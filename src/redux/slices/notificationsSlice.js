import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { notificationsService } from '../../services/notifications.service'

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (params = {}) => {
    const res = await notificationsService.getAll(params)
    return { items: res.data?.data ?? [], totalPages: res.data?.pagination?.totalPages ?? 1 }
  }
)

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async () => {
    const res = await notificationsService.getUnreadCount()
    return res.data?.unreadCount ?? 0
  }
)

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id, { dispatch }) => {
    await notificationsService.read(id)
    dispatch(fetchUnreadCount())
    return id
  }
)

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { dispatch }) => {
    await notificationsService.readAll()
    dispatch(fetchUnreadCount())
  }
)

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (id, { dispatch }) => {
    await notificationsService.delete(id)
    dispatch(fetchUnreadCount())
    return id
  }
)

export const deleteAllNotifications = createAsyncThunk(
  'notifications/deleteAll',
  async (_, { dispatch }) => {
    await notificationsService.deleteAll()
    dispatch(fetchUnreadCount())
  }
)

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    totalPages: 1,
    unreadCount: 0,
    status: 'idle',
    error: null,
    currentRequestId: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state, action) => {
        state.status = 'pending'
        state.currentRequestId = action.meta.requestId
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return
        state.status = 'succeeded'
        state.items = action.payload.items
        state.totalPages = action.payload.totalPages
        state.error = null
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return
        state.status = 'failed'
        state.items = []
        state.error = action.error.message
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload
      })
      .addCase(fetchUnreadCount.rejected, (state) => {
        state.unreadCount = 0
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n.id === action.payload)
        if (item) item.is_read = true
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => {
          n.is_read = true
        })
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.items = state.items.filter((n) => n.id !== action.payload)
      })
      .addCase(deleteAllNotifications.fulfilled, (state) => {
        state.items = []
      })
  },
})

export default notificationsSlice.reducer
