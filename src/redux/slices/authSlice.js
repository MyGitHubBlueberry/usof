import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token') || null
  },
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('token', state.token);
    },
    logout: (state) => {
      state.user = state.token = null;
      localStorage.removeItem('token');
    }
  }
});

export const { login, logout } = authSlice.actions;
export const selectIsAuthenticated = (state) => !!state.auth.token;
export default authSlice.reducer;
