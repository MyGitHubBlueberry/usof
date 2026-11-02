import api from '../utils/api'
import { API } from '../constants/api'

export const leaderboardService = {
  getOverall: (params = {}) => api.get(API.LEADERBOARD.OVERALL, { params }),
  getWeekly: (params = {}) => api.get(API.LEADERBOARD.WEEKLY, { params }),
}
