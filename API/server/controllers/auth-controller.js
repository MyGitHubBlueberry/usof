const DbUser = require('../models/user-model');
const DbUserBan = require('../models/user-ban-model');
const { generateToken } = require('../utils/jwt');
const { hashPassword, passwordsMatch } = require('../utils/password');
const sendMail = require('../utils/email');
const crypto = require('node:crypto');
const logger = require('../utils/logger.js');
const { ConflictError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError }
  = require('../utils/error');
const { ERROR_MESSAGES } = require('../utils/constants');
const { devLinkPayload } = require('../utils/dev-link');

module.exports = class AuthController {
  static async register(req, res) {
    const { login, email, password, confirmed_password, full_name } = req.body;

    if (await DbUser.findOneBy({ login, email }, 'OR')) {
      throw new ConflictError(ERROR_MESSAGES.EMAIL_IN_USE);
    }

    const hashed = await hashPassword(password);

    const email_verification_token = generateRandomToken();

    const user = new DbUser({
      login, email, full_name, password: hashed, email_verification_token
    });

    await user.save();

    sendMail(user.email, user.email_verification_token, 'Verify').catch(err =>
      logger.error(err, 'Failed to send verification email')
    );

    return res.status(201).json({
      message: "User registered. " +
        "Please, check your email for verification.",
      ...devLinkPayload(`/confirm-email/${email_verification_token}`)
    });
  }

  static async requestEmailVerification(req, res) {
    const { email } = req.body;
    const user = await DbUser.findByEmail(email);

    if (!user) {
      throw new NotFoundError('No user with this email exist.');
    } else if (user.isConfirmed()) {
      throw new BadRequestError('This email is already verified.');
    }

    sendMail(user.email, user.email_verification_token, 'Verify').catch(err =>
      logger.error(err, 'Failed to send verification email')
    );

    res.status(202).json({
      message: "Email is sending.",
      ...devLinkPayload(`/confirm-email/${user.email_verification_token}`)
    });
  }

  static async login(req, res) {
    const { login, password } = req.body;

    const user = await DbUser.findByEmailOrLogin(login);

    if (!user || !(await passwordsMatch(password, user.password))) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.isConfirmed()) {
      throw new ForbiddenError(
        "Please, verify your email.",
        devLinkPayload(`/confirm-email/${user.email_verification_token}`)
      );
    }

    const activeBan = await DbUserBan.findActiveBan(user.id);
    if (activeBan) {
      const expMsg = activeBan.expires_at ? ` Ban expires at: ${activeBan.expires_at}.` : '';
      throw new ForbiddenError(`Your account is banned. Reason: ${activeBan.reason}.${expMsg}`);
    }

    res.json({
      token: generateToken({ id: user.id, role: user.role }),
      user: user.getPublicFields(),
    });
  }

  static async logout(req, res) {
    return res.json({ message: "Logged out successfully." });
  }

  static async confirmEmail(req, res) {
    const { confirm_token } = req.params;

    if (!confirm_token) {
      throw new BadRequestError("Email verification token is missing.");
    }

    const user = await DbUser.findOneBy({ email_verification_token: confirm_token });

    if (!user) {
      throw new BadRequestError("Invalid email verification token.");
    }

    user.is_email_confirmed = true;
    user.email_verification_token = null;
    await user.save();

    return res.json({ message: "Account verified successfully." });
  }

  static async passwordResetRequest(req, res) {
    const { email } = req.body;

    const user = await DbUser.findByEmail(email);
    if (!user) {
      throw new BadRequestError("Invalid email address.");
    }

    const resetToken = generateRandomToken();
    user.password_reset_token = resetToken;
    user.password_reset_token_expires = new Date(Date.now() + 3600000);

    await user.save();

    sendMail(user.email, user.password_reset_token, 'ResetPassword').catch(err =>
      logger.error(err, 'Failed to send reset password email')
    );

    return res.json({
      message: `Reset password email sent successfully to ${email}.`,
      ...devLinkPayload(`/password-reset/${resetToken}`)
    });
  }


  static async passwordResetConfirm(req, res) {
    const { confirm_token } = req.params;
    const { new_password } = req.body;

    const user = await DbUser.findByResetToken(confirm_token);

    if (!user) {
      throw new BadRequestError("Invalid or expired password reset token.");
    }

    user.password = await hashPassword(new_password);
    user.password_reset_token = null;
    user.password_reset_token_expires = null;

    await user.save();

    res.json({ message: "Password updated successfully." })
  }
}

function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}
