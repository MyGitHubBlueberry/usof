import { configureStore } from "@reduxjs/toolkit";
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';
import flashReducer from './slices/flashSlice';
import notificationsReducer from './slices/notificationsSlice';
import postsFeedReducer from './slices/postsFeedSlice';
import postDetailReducer from './slices/postDetailSlice';
import commentsReducer from './slices/commentsSlice';
import leaderboardReducer from './slices/leaderboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    flash: flashReducer,
    notifications: notificationsReducer,
    postsFeed: postsFeedReducer,
    postDetail: postDetailReducer,
    comments: commentsReducer,
    leaderboard: leaderboardReducer,
  }
});

export default store;
