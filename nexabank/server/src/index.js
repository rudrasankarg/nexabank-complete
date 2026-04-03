const path = require('path');
const rootEnvLocal = path.join(__dirname, '../../.env.local');
const rootEnv = path.join(__dirname, '../../.env');
console.log(`[ENV] Loading root .env.local from: ${rootEnvLocal}`);
const result = require('dotenv').config({ path: rootEnvLocal });
if (result.error) {
  console.warn(`[ENV] Warning: Failed to load .env.local: ${result.error.message}`);
} else {
  console.log(`[ENV] Successfully loaded .env.local`);
}
require('dotenv').config({ path: rootEnv });
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { connectDB, query } = require('./config/database');
const { connectRedis, get, setEx } = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// ─── Maintenance Guard ────────────────────────────────────
async function checkMaintenanceMode(req, res, next) {
  try {
    const isExcluded = req.path.includes('/admin') || 
                      req.path.includes('/auth/admin') || 
                      req.path.includes('/health');
    
    if (isExcluded) return next();

    let maintenance = await get('settings:maintenance_mode');
    if (!maintenance) {
      const result = await query(`SELECT value FROM system_settings WHERE key = 'maintenance_mode'`);
      maintenance = result.rows[0]?.value || { enabled: false };
      await setEx('settings:maintenance_mode', 60, JSON.stringify(maintenance));
    } else {
      maintenance = JSON.parse(maintenance);
    }

    if (maintenance.enabled) {
      console.log(`[MAINTENANCE] Blocking request: ${req.method} ${req.path}`);
      return res.status(503).json({
        error: 'System Maintenance',
        message: maintenance.message || 'System is currently under maintenance. Please try again later.'
      });
    }
    next();
  } catch (err) {
    console.error('[MAINTENANCE_ERROR]', err.message);
    next();
  }
}

// Route imports
const authRoutes = require('./routes/auth.routes');
const adminAuthRoutes = require('./routes/adminAuth.routes');
const userRoutes = require('./routes/user.routes');
const accountRoutes = require('./routes/account.routes');
const transactionRoutes = require('./routes/transaction.routes');
const cardRoutes = require('./routes/card.routes');
const loanRoutes = require('./routes/loan.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');
const kycRoutes = require('./routes/kyc.routes');
const chatbotRoutes = require('./routes/chatbot.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust the Render/Vercel proxy for rate limiting to work correctly
app.set('trust proxy', 1);

// ─── Security ──────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: [
    process.env.APP_URL || 'http://localhost:3000',
    'http://localhost:19006', // Expo mobile
    /\.vercel\.app$/ // Allow all Vercel deployments
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token', 'X-Device-ID']
}));

// ─── Rate Limiting ─────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts, please try again in 15 minutes.' }
});

// ─── Middleware ────────────────────────────────────────────
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(globalLimiter);
app.use(checkMaintenanceMode);

// ─── Health Check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: process.env.APP_NAME,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ─── API Routes ────────────────────────────────────────────
const API = '/api/v1';

// Auth (rate limited)
app.use(`${API}/auth`, authLimiter, authRoutes);
app.use(`${API}/admin/auth`, authLimiter, adminAuthRoutes);

// User routes
app.use(`${API}/users`, userRoutes);
app.use(`${API}/accounts`, accountRoutes);
app.use(`${API}/transactions`, transactionRoutes);
app.use(`${API}/cards`, cardRoutes);
app.use(`${API}/loans`, loanRoutes);
app.use(`${API}/kyc`, kycRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/chatbot`, chatbotRoutes);

// Admin routes (separate, protected)
app.use(`${API}/admin`, adminRoutes);

// ─── Error Handling ────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Boot ──────────────────────────────────────────────────
async function startServer() {
  try {
    try {
      await connectDB();
      console.log('✅ PostgreSQL connected');
    } catch (dbError) {
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ DB connection failed (fatal in production):', dbError.message);
        process.exit(1);
      }
      console.warn('⚠️  PostgreSQL unavailable, running without DB (dev mode):', dbError.message);
    }

    await connectRedis();
    console.log('✅ Redis connected (or using in-memory fallback)');

    app.listen(PORT, () => {
      console.log(`\n🏦 NexaBank API Server running`);
      console.log(`   Port:        ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV}`);
      console.log(`   API Base:    http://localhost:${PORT}/api/v1\n`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
