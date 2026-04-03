export interface User {
  id: string;
  customer_id: string;
  full_name: string;
  email: string;
  phone: string;
  status: 'pending' | 'active' | 'suspended' | 'closed';
  kyc_status: 'pending' | 'under_review' | 'approved' | 'rejected';
  email_verified: boolean;
  phone_verified: boolean;
  profile_photo_url?: string;
  branch_id?: string;
  two_factor_enabled: boolean;
  notification_preferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface Account {
  id: string;
  account_number: string;
  account_type: 'savings' | 'current' | 'salary' | 'fixed_deposit' | 'recurring_deposit';
  balance: number;
  minimum_balance: number;
  interest_rate: number;
  is_primary: boolean;
  is_active: boolean;
  is_frozen: boolean;
  daily_transaction_limit: number;
  branch_name: string;
  ifsc_code: string;
  opened_at: string;
  nomination_name?: string;
  nomination_relation?: string;
}

export interface Transaction {
  id: string;
  transaction_ref: string;
  type: 'credit' | 'debit' | 'transfer' | 'bill_payment' | 'emi' | 'reversal';
  amount: number;
  balance_after: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'reversed';
  description?: string;
  category?: string;
  merchant_name?: string;
  payment_mode?: string;
  created_at: string;
  account_number: string;
}

export interface Card {
  id: string;
  card_number_masked: string;
  card_holder_name: string;
  card_type: 'debit' | 'credit' | 'prepaid';
  network: 'VISA' | 'MASTERCARD' | 'RUPAY' | 'AMEX';
  expiry_month: string;
  expiry_year: string;
  status: 'active' | 'blocked' | 'expired' | 'cancelled' | 'pending_activation';
  daily_atm_limit: number;
  daily_pos_limit: number;
  daily_online_limit: number;
  is_international_enabled: boolean;
  is_contactless_enabled: boolean;
  is_online_enabled: boolean;
  is_atm_enabled: boolean;
  credit_limit?: number;
  available_credit?: number;
  activated_at?: string;
}

export interface Admin {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  role: 'super_admin' | 'branch_manager' | 'customer_service' | 'compliance' | 'auditor';
  branch_id?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Branch {
  id: string;
  branch_code: string;
  name: string;
  ifsc_code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
}

export interface Loan {
  id: string;
  loan_number: string;
  loan_type: string;
  principal_amount: number;
  outstanding_amount: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  status: string;
  next_emi_date?: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
