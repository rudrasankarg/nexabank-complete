const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
const bcrypt = require('bcryptjs');

async function testLogin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  const email = 'manchesterunitedfan459@gmail.com';
  const password = 'Lux@1234';

  try {
    await client.connect();
    console.log('✅ Connected to Database');

    const result = await client.query('SELECT password_hash, status, kyc_status FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = result.rows[0];
    console.log('User status:', user.status);
    console.log('KYC status:', user.kyc_status);

    const valid = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', valid);

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  } finally {
    await client.end();
  }
}

testLogin();
