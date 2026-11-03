import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { postsService } from '../../services/posts.service'
import { usersService } from '../../services/users.service'

export const fetchPostDetail = createAsyncThunk(
  'postDetail/fetch',
  async (id, { rejectWithValue }) => {
    try {
      const res = await postsService.getById(id)
      const data = res.data

      const [authorRes, categoriesRes, likesRes] = await Promise.all([
        usersService.getById(data.user_id).catch(() => null),
        postsService.getCategories(id).catch(() => ({ data: [] })),
        postsService.getLikes(id).catch(() => ({ data: { likes: 0, dislikes: 0, myReaction: null } })),
      ])

      return {
        post: data,
        author: authorRes?.data ?? null,
        categories: categoriesRes.data ?? [],
        likeCounts: likesRes.data ?? { likes: 0, dislikes: 0, myReaction: null },
      }
    } catch (err) {
      return rejectWithValue(err)
    }
  }
)

const postDetailSlice = createSlice({
  name: 'postDetail',
  initialState: {
    post: null,
    author: null,
    categories: [],
    likeCounts: { likes: 0, dislikes: 0, myReaction: null },
    status: 'idle',
    error: null,
    currentRequestId: null,
  },
  reducers: {
    postStatusChanged: (state, action) => {
      if (state.post) state.post.status = action.payload
    },
    postPatched: (state, action) => {
      if (state.post) Object.assign(state.post, action.payload)
    },
    likeCountsUpdated: (state, action) => {
      state.likeCounts = { ...state.likeCounts, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPostDetail.pending, (state, action) => {
        state.status = 'pending'
        state.currentRequestId = action.meta.requestId
      })
      .addCase(fetchPostDetail.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return
        state.status = 'succeeded'
        state.post = action.payload.post
        state.author = action.payload.author
        state.categories = action.payload.categories
        state.likeCounts = action.payload.likeCounts
        state.error = null
      })
      .addCase(fetchPostDetail.rejected, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return
        state.status = 'failed'
        state.post = null
        state.error = action.payload ?? action.error
      })
  },
})

export const { postStatusChanged, postPatched, likeCountsUpdated } = postDetailSlice.actions
export default postDetailSlice.reducer
