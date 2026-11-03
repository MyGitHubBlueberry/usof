import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { postsService } from '../../services/posts.service'

export const fetchPosts = createAsyncThunk(
  'postsFeed/fetchPosts',
  async (query, { rejectWithValue }) => {
    try {
      const res = await postsService.getAll(query)
      return { items: res.data?.data ?? [], totalPages: res.data?.pagination?.totalPages ?? 1 }
    } catch (err) {
      const status = err?.status ?? err?.response?.status ?? err?.raw?.response?.status
      if (query.author && status === 404) {
        return { items: [], totalPages: 1 }
      }
      return rejectWithValue(err)
    }
  }
)

export const checkForNewPosts = createAsyncThunk(
  'postsFeed/checkForNewPosts',
  async (query, { getState }) => {
    const res = await postsService.getAll({ ...query, page: 1, limit: 1 })
    const latest = res.data?.data?.[0]
    if (!latest) return false
    const current = getState().postsFeed.items[0]
    return !current || Number(latest.id) !== Number(current.id)
  }
)

const postsFeedSlice = createSlice({
  name: 'postsFeed',
  initialState: {
    items: [],
    totalPages: 1,
    status: 'idle',
    error: null,
    hasNewPosts: false,
    currentRequestId: null,
  },
  reducers: {
    newPostsDismissed: (state) => {
      state.hasNewPosts = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state, action) => {
        state.status = 'pending'
        state.currentRequestId = action.meta.requestId
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return
        state.status = 'succeeded'
        state.items = action.payload.items
        state.totalPages = action.payload.totalPages
        state.error = null
        state.hasNewPosts = false
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return
        state.status = 'failed'
        state.items = []
        state.totalPages = 1
        state.error = action.payload ?? action.error
      })
      .addCase(checkForNewPosts.fulfilled, (state, action) => {
        if (action.payload) state.hasNewPosts = true
      })
  },
})

export const { newPostsDismissed } = postsFeedSlice.actions
export default postsFeedSlice.reducer
