const router = require('express').Router();
const { chat } = require('../controllers/chatbot.controller');

router.post('/chat', chat);
router.get('/diag', (req, res) => {
  res.json({ 
    hasKey: !!process.env.GEMINI_API_KEY,
    keyStart: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 8) : 'none'
  });
});

module.exports = router;
