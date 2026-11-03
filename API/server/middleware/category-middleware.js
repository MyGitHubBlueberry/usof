const assert = require('node:assert/strict');
const { ValidationError, NotFoundError } = require("../utils/error");
const DbCategory = require("../models/category-model");

async function preloadCategory(req, res, next) {
  const { category_id } = req.params;
  const category = await DbCategory.find(category_id);

  if (!category) {
    throw new NotFoundError(`Category with id ${category_id} doesn't exist.`);
  }

  req.category = category;
  next();
}

module.exports = {
  preloadCategory
};
