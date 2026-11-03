const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 5000,
  socketTimeout: 5000,
});

module.exports = async function sendMail(email, token, type) {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  let data = {};
  let targetUrl = '';

  switch (type) {
    case 'Verify':
      targetUrl = `${baseUrl}/confirm-email/${token}`;
      data = {
        subject: "Account Verification",
        text: `Thank you for choosing USOF. Click on this link to verify your account: ${targetUrl}`,
        html: `<p>Thank you for choosing <i>USOF</i>.<br>Click on <a href="${targetUrl}">this link</a> to verify your account.</p>`
      };
      break;

    case 'ResetPassword':
    default:
      targetUrl = `${baseUrl}/password-reset/${token}`;
      data = {
        subject: "Reset Password",
        text: `If you want to reset your password, click on this link: ${targetUrl}`,
        html: `<p>If you want to reset your password, click on <a href="${targetUrl}">this link</a>.</p>`
      };
      break;
  }

  logger.info('\n' + '='.repeat(60));
  logger.info(`✉️  [EMAIL SIMULATION] To: ${email}`);
  logger.info(`✉️  [EMAIL SIMULATION] Action: ${data.subject}`);
  logger.info(`✉️  [EMAIL SIMULATION] Link: ${targetUrl}`);
  logger.info('='.repeat(60) + '\n');

  try {
    const info = await transporter.sendMail({
      from: `"USOF Support" <${process.env.SMTP_USER || 'no-reply@usof.local'}>`,
      to: email,
      subject: data.subject,
      text: data.text,
      html: data.html
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`[Email Sent] Preview link: ${previewUrl}`);
    }

    return info;
  } catch (err) {
    logger.warn(`SMTP delivery failed (${err.message}). Using simulated link logged above.`);
    return { simulated: true, url: targetUrl };
  }
};



