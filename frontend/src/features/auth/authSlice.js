import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const login = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', creds);
    localStorage.setItem('accessToken', data.accessToken);
    return data.user;
  } catch (e) { return rejectWithValue(e.response?.data?.error || 'Login failed'); }
});

export const register = createAsyncThunk('auth/register', async (body, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', body);
    localStorage.setItem('accessToken', data.accessToken);
    return data.user;
  } catch (e) { return rejectWithValue(e.response?.data?.error || 'Register failed'); }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/auth/logout'); } catch {}
  localStorage.removeItem('accessToken');
});

// Called on every page load to restore session from httpOnly refresh cookie.
// Uses _skipAuthRedirect so the interceptor never does a hard redirect here —
// if both tokens are expired we just fall through silently to the login page.
// Note: we do NOT bail early when accessToken is missing — the 401 interceptor
// will still attempt a refresh using the httpOnly cookie, recovering sessions
// where localStorage was cleared but the cookie is still alive.
export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me', { _skipAuthRedirect: true });
    return data.user;
  } catch {
    localStorage.removeItem('accessToken');
    return rejectWithValue('session_expired'); // handled silently — no toast
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, loading: false, error: null, checked: false },
  reducers: {
    clearError: s => { s.error = null; },
  },
  extraReducers: b => {
    b
      .addCase(login.pending,       s => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled,     (s, a) => { s.loading = false; s.user = a.payload; s.checked = true; })
      .addCase(login.rejected,      (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(register.fulfilled,  (s, a) => { s.user = a.payload; s.checked = true; })
      .addCase(logout.fulfilled,    s => { s.user = null; })
      .addCase(checkAuth.fulfilled, (s, a) => { s.user = a.payload; s.checked = true; })
      .addCase(checkAuth.rejected,  s => { s.user = null; s.checked = true; });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
