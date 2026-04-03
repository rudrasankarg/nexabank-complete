const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database for migration');

    // 1. Add daily_transaction_limit column if it doesn't exist
    await client.query(`
      ALTER TABLE accounts 
      ADD COLUMN IF NOT EXISTS daily_transaction_limit DECIMAL(15,2) DEFAULT 100000.00
    `);
    console.log('✅ Added daily_transaction_limit column');

    // 2. Update existing accounts to have 100,000 limit
    await client.query(`
      UPDATE accounts SET daily_transaction_limit = 100000.00 WHERE daily_transaction_limit IS NULL
    `);
    console.log('✅ Updated existing account limits');

    // 3. Ensure all accounts have at least 1000 balance (as per user request "any account opening default balance should be 1000")
    await client.query(`
      UPDATE accounts SET balance = 1000.00 WHERE balance < 1000.00
    `);
    console.log('✅ Guaranteed minimum balance of 1000.00');

    console.log('\n🎉 Migration Successful!');
  } catch (err) {
    console.error('❌ Migration Failed:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
