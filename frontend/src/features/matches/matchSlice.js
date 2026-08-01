import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMatchesForJob = createAsyncThunk('matches/forJob', async (jobId) => {
  const { data } = await api.get(`/matches/job/${jobId}`);
  return { jobId, matches: data };
});

export const fetchMyMatches = createAsyncThunk('matches/mine', async () => {
  const { data } = await api.get('/matches/mine');
  return data;
});

const matchSlice = createSlice({
  name: 'matches',
  initialState: { byJob: {}, myMatches: [], loading: false },
  reducers: {},
  extraReducers: b => {
    b.addCase(fetchMatchesForJob.pending,   s => { s.loading = true; })
     .addCase(fetchMatchesForJob.fulfilled, (s, a) => {
       s.loading = false;
       s.byJob[a.payload.jobId] = a.payload.matches;
     })
     .addCase(fetchMyMatches.fulfilled, (s, a) => { s.myMatches = a.payload; });
  },
});

export default matchSlice.reducer;
