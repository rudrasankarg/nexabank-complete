const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');

router.use(authenticate);

router.get('/status', async (req, res) => {
  const result = await query(
    `SELECT kyc_status, (SELECT json_agg(d.*) FROM kyc_documents d WHERE d.user_id = u.id) as documents
     FROM users u WHERE u.id = $1`,
    [req.user.id]
  );
  res.json(result.rows[0] || {});
});

router.post('/documents', async (req, res) => {
  const { document_type, document_number, document_url } = req.body;
  const result = await query(
    `INSERT INTO kyc_documents (user_id, document_type, document_number, document_url)
     VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING *`,
    [req.user.id, document_type, document_number, document_url]
  );
  await query(`UPDATE users SET kyc_status = 'under_review' WHERE id = $1 AND kyc_status = 'pending'`, [req.user.id]);
  res.status(201).json({ document: result.rows[0] });
});

module.exports = router;
