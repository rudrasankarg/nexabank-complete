const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function setup() {
  console.log(' NexaBank Database Setup Wizard');
  
  // Try to connect as the default 'postgres' superuser to fix permissions
  const superuserPassword = process.env.POSTGRES_SUPERUSER_PASSWORD;
  if (!superuserPassword) {
    console.error(' POSTGRES_SUPERUSER_PASSWORD is not set in your .env or .env.local file.');
    process.exit(1);
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_SUPERUSER || 'postgres',
    password: superuserPassword,
  });

  try {
    await client.connect();
    console.log(' Connected to PostgreSQL as superuser');

    // 1. Ensure user exists and has correct password
    console.log('   Syncing user "nexabank_user"...');
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'nexabank_user') THEN
          CREATE ROLE nexabank_user WITH LOGIN PASSWORD 'password';
        ELSE
          ALTER ROLE nexabank_user WITH PASSWORD 'password';
        END IF;
      END $$;
    `);

    // 3. Ensure at least one branch exists
    console.log('   Seeding default branch...');
    const branchCheck = await client.query('SELECT id FROM branches LIMIT 1');
    if (branchCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO branches (branch_code, name, ifsc_code, address, city, state, pincode)
        VALUES ('HO001', 'Head Office', 'NEXA0000001', 'Nexa Tower, Financial District', 'Mumbai', 'Maharashtra', '400001')
      `);
      console.log(' Default branch seeded');
    } else {
      console.log('ℹ Branch already exists');
    }

    console.log('\n DB Setup & Seeding Complete!');
    
  } catch (err) {
    console.error('\n Setup Failed:', err.message);
    console.log('\n TIP: Set POSTGRES_SUPERUSER_PASSWORD in your .env.local file to match your local postgres superuser password.');
  } finally {
    await client.end();
  }
}

setup();
