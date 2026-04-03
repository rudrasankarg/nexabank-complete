const { query } = require('../config/database');

async function sendNotification(userId, { title, message, type, action_url, metadata }) {
  try {
    await query(
      `INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, title, message, type, action_url, JSON.stringify(metadata || {})]
    );
  } catch (err) {
    console.error('Notification error:', err.message);
  }
}

module.exports = { sendNotification };
