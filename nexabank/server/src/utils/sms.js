// sms.js
async function sendSMS(phone, message) {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || process.env.NODE_ENV === 'development') {
      console.log(`[SMS to ${phone}]: ${message}`);
      return;
    }
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilio.messages.create({ body: message, from: process.env.TWILIO_PHONE, to: phone });
  } catch (err) {
    console.error('SMS error:', err.message);
  }
}

module.exports = { sendSMS };
