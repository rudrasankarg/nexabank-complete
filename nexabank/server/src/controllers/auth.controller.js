const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { query } = require('../config/database');
const { setEx, get, del } = require('../config/redis');
const { sendEmail } = require('../utils/emailService');
const { sendSMS } = require('../utils/sms');
const { generateCustomerId, generateAccountNumber } = require('../utils/generators');
const { auditLog } = require('../utils/audit');

// ─── Helper: Generate Tokens ─────────────────────────────
function generateTokens(userId, sessionId = null) {
  const payload = { userId, type: 'user' };
  if (sessionId) payload.sessionId = sessionId;

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshPayload = { userId, type: 'refresh' };
  if (sessionId) refreshPayload.sessionId = sessionId;

  const refreshToken = jwt.sign(
    refreshPayload,
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
}

// ─── Register ────────────────────────────────────────────
async function register(req, res) {
  try {
    const { full_name, email, phone, password, date_of_birth, gender, pan_number, branch_id, email_otp } = req.body;

    if (!email || !email_otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Mandatory Email Verification Check
    const storedOtp = await get(`reg_otp:${email.toLowerCase()}`);
    if (!storedOtp || storedOtp !== email_otp) {
      return res.status(401).json({ error: 'Invalid or expired verification code. Please request a new one.' });
    }

    // Check duplicates
    const existing = await query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email.toLowerCase(), phone]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Email or phone already registered' });
    }

    const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const customerId = await generateCustomerId();
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Get default branch if not specified
    let branchId = branch_id;
    try {
      if (!branchId) {
        const branches = await query('SELECT id FROM branches LIMIT 1');
        branchId = branches.rows[0]?.id;
      }
      if (!branchId) branchId = '00000000-0000-0000-0000-000000000000'; 
    } catch (err) {
      branchId = '00000000-0000-0000-0000-000000000000';
    }

    let user;
    try {
      const userResult = await query(
        `INSERT INTO users (full_name, email, phone, password_hash, date_of_birth, gender,
                            pan_number, branch_id, customer_id, email_verification_token,
                            status, kyc_status, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', 'approved', true)
         RETURNING id, full_name, email, customer_id`,
        [full_name, email.toLowerCase(), phone, passwordHash, date_of_birth, gender,
         pan_number, branchId, customerId, verificationToken]
      );
      user = userResult.rows[0];
    } catch (dbError) {
      console.error('Registration Database Fatal Error:', dbError.message);
      return res.status(500).json({ error: 'Database enrollment failed. Please contact support.' });
    }

    // Create default savings account with ₹1,000 balance and ₹100,000 limit
    const accountNumber = await generateAccountNumber();
    const { generateTransactionRef } = require('../utils/generators');
    try {
      const accResult = await query(
        `INSERT INTO accounts (account_number, user_id, branch_id, account_type,
                                balance, minimum_balance, daily_transaction_limit, is_primary)
         VALUES ($1, $2, $3, 'savings', 1000.00, 1000.00, 100000.00, true) RETURNING id`,
        [accountNumber, user.id, branchId]
      );
      
      // Record initial transaction
      if (accResult.rows.length) {
        await query(
          `INSERT INTO transactions (transaction_ref, account_id, user_id, type, amount, balance_after, status, description)
           VALUES ($1, $2, $3, 'credit', 1000.00, 1000.00, 'completed', 'Opening Balance')`,
          [await generateTransactionRef(), accResult.rows[0].id, user.id]
        );
      }
    } catch (e) {
      console.warn('Post-registration account creation failed:', e.message);
    }

    // Attempt to send welcome email (don't fail the whole request if email fails)
    const verificationLink = `${process.env.APP_URL}/auth/verify-email?token=${verificationToken}`;
    
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to NexaBank – Verify Your Email',
        template: 'welcome',
        data: { name: full_name, customerId, verificationLink }
      });
    } catch (emailErr) {
      console.warn('Welcome email delivery failed:', emailErr.message);
    }

    await auditLog({ actorId: user.id, actorType: 'user', action: 'REGISTER', entityType: 'user', entityId: user.id, ip: req.ip });

    // Success response
    res.status(201).json({
      message: 'Account created successfully. Your account is now active.',
      customer_id: customerId,
      account_number: accountNumber
    });

    // Cleanup OTP
    await del(`reg_otp:${email.toLowerCase()}`);

  } catch (error) {
    console.error('CRITICAL REGISTRATION ERROR:', error);
    res.status(500).json({ error: 'An unexpected error occurred during registration. Please try again.' });
  }
}

// ─── Login ───────────────────────────────────────────────
async function login(req, res) {
  const { email_or_phone, password, device_id, device_name } = req.body;

  const result = await query(
    `SELECT id, customer_id, full_name, email, phone, password_hash,
            status, two_factor_enabled, failed_login_attempts, locked_until,
            email_verified, kyc_status
     FROM users
     WHERE email = $1 OR phone = $1`,
    [email_or_phone.toLowerCase()]
  );

  if (!result.rows.length) {
    console.log(`[LOGIN] Failure: User not found (${email_or_phone})`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = result.rows[0];

  // Account lock check
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const unlockIn = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
    return res.status(423).json({ error: `Account locked. Try again in ${unlockIn} minutes.` });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Account suspended. Contact support.' });
  }

  if (user.status === 'closed') {
    return res.status(403).json({ error: 'Account closed.' });
  }

  const passwordValid = await bcrypt.compare(password, user.password_hash);

  if (!passwordValid) {
    console.log(`[LOGIN] Failure: Invalid password for ${email_or_phone}`);
    const attempts = user.failed_login_attempts + 1;
    const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;

    await query(
      `UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3`,
      [attempts, lockUntil, user.id]
    );

    return res.status(401).json({
      error: 'Invalid credentials',
      attempts_remaining: Math.max(0, 5 - attempts)
    });
  }

  // Reset failed attempts
  await query(
    `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = $1`,
    [user.id]
  );

  const sessionResult = await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, device_id, device_name, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days') RETURNING id`,
    [user.id, 'temp_hash_' + Date.now(), device_id, device_name || 'Browser Session', req.ip]
  );
  const sessionId = sessionResult.rows[0].id;

  const { accessToken, refreshToken } = generateTokens(user.id, sessionId);

  // Store actual refresh token hash
  const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await query(`UPDATE refresh_tokens SET token_hash = $1 WHERE id = $2`, [refreshHash, sessionId]);

  await auditLog({ actorId: user.id, actorType: 'user', action: 'LOGIN', entityType: 'user', entityId: user.id, ip: req.ip });

  res.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    expires_in: 900,
    user: {
      id: user.id,
      customer_id: user.customer_id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      kyc_status: user.kyc_status,
      email_verified: user.email_verified
    }
  });
}

// ─── Refresh Token ───────────────────────────────────────
async function refreshToken(req, res) {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'Refresh token required' });

  try {
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');

    const stored = await query(
      `SELECT id, user_id FROM refresh_tokens
       WHERE token_hash = $1 AND is_revoked = false AND expires_at > NOW()`,
      [tokenHash]
    );

    if (!stored.rows.length) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Rotate refresh token
    await query(`UPDATE refresh_tokens SET is_revoked = true WHERE id = $1`, [stored.rows[0].id]);

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [decoded.userId, newHash]
    );

    res.json({ access_token: accessToken, refresh_token: newRefreshToken, token_type: 'Bearer', expires_in: 900 });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}

// ─── Logout ──────────────────────────────────────────────
async function logout(req, res) {
  const token = req.token;
  const decoded = jwt.decode(token);
  const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));

  await setEx(`blacklist:${token}`, ttl, '1');

  const { refresh_token } = req.body;
  if (refresh_token) {
    const hash = crypto.createHash('sha256').update(refresh_token).digest('hex');
    await query(`UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1`, [hash]);
  }

  await auditLog({ actorId: req.user.id, actorType: 'user', action: 'LOGOUT', ip: req.ip });
  res.json({ message: 'Logged out successfully' });
}

// ─── Forgot Password ─────────────────────────────────────
async function forgotPassword(req, res) {
  const { email_or_phone } = req.body;

  const result = await query(
    `SELECT id, full_name, email, phone FROM users WHERE email = $1 OR phone = $1`,
    [email_or_phone.toLowerCase()]
  );

  // Always return success (prevent enumeration)
  if (!result.rows.length) {
    return res.json({ message: 'If the account exists, a reset link has been sent.' });
  }

  const user = result.rows[0];
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await query(
    `UPDATE users SET password_reset_token = $1, password_reset_expiry = $2 WHERE id = $3`,
    [resetToken, expiry, user.id]
  );

  await sendEmail({
    to: user.email,
    subject: 'NexaBank – Password Reset Request',
    template: 'password-reset',
    data: { name: user.full_name, resetLink: `${process.env.APP_URL}/reset-password?token=${resetToken}`, expiry: '10 minutes' }
  });

  res.json({ message: 'If the account exists, a reset link has been sent.' });
}

// ─── Reset Password ──────────────────────────────────────
async function resetPassword(req, res) {
  const { token, new_password } = req.body;

  const result = await query(
    `SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expiry > NOW()`,
    [token]
  );

  if (!result.rows.length) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  const passwordHash = await bcrypt.hash(new_password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

  await query(
    `UPDATE users SET password_hash = $1, password_reset_token = NULL,
                      password_reset_expiry = NULL, failed_login_attempts = 0, locked_until = NULL
     WHERE id = $2`,
    [passwordHash, result.rows[0].id]
  );

  // Revoke all refresh tokens
  await query(`UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1`, [result.rows[0].id]);

  await auditLog({ actorId: result.rows[0].id, actorType: 'user', action: 'PASSWORD_RESET', ip: req.ip });
  res.json({ message: 'Password reset successfully. Please login with your new password.' });
}

// ─── Verify Email ────────────────────────────────────────
async function verifyEmail(req, res) {
  const { token } = req.params;

  const result = await query(
    `UPDATE users SET email_verified = true, email_verification_token = NULL, status = 'active'
     WHERE email_verification_token = $1 AND status = 'pending'
     RETURNING id, full_name, email`,
    [token]
  );

  if (!result.rows.length) {
    return res.status(400).json({ error: 'Invalid or already used verification token' });
  }

  res.json({ message: 'Email verified successfully. Your account is now active.' });
}

// ─── Send OTP (phone) ────────────────────────────────────
async function sendPhoneOTP(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    // Find user by phone to get their email
    const userResult = await query('SELECT email, full_name FROM users WHERE phone = $1', [phone]);
    if (!userResult.rows.length) return res.status(404).json({ error: 'User with this phone number not found' });
    
    const user = userResult.rows[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await query(
      `UPDATE users SET phone_otp = $1, phone_otp_expiry = $2 WHERE phone = $3`,
      [otp, expiry, phone]
    );

    // Redirected to Email as per request: "All OTPs will be sent to Email not phone"
    await sendEmail({
      to: user.email,
      template: 'otp',
      data: { name: user.full_name, otp, type: 'Security Verification' }
    });

    res.json({ message: 'Verification code sent to your registered email' });
  } catch (err) {
    console.error('[OTP SEND ERROR]', err);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
}

// ─── Verify OTP ──────────────────────────────────────────
async function verifyPhoneOTP(req, res) {
  const { phone, otp } = req.body;

  const result = await query(
    `SELECT id FROM users WHERE phone = $1 AND phone_otp = $2 AND phone_otp_expiry > NOW()`,
    [phone, otp]
  );

  if (!result.rows.length) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  await query(
    `UPDATE users SET phone_verified = true, phone_otp = NULL, phone_otp_expiry = NULL WHERE id = $1`,
    [result.rows[0].id]
  );

  res.json({ message: 'Phone verified successfully' });
}

// ─── Registration Email OTP ──────────────────────────────
async function sendRegistrationOTP(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Check if email already exists
    try {
      const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing.rows.length) {
        return res.status(409).json({ error: 'Email already registered' });
      }
    } catch (dbErr) {
      console.warn('DB check failed in send-otp, proceeding for demo:', dbErr.message);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`\n📧 [DEMO] OTP for ${email}: ${otp}\n`);
    
    await setEx(`reg_otp:${email.toLowerCase()}`, 300, otp); // 5 mins

    await sendEmail({
      to: email,
      template: 'otp',
      data: { otp, type: 'Registration Verification' }
    });

    res.json({ message: 'Verification code sent to your email.' });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[DEV] Registration OTP for ${req.body.email || 'user'} failed to send via SMTP:`, err.message);
      return res.json({ 
        message: 'Verification code sent to your email (DEV: See server console for code)',
        dev_note: 'SMTP failed, but OTP was generated and stored.'
      });
    }
    console.error('OTP Send Error:', err.message);
    res.status(500).json({ error: 'Failed to send verification code. Try again later.' });
  }
}

async function verifyRegistrationOTP(req, res) {
  try {
    const { email, otp } = req.body;
    
    const stored = await get(`reg_otp:${email.toLowerCase()}`);

    if (stored && stored === otp) {
      res.json({ success: true, message: 'Email verified' });
    } else {
      res.status(401).json({ error: 'Invalid or expired verification code' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
}

module.exports = { register, login, refreshToken, logout, forgotPassword, resetPassword, verifyEmail, sendPhoneOTP, verifyPhoneOTP, sendRegistrationOTP, verifyRegistrationOTP };
