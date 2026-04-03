const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  register, login, refreshToken, logout,
  forgotPassword, resetPassword, verifyEmail,
  sendPhoneOTP, verifyPhoneOTP,
  sendRegistrationOTP, verifyRegistrationOTP
} = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/send-otp', sendPhoneOTP);
router.post('/verify-otp', verifyPhoneOTP);
router.post('/send-registration-otp', sendRegistrationOTP);
router.post('/verify-registration-otp', verifyRegistrationOTP);

module.exports = router;
