const router = require('express').Router();
const { authenticate, requireKYC } = require('../middleware/auth');
const { getTransactions, transfer, payBill, requestTransactionOTP, miniStatement } = require('../controllers/transaction.controller');

router.use(authenticate);

router.get('/', getTransactions);
router.get('/mini-statement/:account_id', miniStatement);
router.post('/request-otp', requestTransactionOTP);
router.post('/transfer', requireKYC, transfer);
router.post('/pay-bill', requireKYC, payBill);

module.exports = router;
