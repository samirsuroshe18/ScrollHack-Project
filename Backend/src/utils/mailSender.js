// utils/mailSender.js
import { createTransport } from 'nodemailer';
import crypto from 'crypto';
import { User } from '../models/user.model.js';

const TOKEN_LIFETIME_MS = 1000 * 60 * 10;

const createMailTransport = () => {
  // tests must never send real email
  if (process.env.NODE_ENV === 'test') {
    return createTransport({ jsonTransport: true });
  }

  return createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    }
  });
};

// emailType is "VERIFY" or "RESET"
async function mailSender(email, userId, emailType) {
  try {
    // hex keeps the token safe to put in a URL
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + TOKEN_LIFETIME_MS;

    if (emailType === "VERIFY") {
      await User.findByIdAndUpdate(userId, { verifyToken: token, verifyTokenExpiry: expiry });
    } else if (emailType === "RESET") {
      await User.findByIdAndUpdate(userId, { forgotPasswordToken: token, forgotPasswordTokenExpiry: expiry });
    }

    const isVerify = emailType === "VERIFY";
    const link = `${process.env.FRONTEND_URL}/${isVerify ? "verify-email" : "reset-password"}?token=${token}`;
    const action = isVerify ? "verify your email" : "reset your password";

    const transporter = createMailTransport();

    const mailResponse = await transporter.sendMail({
      from: `AlumniNest <${process.env.MAIL_USER}>`,
      to: email,
      subject: isVerify ? "Verify your email" : "Reset your password",
      html: `<p>Hello,</p>
<p>Click <a href="${link}">here</a> to ${action}. The link is valid for 10 minutes.</p>
<p>If you did not ask for this, you can ignore this email.</p>
<p>AlumniNest</p>`
    });

    return mailResponse;
  } catch (error) {
    console.log(error.message);
  }
};

export default mailSender;
