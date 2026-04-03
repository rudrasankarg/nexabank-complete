const path = require('path');
const envPath = path.join(__dirname, '../../../.env.local');
console.log(`[INIT] Loading env from: ${envPath}`);
require('dotenv').config({ path: envPath });

if (!process.env.DATABASE_URL && !process.env.DB_NAME) {
  console.error('❌ Error: Environment variables not loaded. Check .env.local path.');
  process.exit(1);
}

const { query } = require('./database');

async function fixKyc() {
  console.log('--- KYC & Account Status Migration ---');
  try {
    // 1. Update all users to approved KYC and active status
    const userResult = await query(
      `UPDATE users 
       SET kyc_status = 'approved', 
           status = 'active',
           updated_at = NOW() 
       WHERE kyc_status != 'approved' OR status != 'active'
       RETURNING id, full_name, kyc_status`
    );
    console.log(`✅ Updated ${userResult.rowCount} users to Approved KYC.`);

    // 2. Ensure all accounts are active
    const accountResult = await query(
      `UPDATE accounts 
       SET is_active = true,
           updated_at = NOW()
       WHERE is_active = false
       RETURNING id, account_number`
    );
    console.log(`✅ Activated ${accountResult.rowCount} accounts.`);

    console.log('\nMigration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    process.exit(0);
  }
}

fixKyc();
