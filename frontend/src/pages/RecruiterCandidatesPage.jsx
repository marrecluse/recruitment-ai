import { useEffect, useState } from 'react';
import {
  Box, Typography, CircularProgress, Alert, TextField, Button,
  Chip, Accordion, AccordionSummary, AccordionDetails,
  Avatar, LinearProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import api    from '../services/api';
import Layout from '../components/layout/Layout';

export default function RecruiterCandidatesPage() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    api.get('/matches/candidates')
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(c =>
    c.candidate?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.candidate?.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.skills?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  const initials = name => (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const pct      = score => Math.round((score || 0) * 100);

  const exportCSV = () => {
    const header = ['Name', 'Email', 'Top Match Score (%)', 'Skills', 'Jobs Matched'];
    const rows = filtered.map(c => [
      c.candidate?.name || '',
      c.candidate?.email || '',
      Math.round((c.topScore || 0) * 100),
      (c.skills || []).join('; '),
      c.matches.map(m => m.job?.title || '').join('; '),
    ]);
    const csv = [header, ...rows].map(r =>
      r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'candidates.csv';
    a.click();
  };

  return (
    <Layout>
      <Box sx={{ p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Candidates</Typography>
          <Typography sx={{ fontSize: 13, color: '#64748B', mt: 0.25 }}>
            All candidates who matched your job postings
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, alignItems: 'center' }}>
          <TextField
            size="small" placeholder="Search by name, email or skill…" value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ width: 340, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 } }}
          />
          {filtered.length > 0 && (
            <Button size="small" variant="outlined" startIcon={<FileDownloadOutlinedIcon />}
              onClick={exportCSV}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, fontSize: 12,
                borderColor: '#C7D2FE', color: '#4F46E5', whiteSpace: 'nowrap',
                '&:hover': { background: '#EEF2FF' } }}>
              Export CSV
            </Button>
          )}
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          {[
            { label: 'Total Candidates', value: data.length, color: '#4F46E5' },
            { label: 'Avg Top Score', value: data.length
              ? `${(data.reduce((a, c) => a + pct(c.topScore), 0) / data.length).toFixed(0)}%`
              : '—', color: '#10B981' },
          ].map(s => (
            <Box key={s.label} sx={{
              px: 3, py: 1.5, borderRadius: 2, background: '#fff',
              border: '1.5px solid #E2E8F0', display: 'flex', gap: 1.5, alignItems: 'center',
            }}>
              <Typography sx={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</Typography>
              <Typography sx={{ fontSize: 13, color: '#64748B' }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#4F46E5' }} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, color: '#94A3B8' }}>
            <PeopleOutlineIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography fontWeight={600}>No candidates yet</Typography>
            <Typography fontSize={13} mt={0.5}>Candidates appear after resumes are matched to your jobs</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {filtered.map((c, i) => (
              <Accordion key={c.candidate._id} disableGutters elevation={0}
                sx={{ border: '1.5px solid #E2E8F0', borderRadius: '12px !important',
                  '&:before': { display: 'none' }, overflow: 'hidden' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2.5, py: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                    {/* Rank */}
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', width: 24 }}>
                      #{i + 1}
                    </Typography>
                    <Avatar sx={{ width: 38, height: 38, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', fontSize: 13, fontWeight: 700 }}>
                      {initials(c.candidate.name)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
                        {c.candidate.name}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: '#64748B' }}>{c.candidate.email}</Typography>
                    </Box>
                    {/* Top score bar */}
                    <Box sx={{ width: 140, mr: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                        <Typography sx={{ fontSize: 11, color: '#64748B' }}>Best match</Typography>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#4F46E5' }}>{pct(c.topScore)}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={pct(c.topScore)}
                        sx={{ height: 5, borderRadius: 3,
                          '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #4F46E5, #7C3AED)' },
                          background: '#E2E8F0' }} />
                    </Box>
                    <Chip label={`${c.matches.length} job${c.matches.length !== 1 ? 's' : ''}`} size="small"
                      sx={{ fontSize: 11, height: 20, background: '#EEF2FF', color: '#4F46E5', fontWeight: 600, mr: 1 }} />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 2.5, pt: 0, borderTop: '1px solid #F1F5F9' }}>
                  {/* Skills */}
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#64748B', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Detected Skills
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2.5 }}>
                    {c.skills.length === 0
                      ? <Typography fontSize={12} color="#94A3B8">No skills detected</Typography>
                      : c.skills.map(s => (
                        <Chip key={s} label={s} size="small"
                          sx={{ fontSize: 11, height: 22, background: '#F1F5F9', color: '#475569', fontWeight: 500 }} />
                      ))}
                  </Box>
                  {/* Per-job scores */}
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#64748B', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Match Scores
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {c.matches.map(m => (
                      <Box key={m.job?._id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ fontSize: 13, color: '#0F172A', flex: 1, fontWeight: 500 }}>
                          {m.job?.title || 'Unknown Job'}
                        </Typography>
                        <Box sx={{ width: 120 }}>
                          <LinearProgress variant="determinate" value={pct(m.score)}
                            sx={{ height: 4, borderRadius: 2,
                              '& .MuiLinearProgress-bar': { background: pct(m.score) >= 50 ? '#10B981' : '#4F46E5' },
                              background: '#E2E8F0' }} />
                        </Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#64748B', width: 36, textAlign: 'right' }}>
                          {pct(m.score)}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Box>
    </Layout>
  );
}
