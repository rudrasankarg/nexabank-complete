const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('./database');

const migrations = [
  // ─── Extensions ──────────────────────────────────────────
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

  // ─── Enums ───────────────────────────────────────────────
  `DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'closed');
  EXCEPTION WHEN duplicate_object THEN null; END $$`,

  `DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('savings', 'current', 'salary', 'fixed_deposit', 'recurring_deposit');
  EXCEPTION WHEN duplicate_object THEN null; END $$`,

  `DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('credit', 'debit', 'transfer', 'bill_payment', 'emi', 'reversal');
  EXCEPTION WHEN duplicate_object THEN null; END $$`,

  `DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'reversed');
  EXCEPTION WHEN duplicate_object THEN null; END $$`,

  `DO $$ BEGIN
    CREATE TYPE card_type AS ENUM ('debit', 'credit', 'prepaid');
  EXCEPTION WHEN duplicate_object THEN null; END $$`,

  `DO $$ BEGIN
    CREATE TYPE card_status AS ENUM ('active', 'blocked', 'expired', 'cancelled', 'pending_activation');
  EXCEPTION WHEN duplicate_object THEN null; END $$`,

  `DO $$ BEGIN
    CREATE TYPE kyc_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');
  EXCEPTION WHEN duplicate_object THEN null; END $$`,

  `DO $$ BEGIN
    CREATE TYPE loan_status AS ENUM ('applied', 'under_review', 'approved', 'disbursed', 'active', 'closed', 'rejected');
  EXCEPTION WHEN duplicate_object THEN null; END $$`,

  `DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM ('super_admin', 'branch_manager', 'customer_service', 'compliance', 'auditor');
  EXCEPTION WHEN duplicate_object THEN null; END $$`,

  // ─── Branches ────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    ifsc_code VARCHAR(15) UNIQUE NOT NULL,
    micr_code VARCHAR(9),
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    pincode VARCHAR(6) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100),
    manager_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Admins ──────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role admin_role NOT NULL DEFAULT 'customer_service',
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    phone VARCHAR(15),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    two_factor_secret VARCHAR(32),
    two_factor_enabled BOOLEAN DEFAULT false,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Users ───────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id VARCHAR(15) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    pan_number VARCHAR(10) UNIQUE,
    aadhaar_last4 VARCHAR(4),
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(6),
    country VARCHAR(50) DEFAULT 'India',
    profile_photo_url TEXT,
    status user_status DEFAULT 'pending',
    kyc_status kyc_status DEFAULT 'pending',
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(32),
    biometric_enabled BOOLEAN DEFAULT false,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(100),
    phone_otp VARCHAR(6),
    phone_otp_expiry TIMESTAMPTZ,
    password_reset_token VARCHAR(100),
    password_reset_expiry TIMESTAMPTZ,
    notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Accounts ────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_number VARCHAR(18) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    account_type account_type NOT NULL,
    balance NUMERIC(15,2) DEFAULT 0.00,
    minimum_balance NUMERIC(10,2) DEFAULT 0.00,
    interest_rate NUMERIC(5,2) DEFAULT 0.00,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_frozen BOOLEAN DEFAULT false,
    freeze_reason TEXT,
    daily_transaction_limit NUMERIC(12,2) DEFAULT 200000.00,
    monthly_transaction_limit NUMERIC(14,2) DEFAULT 5000000.00,
    nomination_name VARCHAR(100),
    nomination_relation VARCHAR(50),
    maturity_date DATE,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Transactions ─────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_ref VARCHAR(30) UNIQUE NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type transaction_type NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    balance_after NUMERIC(15,2),
    currency VARCHAR(3) DEFAULT 'INR',
    status transaction_status DEFAULT 'pending',
    description TEXT,
    category VARCHAR(50),
    merchant_name VARCHAR(100),
    merchant_category VARCHAR(50),
    reference_account_id UUID REFERENCES accounts(id),
    reference_account_number VARCHAR(18),
    reference_bank VARCHAR(100),
    ifsc_code VARCHAR(15),
    payment_mode VARCHAR(20),
    upi_id VARCHAR(100),
    card_id UUID,
    bill_type VARCHAR(50),
    bill_reference VARCHAR(100),
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    ip_address INET,
    device_id VARCHAR(100),
    is_flagged BOOLEAN DEFAULT false,
    flag_reason TEXT,
    reversed_at TIMESTAMPTZ,
    reversal_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Cards ───────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_number_hash VARCHAR(255) NOT NULL,
    card_number_last4 VARCHAR(4) NOT NULL,
    card_number_masked VARCHAR(19) NOT NULL,
    card_holder_name VARCHAR(100) NOT NULL,
    card_type card_type NOT NULL,
    network VARCHAR(20) DEFAULT 'VISA',
    expiry_month VARCHAR(2) NOT NULL,
    expiry_year VARCHAR(4) NOT NULL,
    cvv_hash VARCHAR(255) NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status card_status DEFAULT 'pending_activation',
    credit_limit NUMERIC(12,2),
    available_credit NUMERIC(12,2),
    billing_cycle_day INTEGER DEFAULT 1,
    daily_atm_limit NUMERIC(8,2) DEFAULT 25000.00,
    daily_pos_limit NUMERIC(10,2) DEFAULT 100000.00,
    daily_online_limit NUMERIC(10,2) DEFAULT 100000.00,
    is_international_enabled BOOLEAN DEFAULT false,
    is_contactless_enabled BOOLEAN DEFAULT true,
    is_online_enabled BOOLEAN DEFAULT true,
    is_atm_enabled BOOLEAN DEFAULT true,
    pin_hash VARCHAR(255),
    wrong_pin_attempts INTEGER DEFAULT 0,
    pin_locked_until TIMESTAMPTZ,
    delivery_address TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    blocked_at TIMESTAMPTZ,
    block_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── KYC Documents ────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(50),
    document_url TEXT,
    status kyc_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES admins(id),
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    expires_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Loans ───────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_number VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    loan_type VARCHAR(30) NOT NULL,
    principal_amount NUMERIC(14,2) NOT NULL,
    disbursed_amount NUMERIC(14,2),
    outstanding_amount NUMERIC(14,2),
    interest_rate NUMERIC(5,2) NOT NULL,
    tenure_months INTEGER NOT NULL,
    emi_amount NUMERIC(10,2),
    emi_day INTEGER DEFAULT 1,
    status loan_status DEFAULT 'applied',
    purpose TEXT,
    approved_by UUID REFERENCES admins(id),
    approved_at TIMESTAMPTZ,
    disbursed_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    next_emi_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Beneficiaries ───────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(50) NOT NULL,
    beneficiary_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(18) NOT NULL,
    ifsc_code VARCHAR(15),
    bank_name VARCHAR(100),
    upi_id VARCHAR(100),
    is_verified BOOLEAN DEFAULT false,
    is_self BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, account_number)
  )`,

  // ─── Notifications ────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Service Requests ─────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_number VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    request_type VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'open',
    priority VARCHAR(10) DEFAULT 'normal',
    assigned_to UUID REFERENCES admins(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Fixed Deposits ───────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS fixed_deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fd_number VARCHAR(20) UNIQUE NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    principal NUMERIC(14,2) NOT NULL,
    interest_rate NUMERIC(5,2) NOT NULL,
    tenure_days INTEGER NOT NULL,
    maturity_amount NUMERIC(14,2),
    maturity_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    auto_renew BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── OTP Log ─────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS otp_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_id VARCHAR(100) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    type VARCHAR(30) NOT NULL,
    is_used BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Audit Log ───────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID,
    actor_type VARCHAR(10) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Refresh Tokens ───────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    device_id VARCHAR(100),
    device_name VARCHAR(100),
    ip_address INET,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Indexes ─────────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
  `CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`,
  `CREATE INDEX IF NOT EXISTS idx_users_customer_id ON users(customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_accounts_number ON accounts(account_number)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_ref ON transactions(transaction_ref)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_id, actor_type)`,
  
  // ─── System Settings ──────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
];

async function migrate() {
  console.log('🚀 Starting NexaBank database migration...');
  const client = await pool.connect();
  try {
    for (let i = 0; i < migrations.length; i++) {
      await client.query(migrations[i]);
      process.stdout.write(`   Migration ${i + 1}/${migrations.length} ✓\r`);
    }
    console.log('\n✅ All migrations completed successfully!\n');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    if (err.detail) console.error('   Detail:', err.detail);
    if (err.hint) console.error('   Hint:', err.hint);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('\n❌ Fatal: Migration script failed to initialize:', err);
  process.exit(1);
});
