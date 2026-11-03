const express = require('express');
const auth = require('../controllers/auth-controller');
const { authLimiter } = require('../middleware/rate-limiter-middleware');
const { validateBody } = require('../middleware/validate');

const { validateEmail, validateLogin, validatePassword } = require('../middleware/user-middleware');
const { authenticateToken } = require('../middleware/auth-middleware');

const router = express.Router();

router.post("/register",
  authLimiter,
  validateBody(["login", "email", "password", "confirmed_password", "full_name"]),
  validateLogin(true),
  validateEmail(true),
  validatePassword(true),
  auth.register);

router.post("/resend-verification",
  authLimiter,
  validateBody("email"),
  validateEmail(true),
  auth.requestEmailVerification);

router.post("/login",
  authLimiter,
  validateBody(["login", "password"]),
  auth.login);

router.post("/confirm-email/:confirm_token", auth.confirmEmail);

router.post("/password-reset",
  authLimiter,
  validateBody(["email"]),
  auth.passwordResetRequest);

router.post("/password-reset/:confirm_token",
  authLimiter,
  validateBody(["new_password"]),
  auth.passwordResetConfirm);

router.post("/logout",
  authenticateToken,
  auth.logout);

module.exports = router;
