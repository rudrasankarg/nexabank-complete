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
    console.log('✅ Connected to Database');

    console.log('⏳ Adding nomination columns to accounts table...');
    await client.query(`
      ALTER TABLE accounts 
      ADD COLUMN IF NOT EXISTS nomination_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS nomination_relation VARCHAR(50);
    `);
    console.log('✅ Columns added successfully');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
