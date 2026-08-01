import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchJobs = createAsyncThunk('jobs/fetchAll', async () => {
  const { data } = await api.get('/jobs');
  return data;
});

export const createJob = createAsyncThunk('jobs/create', async (body, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/jobs', body);
    return data;
  } catch (e) { return rejectWithValue(e.response?.data?.error); }
});

const jobsSlice = createSlice({
  name: 'jobs',
  initialState: { list: [], selected: null, loading: false, error: null },
  reducers: { selectJob: (s, a) => { s.selected = a.payload; } },
  extraReducers: b => {
    b.addCase(fetchJobs.pending,   s => { s.loading = true; })
     .addCase(fetchJobs.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
     .addCase(fetchJobs.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(createJob.fulfilled, (s, a) => { s.list.unshift(a.payload); });
  },
});

export const { selectJob } = jobsSlice.actions;
export default jobsSlice.reducer;
