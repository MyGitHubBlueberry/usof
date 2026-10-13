import api from '../utils/api'
import { API } from '../constants/api'

export const leaderboardService = {
  getOverall: () => api.get(API.LEADERBOARD.OVERALL),
  getWeekly: () => api.get(API.LEADERBOARD.WEEKLY),
}
