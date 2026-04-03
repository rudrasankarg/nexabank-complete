const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  try {
    await client.connect();
    console.log('Connected to DB');
    const res = await client.query("UPDATE users SET kyc_status = 'approved', status = 'active'");
    console.log(`Updated ${res.rowCount} users to approved/active`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

fix();
