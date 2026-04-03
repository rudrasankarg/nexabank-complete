const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../config/database');
const { auditLog } = require('../utils/audit');
const { sendNotification } = require('../utils/notifications');
const { sendEmail } = require('../utils/emailService');

// ─── Get User Cards ──────────────────────────────────────
async function getCards(req, res) {
  const result = await query(
    `SELECT id, card_number_masked, card_holder_name, card_type, network,
            expiry_month, expiry_year, status, daily_atm_limit, daily_pos_limit,
            daily_online_limit, is_international_enabled, is_contactless_enabled,
            is_online_enabled, is_atm_enabled, credit_limit, available_credit,
            activated_at, requested_at
     FROM cards WHERE user_id = $1 ORDER BY requested_at DESC`,
    [req.user.id]
  );

  res.json({ cards: result.rows });
}

// ─── Request Card OTP ────────────────────────────────────
async function requestCardOTP(req, res) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await query(
    `UPDATE users SET phone_otp = $1, phone_otp_expiry = NOW() + INTERVAL '10 minutes' WHERE id = $2`,
    [otp, req.user.id]
  );

  await sendEmail({
    to: req.user.email,
    template: 'otp',
    data: { name: req.user.full_name, otp, type: 'Card Application' }
  });

  res.json({ message: 'Verification code sent to your email' });
}

// ─── Apply for New Card ──────────────────────────────────
async function applyCard(req, res) {
  try {
    const { account_id, card_type, network = 'VISA', delivery_address, otp } = req.body;

  // 0. Verify OTP
  const otpValid = await query(
    `SELECT id FROM users WHERE id = $1 AND phone_otp = $2 AND phone_otp_expiry > NOW()`,
    [req.user.id, otp]
  );
  if (!otpValid.rows.length) return res.status(400).json({ error: 'Invalid or expired verification code' });
  await query(`UPDATE users SET phone_otp = NULL, phone_otp_expiry = NULL WHERE id = $1`, [req.user.id]);

  // Verify account ownership
  const account = await query(
    `SELECT id, account_number FROM accounts WHERE id = $1 AND user_id = $2 AND is_active = true`,
    [account_id, req.user.id]
  );
  if (!account.rows.length) return res.status(404).json({ error: 'Account not found' });

  // Check existing active card requests
  const existing = await query(
    `SELECT id FROM cards WHERE account_id = $1 AND status IN ('active', 'pending_activation')`,
    [account_id]
  );
  if (existing.rows.length) return res.status(409).json({ error: 'Active card already exists for this account' });

  // Generate card number (masked)
  const cardBin = network === 'VISA' ? '4111' : network === 'MASTERCARD' ? '5111' : '3711';
  const cardMiddle = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  const cardLast4 = Math.floor(1000 + Math.random() * 9000).toString();
  const fullCardNumber = `${cardBin}${cardMiddle}${cardLast4}`;
  const maskedCard = `${cardBin} **** **** ${cardLast4}`;

  const expMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const expYear = (new Date().getFullYear() + 5).toString();

  const cvv = Math.floor(100 + Math.random() * 900).toString();
  const cardNumberHash = crypto.createHash('sha256').update(fullCardNumber + process.env.ENCRYPTION_KEY).digest('hex');
  const cvvHash = await bcrypt.hash(cvv, 10);

  const cardResult = await query(
    `INSERT INTO cards (card_number_hash, card_number_last4, card_number_masked, card_holder_name,
                        card_type, network, expiry_month, expiry_year, cvv_hash,
                        account_id, user_id, status, delivery_address,
                        credit_limit, available_credit)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending_activation', $12, $13, $13)
     RETURNING id, card_number_masked, card_type, network, expiry_month, expiry_year, status`,
    [cardNumberHash, cardLast4, maskedCard, req.user.full_name,
     card_type, network, expMonth, expYear, cvvHash,
     account_id, req.user.id, delivery_address,
     card_type === 'credit' ? 100000 : null]
  );

  await sendNotification(req.user.id, {
    title: 'Card Application Received',
    message: `Your ${card_type} card application has been submitted. Delivery in 5-7 working days.`,
    type: 'card'
  });

  await auditLog({ actorId: req.user.id, actorType: 'user', action: 'CARD_APPLY', entityId: cardResult.rows[0].id, ip: req.ip });

    res.status(201).json({ message: 'Card application submitted', card: cardResult.rows[0] });
  } catch (err) {
    console.error('Card Application Error:', err.message);
    res.status(400).json({ error: err.message || 'Card application failed' });
  }
}

// ─── Activate Card ───────────────────────────────────────
async function activateCard(req, res) {
  const { card_id } = req.params;
  const { last4, expiry_month, expiry_year, set_pin } = req.body;

  const card = await query(
    `SELECT id, card_number_last4, expiry_month, expiry_year, status
     FROM cards WHERE id = $1 AND user_id = $2`,
    [card_id, req.user.id]
  );

  if (!card.rows.length) return res.status(404).json({ error: 'Card not found' });
  const c = card.rows[0];

  if (c.status !== 'pending_activation') return res.status(400).json({ error: `Card is ${c.status}` });
  if (c.card_number_last4 !== last4 || c.expiry_month !== expiry_month || c.expiry_year !== expiry_year) {
    return res.status(400).json({ error: 'Card details do not match' });
  }

  const pinHash = await bcrypt.hash(set_pin, 10);
  await query(
    `UPDATE cards SET status = 'active', pin_hash = $1, activated_at = NOW() WHERE id = $2`,
    [pinHash, card_id]
  );

  res.json({ message: 'Card activated successfully' });
}

// ─── Block / Unblock Card ────────────────────────────────
async function blockCard(req, res) {
  const { card_id } = req.params;
  const { reason } = req.body;

  const result = await query(
    `UPDATE cards SET status = 'blocked', blocked_at = NOW(), block_reason = $1
     WHERE id = $2 AND user_id = $3 AND status = 'active'
     RETURNING id`,
    [reason || 'User request', card_id, req.user.id]
  );

  if (!result.rows.length) return res.status(404).json({ error: 'Active card not found' });

  await sendNotification(req.user.id, {
    title: 'Card Blocked',
    message: 'Your card has been blocked as requested. Contact support to unblock.',
    type: 'card'
  });

  await auditLog({ actorId: req.user.id, actorType: 'user', action: 'CARD_BLOCK', entityId: card_id, ip: req.ip });
  res.json({ message: 'Card blocked successfully' });
}

// ─── Update Card Settings ─────────────────────────────────
async function updateCardSettings(req, res) {
  const { card_id } = req.params;
  const { is_international_enabled, is_contactless_enabled, is_online_enabled, is_atm_enabled,
          daily_atm_limit, daily_pos_limit, daily_online_limit } = req.body;

  const updates = [];
  const params = [];
  let idx = 1;

  if (is_international_enabled !== undefined) { updates.push(`is_international_enabled = $${idx++}`); params.push(is_international_enabled); }
  if (is_contactless_enabled !== undefined) { updates.push(`is_contactless_enabled = $${idx++}`); params.push(is_contactless_enabled); }
  if (is_online_enabled !== undefined) { updates.push(`is_online_enabled = $${idx++}`); params.push(is_online_enabled); }
  if (is_atm_enabled !== undefined) { updates.push(`is_atm_enabled = $${idx++}`); params.push(is_atm_enabled); }
  if (daily_atm_limit) { updates.push(`daily_atm_limit = $${idx++}`); params.push(daily_atm_limit); }
  if (daily_pos_limit) { updates.push(`daily_pos_limit = $${idx++}`); params.push(daily_pos_limit); }
  if (daily_online_limit) { updates.push(`daily_online_limit = $${idx++}`); params.push(daily_online_limit); }

  if (!updates.length) return res.status(400).json({ error: 'No settings to update' });

  params.push(card_id, req.user.id);
  const result = await query(
    `UPDATE cards SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${idx} AND user_id = $${idx + 1} AND status = 'active'
     RETURNING id`,
    params
  );

  if (!result.rows.length) return res.status(404).json({ error: 'Active card not found' });
  res.json({ message: 'Card settings updated' });
}

// ─── Change PIN ──────────────────────────────────────────
async function changePin(req, res) {
  const { card_id } = req.params;
  const { current_pin, new_pin } = req.body;

  const card = await query(`SELECT pin_hash FROM cards WHERE id = $1 AND user_id = $2 AND status = 'active'`, [card_id, req.user.id]);
  if (!card.rows.length) return res.status(404).json({ error: 'Card not found' });

  const pinValid = await bcrypt.compare(current_pin, card.rows[0].pin_hash);
  if (!pinValid) return res.status(400).json({ error: 'Current PIN is incorrect' });

  const newPinHash = await bcrypt.hash(new_pin, 10);
  await query(`UPDATE cards SET pin_hash = $1 WHERE id = $2`, [newPinHash, card_id]);

  res.json({ message: 'PIN changed successfully' });
}

module.exports = { getCards, applyCard, activateCard, blockCard, updateCardSettings, changePin, requestCardOTP };
