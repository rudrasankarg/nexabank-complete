const router = require('express').Router();
const { authenticate, requireKYC } = require('../middleware/auth');
const { getCards, applyCard, activateCard, blockCard, updateCardSettings, changePin, requestCardOTP } = require('../controllers/card.controller');

router.use(authenticate);

router.get('/', getCards);
router.post('/apply', requireKYC, applyCard);
router.post('/request-otp', requestCardOTP);
router.post('/:card_id/activate', activateCard);
router.post('/:card_id/block', blockCard);
router.patch('/:card_id/settings', updateCardSettings);
router.post('/:card_id/change-pin', changePin);

module.exports = router;
