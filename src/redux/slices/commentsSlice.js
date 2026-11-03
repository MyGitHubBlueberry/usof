import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { postsService } from '../../services/posts.service'
import { usersService } from '../../services/users.service'
import { commentsService } from '../../services/comments.service'

const MAX_COMMENTS = 100

function collectDescendantIds(flatComments, rootId) {
  const toRemove = new Set([rootId])
  let changed = true
  while (changed) {
    changed = false
    flatComments.forEach((c) => {
      if (c.parent_comment_id && toRemove.has(c.parent_comment_id) && !toRemove.has(c.id)) {
        toRemove.add(c.id)
        changed = true
      }
    })
  }
  return toRemove
}

export const fetchComments = createAsyncThunk(
  'comments/fetch',
  async (postId) => {
    const res = await postsService.getComments(postId, { limit: MAX_COMMENTS })
    const data = res.data?.data ?? []

    const uniqueUserIds = [...new Set(data.map((c) => c.user_id).filter(Boolean))]
    const usersPromise = Promise.all(
      uniqueUserIds.map((userId) =>
        usersService
          .getById(userId)
          .then((userRes) => [userId, userRes.data])
          .catch(() => [userId, null])
      )
    )

    const rootIds = data.filter((c) => !c.parent_comment_id).map((c) => c.id)
    const likesPromise = Promise.all(
      rootIds.map((id) =>
        commentsService
          .getLikes(id)
          .then((r) => [id, { likes: r.data?.likes ?? 0, dislikes: r.data?.dislikes ?? 0 }])
          .catch(() => [id, { likes: 0, dislikes: 0 }])
      )
    )

    const [userEntries, likeEntries] = await Promise.all([usersPromise, likesPromise])

    return {
      postId,
      items: data,
      usersById: Object.fromEntries(userEntries),
      likeNet: Object.fromEntries(likeEntries),
    }
  }
)

const commentsSlice = createSlice({
  name: 'comments',
  initialState: {
    postId: null,
    items: [],
    usersById: {},
    likeNet: {},
    status: 'idle',
    error: null,
    page: 1,
    sortMode: 'liked',
    currentRequestId: null,
  },
  reducers: {
    commentAdded: (state, action) => {
      state.items.push({
        status: 'active',
        publish_date: new Date().toISOString(),
        ...action.payload,
      })
    },
    commentPatched: (state, action) => {
      const idx = state.items.findIndex((c) => c.id === action.payload.id)
      if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload }
    },
    commentDeleted: (state, action) => {
      const toRemove = collectDescendantIds(state.items, action.payload)
      state.items = state.items.filter((c) => !toRemove.has(c.id))
    },
    likeNetUpdated: (state, action) => {
      const { commentId, likes, dislikes } = action.payload
      state.likeNet[commentId] = { likes, dislikes }
    },
    userSeeded: (state, action) => {
      const { userId, user } = action.payload
      if (!state.usersById[userId]) state.usersById[userId] = user
    },
    pageChanged: (state, action) => {
      state.page = action.payload
    },
    sortModeChanged: (state, action) => {
      state.sortMode = action.payload
      state.page = 1
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state, action) => {
        state.status = 'pending'
        state.currentRequestId = action.meta.requestId
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return
        state.status = 'succeeded'
        state.postId = action.payload.postId
        state.items = action.payload.items
        state.usersById = action.payload.usersById
        state.likeNet = action.payload.likeNet
        state.error = null
      })
      .addCase(fetchComments.rejected, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return
        state.status = 'failed'
        state.items = []
        state.usersById = {}
        state.likeNet = {}
        state.error = action.error.message
      })
  },
})

export const {
  commentAdded,
  commentPatched,
  commentDeleted,
  likeNetUpdated,
  userSeeded,
  pageChanged,
  sortModeChanged,
} = commentsSlice.actions
export default commentsSlice.reducer
