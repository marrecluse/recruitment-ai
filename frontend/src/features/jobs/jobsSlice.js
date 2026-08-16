import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchJobs = createAsyncThunk('jobs/fetchAll', async () => {
  const { data } = await api.get('/jobs');
  return data;
});

export const fetchMyJobs = createAsyncThunk('jobs/fetchMy', async () => {
  const { data } = await api.get('/jobs/my');
  return data;
});

export const createJob = createAsyncThunk('jobs/create', async (body, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/jobs', body);
    return data;
  } catch (e) { return rejectWithValue(e.response?.data?.error); }
});

export const updateJob = createAsyncThunk('jobs/update', async ({ id, body }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/jobs/${id}`, body);
    return data;
  } catch (e) { return rejectWithValue(e.response?.data?.error); }
});

export const deleteJob = createAsyncThunk('jobs/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/jobs/${id}`);
    return id;
  } catch (e) { return rejectWithValue(e.response?.data?.error); }
});

const jobsSlice = createSlice({
  name: 'jobs',
  initialState: { list: [], selected: null, loading: false, error: null },
  reducers: {
    selectJob: (s, a) => { s.selected = a.payload; },
    clearSelected: (s) => { s.selected = null; },
  },
  extraReducers: b => {
    b.addCase(fetchJobs.pending,    s => { s.loading = true; })
     .addCase(fetchJobs.fulfilled,  (s, a) => { s.loading = false; s.list = a.payload; })
     .addCase(fetchJobs.rejected,   (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(fetchMyJobs.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
     .addCase(createJob.fulfilled,  (s, a) => { s.list.unshift(a.payload); s.selected = a.payload; })
     .addCase(updateJob.fulfilled,  (s, a) => {
       const idx = s.list.findIndex(j => j._id === a.payload._id);
       if (idx !== -1) s.list[idx] = a.payload;
       if (s.selected?._id === a.payload._id) s.selected = a.payload;
     })
     .addCase(deleteJob.fulfilled,  (s, a) => {
       s.list = s.list.filter(j => j._id !== a.payload);
       if (s.selected?._id === a.payload) s.selected = null;
     });
  },
});

export const { selectJob, clearSelected } = jobsSlice.actions;
export default jobsSlice.reducer;
