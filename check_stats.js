const { query } = require('./nexabank/server/src/config/database');

async function checkStats() {
  try {
    const users = await query('SELECT COUNT(*) FROM users');
    const cards = await query("SELECT COUNT(*) FROM cards WHERE status = 'active'");
    const pendingCards = await query("SELECT COUNT(*) FROM cards WHERE status = 'pending_activation'");
    
    console.log('Real DB Stats:');
    console.log('Total Users:', users.rows[0].count);
    console.log('Active Cards:', cards.rows[0].count);
    console.log('Pending Cards:', pendingCards.rows[0].count);
  } catch (err) {
    console.error('Error:', err);
  }
}

checkStats();
