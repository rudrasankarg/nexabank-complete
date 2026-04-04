const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s/g, '') : ''
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  connectionTimeout: 20000, // Increase to 20 seconds
  greetingTimeout: 20000,
  tls: {
    rejectUnauthorized: false
  }
});

// ─── SMTP Transporter Verification ───────────────────────
if (process.env.NODE_ENV !== 'development') {
  transporter.verify((error, success) => {
    if (error) {
      console.error('[MAIL] Transporter Verification Failed:', error.message);
    } else {
      console.log('[MAIL] Transporter Ready for Delivery');
    }
  });
}

const templates = {
  welcome: (data) => ({
    subject: `Welcome to NexaBank, ${data.name}!`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;border:1px solid #eee;padding:20px;border-radius:8px">
        <h1 style="color:#1a3a6e;border-bottom:2px solid #1a3a6e;padding-bottom:10px">NEXABANK</h1>
        <h2>Welcome, ${data.name}!</h2>
        <p>Your account has been created. Your Customer ID is:</p>
        <div style="background:#f4f7fa;padding:15px;text-align:center;margin:20px 0;font-size:24px;font-weight:bold;color:#1a3a6e;letter-spacing:4px">
          ${data.customerId}
        </div>
        <p>Please verify your email to activate your account:</p>
        <p><a href="${data.verificationLink}" style="color:#1a56db;font-weight:bold">Verify Email Address</a></p>
        <p style="color:#666;font-size:12px;margin-top:20px">This link expires in 24 hours. If you didn't create this account, please ignore this email.</p>
        <hr style="border:0;border-top:1px solid #eee;margin:20px 0">
        <p style="text-align:center;color:#999;font-size:11px">© 2024 NexaBank. All rights reserved. | Regulated by RBI</p>
      </div>
    `
  }),

  'password-reset': (data) => ({
    subject: 'NexaBank – Password Reset Request',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;border:1px solid #eee;padding:20px;border-radius:8px">
        <h1 style="color:#1a3a6e;border-bottom:2px solid #1a3a6e;padding-bottom:10px">NEXABANK</h1>
        <h2>Reset Your Password</h2>
        <p>Hello ${data.name},</p>
        <p>We received a request to reset your password. Click the link below to create a new secure password. This link expires in ${data.expiry}.</p>
        <p><a href="${data.resetLink}" style="color:#f59e0b;font-weight:bold;font-size:16px">Reset Password Now</a></p>
        <p style="color:#666;font-size:12px;margin-top:20px">⚠️ If you didn't request this, please ignore this email or contact support immediately.</p>
        <hr style="border:0;border-top:1px solid #eee;margin:20px 0">
      </div>
    `
  }),

  otp: (data) => ({
    subject: `NexaBank Verification Code: ${data.otp}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;border:1px solid #eee;padding:20px;border-radius:8px">
        <h1 style="color:#1a3a6e;border-bottom:2px solid #1a3a6e;padding-bottom:10px">NEXABANK</h1>
        <h2>${data.type || 'Verification Code'}</h2>
        <p>Hello ${data.name || 'User'},</p>
        <p>Use the following 6-digit code to complete your ${data.type?.toLowerCase() || 'request'}. This code expires in 10 minutes.</p>
        <div style="background:#f4f7fa;padding:20px;text-align:center;margin:20px 0;border:1px dashed #1a3a6e">
          <span style="font-size:32px;font-weight:bold;color:#1a3a6e;letter-spacing:10px;font-family:monospace">${data.otp}</span>
        </div>
        <p style="color:#666;font-size:12px">If you didn't request this, please ignore this email or contact support if you're concerned about your security.</p>
      </div>
    `
  }),

  transaction: (data) => ({
    subject: `NexaBank – ${data.type === 'credit' ? 'Money Received' : 'Transaction Alert'} ₹${data.amount}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;border:1px solid #eee;padding:20px;border-radius:8px">
        <h1 style="color:#1a3a6e;border-bottom:2px solid #1a3a6e;padding-bottom:10px">NEXABANK</h1>
        <h2>${data.type === 'credit' ? '✅ Money Received' : '💳 Transaction Alert'}</h2>
        <p>An amount of <strong>₹${data.amount}</strong> has been ${data.type === 'credit' ? 'credited to' : 'debited from'} your account.</p>
        <p>Reference: ${data.ref}</p>
        <p>Current Balance: ₹${data.balance}</p>
      </div>
    `
  })
};

async function sendEmail({ to, subject, template, data, html }) {
  // ─── 🚀 0-Latency Development Bypass ─────────────────────
  // Instantly return for any development OTP to avoid 30s SMTP hangs
  if (process.env.NODE_ENV === 'development') {
    const isOTP = (data && data.otp) || template === 'otp';
    if (isOTP) {
      console.log('\n' + '█'.repeat(50));
      console.log(`📬 [DEV_OTP] To: ${to}`);
      console.log(`🔑 Verification Code: ${data?.otp || 'N/A'}`);
      console.log(`📝 Template: ${template || 'Manual'}`);
      console.log('█'.repeat(50) + '\n');
      return { messageId: 'dev-mock-id-' + Date.now(), accepted: [to] };
    }
  }

  console.log(`[MAIL] Dispatching to ${to} using SMTP...`);
  try {
    const templateData = (template && templates[template]) ? templates[template](data) : null;
    
    // Use sender from environment variables
    const fromAddr = process.env.EMAIL_FROM || process.env.SMTP_USER;
    const fromName = process.env.EMAIL_FROM_NAME || 'NexaBank Security';

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to,
      subject: templateData?.subject || subject,
      html: templateData?.html || html || '<p>No content</p>'
    });
    console.log(`[MAIL] Delivery Success: ${info.messageId}`);
    return info;
  } catch (err) {
    // ─── 📡 Production Rescue Log ───
    // If SMTP fails, we ALWAYS log the OTP to the console as a last resort.
    // This allows you to find the code in your Render/Vercel dashboard logs.
    if (data && data.otp) {
      console.log('\n' + '!'.repeat(50));
      console.log(`📡 [MAIL_FAIL_RESCUE] To: ${to} | OTP: ${data.otp}`);
      console.log('!'.repeat(50) + '\n');
    }
    console.error('[MAIL] Dispatch ERROR:', err.message);
    throw err;
  }
}

module.exports = { sendEmail };
