const path = require('path');
const dotenv = require('dotenv');

// ─── Environment Loading ──────────────────────────────────
if (!process.env.VERCEL) {
  const rootPath = path.join(__dirname, '../../../');
  const serverPath = path.join(__dirname, '../');
  dotenv.config({ path: path.join(rootPath, '.env.local') });
  dotenv.config({ path: path.join(rootPath, '.env') });
  dotenv.config({ path: path.join(serverPath, '.env.local') });
  dotenv.config({ path: path.join(serverPath, '.env') });
} else {
  // Temporary Debug: Log available keys on Vercel (sanitized)
  const keys = Object.keys(process.env).filter(k => k.includes('JWT') || k.includes('SECRET'));
  console.log(`[VERCEL_DEBUG] Available Keys: ${JSON.stringify(keys)}`);
}

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
let isServerReady = false;

async function checkMaintenanceMode(req, res, next) {
  try {
    const isExcluded = req.path.includes('/admin') || 
                      req.path.includes('/auth/admin') || 
                      req.path.includes('/health');
    
    // ─── 🚀 Ensure connections are ready for Serverless ───
    if (!isServerReady) {
      console.log('[BOOT] Serverless Warm-up: Connecting to DB...');
      try {
        await connectDB();
        await connectRedis();
        isServerReady = true;
      } catch (connErr) {
        console.error('[BOOT_ERROR]', connErr.message);
        // Continue anyway, controllers have their own error handling
      }
    }

    if (isExcluded) return next();

    let maintenance = await get('settings:maintenance_mode');
    if (!maintenance) {
      const result = await query(`SELECT value FROM system_settings WHERE key = 'maintenance_mode'`);
      maintenance = result.rows[0]?.value || { enabled: false };
      await setEx('settings:maintenance_mode', 60, JSON.stringify(maintenance));
    } else {
      maintenance = typeof maintenance === 'string' ? JSON.parse(maintenance) : maintenance;
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
    'https://nexabank-complete-iu44iixk2-rudrasankargs-projects.vercel.app', // Explicit prod origin
    /\.vercel\.app$/ // Allow all Vercel deployments
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token', 'X-Device-ID']
}));

// ─── Rate Limiting ─────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100),
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 100 : 10,
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
// ─── Boot ──────────────────────────────────────────────────
async function startServer() {
  // 🚀 Start listener ONLY if not in a serverless environment (Vercel)
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const server = app.listen(PORT, () => {
      console.log(`\n🏦 NexaBank API Server listening on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV}`);
      console.log(`   API Base:    http://localhost:${PORT}/api/v1\n`);
    });
  }

  try {
    // ─── Background Initializations ───
    console.log('[BOOT] Connecting to services...');

    try {
      await connectDB();
      console.log('✅ PostgreSQL connected');
    } catch (dbError) {
      if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
        console.error('❌ DB connection failed (fatal in production):', dbError.message);
        process.exit(1);
      }
      console.warn('⚠️  PostgreSQL unavailable or lazy-loading:', dbError.message);
    }

    await connectRedis();
    console.log('✅ Redis connected (or using fallback)');

    isServerReady = true;
    console.log('✨ [READY] System warming complete.');

  } catch (error) {
    console.error('❌ Server background startup failed:', error.message);
  }
}

// In Vercel, we don't call startServer() top-level at the same time as listen
// But we DO need the DB connection.
startServer();

// ─── Process Safeguards (Only for long-running processes) ───
if (!process.env.VERCEL) {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err.message);
    if (err.stack) console.error(err.stack);
  });
}

module.exports = app;
