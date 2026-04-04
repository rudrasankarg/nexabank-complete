const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');
const { auditLog } = require('../utils/audit');

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { employee_id, password } = req.body;

    if (!employee_id || !password) {
      return res.status(400).json({ error: 'Employee ID and Password are required' });
    }

    const result = await query(
      `SELECT id, employee_id, full_name, email, password_hash, role, branch_id,
              is_active, failed_login_attempts, locked_until, two_factor_enabled
       FROM admins WHERE employee_id = $1`,
      [employee_id]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];

    if (!admin.is_active) return res.status(403).json({ error: 'Admin account is inactive' });

    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return res.status(423).json({ error: 'Account temporarily locked' });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      const attempts = admin.failed_login_attempts + 1;
      const lockUntil = attempts >= 3 ? new Date(Date.now() + 30 * 60 * 1000) : null;
      await query(
        `UPDATE admins SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3`,
        [attempts, lockUntil, admin.id]
      );
      return res.status(401).json({ error: 'Invalid credentials', attempts_remaining: Math.max(0, 3 - attempts) });
    }

    await query(
      `UPDATE admins SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = $1`,
      [admin.id]
    );

    // ─── NEW: Create physical Admin Session ───
    const sessionResult = await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, device_id, device_name, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days') RETURNING id`,
      [admin.id, 'temp_hash_' + Date.now(), req.headers['x-device-id'] || 'admin-api', 'Admin Portal', req.ip]
    );
    const sessionId = sessionResult.rows[0].id;

    if (!process.env.ADMIN_JWT_SECRET) {
      throw new Error('ADMIN_JWT_SECRET is not defined in environment variables');
    }

    const token = jwt.sign(
      { adminId: admin.id, role: admin.role, type: 'admin', sessionId },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '8h' }
    );

    await auditLog({ actorId: admin.id, actorType: 'admin', action: 'ADMIN_LOGIN', ip: req.ip });

    res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 28800,
      sessionId,
      admin: {
        id: admin.id,
        employee_id: admin.employee_id,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role,
        branch_id: admin.branch_id
      }
    });
  } catch (error) {
    console.error('[ADMIN_LOGIN_ERROR]', error);
    const visibleKeys = Object.keys(process.env).filter(k => k.includes('JWT') || k.includes('SECRET') || k.includes('ADMIN'));
    res.status(500).json({ 
      error: 'An unexpected error occurred during admin login.',
      debug_error: error.message,
      hint: `Vercel is only sending these keys: [${visibleKeys.join(', ')}]. Is ADMIN_JWT_SECRET in that list?`
    });
  }
});

// Admin profile
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Auth required' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    const result = await query(
      `SELECT a.id, a.employee_id, a.full_name, a.email, a.role, a.last_login,
              b.name as branch_name
       FROM admins a LEFT JOIN branches b ON a.branch_id = b.id
       WHERE a.id = $1`,
      [decoded.adminId]
    );
    res.json({ admin: result.rows[0] });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
