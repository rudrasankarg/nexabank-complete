const router = require('express').Router();
const { authenticateAdmin, requireRole } = require('../middleware/auth');
const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const { auditLog } = require('../utils/audit');

router.use(authenticateAdmin);

// ─── Dashboard Stats ─────────────────────────────────────
// ─── Dashboard Stats ─────────────────────────────────────
// ─── Dashboard Stats ─────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  const [users, accounts, transactions, pendingKyc, loans, cards, historicalVolume, kycActivity] = await Promise.all([
    query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'active') as active,
           COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_new FROM users`),
    query(`SELECT COUNT(*) as total, COALESCE(SUM(balance), 0) as total_deposits FROM accounts WHERE is_active = true`),
    query(`SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as volume
           FROM transactions WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed'`),
    query(`SELECT COUNT(*) FROM kyc_documents WHERE status = 'pending'`),
    query(`SELECT COUNT(*) FILTER (WHERE status = 'applied') as pending FROM loans`),
    query(`SELECT COUNT(*) FILTER (WHERE status = 'pending_activation') as pending FROM cards`),
    query(`SELECT TO_CHAR(created_at, 'Dy') as name, COALESCE(SUM(amount), 0)::float as volume 
           FROM transactions WHERE created_at > CURRENT_DATE - INTERVAL '7 days' 
           AND status = 'completed' GROUP BY name, DATE(created_at) ORDER BY DATE(created_at)`),
    query(`SELECT TO_CHAR(created_at, 'Mon') as month,
           COUNT(*) FILTER (WHERE status = 'approved')::int as approved,
           COUNT(*) FILTER (WHERE status = 'rejected')::int as rejected
           FROM kyc_documents WHERE created_at > CURRENT_DATE - INTERVAL '6 months'
           GROUP BY month, DATE_TRUNC('month', created_at)
           ORDER BY DATE_TRUNC('month', created_at)`)
  ]);

  res.json({
    users: users.rows[0],
    accounts: accounts.rows[0],
    today_transactions: transactions.rows[0],
    pending_kyc: pendingKyc.rows[0].count,
    pending_loans: loans.rows[0].pending,
    pending_cards: cards.rows[0].pending,
    charts: historicalVolume.rows,
    kyc_activity: kycActivity.rows // REAL KYC activity data
  });
});

// ─── Notifications ────────────────────────────────────────
router.get('/notifications', async (req, res) => {
  // Ensure table exists
  await query(`
    CREATE TABLE IF NOT EXISTS marketing_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const result = await query(`SELECT * FROM marketing_notifications ORDER BY created_at DESC LIMIT 10`);
  
  // Seed if empty
  if (result.rows.length === 0) {
    const seed = [
      { title: 'New Personal Loan Offer', message: 'NexaBank introduces 9.5% interest on personal loans for premium members.', type: 'info' },
      { title: 'Security Alert: UPI Limits', message: 'System-wide UPI limits updated to ₹1,00,000 for improved safety.', type: 'warning' },
      { title: 'Fixed Deposit Bonus', message: 'Get 0.5% extra interest on FDs booked via the NexaBank app this week.', type: 'success' }
    ];
    for (const n of seed) {
      await query(`INSERT INTO marketing_notifications (title, message, type) VALUES ($1, $2, $3)`, [n.title, n.message, n.type]);
    }
    const fresh = await query(`SELECT * FROM marketing_notifications ORDER BY created_at DESC LIMIT 10`);
    return res.json({ notifications: fresh.rows });
  }

  res.json({ notifications: result.rows });
});

// ─── Global Search ───────────────────────────────────────
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ results: [] });

  const result = await query(
    `SELECT id, full_name, customer_id, email, 'user' as type
     FROM users 
     WHERE full_name ILIKE $1 OR customer_id ILIKE $1 OR email ILIKE $1
     ORDER BY 
       CASE 
         WHEN full_name ILIKE $1 THEN 1
         WHEN customer_id ILIKE $1 THEN 2
         ELSE 3
       END
     LIMIT 8`,
    [`%${q}%`]
  );
  res.json({ results: result.rows });
});

router.get('/stats', async (req, res) => {
  const [users, accounts, transactions, pendingKyc, loans, cards, flaggedTx] = await Promise.all([
    query(`SELECT COUNT(*) as total FROM users`),
    query(`SELECT COUNT(*) as total FROM accounts WHERE is_active = true`),
    query(`SELECT COALESCE(SUM(amount), 0) as volume FROM transactions WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed'`),
    query(`SELECT COUNT(*) FROM kyc_documents WHERE status = 'pending'`),
    query(`SELECT COUNT(*) FILTER (WHERE status = 'applied') as pending FROM loans`),
    query(`SELECT 
      COUNT(*) as total, 
      COUNT(*) FILTER (WHERE status = 'active') as active,
      COUNT(*) FILTER (WHERE status = 'blocked') as blocked,
      COUNT(*) FILTER (WHERE status = 'pending_activation') as pending
    FROM cards`),
    query(`SELECT COUNT(*) FROM transactions WHERE is_flagged = true`)
  ]);

  const newUsersToday = await query(`SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE`);

  res.json({
    total_users: users.rows[0].total,
    new_users_today: newUsersToday.rows[0].count,
    active_accounts: accounts.rows[0].total,
    pending_kyc: pendingKyc.rows[0].count,
    total_transactions_today: `₹${(transactions.rows[0].volume / 10000000).toFixed(1)}Cr`,
    flagged_transactions: flaggedTx.rows[0].count,
    active_cards: cards.rows[0].active,
    blocked_cards: cards.rows[0].blocked,
    pending_cards: cards.rows[0].pending,
    pending_loans: loans.rows[0].pending
  });
});

// ─── Analytics ──────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  const [cards, users, txns, revenueHistory, userGrowth] = await Promise.all([
    query(`SELECT COUNT(*) as total FROM cards WHERE status = 'active'`),
    query(`SELECT COUNT(*) as total FROM users`),
    query(`SELECT COUNT(*) as total FROM transactions WHERE status = 'completed'`),
    query(`SELECT TO_CHAR(created_at, 'Dy') as name, COALESCE(SUM(amount), 0) * 0.05 as amount 
           FROM transactions WHERE created_at > CURRENT_DATE - INTERVAL '7 days' 
           GROUP BY name, DATE(created_at) ORDER BY DATE(created_at)`),
    query(`SELECT TO_CHAR(created_at, 'Dy') as name, COUNT(*) as count 
           FROM users WHERE created_at > CURRENT_DATE - INTERVAL '7 days' 
           GROUP BY name, DATE(created_at) ORDER BY DATE(created_at)`)
  ]);

  res.json({
    revenueChart: revenueHistory.rows,
    usersChart: userGrowth.rows,
    stats: {
      total_revenue: `₹${(txns.rows[0].total * 0.05).toFixed(1)}M`,
      active_users: users.rows[0].total,
      txn_volume: `${txns.rows[0].total}/total`,
      new_cards: cards.rows[0].total
    }
  });
});

// ─── User Management ─────────────────────────────────────
router.get('/users', async (req, res) => {
  const { page = 1, limit = 20, search, status, kyc_status } = req.query;
  const offset = (page - 1) * limit;

  let conditions = ['1=1'];
  let params = [];
  let idx = 1;

  if (search) {
    conditions.push(`(u.full_name ILIKE $${idx} OR u.email ILIKE $${idx} OR u.phone ILIKE $${idx} OR u.customer_id ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  if (status) { conditions.push(`u.status = $${idx++}`); params.push(status); }
  if (kyc_status) { conditions.push(`u.kyc_status = $${idx++}`); params.push(kyc_status); }

  const where = conditions.join(' AND ');

  const [users, total] = await Promise.all([
    query(
      `SELECT u.id, u.customer_id, u.full_name, u.email, u.phone, u.status,
              u.kyc_status, u.created_at, u.last_login, b.name as branch_name
       FROM users u LEFT JOIN branches b ON u.branch_id = b.id
       WHERE ${where} ORDER BY u.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    ),
    query(`SELECT COUNT(*) FROM users u WHERE ${where}`, params)
  ]);

  res.json({ users: users.rows, total: parseInt(total.rows[0].count), page: parseInt(page) });
});

router.get('/users/:id', async (req, res) => {
  const [user, accounts, cards, recentTx] = await Promise.all([
    query(`SELECT u.*, b.name as branch_name FROM users u LEFT JOIN branches b ON u.branch_id = b.id WHERE u.id = $1`, [req.params.id]),
    query(`SELECT * FROM accounts WHERE user_id = $1`, [req.params.id]),
    query(`SELECT id, card_number_masked, card_type, status FROM cards WHERE user_id = $1`, [req.params.id]),
    query(`SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`, [req.params.id])
  ]);

  if (!user.rows.length) return res.status(404).json({ error: 'User not found' });

  res.json({ user: user.rows[0], accounts: accounts.rows, cards: cards.rows, recent_transactions: recentTx.rows });
});

// Get all accounts
router.get('/accounts', async (req, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const offset = (page - 1) * limit;

  let conditions = ['1=1'];
  let params = [];
  let idx = 1;

  if (search) {
    conditions.push(`(a.account_number ILIKE $${idx} OR u.full_name ILIKE $${idx} OR u.customer_id ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.join(' AND ');

  const result = await query(
    `SELECT a.*, u.full_name as owner_name, u.customer_id, b.name as branch_name
     FROM accounts a 
     JOIN users u ON a.user_id = u.id
     LEFT JOIN branches b ON a.branch_id = b.id
     WHERE ${where} 
     ORDER BY a.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  res.json({ accounts: result.rows });
});

// Update user status
router.patch('/users/:id/status', requireRole('super_admin', 'branch_manager', 'compliance'), async (req, res) => {
  const { status, reason } = req.body;
  await query(`UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2`, [status, req.params.id]);
  await auditLog({
    actorId: req.admin.id, actorType: 'admin', action: `USER_STATUS_${status.toUpperCase()}`,
    entityType: 'user', entityId: req.params.id, newValues: { status, reason }, ip: req.ip
  });
  res.json({ message: `User status updated to ${status}` });
});

// Freeze/unfreeze account
router.patch('/accounts/:id/freeze', requireRole('super_admin', 'branch_manager', 'compliance'), async (req, res) => {
  const { freeze, reason } = req.body;
  await query(
    `UPDATE accounts SET is_frozen = $1, freeze_reason = $2 WHERE id = $3`,
    [freeze, reason, req.params.id]
  );
  res.json({ message: `Account ${freeze ? 'frozen' : 'unfrozen'}` });
});

// ─── KYC Management ──────────────────────────────────────
router.get('/kyc/pending', async (req, res) => {
  const result = await query(
    `SELECT k.*, u.full_name, u.email, u.customer_id
     FROM kyc_documents k JOIN users u ON k.user_id = u.id
     WHERE k.status = 'pending' ORDER BY k.created_at ASC`
  );
  res.json({ documents: result.rows });
});

router.patch('/kyc/:id/review', requireRole('super_admin', 'compliance', 'customer_service'), async (req, res) => {
  const { status, notes } = req.body;

  const doc = await query(
    `UPDATE kyc_documents SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = NOW()
     WHERE id = $4 RETURNING user_id`,
    [status, notes, req.admin.id, req.params.id]
  );

  if (status === 'approved') {
    // Check if all docs approved for user
    const pending = await query(
      `SELECT COUNT(*) FROM kyc_documents WHERE user_id = $1 AND status != 'approved'`,
      [doc.rows[0].user_id]
    );
    if (parseInt(pending.rows[0].count) === 0) {
      await query(`UPDATE users SET kyc_status = 'approved' WHERE id = $1`, [doc.rows[0].user_id]);
    }
  }

  res.json({ message: `KYC document ${status}` });
});

// ─── Loan Management ─────────────────────────────────────
router.get('/loans', async (req, res) => {
  const { status } = req.query;
  const result = await query(
    `SELECT l.*, u.full_name, u.customer_id, u.email
     FROM loans l JOIN users u ON l.user_id = u.id
     ${status ? `WHERE l.status = '${status}'` : ''}
     ORDER BY l.created_at DESC LIMIT 50`
  );
  res.json({ loans: result.rows });
});

router.patch('/loans/:id/approve', requireRole('super_admin', 'branch_manager'), async (req, res) => {
  const { action, disbursement_account_id } = req.body;

  if (action === 'approve') {
    const { getClient } = require('../config/database');
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const loan = await client.query(
        `UPDATE loans SET status = 'approved', approved_by = $1, approved_at = NOW()
         WHERE id = $2 RETURNING *`,
        [req.admin.id, req.params.id]
      );

      if (!loan.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Loan not found' });
      }

      const l = loan.rows[0];

      let targetAccountId = disbursement_account_id || l.account_id;

      if (targetAccountId) {
        const account = await client.query(`SELECT id, balance FROM accounts WHERE id = $1 AND user_id = $2`, [targetAccountId, l.user_id]);
        if (!account.rows.length) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Invalid disbursement account' });
        }

        const newBalance = parseFloat(account.rows[0].balance) + parseFloat(l.principal_amount);
        await client.query(`UPDATE accounts SET balance = $1 WHERE id = $2`, [newBalance, targetAccountId]);

        const { generateTransactionRef } = require('../utils/generators');
        const txRef = await generateTransactionRef();
        await client.query(
          `INSERT INTO transactions (transaction_ref, account_id, user_id, type, amount, balance_after, status, description, category)
           VALUES ($1, $2, $3, 'credit', $4, $5, 'completed', $6, 'loan_disbursement')`,
          [txRef, targetAccountId, l.user_id, l.principal_amount, newBalance, `Loan disbursement for ${l.loan_type} loan #${l.id.substr(0,8)}`]
        );

        await client.query(
          `UPDATE loans SET status = 'disbursed', disbursed_amount = $1, disbursed_at = NOW(),
           outstanding_amount = $1 WHERE id = $2`,
          [l.principal_amount, l.id]
        );
      }

      await client.query('COMMIT');
      res.json({ message: 'Loan approved and disbursed' });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  } else {
    await query(`UPDATE loans SET status = 'rejected' WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Loan rejected' });
  }
});

// ─── Card Management ─────────────────────────────────────
router.get('/cards/pending', async (req, res) => {
  const result = await query(
    `SELECT c.*, u.full_name, u.customer_id FROM cards c JOIN users u ON c.user_id = u.id
     WHERE c.status = 'pending_activation' ORDER BY c.requested_at ASC`
  );
  res.json({ cards: result.rows });
});

router.patch('/cards/:id/review', requireRole('super_admin', 'branch_manager'), async (req, res) => {
  const { status } = req.body;
  await query(`UPDATE cards SET status = $1, updated_at = NOW() WHERE id = $2`, [status, req.params.id]);
  res.json({ message: `Card ${status}` });
});

// ─── Transactions ─────────────────────────────────────────
router.get('/transactions', async (req, res) => {
  const { page = 1, limit = 50, flagged } = req.query;
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT t.*, u.full_name, u.customer_id
     FROM transactions t JOIN users u ON t.user_id = u.id
     ${flagged ? 'WHERE t.is_flagged = true' : ''}
     ORDER BY t.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  res.json({ transactions: result.rows });
});

// Flag transaction
router.patch('/transactions/:id/flag', requireRole('super_admin', 'compliance', 'auditor'), async (req, res) => {
  const { reason } = req.body;
  await query(`UPDATE transactions SET is_flagged = true, flag_reason = $1 WHERE id = $2`, [reason, req.params.id]);
  res.json({ message: 'Transaction flagged' });
});

router.patch('/transactions/:id/unflag', requireRole('super_admin', 'compliance', 'auditor'), async (req, res) => {
  await query(`UPDATE transactions SET is_flagged = false, flag_reason = NULL WHERE id = $1`, [req.params.id]);
  res.json({ message: 'Transaction unflagged' });
});

// ─── Branches ─────────────────────────────────────────────
router.get('/branches', async (req, res) => {
  const result = await query(`SELECT * FROM branches WHERE is_active = true ORDER BY name`);
  res.json({ branches: result.rows });
});

router.post('/branches', requireRole('super_admin'), async (req, res) => {
  const { branch_code, name, ifsc_code, micr_code, address, city, state, pincode, phone, email } = req.body;
  const result = await query(
    `INSERT INTO branches (branch_code, name, ifsc_code, micr_code, address, city, state, pincode, phone, email)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [branch_code, name, ifsc_code, micr_code, address, city, state, pincode, phone, email]
  );
  res.status(201).json({ branch: result.rows[0] });
});

// ─── Admin Management ─────────────────────────────────────
router.get('/admins', requireRole('super_admin'), async (req, res) => {
  const result = await query(
    `SELECT a.id, a.employee_id, a.full_name, a.email, a.role, a.is_active,
            a.last_login, b.name as branch_name
     FROM admins a LEFT JOIN branches b ON a.branch_id = b.id ORDER BY a.created_at DESC`
  );
  res.json({ admins: result.rows });
});

router.post('/admins', requireRole('super_admin'), async (req, res) => {
  const { employee_id, full_name, email, password, role, branch_id, phone } = req.body;
  const hash = await bcrypt.hash(password, 12);

  const result = await query(
    `INSERT INTO admins (employee_id, full_name, email, password_hash, role, branch_id, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, employee_id, full_name, email, role`,
    [employee_id, full_name, email, hash, role, branch_id, phone]
  );
  res.status(201).json({ admin: result.rows[0] });
});

// ─── Audit Log ────────────────────────────────────────────
router.get('/audit-log', requireRole('super_admin', 'auditor'), async (req, res) => {
  const { page = 1, limit = 50, actor_type, action } = req.query;
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT * FROM audit_log ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  res.json({ logs: result.rows });
});

// ─── Service Requests ─────────────────────────────────────
router.get('/service-requests', async (req, res) => {
  const result = await query(
    `SELECT sr.*, u.full_name, u.customer_id FROM service_requests sr
     JOIN users u ON sr.user_id = u.id WHERE sr.status = 'open' ORDER BY sr.created_at ASC LIMIT 100`
  );
  res.json({ requests: result.rows });
});

router.patch('/service-requests/:id/resolve', async (req, res) => {
  const { resolution_notes } = req.body;
  await query(
    `UPDATE service_requests SET status = 'resolved', assigned_to = $1,
     resolved_at = NOW(), resolution_notes = $2 WHERE id = $3`,
    [req.admin.id, resolution_notes, req.params.id]
  );
  res.json({ message: 'Request resolved' });
});

// ─── Settings ──────────────────────────────────────────────
router.get('/settings', requireRole('super_admin'), async (req, res) => {
  // Ensure table exists
  await query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(50) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW(),
      updated_by UUID REFERENCES admins(id)
    )
  `);

  const result = await query(`SELECT * FROM system_settings`);
  const settings = result.rows.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});
  
  // Fallback defaults if table is empty
  if (Object.keys(settings).length === 0) {
    return res.json({
      interest_rates: { savings: 4.0, fixed_deposit: 7.5, personal_loan: 13.5, home_loan: 9.5 },
      transaction_limits: { daily_upi: 100000, daily_atm: 50000 },
      maintenance_mode: { enabled: false, message: '' }
    });
  }
  res.json(settings);
});

router.patch('/settings', requireRole('super_admin'), async (req, res) => {
  const updates = req.body; // { key: value }
  for (const [key, value] of Object.entries(updates)) {
    await query(
      `INSERT INTO system_settings (key, value, updated_at, updated_by)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW(), updated_by = EXCLUDED.updated_by`,
      [key, value, req.admin.id]
    );
  }
  res.json({ message: 'Settings updated' });
});

// ─── System Control ───────────────────────────────────────
router.post('/system/clear-cache', requireRole('super_admin'), async (req, res) => {
  const { flushAll } = require('../config/redis');
  await flushAll();
  res.json({ message: 'System cache cleared successfully' });
});

router.post('/system/flush-notifications', requireRole('super_admin'), async (req, res) => {
  await query(`DELETE FROM marketing_notifications`);
  res.json({ message: 'Marketing notifications flushed' });
});

module.exports = router;
