const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parsePagination(req, res, next) {
  const rawPage = req.query.page;
  const rawLimit = req.query.limit;

  let page = Number(rawPage);
  let limit = Number(rawLimit);

  page = Number.isInteger(page) && page > 0 ? page : DEFAULT_PAGE;
  limit = Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_LIMIT;

  limit = Math.min(limit, MAX_LIMIT);

  const offset = (page - 1) * limit;

  req.pagination = { page, limit, offset };

  next();
}

module.exports = { parsePagination };
