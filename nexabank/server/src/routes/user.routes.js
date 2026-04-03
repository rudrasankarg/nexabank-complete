const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const { auditLog } = require('../utils/audit');

router.use(authenticate);

// Get profile
router.get('/profile', async (req, res) => {
  const result = await query(
    `SELECT u.id, u.customer_id, u.full_name, u.email, u.phone, u.date_of_birth,
            u.gender, u.pan_number, u.address_line1, u.address_line2, u.city,
            u.state, u.pincode, u.country, u.profile_photo_url, u.status,
            u.kyc_status, u.email_verified, u.phone_verified,
            u.two_factor_enabled, u.biometric_enabled, u.last_login,
            u.notification_preferences, u.created_at,
            b.name as branch_name, b.ifsc_code, b.city as branch_city
     FROM users u LEFT JOIN branches b ON u.branch_id = b.id
     WHERE u.id = $1`,
    [req.user.id]
  );
  res.json({ user: result.rows[0] });
});

// Update profile
router.patch('/profile', async (req, res) => {
  const { full_name, address_line1, address_line2, city, state, pincode, gender } = req.body;

  const result = await query(
    `UPDATE users SET full_name = COALESCE($1, full_name),
                      address_line1 = COALESCE($2, address_line1),
                      address_line2 = COALESCE($3, address_line2),
                      city = COALESCE($4, city), state = COALESCE($5, state),
                      pincode = COALESCE($6, pincode), gender = COALESCE($7, gender),
                      updated_at = NOW()
     WHERE id = $8 RETURNING full_name, city, state`,
    [full_name, address_line1, address_line2, city, state, pincode, gender, req.user.id]
  );

  await auditLog({ actorId: req.user.id, actorType: 'user', action: 'PROFILE_UPDATE', ip: req.ip });
  res.json({ message: 'Profile updated', user: result.rows[0] });
});

// Change password
router.post('/change-password', async (req, res) => {
  const { current_password, new_password } = req.body;

  const result = await query(`SELECT password_hash FROM users WHERE id = $1`, [req.user.id]);
  const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
  if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

  const newHash = await bcrypt.hash(new_password, 12);
  await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [newHash, req.user.id]);

  await auditLog({ actorId: req.user.id, actorType: 'user', action: 'PASSWORD_CHANGE', ip: req.ip });
  res.json({ message: 'Password changed successfully' });
});

// Update notification preferences
router.patch('/notifications/preferences', async (req, res) => {
  const { '2fa': twoFactor, ...prefs } = req.body;
  
  if (twoFactor !== undefined) {
    await query(`UPDATE users SET two_factor_enabled = $1 WHERE id = $2`, [twoFactor, req.user.id]);
  }

  if (Object.keys(prefs).length > 0) {
    await query(
      `UPDATE users SET notification_preferences = COALESCE(notification_preferences, '{}'::jsonb) || $1::jsonb WHERE id = $2`,
      [JSON.stringify(prefs), req.user.id]
    );
  }
  res.json({ message: 'Preferences updated successfully' });
});

// Sessions management
router.get('/sessions', async (req, res) => {
  const result = await query(
    `SELECT id, device_id, device_name, ip_address, last_used_at, created_at, expires_at 
     FROM refresh_tokens 
     WHERE user_id = $1 AND is_revoked = false AND expires_at > NOW()
     ORDER BY last_used_at DESC`,
    [req.user.id]
  );
  res.json({ sessions: result.rows });
});

router.delete('/sessions/:id', async (req, res) => {
  await query(
    `UPDATE refresh_tokens SET is_revoked = true WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  );
  res.json({ message: 'Session terminated' });
});

router.delete('/sessions/all/others', async (req, res) => {
  // To identify "others", we usually need the current refresh token's hash
  // But for simplicity, we can just revoke all and let the user re-login if needed
  // Or better: req.body.current_token_hash
  const { current_session_id } = req.body;
  if (current_session_id) {
    await query(
      `UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1 AND id != $2`,
      [req.user.id, current_session_id]
    );
  } else {
    await query(
      `UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1`,
      [req.user.id]
    );
  }
  res.json({ message: 'Other sessions terminated' });
});

// Update profile photo
router.patch('/profile-photo', async (req, res) => {
  const { photo_url } = req.body;
  if (!photo_url) return res.status(400).json({ error: 'Photo URL required' });

  await query(`UPDATE users SET profile_photo_url = $1 WHERE id = $2`, [photo_url, req.user.id]);
  res.json({ message: 'Profile photo updated', photo_url });
});

// Get beneficiaries
router.get('/beneficiaries', async (req, res) => {
  const result = await query(
    `SELECT * FROM beneficiaries WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json({ beneficiaries: result.rows });
});

// Add beneficiary
router.post('/beneficiaries', async (req, res) => {
  const { nickname, beneficiary_name, account_number, ifsc_code, bank_name, upi_id } = req.body;
  const result = await query(
    `INSERT INTO beneficiaries (user_id, nickname, beneficiary_name, account_number, ifsc_code, bank_name, upi_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.user.id, nickname, beneficiary_name, account_number, ifsc_code, bank_name, upi_id]
  );
  res.status(201).json({ beneficiary: result.rows[0] });
});

// Delete beneficiary
router.delete('/beneficiaries/:id', async (req, res) => {
  await query(`DELETE FROM beneficiaries WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
  res.json({ message: 'Beneficiary removed' });
});

// Request branch change
router.post('/request-branch-change', async (req, res) => {
  const { new_branch_id, reason } = req.body;
  const { generateRequestNumber } = require('../utils/generators');
  const reqNum = await generateRequestNumber();

  await query(
    `INSERT INTO service_requests (request_number, user_id, request_type, description, metadata)
     VALUES ($1, $2, 'branch_change', $3, $4)`,
    [reqNum, req.user.id, reason, JSON.stringify({ new_branch_id })]
  );

  res.status(201).json({ message: 'Branch change request submitted', request_number: reqNum });
});

// Dashboard summary
router.get('/dashboard', async (req, res) => {
  const [accounts, recentTx, notifications, cards] = await Promise.all([
    query(
      `SELECT account_number, account_type, balance, is_primary FROM accounts
       WHERE user_id = $1 AND is_active = true`,
      [req.user.id]
    ),
    query(
      `SELECT t.type, t.amount, t.description, t.created_at, t.status
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE t.user_id = $1 ORDER BY t.created_at DESC LIMIT 5`,
      [req.user.id]
    ),
    query(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [req.user.id]
    ),
    query(
      `SELECT card_number_masked, card_type, status, expiry_month, expiry_year
       FROM cards WHERE user_id = $1 AND status = 'active'`,
      [req.user.id]
    )
  ]);

  const totalBalance = accounts.rows.reduce((sum, a) => sum + parseFloat(a.balance), 0);

  res.json({
    summary: { total_balance: totalBalance, account_count: accounts.rows.length },
    accounts: accounts.rows,
    recent_transactions: recentTx.rows,
    notifications: notifications.rows,
    cards: cards.rows
  });
});

module.exports = router;
