import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, CircularProgress, IconButton, InputAdornment } from '@mui/material';
import AutoAwesomeIcon           from '@mui/icons-material/AutoAwesome';
import LockOutlinedIcon          from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon    from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ResetPasswordPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const prefill   = location.state?.email || '';

  const [form,    setForm]    = useState({ email: prefill, resetCode: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');
  const [showPw,  setShowPw]  = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', {
        email: form.email, resetCode: form.resetCode, newPassword: form.newPassword,
      });
      setSuccess(true);
    } catch (e) { toast.error(e.response?.data?.error || 'Reset failed'); }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg, #F8FAFC 0%, #EEF2FF 100%)' }}>
      <Box sx={{ width: '100%', maxWidth: 420, p: 4 }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Box sx={{ width: 34, height: 34, borderRadius: 1.5,
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#0F172A' }}>RecruitAI</Typography>
        </Box>

        <Box sx={{ background: '#fff', borderRadius: 3, p: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <LockOutlinedIcon sx={{ color: '#4F46E5', fontSize: 24 }} />
            <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>Reset Password</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: '#64748B', mb: 3 }}>
            Enter the reset code from the previous step.
          </Typography>

          {error   && <Alert severity="error"   sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>Password updated! You can now log in.</Alert>}

          {success ? (
            <Button fullWidth variant="contained" onClick={() => navigate('/login')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.25,
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
              Go to Login
            </Button>
          ) : (
            <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Email Address" type="email" value={form.email}
                onChange={set('email')} fullWidth size="small" required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
              <TextField label="Reset Code" value={form.resetCode} onChange={set('resetCode')}
                fullWidth size="small" required placeholder="e.g. A3F9C1"
                inputProps={{ style: { textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
              <TextField
                label="New Password" type={showPw ? 'text' : 'password'} value={form.newPassword}
                onChange={set('newPassword')} fullWidth size="small" required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                InputProps={{ endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPw(p => !p)}>
                      {showPw ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )}} />
              <TextField label="Confirm Password" type="password" value={form.confirm}
                onChange={set('confirm')} fullWidth size="small" required
                error={!!(form.confirm && form.confirm !== form.newPassword)}
                helperText={form.confirm && form.confirm !== form.newPassword ? 'Passwords do not match' : ''}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
              <Button type="submit" fullWidth variant="contained" disabled={loading}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.25, mt: 0.5,
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  '&:hover': { background: 'linear-gradient(135deg, #4338CA, #6D28D9)' } }}>
                {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Reset Password'}
              </Button>
            </Box>
          )}

          <Box sx={{ textAlign: 'center', mt: 2.5, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Typography component="span" onClick={() => navigate('/forgot-password')}
              sx={{ fontSize: 13, color: '#64748B', cursor: 'pointer', '&:hover': { color: '#4F46E5' } }}>
              ← Get new code
            </Typography>
            <Typography component="span" onClick={() => navigate('/login')}
              sx={{ fontSize: 13, color: '#4F46E5', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
              Back to Login
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
