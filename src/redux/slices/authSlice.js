import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API } from '../../constants/api';
import { authService } from "../../services/auth.service";

export const registerThunk = createAsyncThunk(API.AUTH.REGISTER, async (credentials, { rejectWithValue }) => {
  try {
    const response = await authService.register(credentials);
    return response.data;
  } catch (err) {
    const { status, message, errors } = err;
    return rejectWithValue({ status, message, errors });
  }
});

export const loginThunk = createAsyncThunk(API.AUTH.LOGIN, async (credentials, { rejectWithValue }) => {
  try {
    const response = await authService.login(credentials);
    return response.data;
  } catch (err) {
    const { status, message, errors, dev_link } = err;
    return rejectWithValue({ status, message, errors, dev_link });
  }
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

const loadSavedUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: loadSavedUser(),
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
    devLink: null,
    banned: null
  },
  reducers: {
    logout: (state) => {
      state.user = state.token = null;
      state.banned = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    updateUser: (state, action) => {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    clearError: (state) => {
      state.error = null;
      state.devLink = null;
    },
    setBanned: (state, action) => {
      state.banned = action.payload;
    },
    clearBanned: (state) => {
      state.banned = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true
        state.error = null
        state.devLink = null
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        localStorage.setItem('token', action.payload.token)
        if (action.payload.user) {
          localStorage.setItem('user', JSON.stringify(action.payload.user))
        }
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message ?? action.error.message
        state.devLink = action.payload?.dev_link ?? null
      })
      .addCase(registerThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerThunk.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message ?? action.error.message
      })
  }
});

export const { logout, updateUser, clearError, setBanned, clearBanned } = authSlice.actions;
export const selectIsAuthenticated = (state) => !!state.auth.token;
export default authSlice.reducer;
