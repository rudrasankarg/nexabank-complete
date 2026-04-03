const { query } = require('./config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function check() {
  try {
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cards'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
