const { BadRequestError, ConflictError, NotFoundError } = require("../utils/error");
const DbCategory = require('../models/category-model');

module.exports = class CategoryController {
  static async create(req, res) {
    const { title, description } = req.body;

    let category = await DbCategory.findByTitle(title);

    if (category) {
      throw new ConflictError(`Category with title '${title}' already exists.`)
    }

    category = new DbCategory({
      title,
      description: description || ''
    });

    await category.save();

    res.status(201).json(category);
  }

  static async get(req, res) {
    return res.json(req.category);
  }

  static async getAll(req, res) {
    const { page, limit, offset } = req.pagination;
    const { order, search } = req.query;
    return res.json(await DbCategory.findAll({
      page, limit, offset,
      sortBy: 'title',
      order, search: { title: search }
    }));
  }

  static async getPosts(req, res) {
    const posts = await DbCategory.getCategoryPosts(req.category.id, req.pagination);
    return res.json(posts);
  }

  static async update(req, res) {
    const category = req.category;
    const { title, description } = req.body;

    if (title !== undefined && title) {
      const existingCategory = await DbCategory.findByTitle(title);
      if (existingCategory && Number(existingCategory.id) !== Number(category.id)) {
        throw new ConflictError(`Category with title '${title}' already exists.`);
      }

      category.title = title;
    }

    if (description !== undefined) {
      category.description = description;
    }

    await category.save();

    return res.json(category);
  }

  static async delete(req, res) {
    await req.category.delete();
    return res.status(204).end();
  }
}
