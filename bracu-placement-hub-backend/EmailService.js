const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify connection
transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ Email service error:', error);
  } else {
    console.log('✅ Email service ready');
  }
});

// Send OTP email
async function sendOTPEmail(email, otp, type) {
  try {
    const subject = type === 'registration' 
      ? '🔐 Verify Your Email - BRACU Placement Hub' 
      : '🔑 Reset Your Password - BRACU Placement Hub';
    
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${type === 'registration' ? 'Welcome to BRACU Placement Hub!' : 'Password Reset Request'}</h2>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"BRACU Placement Hub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: message,
    });

    console.log('📧 Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendOTPEmail,
};