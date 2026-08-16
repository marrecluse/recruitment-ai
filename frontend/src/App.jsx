import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { checkAuth } from './features/auth/authSlice';
import LoginPage               from './pages/LoginPage';
import ForgotPasswordPage      from './pages/ForgotPasswordPage';
import ResetPasswordPage       from './pages/ResetPasswordPage';
import RecruiterDashboard      from './pages/RecruiterDashboard';
import RecruiterJobsPage       from './pages/RecruiterJobsPage';
import RecruiterCandidatesPage from './pages/RecruiterCandidatesPage';
import RecruiterAnalyticsPage  from './pages/RecruiterAnalyticsPage';
import CandidateDashboard      from './pages/CandidateDashboard';
import AdminDashboard          from './pages/AdminDashboard';
import RecruiterPipelinePage    from './pages/RecruiterPipelinePage';
import CandidateApplicationsPage from './pages/CandidateApplicationsPage';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useSelector(s => s.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (role && !role.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
};

const RootRedirect = () => {
  const { user } = useSelector(s => s.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin')     return <Navigate to="/admin" replace />;
  if (user.role === 'recruiter') return <Navigate to="/recruiter" replace />;
  return <Navigate to="/candidate" replace />;
};

function SplashScreen() {
  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg, #0F172A 0%, #1E1B4B 60%, #312E81 100%)',
      gap: 3,
    }}>
      <Box sx={{
        width: 56, height: 56, borderRadius: 2.5,
        background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(79,70,229,0.4)',
      }}>
        <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 28 }} />
      </Box>
      <CircularProgress size={28} sx={{ color: '#818CF8' }} />
    </Box>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const { checked } = useSelector(s => s.auth);

  useEffect(() => {
    // Restore session from cookie on every page load.
    // If both access + refresh tokens are expired, checkAuth silently sets
    // user=null and the router redirects to /login — no toast shown.
    // If a token expires DURING the session (not on load), the axios
    // interceptor in api.js does a hard window.location.href='/login' redirect
    // so component catch blocks never run and no error toast fires.
    dispatch(checkAuth());
  }, [dispatch]);

  if (!checked) return <SplashScreen />;

  return (
    <Routes>
      <Route path="/"                       element={<RootRedirect />} />
      <Route path="/login"                  element={<LoginPage />} />
      <Route path="/forgot-password"        element={<ForgotPasswordPage />} />
      <Route path="/reset-password"         element={<ResetPasswordPage />} />

      <Route path="/recruiter" element={
        <ProtectedRoute role={['recruiter']}><RecruiterDashboard /></ProtectedRoute>
      } />
      <Route path="/recruiter/jobs" element={
        <ProtectedRoute role={['recruiter']}><RecruiterJobsPage /></ProtectedRoute>
      } />
      <Route path="/recruiter/candidates" element={
        <ProtectedRoute role={['recruiter']}><RecruiterCandidatesPage /></ProtectedRoute>
      } />
      <Route path="/recruiter/analytics" element={
        <ProtectedRoute role={['recruiter']}><RecruiterAnalyticsPage /></ProtectedRoute>
      } />
      <Route path="/recruiter/pipeline" element={
        <ProtectedRoute role={['recruiter']}><RecruiterPipelinePage /></ProtectedRoute>
      } />

      <Route path="/candidate" element={
        <ProtectedRoute role={['candidate']}><CandidateDashboard /></ProtectedRoute>
      } />
      <Route path="/candidate/resume" element={
        <ProtectedRoute role={['candidate']}><CandidateDashboard view="resume" /></ProtectedRoute>
      } />
      <Route path="/candidate/applications" element={
        <ProtectedRoute role={['candidate']}><CandidateApplicationsPage /></ProtectedRoute>
      } />

      <Route path="/admin"       element={<ProtectedRoute role={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute role={['admin']}><AdminDashboard view="users" /></ProtectedRoute>} />
      <Route path="/admin/jobs"  element={<ProtectedRoute role={['admin']}><AdminDashboard view="jobs" /></ProtectedRoute>} />
      <Route path="/admin/stats" element={<ProtectedRoute role={['admin']}><AdminDashboard view="stats" /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
