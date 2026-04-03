const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const bcrypt = require('bcryptjs');

async function fix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to Database');

    const passwordHash = await bcrypt.hash('Lux@1234', 12);
    console.log('⏳ Updating user manchesterunitedfan459@gmail.com...');
    
    await client.query(`
      UPDATE users 
      SET status = 'active', 
          email_verified = true, 
          kyc_status = 'approved',
          password_hash = $1
      WHERE email = $2
    `, [passwordHash, 'manchesterunitedfan459@gmail.com']);
    
    console.log('✅ User updated successfully');

  } catch (err) {
    console.error('❌ Fix failed:', err.message);
  } finally {
    await client.end();
  }
}

fix();
