const { query } = require('./server/src/config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function testPool() {
  try {
    console.log('⏳ Testing Pool Query...');
    const res = await query('SELECT NOW()');
    console.log('✅ Pool Query Success:', res.rows[0]);
    
    console.log('⏳ Checking user...');
    const userRes = await query('SELECT email FROM users WHERE email = $1', ['manchesterunitedfan459@gmail.com']);
    console.log('✅ User Check Success:', userRes.rows[0] || 'NOT FOUND');

  } catch (err) {
    console.error('❌ Pool Test Failed:', err.message);
  } finally {
    process.exit();
  }
}

testPool();
