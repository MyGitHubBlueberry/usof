const ROLES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin'
});

const ROLE_LEVELS = Object.freeze({
  [ROLES.USER]: 1,
  [ROLES.ADMIN]: 2,
  [ROLES.SUPERADMIN]: 3
});

const CONTENT_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  RESOLVED: 'resolved'
});

const REACTION_TYPES = Object.freeze({
  LIKE: 'like',
  DISLIKE: 'dislike'
});

const NOTIFICATION_TYPES = Object.freeze({
  POST_UPDATED: 'post_updated',
  POST_COMMENTED: 'post_commented',
  POST_STATUS_CHANGED: 'post_status_changed'
});

const POST_SORT_FIELDS = Object.freeze({
  PUBLISH_DATE: 'publish_date',
  TITLE: 'title',
  LIKES: 'likes'
});

const ERROR_MESSAGES = Object.freeze({
  TOKEN_REQUIRED: 'Access token required.',
  TOKEN_EXPIRED: 'Access token is expired. Please log in again.',
  TOKEN_INVALID: 'Access token is invalid.',
  INSUFFICIENT_PRIVILEGES: 'Insufficient privileges.',
  INVALID_CREDENTIALS: 'Invalid login credentials.',
  USER_NOT_FOUND: 'User not found.',
  REACTION_NOT_FOUND: 'Reaction not found.',
  POST_EXISTS: 'Post with this title already exists.',
  EMAIL_IN_USE: 'Login or email is already in use.'
});

const ASSERT_MESSAGES = Object.freeze({
  REQ_BODY_MISSING: "req.body must exist. Did you forget to use 'validateBody' middleware?",
  REQ_USER_MISSING: "req.user must exist. Did you forget to use 'authenticateToken' middleware?",
  REQ_POST_MISSING: "req.post must exist. Did you forget to use 'preloadPost' middleware?",
  REQ_COMMENT_MISSING: "req.comment must exist. Did you forget to use 'preloadComment' middleware?",
  VALID_RESOURCE_KEY: "resourceKey must be one of: 'users', 'post', 'comment'."
});

module.exports = {
  ROLES,
  ROLE_LEVELS,
  CONTENT_STATUS,
  REACTION_TYPES,
  NOTIFICATION_TYPES,
  ERROR_MESSAGES,
  ASSERT_MESSAGES,
  POST_SORT_FIELDS
};
