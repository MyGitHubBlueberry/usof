import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { leaderboardService } from '../../services/leaderboard.service'

function emptyBranch() {
  return { items: [], totalPages: 1, status: 'idle', error: null, currentRequestId: null }
}

export const fetchLeaderboard = createAsyncThunk(
  'leaderboard/fetch',
  async ({ mode, page, limit = 10 }) => {
    const fetchPage = mode === 'weekly' ? leaderboardService.getWeekly : leaderboardService.getOverall
    const res = await fetchPage({ page, limit })
    return {
      mode,
      items: res.data?.data ?? [],
      totalPages: res.data?.pagination?.totalPages ?? 1,
    }
  }
)

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState: {
    overall: emptyBranch(),
    weekly: emptyBranch(),
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state, action) => {
        const branch = state[action.meta.arg.mode]
        branch.status = 'pending'
        branch.currentRequestId = action.meta.requestId
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        const branch = state[action.payload.mode]
        if (action.meta.requestId !== branch.currentRequestId) return
        branch.status = 'succeeded'
        branch.items = action.payload.items
        branch.totalPages = action.payload.totalPages
        branch.error = null
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        const branch = state[action.meta.arg.mode]
        if (action.meta.requestId !== branch.currentRequestId) return
        branch.status = 'failed'
        branch.items = []
        branch.error = action.error.message
      })
  },
})

export default leaderboardSlice.reducer
