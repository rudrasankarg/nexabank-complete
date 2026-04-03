const router = require('express').Router();
const { authenticate, requireKYC } = require('../middleware/auth');
const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

router.use(authenticate);

router.get('/', async (req, res) => {
  const result = await query(
    `SELECT l.*, a.account_number FROM loans l
     JOIN accounts a ON l.account_id = a.id
     WHERE l.user_id = $1 ORDER BY l.created_at DESC`,
    [req.user.id]
  );
  res.json({ loans: result.rows });
});

router.post('/apply', requireKYC, async (req, res) => {
  const { account_id, loan_type, principal_amount, tenure_months, purpose, interest_rate, amount, tenure } = req.body;
  
  const finalPrincipal = principal_amount || amount;
  const finalTenure = tenure_months || tenure;

  if (!finalPrincipal || !finalTenure) {
    return res.status(400).json({ error: 'Principal amount and tenure are required' });
  }

  const account = await query(`SELECT id FROM accounts WHERE id = $1 AND user_id = $2 AND is_active = true`, [account_id, req.user.id]);
  if (!account.rows.length) return res.status(404).json({ error: 'Account not found' });

  const loanNumber = 'LN' + Date.now().toString();
  const rates = { personal: 13.5, home: 9.5, car: 10.5, education: 10.0, business: 14.5, gold: 9.0 };
  const rate = interest_rate || rates[loan_type] || 13.5;

  const monthlyRate = rate / 12 / 100;
  const emi = finalPrincipal * monthlyRate * Math.pow(1 + monthlyRate, finalTenure) / (Math.pow(1 + monthlyRate, finalTenure) - 1);

  const result = await query(
    `INSERT INTO loans (loan_number, user_id, account_id, loan_type, principal_amount, outstanding_amount, interest_rate, tenure_months, emi_amount, purpose, status)
     VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9, 'applied')
     RETURNING *`,
    [loanNumber, req.user.id, account_id, loan_type, finalPrincipal, rate, finalTenure, Math.round(emi * 100) / 100, purpose]
  );

  res.status(201).json({ message: 'Loan application submitted', loan: result.rows[0] });
});

module.exports = router;
