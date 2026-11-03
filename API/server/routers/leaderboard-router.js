const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboard-controller');
const { parsePagination } = require('../middleware/pagination-middleware');
const { authenticateTokenOptional } = require('../middleware/auth-middleware');

router.use(authenticateTokenOptional);

router.get('/', parsePagination, leaderboardController.getOverall);

router.get('/weekly', parsePagination, leaderboardController.getWeekly);

module.exports = router;
