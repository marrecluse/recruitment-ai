import { configureStore } from '@reduxjs/toolkit';
import authReducer  from '../features/auth/authSlice';
import jobsReducer  from '../features/jobs/jobsSlice';
import matchReducer from '../features/matches/matchSlice';

export const store = configureStore({
  reducer: {
    auth:    authReducer,
    jobs:    jobsReducer,
    matches: matchReducer,
  },
});
