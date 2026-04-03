const { v4: uuidv4 } = require('uuid');
const { query, getClient } = require('../config/database');
const { auditLog } = require('../utils/audit');
const { sendNotification } = require('../utils/notifications');
const { generateTransactionRef } = require('../utils/generators');

// ─── Get Transactions ────────────────────────────────────
async function getTransactions(req, res) {
  const { account_id, page = 1, limit = 20, type, start_date, end_date, search } = req.query;
  const offset = (page - 1) * limit;

  let conditions = ['t.user_id = $1'];
  let params = [req.user.id];
  let paramIdx = 2;

  if (account_id) {
    conditions.push(`t.account_id = $${paramIdx++}`);
    params.push(account_id);
  }
  if (type) {
    conditions.push(`t.type = $${paramIdx++}`);
    params.push(type);
  }
  if (start_date) {
    conditions.push(`t.created_at >= $${paramIdx++}`);
    params.push(start_date);
  }
  if (end_date) {
    conditions.push(`t.created_at <= $${paramIdx++}`);
    params.push(end_date + ' 23:59:59');
  }
  if (search) {
    conditions.push(`(t.description ILIKE $${paramIdx} OR t.transaction_ref ILIKE $${paramIdx} OR t.merchant_name ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }
  if (req.query.category) {
    conditions.push(`t.category = $${paramIdx++}`);
    params.push(req.query.category);
  }

  const where = conditions.join(' AND ');

  const [txResult, countResult] = await Promise.all([
    query(
      `SELECT t.id, t.transaction_ref, t.type, t.amount, t.balance_after,
              t.currency, t.status, t.description, t.category, t.merchant_name,
              t.payment_mode, t.created_at, a.account_number
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE ${where}
       ORDER BY t.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    ),
    query(`SELECT COUNT(*) FROM transactions t WHERE ${where}`, params)
  ]);

  res.json({
    transactions: txResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(countResult.rows[0].count),
      pages: Math.ceil(countResult.rows[0].count / limit)
    }
  });
}

// ─── Fund Transfer ────────────────────────────────────────
async function transfer(req, res) {
  const {
    from_account_id, to_account_number, amount, description,
    payment_mode = 'NEFT', ifsc_code, beneficiary_name, otp, to_vpa
  } = req.body;

  // Verify OTP
  const otpValid = await verifyTransactionOTP(req.user.id, otp);
  if (!otpValid) return res.status(400).json({ error: 'Invalid or expired OTP' });

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Lock source account
    const sourceResult = await client.query(
      `SELECT id, account_number, balance, is_frozen, daily_transaction_limit, is_active
       FROM accounts WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [from_account_id, req.user.id]
    );

    if (!sourceResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Source account not found' });
    }

    const source = sourceResult.rows[0];

    if (!source.is_active) return res.status(400).json({ error: 'Account is inactive' });
    if (source.is_frozen) return res.status(400).json({ error: 'Account is frozen' });
    if (parseFloat(source.balance) < parseFloat(amount)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Daily limit check
    const todayTotal = await client.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
       WHERE account_id = $1 AND type = 'debit'
       AND DATE(created_at) = CURRENT_DATE AND status = 'completed'`,
      [from_account_id]
    );

    if (parseFloat(todayTotal.rows[0].total) + parseFloat(amount) > parseFloat(source.daily_transaction_limit)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Daily transaction limit exceeded' });
    }

    // Find destination account
    const destResult = await client.query(
      `SELECT a.id, a.account_number, a.balance, a.is_active, a.user_id, u.full_name
       FROM accounts a JOIN users u ON a.user_id = u.id
       WHERE a.account_number = $1 FOR UPDATE`,
      [to_account_number]
    );

    const txRef = await generateTransactionRef();
    const newSourceBalance = parseFloat(source.balance) - parseFloat(amount);

    // Debit source
    await client.query(
      `UPDATE accounts SET balance = $1 WHERE id = $2`,
      [newSourceBalance, from_account_id]
    );

    // Internal transfer
    if (destResult.rows.length && !ifsc_code) {
      const dest = destResult.rows[0];
      const newDestBalance = parseFloat(dest.balance) + parseFloat(amount);

      await client.query(`UPDATE accounts SET balance = $1 WHERE id = $2`, [newDestBalance, dest.id]);

      // Record both sides
      await client.query(
        `INSERT INTO transactions (transaction_ref, account_id, user_id, type, amount, balance_after,
                                    status, description, payment_mode, reference_account_id)
         VALUES ($1, $2, $3, 'debit', $4, $5, 'completed', $6, $7, $8)`,
        [txRef, from_account_id, req.user.id, amount, newSourceBalance, description || `Transfer to ${to_account_number}`, payment_mode, dest.id]
      );

      await client.query(
        `INSERT INTO transactions (transaction_ref, account_id, user_id, type, amount, balance_after,
                                    status, description, payment_mode, reference_account_id)
         VALUES ($1||'-CR', $2, $3, 'credit', $4, $5, 'completed', $6, $7, $8)`,
        [txRef, dest.id, dest.user_id, amount, newDestBalance, description || `Transfer from ${source.account_number}`, payment_mode, source.id]
      );

      // Notify recipient
      await sendNotification(dest.id, {
        title: 'Money Received',
        message: `₹${amount} received from ${req.user.full_name}`,
        type: 'transaction'
      });
    } else if (to_vpa) {
      // UPI / VPA Payment
      await client.query(
        `INSERT INTO transactions (transaction_ref, account_id, user_id, type, amount, balance_after,
                                    status, description, payment_mode, merchant_name)
         VALUES ($1, $2, $3, 'debit', $4, $5, 'completed', $6, 'UPI', $7)`,
        [txRef, from_account_id, req.user.id, amount, newSourceBalance,
         description || `UPI Payment to ${to_vpa}`, to_vpa]
      );
    } else {
      // External / NEFT / IMPS
      await client.query(
        `INSERT INTO transactions (transaction_ref, account_id, user_id, type, amount, balance_after,
                                    status, description, payment_mode, reference_account_number, ifsc_code)
         VALUES ($1, $2, $3, 'debit', $4, $5, 'processing', $6, $7, $8, $9)`,
        [txRef, from_account_id, req.user.id, amount, newSourceBalance,
         description || `Transfer to ${to_account_number}`, payment_mode, to_account_number, ifsc_code]
      );
    }

    await client.query('COMMIT');

    await auditLog({ actorId: req.user.id, actorType: 'user', action: 'FUND_TRANSFER', entityType: 'transaction', ip: req.ip });

    // Send notification to sender
    await sendNotification(req.user.id, {
      title: 'Transfer Successful',
      message: `₹${amount} transferred successfully. Ref: ${txRef}`,
      type: 'transaction'
    });

    res.json({ message: 'Transfer successful', transaction_ref: txRef, amount, balance: newSourceBalance });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Transfer Error:', err.message);
    res.status(400).json({ error: err.message || 'Transfer failed' });
  } finally {
    client.release();
  }
}

// ─── Bill Payment ─────────────────────────────────────────
async function payBill(req, res) {
  const { account_id, bill_type, bill_reference, operator, amount, description, otp } = req.body;

  // 0. Verify OTP
  const otpValid = await verifyTransactionOTP(req.user.id, otp);
  if (!otpValid) return res.status(400).json({ error: 'Invalid or expired verification code' });

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const accountResult = await client.query(
      `SELECT id, balance, is_frozen FROM accounts WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [account_id, req.user.id]
    );

    if (!accountResult.rows.length) return res.status(404).json({ error: 'Account not found' });
    const account = accountResult.rows[0];

    if (account.is_frozen) return res.status(400).json({ error: 'Account frozen' });
    if (parseFloat(account.balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const newBalance = parseFloat(account.balance) - parseFloat(amount);
    const txRef = await generateTransactionRef();

    await client.query(`UPDATE accounts SET balance = $1 WHERE id = $2`, [newBalance, account_id]);
    await client.query(
      `INSERT INTO transactions (transaction_ref, account_id, user_id, type, amount, balance_after,
                                  status, description, category, bill_type, bill_reference, payment_mode)
       VALUES ($1, $2, $3, 'debit', $4, $5, 'completed', $6, 'bill_payment', $7, $8, 'online')`,
      [txRef, account_id, req.user.id, amount, newBalance, description || `${operator || ''} ${bill_type} bill payment`.trim(), bill_type, bill_reference]
    );

    await client.query('COMMIT');

    res.json({ message: 'Bill paid successfully', transaction_ref: txRef, amount, balance: newBalance });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Request Transaction OTP ─────────────────────────────
async function requestTransactionOTP(req, res) {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[OTP] Generating for ${req.user.email}: ${otp}`);
    
    await query(
      `UPDATE users SET phone_otp = $1, phone_otp_expiry = NOW() + INTERVAL '10 minutes' WHERE id = $2`,
      [otp, req.user.id]
    );

    const { sendEmail } = require('../utils/emailService');
    await sendEmail({
      to: req.user.email,
      template: 'otp',
      data: { name: req.user.full_name, otp, type: 'Transaction Verification' }
    });

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('[OTP ERROR]', err);
    res.status(500).json({ error: 'Failed to send OTP. Please check your connection or try later.' });
  }
}

async function verifyTransactionOTP(userId, otp) {
  try {
    if (!otp) return false;

    const result = await query(
      `SELECT id FROM users WHERE id = $1 AND phone_otp = $2 AND phone_otp_expiry > NOW()`,
      [userId, otp]
    );

    if (result.rows.length) {
      // Clear OTP after use
      await query(`UPDATE users SET phone_otp = NULL, phone_otp_expiry = NULL WHERE id = $1`, [userId]);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[OTP VERIFY ERROR]', err);
    return false;
  }
}

// ─── Mini Statement ──────────────────────────────────────
async function miniStatement(req, res) {
  const { account_id } = req.params;

  const result = await query(
    `SELECT t.transaction_ref, t.type, t.amount, t.balance_after,
            t.description, t.created_at
     FROM transactions t
     WHERE t.account_id = $1 AND t.user_id = $2
     ORDER BY t.created_at DESC LIMIT 10`,
    [account_id, req.user.id]
  );

  res.json({ transactions: result.rows });
}

module.exports = { getTransactions, transfer, payBill, requestTransactionOTP, verifyTransactionOTP, miniStatement };
