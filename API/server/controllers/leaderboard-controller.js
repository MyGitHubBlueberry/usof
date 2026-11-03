const DbUser = require('../models/user-model');

module.exports = class LeaderboardController {
  static async getOverall(req, res) {
    const { page, limit, offset } = req.pagination;
    const result = await DbUser.findAll({
      page,
      limit,
      offset,
      sortBy: 'rating',
      order: 'DESC'
    });

    result.data = result.data.map(user => user.getPublicFields());
    
    return res.json(result);
  }

  static async getWeekly(req, res) {
    const { page, limit, offset } = req.pagination;
    const result = await DbUser.getWeeklyLeaderboard({ page, limit, offset });
    return res.json(result);
  }
};
