require('dotenv').config({ path: '../../.env' });
const bcrypt = require('bcryptjs');
const { pool } = require('./database');

async function seed() {
  const client = await pool.connect();
  console.log('🌱 Seeding NexaBank database...\n');

  try {
    await client.query('BEGIN');

    // ─── Seed Branches ────────────────────────────────
    const branches = [
      { code: 'MUM001', name: 'Mumbai Main Branch', ifsc: 'NXBK0001001', micr: '400000001', address: '123 Fort, Mumbai', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', phone: '+912222001000', email: 'mumbai.main@nexabank.com' },
      { code: 'DEL001', name: 'Delhi Connaught Place', ifsc: 'NXBK0001002', micr: '110000002', address: '45 CP, New Delhi', city: 'New Delhi', state: 'Delhi', pincode: '110001', phone: '+911122001000', email: 'delhi.cp@nexabank.com' },
      { code: 'BAN001', name: 'Bangalore MG Road', ifsc: 'NXBK0001003', micr: '560000003', address: '78 MG Road, Bangalore', city: 'Bangalore', state: 'Karnataka', pincode: '560001', phone: '+918022001000', email: 'bangalore.mgr@nexabank.com' },
      { code: 'CHE001', name: 'Chennai Anna Salai', ifsc: 'NXBK0001004', micr: '600000004', address: '200 Anna Salai, Chennai', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002', phone: '+914422001000', email: 'chennai.anna@nexabank.com' },
      { code: 'HYD001', name: 'Hyderabad Banjara Hills', ifsc: 'NXBK0001005', micr: '500000005', address: '12 Rd No 2, Banjara Hills, Hyderabad', city: 'Hyderabad', state: 'Telangana', pincode: '500034', phone: '+914022001000', email: 'hyd.banjara@nexabank.com' },
    ];

    const branchIds = {};
    for (const b of branches) {
      const r = await client.query(
        `INSERT INTO branches (branch_code, name, ifsc_code, micr_code, address, city, state, pincode, phone, email)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (branch_code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, branch_code`,
        [b.code, b.name, b.ifsc, b.micr, b.address, b.city, b.state, b.pincode, b.phone, b.email]
      );
      branchIds[b.code] = r.rows[0].id;
      console.log(`  ✓ Branch: ${b.name}`);
    }

    // ─── Seed Admins ───────────────────────────────────
    const admins = [
      { employee_id: 'EMP-SUPER-001', full_name: 'Arjun Sharma', email: 'admin@nexabank.com', password: 'Admin@2024!', role: 'super_admin', branch: null },
      { employee_id: 'EMP-MGR-001', full_name: 'Priya Mehta', email: 'mumbai.manager@nexabank.com', password: 'Manager@2024!', role: 'branch_manager', branch: 'MUM001' },
      { employee_id: 'EMP-CS-001', full_name: 'Rahul Gupta', email: 'cs1@nexabank.com', password: 'CS@2024!', role: 'customer_service', branch: 'MUM001' },
      { employee_id: 'EMP-COMP-001', full_name: 'Sneha Iyer', email: 'compliance@nexabank.com', password: 'Comp@2024!', role: 'compliance', branch: null },
    ];

    console.log('\n  Admin Accounts:');
    for (const a of admins) {
      const hash = await bcrypt.hash(a.password, 12);
      await client.query(
        `INSERT INTO admins (employee_id, full_name, email, password_hash, role, branch_id)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (employee_id) DO NOTHING`,
        [a.employee_id, a.full_name, a.email, hash, a.role, a.branch ? branchIds[a.branch] : null]
      );
      console.log(`  ✓ ${a.role}: ${a.employee_id} / ${a.email} / password: ${a.password}`);
    }

    // ─── Seed Demo Customer ────────────────────────────
    const demoHash = await bcrypt.hash('Demo@2024!', 12);
    const customerId = 'NXBK' + Date.now().toString().slice(-8);

    const userResult = await client.query(
      `INSERT INTO users (customer_id, full_name, email, phone, password_hash,
                          date_of_birth, gender, pan_number, branch_id,
                          status, kyc_status, email_verified, phone_verified)
       VALUES ($1, 'Demo Customer', 'demo@nexabank.com', '9876543210', $2,
               '1990-06-15', 'male', 'ABCDE1234F', $3,
               'active', 'approved', true, true)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [customerId, demoHash, branchIds['MUM001']]
    );

    if (userResult.rows.length) {
      const userId = userResult.rows[0].id;
      const accountNumber = '1000' + Date.now().toString().slice(-14);

      await client.query(
        `INSERT INTO accounts (account_number, user_id, branch_id, account_type, balance, minimum_balance, is_primary, interest_rate)
         VALUES ($1, $2, $3, 'savings', 125000.00, 1000.00, true, 3.5)`,
        [accountNumber, userId, branchIds['MUM001']]
      );

      console.log('\n  Demo Customer:');
      console.log(`  ✓ Email: demo@nexabank.com / Password: Demo@2024!`);
      console.log(`  ✓ Customer ID: ${customerId}`);
      console.log(`  ✓ Account: ${accountNumber} / Balance: ₹1,25,000`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Database seeded successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('   USER LOGIN:  demo@nexabank.com / Demo@2024!');
    console.log('   ADMIN LOGIN: EMP-SUPER-001 / Admin@2024!\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
