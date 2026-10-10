import { createStore } from "@reduxjs/toolkit";
import authReducer from './slices/authSlice';

export const store = createStore({
  reducer: {
    auth: authReducer,
  }
})
