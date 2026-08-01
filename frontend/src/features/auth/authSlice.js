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
  await api.post('/auth/logout');
  localStorage.removeItem('accessToken');
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, loading: false, error: null },
  reducers: { clearError: s => { s.error = null; } },
  extraReducers: b => {
    b.addCase(login.pending,    s => { s.loading = true;  s.error = null; })
     .addCase(login.fulfilled,  (s, a) => { s.loading = false; s.user = a.payload; })
     .addCase(login.rejected,   (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(register.fulfilled,(s, a) => { s.user = a.payload; })
     .addCase(logout.fulfilled,  s => { s.user = null; });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
