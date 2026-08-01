import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Chip, Grid, LinearProgress } from '@mui/material';
import CloudUploadOutlinedIcon  from '@mui/icons-material/CloudUploadOutlined';
import DescriptionOutlinedIcon  from '@mui/icons-material/DescriptionOutlined';
import AutoAwesomeIcon          from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon            from '@mui/icons-material/TrendingUp';
import CheckCircleOutlineIcon   from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon          from '@mui/icons-material/HighlightOff';
import api from '../services/api';
import { fetchMyMatches } from '../features/matches/matchSlice';
import CircularScore from '../components/dashboard/CircularScore';
import StatCard      from '../components/dashboard/StatCard';
import Layout        from '../components/layout/Layout';

const TIER_CONFIG = {
  high:   { label: 'Strong Match',  bg: '#ECFDF5', border: '#A7F3D0', dot: '#10B981' },
  medium: { label: 'Good Match',    bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B' },
  low:    { label: 'Partial Match', bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444' },
};

function MatchCard({ match }) {
  const pct   = Math.round((match.score || 0) * 100);
  const tier  = pct >= 70 ? 'high' : pct >= 45 ? 'medium' : 'low';
  const cfg   = TIER_CONFIG[tier];

  return (
    <Box sx={{
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 3,
      p: 2.5,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
        transform: 'translateY(-2px)',
      },
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        {/* Left: Job info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
            <Box sx={{
              px: 1, py: 0.25, borderRadius: 1, fontSize: 10, fontWeight: 700,
              background: cfg.bg, color: cfg.dot, border: `1px solid ${cfg.border}`,
              display: 'flex', alignItems: 'center', gap: 0.5,
            }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
              {cfg.label}
            </Box>
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#0F172A', mb: 0.5 }}>
            {match.job?.title || 'Job Title'}
          </Typography>
          {match.explanation && (
            <Typography sx={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, mb: 1.25 }}>
              {match.explanation}
            </Typography>
          )}

          {/* Score bar */}
          <Box sx={{ mb: 1.25 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>Match strength</Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: cfg.dot }}>{pct}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate" value={pct}
              sx={{
                height: 6, borderRadius: 8,
                background: '#F1F5F9',
                '& .MuiLinearProgress-bar': {
                  background: tier === 'high'
                    ? 'linear-gradient(90deg, #10B981, #059669)'
                    : tier === 'medium'
                      ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                      : 'linear-gradient(90deg, #EF4444, #DC2626)',
                },
              }}
            />
          </Box>

          {/* Skills row */}
          {(match.matchedSkills || []).length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 14, color: '#10B981' }} />
              {match.matchedSkills.slice(0, 4).map(s => (
                <Chip key={s} label={s} size="small" sx={{
                  fontSize: 10, height: 20, fontWeight: 600,
                  background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0',
                }} />
              ))}
              {match.matchedSkills.length > 4 && (
                <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>+{match.matchedSkills.length - 4} more</Typography>
              )}
            </Box>
          )}
          {(match.missingSkills || []).length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', mt: 0.5 }}>
              <HighlightOffIcon sx={{ fontSize: 14, color: '#EF4444' }} />
              {match.missingSkills.slice(0, 3).map(s => (
                <Chip key={s} label={s} size="small" sx={{
                  fontSize: 10, height: 20, fontWeight: 600,
                  background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
                }} />
              ))}
            </Box>
          )}
        </Box>

        {/* Right: circular score */}
        <CircularScore score={match.score || 0} size={80} strokeWidth={7} />
      </Box>
    </Box>
  );
}

export default function CandidateDashboard() {
  const dispatch = useDispatch();
  const { user }      = useSelector(s => s.auth);
  const { myMatches } = useSelector(s => s.matches);
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

  useEffect(() => { dispatch(fetchMyMatches()); }, []);

  const doUpload = async file => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('resume', file);
    try {
      await api.post('/resumes/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadDone(true);
      setTimeout(() => { dispatch(fetchMyMatches()); setUploadDone(false); }, 3000);
    } finally {
      setUploading(false);
    }
  };

  const onFile   = e => doUpload(e.target.files[0]);
  const onDrop   = e => { e.preventDefault(); setDragging(false); doUpload(e.dataTransfer.files[0]); };
  const onDragOver  = e => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);

  // Stats
  const bestMatch  = myMatches.length ? Math.max(...myMatches.map(m => Math.round((m.score || 0) * 100))) : 0;
  const avgMatch   = myMatches.length ? Math.round(myMatches.reduce((a, m) => a + (m.score || 0), 0) / myMatches.length * 100) : 0;
  const strongOnes = myMatches.filter(m => (m.score || 0) >= 0.7).length;

  const greetingHour = new Date().getHours();
  const greeting     = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </Typography>
          <Typography sx={{ color: '#64748B', mt: 0.5, fontSize: 15 }}>
            Here's your AI-powered job match overview
          </Typography>
        </Box>

        {/* Stats */}
        {myMatches.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6} sm={3}>
              <StatCard icon={<AutoAwesomeIcon />}          label="Total Matches"   value={myMatches.length}        color="#4F46E5" bgColor="#EEF2FF" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard icon={<TrendingUpIcon />}           label="Best Match"      value={`${bestMatch}%`}         color="#10B981" bgColor="#ECFDF5" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard icon={<CheckCircleOutlineIcon />}   label="Strong Matches"  value={strongOnes}              color="#7C3AED" bgColor="#F5F3FF" sub="≥70% score" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard icon={<DescriptionOutlinedIcon />}  label="Avg Match Score" value={avgMatch ? `${avgMatch}%` : '—'} color="#F59E0B" bgColor="#FFFBEB" />
            </Grid>
          </Grid>
        )}

        {/* Upload zone */}
        <Box
          onClick={() => !uploading && fileRef.current.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          sx={{
            mb: 4, p: { xs: 3, md: 4 }, borderRadius: 3, textAlign: 'center',
            border: `2px dashed ${dragging ? '#4F46E5' : uploadDone ? '#10B981' : '#CBD5E1'}`,
            background: dragging ? '#EEF2FF' : uploadDone ? '#ECFDF5' : '#F8FAFC',
            cursor: uploading ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': uploading ? {} : {
              borderColor: '#818CF8',
              background: '#EEF2FF',
            },
          }}
        >
          <input ref={fileRef} type="file" hidden accept=".pdf,.docx" onChange={onFile} />
          <Box sx={{
            width: 56, height: 56, borderRadius: 3, mx: 'auto', mb: 1.5,
            background: uploadDone ? '#ECFDF5' : dragging ? '#EEF2FF' : '#F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
            {uploadDone
              ? <CheckCircleOutlineIcon sx={{ fontSize: 30, color: '#10B981' }} />
              : uploading
                ? <Box sx={{ width: 28, height: 28, border: '3px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }} />
                : <CloudUploadOutlinedIcon sx={{ fontSize: 30, color: dragging ? '#4F46E5' : '#94A3B8' }} />
            }
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: 16, color: uploadDone ? '#059669' : '#0F172A', mb: 0.5 }}>
            {uploadDone ? 'Resume uploaded! Processing…' : uploading ? 'Uploading…' : dragging ? 'Drop your CV here' : 'Upload your CV'}
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#94A3B8' }}>
            {uploadDone
              ? 'AI is parsing your resume and generating matches'
              : 'Drag & drop or click to browse · PDF or DOCX · Max 10MB'}
          </Typography>
          {!uploading && !uploadDone && (
            <Box sx={{
              mt: 2, display: 'inline-flex', alignItems: 'center', gap: 0.75,
              px: 2, py: 0.75, borderRadius: 2,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              color: '#fff', fontSize: 13, fontWeight: 700,
            }}>
              <CloudUploadOutlinedIcon sx={{ fontSize: 16 }} />
              Choose File
            </Box>
          )}
        </Box>

        {/* Matches section */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 18, color: '#0F172A' }}>
                Your Job Matches
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#94A3B8' }}>
                Ranked by AI semantic similarity score
              </Typography>
            </Box>
            {myMatches.length > 0 && (
              <Chip
                label={`${myMatches.length} match${myMatches.length !== 1 ? 'es' : ''}`}
                sx={{ background: '#EEF2FF', color: '#4F46E5', fontWeight: 700 }}
              />
            )}
          </Box>

          {myMatches.length === 0 ? (
            <Box sx={{
              textAlign: 'center', py: 8,
              background: '#fff', borderRadius: 3,
              border: '1px solid rgba(0,0,0,0.07)',
            }}>
              <AutoAwesomeIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1.5 }} />
              <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#94A3B8', mb: 0.5 }}>
                No matches yet
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#CBD5E1', maxWidth: 320, mx: 'auto' }}>
                Upload your resume above and our AI will match you to active job listings automatically
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {myMatches.map(m => (
                <Grid item xs={12} md={6} key={m._id}>
                  <MatchCard match={m} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Layout>
  );
}
