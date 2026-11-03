const assert = require('node:assert/strict');
const { CONTENT_STATUS, ASSERT_MESSAGES } = require('../utils/constants');
const { ValidationError } = require('../utils/error');

function validateBody(fields, areAllFieldsRequired = true) {
  const fieldList = Array.isArray(fields) ? fields : [fields];

  return (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new ValidationError("Validation failed",
        fieldList.map(field => ({ field, message: "This field is required." }))
      );
    }

    if (fieldList.length === 0) {
      return next();
    }

    const body = req.body;

    const missing = fieldList.filter(
      field => body[field] === undefined
        || body[field] === null
        || String(body[field]).trim() === '');

    if (areAllFieldsRequired) {
      if (missing.length > 0) {
        throw new ValidationError("Missing all required fields",
          missing.map(field => ({ field, message: "This field is required." }))
        );
      }
    } else {
      if (missing.length === fieldList.length) {
        throw new ValidationError("At least one of the following fields must be provided",
          missing.map(field => ({ field, message: "This field is missing." }))
        );
      }
    }

    next();
  };
}

function validateIdParam(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    const num = Number(id);

    if (!id || !Number.isInteger(num) || num <= 0) {
      throw new ValidationError("Validation failed", [{
        field: paramName,
        message: `Invalid '${paramName}' parameter. Must be a positive integer.`
      }]);
    }

    next();
  };
}

function validateStatus(required = true, forbiddenStatuses = []) {
  return (req, res, next) => {
    assert.ok(req.body, ASSERT_MESSAGES.REQ_BODY_MISSING);
    const { status } = req.body;
    const statuses = Object.values(CONTENT_STATUS);
    const allowedStatuses = statuses.filter(s => !forbiddenStatuses.includes(s));

    if (status === undefined) {
      if (required) {
        throw new ValidationError("Validation failed", [{
          field: 'status',
          message: "'status' is required but undefined."
        }]);
      }
      return next();
    }
    if (!allowedStatuses.includes(status)) {
      throw new ValidationError("Validation failed", [{
        field: 'status',
        message: "Invalid 'status' parameter. Must be any of: "
        + `${allowedStatuses.map(x => `'${x}'`).join(', ')}.`
      }]);
    }
    next();
  };
}

function validateTitle(required = true) {
  return (req, res, next) => {
    assert.ok(req.body, ASSERT_MESSAGES.REQ_BODY_MISSING);
    const body = req.body;
    let { title } = body;

    if (required && (title === undefined || title === null || String(title).trim() === '')) {
      throw new ValidationError('Validation failed', [
        { field: 'title', message: 'Title is required. And cannot be whitespace.' }
      ]);
    }

    if (title !== undefined && title !== null) {
      title = String(title).trim();

      if (title.length < 3) {
        throw new ValidationError('Validation failed', [
          { field: 'title', message: 'Title should be at least 3 characters long.' }
        ]);
      }

      body.title = title;
    }

    next();
  };
}

module.exports = {
  validateBody,
  validateIdParam,
  validateStatus,
  validateTitle
};
