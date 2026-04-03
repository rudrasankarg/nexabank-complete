const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const connectionString = 'postgresql://nexabank_user:password@localhost:5432/nexabank_db';

  const client = new Client({
    connectionString: connectionString
  });

  try {
    await client.connect();
    console.log('✅ Connected to Database');

    // Get a branch ID
    const branchRes = await client.query('SELECT id FROM branches LIMIT 1');
    const branchId = branchRes.rows[0]?.id;

    if (!branchId) {
      console.error('❌ No branch found. Please run db-setup.js first.');
      return;
    }

    const employeeId = 'ADMIN001';
    const fullName = 'System Administrator';
    const email = 'admin@nexabank.com';
    const password = 'Admin@123';
    const role = 'super_admin';

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    await client.query(`
      INSERT INTO admins (employee_id, full_name, email, password_hash, role, branch_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (employee_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        branch_id = EXCLUDED.branch_id,
        is_active = true
    `, [employeeId, fullName, email, passwordHash, role, branchId]);

    console.log('✅ Admin user created/updated successfully!');
    console.log('-------------------------------------------');
    console.log(`Email: ${email}`);
    console.log(`Employee ID: ${employeeId}`);
    console.log(`Password: ${password}`);
    console.log('-------------------------------------------');

  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
  } finally {
    await client.end();
  }
}

createAdmin();
