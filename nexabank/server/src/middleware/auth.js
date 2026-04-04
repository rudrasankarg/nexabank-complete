const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { get } = require('../config/redis');

// ─── User Authentication ──────────────────────────────────
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { sessionId } = decoded;

    // Check if token is blacklisted (explicit logout)
    const blacklisted = await get(`blacklist:${token}`);
    if (blacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    // NEW: Session Verification (Immediate Logout Support)
    if (sessionId) {
      const sessionResult = await query(
        `SELECT id FROM refresh_tokens 
         WHERE id = $1 AND user_id = $2 AND is_revoked = false AND expires_at > NOW()`,
        [sessionId, decoded.userId]
      );
      if (!sessionResult.rows.length) {
        return res.status(401).json({ error: 'Session has been terminated', code: 'SESSION_REVOKED' });
      }
    }

    // Fetch user
    const result = await query(
      `SELECT id, customer_id, full_name, email, phone, status, kyc_status,
              branch_id, two_factor_enabled, email_verified, phone_verified
       FROM users WHERE id = $1 AND status = 'active'`,
      [decoded.userId]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: 'Account not found or inactive' });
    }

    req.user = result.rows[0];
    req.user.sessionId = sessionId;
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next(err);
  }
}

// ─── Admin Authentication ─────────────────────────────────
async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    if (decoded.type !== 'admin') {
      return res.status(403).json({ error: 'Invalid admin token' });
    }

    const result = await query(
      `SELECT id, employee_id, full_name, email, role, branch_id, is_active
       FROM admins WHERE id = $1 AND is_active = true`,
      [decoded.adminId]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: 'Admin account not found or inactive' });
    }

    req.admin = result.rows[0];
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Admin token expired', code: 'TOKEN_EXPIRED' });
    }
    next(err);
  }
}

// ─── Role Guard ───────────────────────────────────────────
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Admin auth required' });
    }
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.admin.role
      });
    }
    next();
  };
}

// ─── KYC Guard ───────────────────────────────────────────
function requireKYC(req, res, next) {
  if (req.user.kyc_status !== 'approved') {
    return res.status(403).json({
      error: 'KYC verification required',
      kyc_status: req.user.kyc_status
    });
  }
  next();
}

module.exports = { authenticate, authenticateAdmin, requireRole, requireKYC };
