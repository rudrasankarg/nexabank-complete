const router = require('express').Router();
const { authenticate, requireKYC } = require('../middleware/auth');
const { query } = require('../config/database');

router.use(authenticate);

// Get all accounts for user
router.get('/', async (req, res) => {
  const result = await query(
    `SELECT a.id, a.account_number, a.account_type, a.balance, a.minimum_balance,
            a.interest_rate, a.is_primary, a.is_active, a.is_frozen, a.opened_at,
            a.daily_transaction_limit,
            b.name as branch_name, b.ifsc_code
     FROM accounts a
     JOIN branches b ON a.branch_id = b.id
     WHERE a.user_id = $1 ORDER BY a.is_primary DESC, a.opened_at ASC`,
    [req.user.id]
  );
  res.json({ accounts: result.rows });
});

// Get single account
router.get('/:id', async (req, res) => {
  const result = await query(
    `SELECT a.*, b.name as branch_name, b.ifsc_code, b.micr_code
     FROM accounts a JOIN branches b ON a.branch_id = b.id
     WHERE a.id = $1 AND a.user_id = $2`,
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Account not found' });
  res.json({ account: result.rows[0] });
});

// Open new account (FD, RD, etc.)
router.post('/open', requireKYC, async (req, res) => {
  const { account_type, initial_deposit, source_account_id, tenure_days = 365, interest_rate = 7.5, 
          nomination_name, nomination_relation } = req.body;
  const { generateAccountNumber, generateTransactionRef } = require('../utils/generators');
  const { getClient } = require('../config/database');

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. If it's FD/RD, deduct from source
    if (initial_deposit > 0 && source_account_id) {
      const source = await client.query(
        'SELECT balance, minimum_balance FROM accounts WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [source_account_id, req.user.id]
      );
      if (!source.rows.length) throw new Error('Source account not found');
      
      const sourceBalance = parseFloat(source.rows[0].balance);
      const minBalance = parseFloat(source.rows[0].minimum_balance || 0);
      const depositAmount = parseFloat(initial_deposit);

      if (sourceBalance < depositAmount) throw new Error('Insufficient balance in source account');
      if (sourceBalance - depositAmount < minBalance) throw new Error(`Transfer would leave source account below minimum balance of ₹${minBalance}`);

      await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [depositAmount, source_account_id]);
      
      // Record debit
      await client.query(
        `INSERT INTO transactions (transaction_ref, account_id, user_id, type, amount, status, description)
         VALUES ($1, $2, $3, 'debit', $4, 'completed', $5)`,
        [await generateTransactionRef(), source_account_id, req.user.id, initial_deposit, `Opening ${account_type} account`]
      );
    }

    // 2. Create new account
    const accountNumber = await generateAccountNumber();
    const branchId = (await client.query('SELECT branch_id FROM users WHERE id = $1', [req.user.id])).rows[0]?.branch_id;

    const isFD = account_type === 'fixed_deposit';
    const bonusAmount = isFD ? 0 : 1000.00;
    const finalBalance = (parseFloat(initial_deposit) || 0) + bonusAmount;
    const accountResult = await client.query(
      `INSERT INTO accounts (account_number, user_id, branch_id, account_type, balance, minimum_balance,
                             nomination_name, nomination_relation, daily_transaction_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 100000.00) RETURNING id, account_number, account_type, balance`,
      [accountNumber, req.user.id, branchId, account_type, finalBalance, bonusAmount, nomination_name, nomination_relation]
    );
    const newAccount = accountResult.rows[0];

    // 2.5 Record opening transactions
    if (bonusAmount > 0) {
      await client.query(
        `INSERT INTO transactions (transaction_ref, account_id, user_id, type, amount, balance_after, status, description)
         VALUES ($1, $2, $3, 'credit', $4, $4, 'completed', 'Opening Bonus/Initial Balance')`,
        [await generateTransactionRef() + '-INIT', newAccount.id, req.user.id, bonusAmount]
      );
    }

    // Initial Deposit (if any)
    if (parseFloat(initial_deposit) > 0) {
      await client.query(
        `INSERT INTO transactions (transaction_ref, account_id, user_id, type, amount, balance_after, status, description)
         VALUES ($1, $2, $3, 'credit', $4, $5, 'completed', 'Initial Deposit')`,
        [await generateTransactionRef() + '-DEP', newAccount.id, req.user.id, initial_deposit, finalBalance]
      );
    }

    // 3. If FD, create record
    if (account_type === 'fixed_deposit') {
      const maturityDate = new Date();
      maturityDate.setDate(maturityDate.getDate() + parseInt(tenure_days));
      const maturityAmount = parseFloat(initial_deposit) * (1 + (parseFloat(interest_rate) / 100) * (parseInt(tenure_days) / 365));

      await client.query(
        `INSERT INTO fixed_deposits (fd_number, account_id, user_id, principal, interest_rate, tenure_days, maturity_amount, maturity_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [accountNumber.replace('ACC', 'FD'), newAccount.id, req.user.id, initial_deposit, interest_rate, tenure_days, maturityAmount, maturityDate]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Account opened successfully', account: newAccount });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Deposit Money
router.post('/:id/deposit', async (req, res) => {
  const { amount, description } = req.body;
  const { generateTransactionRef } = require('../utils/generators');

  try {
    const result = await query(
      `UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3 RETURNING balance`,
      [amount, req.params.id, req.user.id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Account not found' });

    await query(
      `INSERT INTO transactions (transaction_ref, account_id, user_id, type, amount, balance_after, status, description)
       VALUES ($1, $2, $3, 'credit', $4, $5, 'completed', $6)`,
      [await generateTransactionRef(), req.params.id, req.user.id, amount, result.rows[0].balance, description || 'Cash Deposit']
    );

    res.json({ message: 'Deposit successful', balance: result.rows[0].balance });
  } catch (err) {
    console.error('[DEPOSIT ERROR]', err);
    res.status(500).json({ error: 'Deposit failed' });
  }
});

module.exports = router;
