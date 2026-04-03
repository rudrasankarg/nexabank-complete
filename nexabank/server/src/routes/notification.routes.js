const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');

router.use(authenticate);

router.get('/', async (req, res) => {
  const result = await query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [req.user.id]
  );
  res.json({ notifications: result.rows, unread: result.rows.filter(n => !n.is_read).length });
});

router.patch('/:id/read', async (req, res) => {
  await query(`UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
  res.json({ message: 'Marked as read' });
});

router.patch('/read-all', async (req, res) => {
  await query(`UPDATE notifications SET is_read = true WHERE user_id = $1`, [req.user.id]);
  res.json({ message: 'All notifications marked as read' });
});

module.exports = router;
