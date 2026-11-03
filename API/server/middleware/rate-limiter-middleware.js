const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 15000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again in 5 minutes.'
  }
});

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication or email requests. Please try again in 5 minutes.'
  }
});

module.exports = {
  globalLimiter,
  authLimiter
};
