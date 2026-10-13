import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API } from '../../constants/api';
import { authService } from "../../services/auth.service";

export const registerThunk = createAsyncThunk(API.AUTH.REGISTER, async (credentials) => {
  const response = await authService.register(credentials);
  return response.data;
});

export const loginThunk = createAsyncThunk(API.AUTH.LOGIN, async (credentials) => {
  const response = await authService.login(credentials);
  return response.data;
});

export const logoutThunk = createAsyncThunk(
  API.AUTH.LOGOUT,
  async (_, { dispatch }) => {
    dispatch(authSlice.actions.logout());

    try {
      await authService.logout();
    } catch (err) {
      console.warn('Backend logout failed, local session already cleared:', err);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token') || null
  },
  reducers: {
    logout: (state) => {
      state.user = state.token = null;
      localStorage.removeItem('token');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        localStorage.setItem('token', action.payload.token)
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(registerThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        localStorage.setItem('token', action.payload.token)
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
  }
});

export const { logout } = authSlice.actions;
export const selectIsAuthenticated = (state) => !!state.auth.token;
export default authSlice.reducer;
