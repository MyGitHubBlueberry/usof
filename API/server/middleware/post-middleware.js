const DbPost = require('../models/post-model');
const DbUser = require('../models/user-model');
const DbCategory = require('../models/category-model');
const assert = require('node:assert/strict');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/error');
const { CONTENT_STATUS, POST_SORT_FIELDS, ASSERT_MESSAGES } = require('../utils/constants');

const ALLOWED_SORT_FIELDS = Object.values(POST_SORT_FIELDS);
const ALLOWED_STATUS_VALUES = Object.values(CONTENT_STATUS);
const ALLOWED_ORDERS = ['asc', 'desc'];

async function preloadPost(req, res, next) {
  const { post_id } = req.params;
  const post = await DbPost.find(post_id);

  if (!post) {
    throw new NotFoundError(`Post with id ${post_id} doesn't exist.`);
  }

  const isAdminOrAuthor = req.user
    && (req.isAdmin
      || Number(req.user.id) === Number(post.user_id));
  if (post.status === CONTENT_STATUS.INACTIVE && !isAdminOrAuthor) {
    throw new ForbiddenError("Inactive posts are locked and hidden.");
  }

  req.post = post;
  next();
}

async function validatePostQueryParams(req, res, next) {
  const { status, order, sortBy, author, category, dateFrom, dateTo } = req.query;
  const errorDetails = [];

  if (status !== undefined && status !== '') {
    if (!ALLOWED_STATUS_VALUES.includes(status.toLowerCase())) {
      errorDetails.push({
        field: 'status',
        value: status,
        message: `Allowed values: ${ALLOWED_STATUS_VALUES.join(', ')}`
      });
    }
  }

  if (order !== undefined && order !== '') {
    if (!ALLOWED_ORDERS.includes(order.toLowerCase())) {
      errorDetails.push({
        field: 'order',
        value: order,
        message: "Must be 'ASC' or 'DESC'"
      });
    }
  }

  if (sortBy !== undefined && sortBy !== '') {
    if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
      errorDetails.push({
        field: 'sortBy',
        value: sortBy,
        message: `Allowed fields: ${ALLOWED_SORT_FIELDS.join(', ')}`
      });
    }
  }

  if (dateFrom !== undefined && dateFrom !== '') {
    if (isNaN(Date.parse(dateFrom))) {
      errorDetails.push({
        field: 'dateFrom',
        value: dateFrom,
        message: 'Must be a valid date (e.g. 2024-01-01 or ISO 8601)'
      });
    }
  }

  if (dateTo !== undefined && dateTo !== '') {
    if (isNaN(Date.parse(dateTo))) {
      errorDetails.push({
        field: 'dateTo',
        value: dateTo,
        message: 'Must be a valid date (e.g. 2024-12-31 or ISO 8601)'
      });
    }
  }

  if (errorDetails.length > 0) {
    throw new ValidationError('Query parameter validation failed', errorDetails);
  }

  if (author && String(author).trim() !== '') {
    const user = await DbUser.findByEmailOrLogin(String(author).trim());
    if (!user) {
      throw new NotFoundError(`User with login or email '${author}' does not exist.`);
    }
    req.validatedUser = user;
  }

  if (category && String(category).trim() !== '') {
    const validatedCategory = await DbCategory.findByTitle(String(category).trim());
    if (!validatedCategory) {
      throw new NotFoundError(`Category '${category}' does not exist.`);
    }
    req.validatedCategory = validatedCategory;
  }

  next();
}

function restrictInactivePost(restrictOwn = false) {
  return (req, res, next) => {
    assert.ok(req.post, ASSERT_MESSAGES.REQ_POST_MISSING);
    if (req.post.status !== CONTENT_STATUS.INACTIVE) {
      return next();
    }
    if (req.isAdmin) {
      return next();
    }
    const isOwnPost = req.user ? req.post.user_id === req.user.id : false;
    if (!restrictOwn && isOwnPost) {
      return next();
    }
    throw new ForbiddenError("Can't access inactive post.");
  }
};

function restrictResolvedPost(req, res, next) {
  assert.ok(req.post, ASSERT_MESSAGES.REQ_POST_MISSING);
  if (req.post.status !== CONTENT_STATUS.RESOLVED) {
    return next();
  }
  throw new ForbiddenError("Can't access resolved post.");
}

function validateCategories(required = false) {
  return (req, res, next) => {
    assert.ok(req.body, ASSERT_MESSAGES.REQ_BODY_MISSING);

    const categories = req.body.categories;
    if (!categories) {
      if (required) {
        throw new ValidationError("Missing 'categories' field", [{
          field: 'categories', message: 'This field is required.'
        }]);
      }
      return next();
    }

    if (!Array.isArray(categories)) {
      throw new ValidationError("Invalid field type", [{
        field: 'categories', message: 'This field should be an array.'
      }]);
    }

    next();
  };
}

module.exports = {
  preloadPost,
  validatePostQueryParams,
  restrictInactivePost,
  restrictResolvedPost,
  validateCategories
};
