const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
const { setEx, get } = require('./src/config/redis');
const { sendEmail } = require('./src/utils/emailService');

async function test() {
  console.log('--- Diagnostic Test ---');
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '********' : 'MISSING');
  
  try {
    console.log('\n1. Testing Redis/Memory Store...');
    await setEx('test_key', 10, 'test_value');
    const val = await get('test_key');
    console.log('   Result:', val === 'test_value' ? '✅ SUCCESS' : '❌ FAILED');
  } catch (err) {
    console.error('   ❌ Redis Error:', err.message);
  }

  try {
    console.log('\n2. Testing Email Service...');
    // Try sending to the same user
    await sendEmail({
      to: process.env.SMTP_USER,
      subject: 'NexaBank Diagnostic Test',
      template: 'otp',
      data: { otp: '123456', type: 'Diagnostic Test' }
    });
    console.log('   Result: ✅ SUCCESS');
  } catch (err) {
    console.error('   ❌ Email Error:', err.message);
  }
  
  process.exit();
}

test();
