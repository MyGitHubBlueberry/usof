const assert = require('node:assert/strict');
const { ValidationError } = require('../utils/error');
const { ROLES, ASSERT_MESSAGES } = require('../utils/constants');

function validateEmail(required = true) {
  return (req, res, next) => {
    assert.ok(req.body, ASSERT_MESSAGES.REQ_BODY_MISSING);
    const { email } = req.body;

    if (required && (!email || String(email).trim() === '')) {
      throw new ValidationError('Validation failed', [
        { field: 'email', message: 'Email address is required.' }
      ]);
    }

    if (email !== undefined && (!email || !String(email).includes('@'))) {
      throw new ValidationError('Validation failed', [
        { field: 'email', value: email, message: 'Invalid email address format.' }
      ]);
    }

    next();
  };
}

function validateLogin(required = true) {
  return (req, res, next) => {
    assert.ok(req.body, ASSERT_MESSAGES.REQ_BODY_MISSING);
    const { login } = req.body;

    if (required && (!login || String(login).trim() === '')) {
      throw new ValidationError('Validation failed', [
        { field: 'login', message: 'Login is required.' }
      ]);
    }

    if (login !== undefined && (!login || String(login).trim().length < 3)) {
      throw new ValidationError('Validation failed', [
        { field: 'login', value: login, message: 'Login must be at least 3 characters long.' }
      ]);
    }

    next();
  };
}

function validatePassword(required = true) {
  return (req, res, next) => {
    assert.ok(req.body, ASSERT_MESSAGES.REQ_BODY_MISSING);
    const { password, confirmed_password } = req.body;

    if (required && (!password || String(password).trim() === '')) {
      throw new ValidationError('Validation failed', [
        { field: 'password', message: 'Password is required.' }
      ]);
    }

    if (password !== undefined) {
      if (String(password).length < 8) {
        throw new ValidationError('Validation failed', [{
          field: 'password',
          message: 'Password must be at least 8 characters long.'
        }]);
      }

      if (confirmed_password !== undefined && password !== confirmed_password) {
        throw new ValidationError("Validation failed", [{
          field: 'confirmed_password',
          message: "Passwords don't match."
        }]);
      }
    }

    next();
  };
}

function validateRole(required = true) {
  return (req, res, next) => {
    assert.ok(req.body, ASSERT_MESSAGES.REQ_BODY_MISSING);
    const body = req.body;
    let { role } = body;
    if (required && !role) {
      throw new ValidationError('Validation failed', [{
        field: 'role',
        message: 'Role is required.'
      }]);
    }
    if (role !== undefined && role !== null) {
      role = String(role).trim().toLowerCase();
      const validRoles = Object.values(ROLES);
      if (!validRoles.includes(role)) {
        throw new ValidationError('Validation failed', [{
          field: 'role',
          message: "Invalid role value. Allowed values: " +
            `${validRoles.join(', ')}. Provided value: '${role}'.`
        }]);
      }
      body.role = role;
    }
    next();
  };
}

module.exports = {
  validateEmail,
  validateLogin,
  validatePassword,
  validateRole
};
