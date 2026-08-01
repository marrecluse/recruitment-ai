import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, CircularProgress,
         Tab, Tabs, InputAdornment, IconButton } from '@mui/material';
import EmailOutlinedIcon      from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon       from '@mui/icons-material/LockOutlined';
import PersonOutlinedIcon     from '@mui/icons-material/PersonOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import AutoAwesomeIcon        from '@mui/icons-material/AutoAwesome';
import ManageSearchIcon       from '@mui/icons-material/ManageSearch';
import BalanceIcon            from '@mui/icons-material/Balance';
import SpeedIcon              from '@mui/icons-material/Speed';
import { login, register } from '../features/auth/authSlice';

const FEATURES = [
  { icon: <ManageSearchIcon sx={{ fontSize: 20 }} />, label: 'AI Resume Parsing', desc: 'BERT-powered NER extracts skills & experience' },
  { icon: <AutoAwesomeIcon sx={{ fontSize: 20 }} />,  label: 'Semantic Matching', desc: 'Sentence-BERT ranks candidates by relevance' },
  { icon: <BalanceIcon    sx={{ fontSize: 20 }} />,  label: 'Fairness Audit',   desc: 'Demographic parity scoring across all models' },
  { icon: <SpeedIcon      sx={{ fontSize: 20 }} />,  label: 'Real-time Results', desc: 'Bull/Redis async queue for instant feedback' },
];

const ROLE_OPTS = [
  { value: 'candidate', label: 'Job Seeker',  emoji: '🧑‍💼', desc: 'Upload resume & see matches' },
  { value: 'recruiter', label: 'Recruiter',   emoji: '🔍',   desc: 'Post jobs & review candidates' },
];

export default function LoginPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading, error } = useSelector(s => s.auth);

  const [tab,    setTab]    = useState(0);          // 0=login, 1=register
  const [role,   setRole]   = useState('candidate');
  const [showPw, setShowPw] = useState(false);
  const [form,   setForm]   = useState({ name: '', email: '', password: '' });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handle = async e => {
    e.preventDefault();
    const action = tab === 0
      ? login({ email: form.email, password: form.password })
      : register({ ...form, role });
    const res = await dispatch(action);
    if (res.meta.requestStatus === 'fulfilled') {
      navigate(res.payload.role === 'recruiter' ? '/recruiter' : '/candidate');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ─── LEFT: Brand panel ─── */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: 480,
        minHeight: '100vh',
        p: 5,
        background: 'linear-gradient(145deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative blobs */}
        <Box sx={{
          position: 'absolute', top: -80, right: -80, width: 300, height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute', bottom: 60, left: -60, width: 250, height: 250,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 2,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              RecruitAI
            </Typography>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, pl: 0.5 }}>
            Group 18 · UWS MSc Project
          </Typography>
        </Box>

        {/* Headline */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography sx={{
            fontSize: 36, fontWeight: 800, color: '#fff',
            lineHeight: 1.2, mb: 2, letterSpacing: '-0.5px',
          }}>
            Smarter hiring<br />
            <Box component="span" sx={{
              background: 'linear-gradient(90deg, #818CF8, #A78BFA)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              powered by AI
            </Box>
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.6, mb: 4 }}>
            An intelligent NLP pipeline that parses resumes, semantically matches candidates to jobs, and audits algorithmic fairness.
          </Typography>

          {/* Feature list */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {FEATURES.map(f => (
              <Box key={f.label} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{
                  mt: 0.3, width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#818CF8',
                }}>
                  {f.icon}
                </Box>
                <Box>
                  <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{f.label}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{f.desc}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Footer */}
        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, position: 'relative', zIndex: 1 }}>
          © 2025 RecruitAI · University of the West of Scotland
        </Typography>
      </Box>

      {/* ─── RIGHT: Form panel ─── */}
      <Box sx={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        p: { xs: 3, sm: 6 }, background: '#F8FAFC',
      }}>
        <Box sx={{ width: '100%', maxWidth: 420 }}>

          {/* Mobile logo */}
          <Box sx={{ display: { md: 'none' }, mb: 4, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#4F46E5', letterSpacing: '-0.5px' }}>
              RecruitAI
            </Typography>
          </Box>

          <Typography variant="h4" sx={{ mb: 0.75, letterSpacing: '-0.5px' }}>
            {tab === 0 ? 'Welcome back' : 'Create account'}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 3, fontSize: 15 }}>
            {tab === 0
              ? 'Sign in to your RecruitAI account'
              : 'Join the AI-powered recruitment platform'}
          </Typography>

          {/* Tab switcher */}
          <Box sx={{ mb: 3.5, background: '#EEF2FF', borderRadius: 2.5, p: 0.5 }}>
            <Tabs
              value={tab} onChange={(_, v) => setTab(v)}
              TabIndicatorProps={{ style: { display: 'none' } }}
              sx={{
                minHeight: 0,
                '& .MuiTab-root': {
                  minHeight: 36, fontWeight: 600, borderRadius: 2, color: '#64748B',
                  fontSize: 14, flex: 1, transition: 'all 0.2s',
                },
                '& .Mui-selected': {
                  color: '#4F46E5 !important',
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Tab label="Sign In" disableRipple />
              <Tab label="Register" disableRipple />
            </Tabs>
          </Box>

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontSize: 14 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handle}>
            {/* Register-only: name + role picker */}
            {tab === 1 && (
              <>
                <TextField
                  fullWidth label="Full Name" value={form.name} onChange={set('name')}
                  sx={{ mb: 2 }} required size="medium"
                  InputProps={{ startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlinedIcon sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  )}}
                />
                {/* Role selector cards */}
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#64748B', mb: 1.5 }}>
                  I am a…
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
                  {ROLE_OPTS.map(r => (
                    <Box
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      sx={{
                        flex: 1, p: 2, borderRadius: 2.5, cursor: 'pointer',
                        border: role === r.value ? '2px solid #4F46E5' : '2px solid #E2E8F0',
                        background: role === r.value ? '#EEF2FF' : '#fff',
                        transition: 'all 0.15s',
                        '&:hover': { borderColor: '#818CF8' },
                      }}
                    >
                      <Typography sx={{ fontSize: 22, mb: 0.5 }}>{r.emoji}</Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: 14, color: role === r.value ? '#4F46E5' : '#0F172A' }}>
                        {r.label}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>{r.desc}</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}

            {/* Email */}
            <TextField
              fullWidth label="Email address" type="email"
              value={form.email} onChange={set('email')}
              sx={{ mb: 2 }} required
              InputProps={{ startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon sx={{ color: '#94A3B8' }} />
                </InputAdornment>
              )}}
            />

            {/* Password */}
            <TextField
              fullWidth label="Password" type={showPw ? 'text' : 'password'}
              value={form.password} onChange={set('password')}
              sx={{ mb: 3 }} required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw(p => !p)} edge="end" size="small">
                      {showPw
                        ? <VisibilityOffOutlinedIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                        : <VisibilityOutlinedIcon   sx={{ color: '#94A3B8', fontSize: 20 }} />
                      }
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit" fullWidth variant="contained" size="large" disabled={loading}
              sx={{
                py: 1.5, fontSize: 15,
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                '&:hover': { background: 'linear-gradient(135deg, #3730A3, #5B21B6)' },
              }}
            >
              {loading
                ? <CircularProgress size={22} sx={{ color: '#fff' }} />
                : tab === 0 ? 'Sign In' : 'Create Account'
              }
            </Button>
          </form>

          <Typography sx={{ textAlign: 'center', mt: 3, fontSize: 13, color: '#94A3B8' }}>
            {tab === 0 ? "Don't have an account? " : 'Already have an account? '}
            <Box
              component="span"
              onClick={() => setTab(tab === 0 ? 1 : 0)}
              sx={{ color: '#4F46E5', fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              {tab === 0 ? 'Register' : 'Sign In'}
            </Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
