const assert = require('node:assert/strict');
const { ValidationError } = require("../utils/error");
const { REACTION_TYPES, ASSERT_MESSAGES } = require("../utils/constants");

function validateLikeType(required = true) {
  return (req, res, next) => {
    assert.ok(req.body, ASSERT_MESSAGES.REQ_BODY_MISSING);
    const { type } = req.body;

    if (type === undefined && required) {
      throw new ValidationError("Validation failed",
        [{ field: 'type', message: "Like type is required but missing." }]);
    }

    if (type && type !== REACTION_TYPES.LIKE && type !== REACTION_TYPES.DISLIKE) {
      throw new ValidationError("Validation failed", [{
        field: 'type', message: "Invalid like type. Valid types are: " +
          `'${REACTION_TYPES.LIKE}' and '${REACTION_TYPES.DISLIKE}'.`
      }]);
    }

    next();
  };
}

module.exports = {
  validateLikeType
};
