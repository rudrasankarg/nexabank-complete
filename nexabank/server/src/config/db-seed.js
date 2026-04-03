const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function seed() {
  console.log('🌱 Seeding NexaBank Branches...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to NexaBank Database');

    // Insert Default Branch
    const res = await client.query(`
      INSERT INTO branches (branch_code, name, ifsc_code, address, city, state, pincode)
      VALUES ('HO001', 'Head Office', 'NEXA0000001', 'Nexa Tower, Financial District', 'Mumbai', 'Maharashtra', '400001')
      ON CONFLICT (branch_code) DO NOTHING
      RETURNING id;
    `);

    if (res.rows.length > 0) {
      console.log('✅ Default branch "Head Office" created with ID:', res.rows[0].id);
    } else {
      console.log('ℹ️ Default branch already exists.');
    }

    console.log('\n🎉 Seed Complete!');
    
  } catch (err) {
    console.error('\n❌ Seed Failed:', err.message);
  } finally {
    await client.end();
  }
}

seed();
