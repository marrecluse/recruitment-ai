import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LockResetIcon   from '@mui/icons-material/LockReset';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ForgotPasswordPage() {
  const navigate  = useNavigate();
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null); // { resetCode, message }
  const [error,   setError]   = useState('');

  const submit = async e => {
    e.preventDefault();
    if (!email) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setResult(data);
    } catch (e) { toast.error(e.response?.data?.error || 'Something went wrong'); }
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
            <LockResetIcon sx={{ color: '#4F46E5', fontSize: 24 }} />
            <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>Forgot Password</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: '#64748B', mb: 3 }}>
            Enter your email and we'll send you a 6-character reset code.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          {result ? (
            <>
              <Box sx={{ textAlign: 'center', py: 2, mb: 2 }}>
                <Box sx={{ fontSize: 48, mb: 1 }}>📬</Box>
                <Typography sx={{ fontSize: 17, fontWeight: 800, color: '#0F172A', mb: 1 }}>
                  Check your email
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
                  We sent a 6-character reset code to <strong>{email}</strong>. It expires in 15 minutes.
                </Typography>
              </Box>
              <Button fullWidth variant="contained" onClick={() => navigate('/reset-password', { state: { email } })}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.25,
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                Enter Reset Code →
              </Button>
              <Button fullWidth variant="text" onClick={() => setResult(null)}
                sx={{ mt: 1, textTransform: 'none', fontSize: 13, color: '#94A3B8' }}>
                Didn't receive it? Send again
              </Button>
            </>
          ) : (
            <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Email Address" type="email" value={email}
                onChange={e => setEmail(e.target.value)} fullWidth size="small" required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
              />
              <Button type="submit" fullWidth variant="contained" disabled={loading || !email}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.25,
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  '&:hover': { background: 'linear-gradient(135deg, #4338CA, #6D28D9)' } }}>
                {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Get Reset Code'}
              </Button>
            </Box>
          )}

          <Box sx={{ textAlign: 'center', mt: 2.5 }}>
            <Typography component="span" onClick={() => navigate('/login')}
              sx={{ fontSize: 13, color: '#4F46E5', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
              ← Back to Login
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
