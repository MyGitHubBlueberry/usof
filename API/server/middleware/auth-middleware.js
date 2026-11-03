const { verifyToken } = require("../utils/jwt");
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError, BadRequestError } = require("../utils/error");
const DbUserBan = require("../models/user-ban-model");
const { ERROR_MESSAGES, ASSERT_MESSAGES, ROLES, ROLE_LEVELS } = require("../utils/constants");

async function authenticateToken(req, res, next) {
  if (req.user) return next();

  const token = getBearerToken(req);

  if (!token) {
    throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_REQUIRED);
  }

  try {
    req.user = verifyToken(token);
    req.isAdmin = (ROLE_LEVELS[req.user.role] ?? 0) >= ROLE_LEVELS[ROLES.ADMIN];

    const activeBan = await DbUserBan.findActiveBan(req.user.id);
    if (activeBan) {
      const expMsg = activeBan.expires_at ? ` Ban expires at: ${activeBan.expires_at}.` : '';
      return res.status(403).json({
        error: `Your account is banned. Reason: ${activeBan.reason}.${expMsg}`,
        banned: true,
        reason: activeBan.reason,
        expiresAt: activeBan.expires_at ?? null,
      });
    }

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_EXPIRED);
    }
    throw new ForbiddenError(ERROR_MESSAGES.TOKEN_INVALID);
  }
}

async function authenticateTokenOptional(req, res, next) {
  if (req.user) return next();

  const token = getBearerToken(req);

  if (!token) {
    req.isAdmin = false;
    return next();
  }

  return authenticateToken(req, res, next);
}

function getBearerToken(req) {
  const authHeader = req.headers['authorization'];
  return authHeader && authHeader.split(' ')[1]; //skip "Bearer "
}

function requireRole(requiredRole) {
  assert.ok(
    Object.prototype.hasOwnProperty.call(ROLE_LEVELS, requiredRole),
    `Invalid role specified in route configuration: '${requiredRole}'. ` +
    `Valid roles are: ${Object.keys(ROLE_LEVELS).join(', ')}`
  );

  return (req, res, next) => {
    assert.ok(req.user, ASSERT_MESSAGES.REQ_USER_MISSING);

    const userLevel = ROLE_LEVELS[req.user.role] ?? 0;
    const requiredLevel = ROLE_LEVELS[requiredRole];

    if (userLevel < requiredLevel) {
      throw new ForbiddenError(ERROR_MESSAGES.INSUFFICIENT_PRIVILEGES);
    }

    next();
  };
}

function authorizeResourceAccess(req, resourceKey, ownerIdField, allowAdmin) {
  assert.ok(req.user, ASSERT_MESSAGES.REQ_USER_MISSING);

  if (allowAdmin && req.isAdmin) {
    return;
  }

  const resource = req[resourceKey];
  if (!resource) {
    throw new BadRequestError('Invalid resourceKey.');
  }

  if (Number(resource[ownerIdField]) !== Number(req.user.id)) {
    throw new ForbiddenError(
      `Only the resource owner ${allowAdmin ? "or an admin " : ''}
      can perform this action.`
    );
  }
}

function requireOwner(resourceKey, ownerIdField = 'user_id') {
  return (req, res, next) => {
    authorizeResourceAccess(req, resourceKey, ownerIdField, false);
    next();
  };
}

function requireOwnerOrAdmin(resourceKey, ownerIdField = 'user_id') {
  return (req, res, next) => {
    authorizeResourceAccess(req, resourceKey, ownerIdField, true);
    next();
  };
}

module.exports = {
  authenticateToken,
  authenticateTokenOptional,
  requireRole,
  requireOwner,
  requireOwnerOrAdmin
};
