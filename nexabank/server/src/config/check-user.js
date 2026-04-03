const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

async function check() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to Database');

    const res = await client.query('SELECT email, status, kyc_status, email_verified FROM users WHERE email = $1', ['manchesterunitedfan459@gmail.com']);
    console.log('User Data:', res.rows[0] || 'NOT FOUND');

  } catch (err) {
    console.error('❌ Check failed:', err.message);
  } finally {
    await client.end();
  }
}

check();
