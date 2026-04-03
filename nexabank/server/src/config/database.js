const { Pool } = require('pg');

const config = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'nexabank_db',
      user: process.env.DB_USER || 'nexabank_user',
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

console.log(`[DB] Config: ${JSON.stringify({...config, password: config.password ? '****' : 'MISSING', connectionString: config.connectionString ? config.connectionString.replace(/:[^:@]+@/, ':****@') : undefined})}`);

const pool = new Pool({
  ...config,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err.message);
});

async function connectDB() {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    client.release();
  } catch (err) {
    client.release();
    throw new Error(`DB connection failed: ${err.message}`);
  }
}

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development' && duration > 1000) {
    console.warn(`Slow query (${duration}ms):`, text);
  }
  return res;
}

async function getClient() {
  return await pool.connect();
}

module.exports = { pool, connectDB, query, getClient };
