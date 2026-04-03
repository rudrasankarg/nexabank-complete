const { query } = require('./config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
  try {
    const res = await query("UPDATE users SET kyc_status = 'approved', status = 'active'");
    console.log(`Updated ${res.rowCount} users to approved/active`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
