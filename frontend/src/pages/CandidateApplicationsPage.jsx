import { useEffect, useState } from 'react';
import {
  Box, Typography, Chip, LinearProgress, Avatar, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Divider,
  CircularProgress,
} from '@mui/material';
import WorkOutlinedIcon         from '@mui/icons-material/WorkOutlined';
import CheckCircleIcon          from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DeleteOutlineIcon        from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon            from '@mui/icons-material/OpenInNew';
import CheckCircleOutlineIcon   from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon         from '@mui/icons-material/HighlightOff';
import LocationOnOutlinedIcon   from '@mui/icons-material/LocationOnOutlined';
import CalendarTodayIcon        from '@mui/icons-material/CalendarToday';
import AutoAwesomeIcon          from '@mui/icons-material/AutoAwesome';
import CloseIcon                from '@mui/icons-material/Close';
import toast from 'react-hot-toast';
import api from '../services/api';
import Layout from '../components/layout/Layout';

const STAGES = [
  { key: 'applied',     label: 'Applied'     },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview',   label: 'Interview'   },
  { key: 'offer',       label: 'Offer'       },
  { key: 'hired',       label: 'Hired'       },
];
const STAGE_META = {
  applied:     { color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
  shortlisted: { color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  interview:   { color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  offer:       { color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
  hired:       { color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
  rejected:    { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
};

function daysAgo(date) {
  const d = Math.floor((Date.now() - new Date(date)) / 86400000);
  return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`;
}

function StageTimeline({ currentStage }) {
  const rejected = currentStage === 'rejected';
  const currentIdx = STAGES.findIndex(s => s.key === currentStage);
  if (rejected) return (
    <Chip label="Not progressed" size="small"
      sx={{ fontSize: 10, height: 20, fontWeight: 700,
        background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', mt: 1.5 }} />
  );
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
      {STAGES.map((s, i) => {
        const done = i < currentIdx, current = i === currentIdx;
        const meta = STAGE_META[s.key];
        return (
          <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', flex: i < STAGES.length - 1 ? 1 : 'none' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {done ? <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                : current ? <Box sx={{ width: 16, height: 16, borderRadius: '50%',
                    background: meta.color, boxShadow: `0 0 0 3px ${meta.color}33` }} />
                : <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: '#CBD5E1' }} />}
              <Typography sx={{ fontSize: 9, fontWeight: current ? 700 : 500, mt: 0.25, whiteSpace: 'nowrap',
                color: done ? '#10B981' : current ? meta.color : '#CBD5E1' }}>
                {s.label}
              </Typography>
            </Box>
            {i < STAGES.length - 1 && (
              <Box sx={{ flex: 1, height: 2, mx: 0.5, mb: 1.5, borderRadius: 4,
                background: done ? '#10B981' : '#E2E8F0' }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// ── Detail Dialog ─────────────────────────────────────────────
function DetailDialog({ app, onClose }) {
  const meta = STAGE_META[app.stage] || STAGE_META.applied;
  const pct  = Math.round((app.score || 0) * 100);
  const color = pct >= 70 ? '#10B981' : pct >= 45 ? '#F59E0B' : '#EF4444';
  const matched = app.matchedSkills || [];
  const missing = app.missingSkills || [];
  const required = app.job?.skills || [];

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg,#0F172A,#1E1B4B)', px: 3, py: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 44, height: 44, fontSize: 18, fontWeight: 800,
              background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
              {app.job?.title?.[0]?.toUpperCase() || 'J'}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>
                {app.job?.title}
              </Typography>
              {app.job?.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                  <LocationOnOutlinedIcon sx={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }} />
                  <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{app.job.location}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.75,
                px: 1, py: 0.2, borderRadius: 1, background: `${meta.color}30`, border: `1px solid ${meta.color}50` }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: meta.color }}>
                  {app.stage.charAt(0).toUpperCase() + app.stage.slice(1)}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ position: 'relative', width: 50, height: 50 }}>
              <CircularProgress variant="determinate" value={100} size={50} thickness={4}
                sx={{ color: 'rgba(255,255,255,0.08)', position: 'absolute' }} />
              <CircularProgress variant="determinate" value={pct} size={50} thickness={4}
                sx={{ color, position: 'absolute', '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 900, color, lineHeight: 1 }}>{pct}%</Typography>
                <Typography sx={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>MATCH</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={onClose}
              sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#fff' } }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {/* Applied date + timeline */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CalendarTodayIcon sx={{ fontSize: 13, color: '#94A3B8' }} />
          <Typography sx={{ fontSize: 12, color: '#64748B' }}>
            Applied <strong>{new Date(app.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            &nbsp;·&nbsp;{daysAgo(app.createdAt)}
          </Typography>
        </Box>

        <StageTimeline currentStage={app.stage} />

        <Divider sx={{ my: 2 }} />

        {/* AI Score bar */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AutoAwesomeIcon sx={{ fontSize: 13, color: '#94A3B8' }} />
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94A3B8',
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Match Score</Typography>
            </Box>
            <Typography sx={{ fontSize: 12, fontWeight: 800, color }}>{pct}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 8,
            background: '#F1F5F9',
            '& .MuiLinearProgress-bar': {
              background: pct >= 70 ? 'linear-gradient(90deg,#10B981,#059669)'
                : pct >= 45 ? 'linear-gradient(90deg,#F59E0B,#D97706)'
                : 'linear-gradient(90deg,#EF4444,#DC2626)', borderRadius: 8 } }} />
          <Typography sx={{ fontSize: 10, color: '#94A3B8', mt: 0.5 }}>
            {pct >= 70 ? '🟢 Strong match' : pct >= 45 ? '🟡 Good match' : '🔴 Partial match'}
            &nbsp;·&nbsp;{matched.length} matched · {missing.length} missing
          </Typography>
        </Box>

        {/* Matched skills */}
        {matched.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 13, color: '#10B981' }} />
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#10B981',
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>{matched.length} Matched Skills</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
              {matched.map(s => (
                <Chip key={s} label={s} size="small" sx={{ fontSize: 10, height: 22, fontWeight: 600,
                  background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }} />
              ))}
            </Box>
          </Box>
        )}

        {/* Missing skills */}
        {missing.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
              <HighlightOffIcon sx={{ fontSize: 13, color: '#EF4444' }} />
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#EF4444',
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>{missing.length} Skill Gap{missing.length !== 1 ? 's' : ''}</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
              {missing.map(s => (
                <Chip key={s} label={s} size="small" sx={{ fontSize: 10, height: 22, fontWeight: 600,
                  background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }} />
              ))}
            </Box>
          </Box>
        )}

        {/* Job description */}
        {app.job?.description && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94A3B8',
              textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>Job Description</Typography>
            <Typography sx={{ fontSize: 13, color: '#475569', lineHeight: 1.7 }}>
              {app.job.description}
            </Typography>
          </>
        )}

        {/* Required skills */}
        {required.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94A3B8',
              textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>Required Skills</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
              {required.map(s => {
                const isMatched = matched.map(m => m.toLowerCase()).includes(s.toLowerCase());
                return (
                  <Chip key={s} label={s} size="small" sx={{ fontSize: 10, height: 22, fontWeight: 600,
                    background: isMatched ? '#ECFDF5' : '#FEF2F2',
                    color: isMatched ? '#059669' : '#DC2626',
                    border: `1px solid ${isMatched ? '#A7F3D0' : '#FECACA'}` }} />
                );
              })}
            </Box>
          </Box>
        )}

        {/* Recruiter note */}
        {app.recruiterNotes && (
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#92400E', mb: 0.5 }}>
              📝 Note from recruiter
            </Typography>
            <Typography sx={{ fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>{app.recruiterNotes}</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F1F5F9' }}>
        <Button onClick={onClose} sx={{ color: '#64748B', textTransform: 'none', fontWeight: 600 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Application Card ──────────────────────────────────────────
function ApplicationCard({ app, onWithdraw, onView }) {
  const meta       = STAGE_META[app.stage] || STAGE_META.applied;
  const pct        = Math.round((app.score || 0) * 100);
  const scoreColor = pct >= 70 ? '#10B981' : pct >= 45 ? '#F59E0B' : '#EF4444';
  const canWithdraw = !['hired','rejected'].includes(app.stage);

  return (
    <Box sx={{ background: '#fff', borderRadius: 3, p: 2.5, mb: 2,
      border: '1.5px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      transition: 'box-shadow 0.15s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' } }}>

      {/* Top row */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Avatar sx={{ width: 42, height: 42, background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
          fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
          {app.job?.title?.[0]?.toUpperCase() || 'J'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#0F172A',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {app.job?.title || 'Unknown Role'}
            </Typography>
            <Chip label={app.stage.charAt(0).toUpperCase() + app.stage.slice(1)} size="small"
              sx={{ fontSize: 10, height: 22, fontWeight: 700, flexShrink: 0,
                background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.25 }}>
            {app.job?.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <LocationOnOutlinedIcon sx={{ fontSize: 11, color: '#94A3B8' }} />
                <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>{app.job.location}</Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <CalendarTodayIcon sx={{ fontSize: 11, color: '#94A3B8' }} />
              <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>Applied {daysAgo(app.createdAt)}</Typography>
            </Box>
          </Box>
        </Box>
        {/* Score ring */}
        <Box sx={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
          border: `3px solid ${scoreColor}`, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{pct}%</Typography>
          <Typography sx={{ fontSize: 8, color: '#94A3B8', lineHeight: 1 }}>match</Typography>
        </Box>
      </Box>

      {/* Score bar */}
      <LinearProgress variant="determinate" value={pct} sx={{ height: 5, borderRadius: 8, mt: 2, mb: 1.5,
        background: '#F1F5F9',
        '& .MuiLinearProgress-bar': {
          background: pct >= 70 ? 'linear-gradient(90deg,#10B981,#059669)'
            : pct >= 45 ? 'linear-gradient(90deg,#F59E0B,#D97706)'
            : 'linear-gradient(90deg,#EF4444,#DC2626)' } }} />

      {/* Skills preview */}
      {(app.matchedSkills || []).length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
          {app.matchedSkills.slice(0, 5).map(s => (
            <Chip key={s} label={s} size="small" sx={{ fontSize: 10, height: 20, fontWeight: 600,
              background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }} />
          ))}
          {app.matchedSkills.length > 5 && (
            <Typography sx={{ fontSize: 10, color: '#94A3B8', alignSelf: 'center' }}>
              +{app.matchedSkills.length - 5} more
            </Typography>
          )}
        </Box>
      )}

      {/* Timeline */}
      <StageTimeline currentStage={app.stage} />

      {/* Recruiter note preview */}
      {app.recruiterNotes && (
        <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 1.5, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#92400E', mb: 0.25 }}>
            📝 Recruiter note
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#78350F',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {app.recruiterNotes}
          </Typography>
        </Box>
      )}

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
        <Button size="small" startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
          onClick={() => onView(app)}
          sx={{ textTransform: 'none', fontWeight: 600, fontSize: 12, borderRadius: 2,
            color: '#4F46E5', border: '1.5px solid #C7D2FE', background: '#EEF2FF',
            '&:hover': { background: '#C7D2FE' } }}>
          View Details
        </Button>
        {canWithdraw && (
          <Button size="small" startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
            onClick={() => onWithdraw(app)}
            sx={{ textTransform: 'none', fontWeight: 600, fontSize: 12, borderRadius: 2,
              color: '#EF4444', border: '1.5px solid #FECACA', background: '#FEF2F2',
              '&:hover': { background: '#FECACA' } }}>
            Withdraw
          </Button>
        )}
      </Box>
    </Box>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function CandidateApplicationsPage() {
  const [apps,         setApps]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [withdrawing,  setWithdrawing]  = useState(false);
  const [viewTarget,   setViewTarget]   = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/applications/my')
      .then(r => setApps(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleWithdraw = async () => {
    if (!withdrawTarget) return;
    setWithdrawing(true);
    try {
      await api.delete(`/applications/${withdrawTarget._id}`);
      setApps(prev => prev.filter(a => a._id !== withdrawTarget._id));
      toast.success('Application withdrawn');
      setWithdrawTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to withdraw');
    } finally { setWithdrawing(false); }
  };

  const active    = apps.filter(a => !['hired','rejected'].includes(a.stage));
  const concluded = apps.filter(a =>  ['hired','rejected'].includes(a.stage));

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 780, mx: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
            My Applications
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: 14, mt: 0.25 }}>
            Track your application status in real time
          </Typography>
        </Box>

        {/* Stats */}
        {apps.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
            {[
              { label: 'Total',    value: apps.length,                               color: '#0F172A', bg: '#F8FAFC', border: '#E2E8F0' },
              { label: 'Active',   value: active.length,                             color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
              { label: 'Hired',    value: apps.filter(a=>a.stage==='hired').length,   color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
              { label: 'Rejected', value: apps.filter(a=>a.stage==='rejected').length,color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
            ].map(s => (
              <Box key={s.label} sx={{ px: 2.5, py: 1.25, borderRadius: 2, background: s.bg, border: `1.5px solid ${s.border}` }}>
                <Typography sx={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</Typography>
                <Typography sx={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <Box sx={{ width: 36, height: 36, border: '3px solid #4F46E5', borderTopColor: 'transparent',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }} />
          </Box>
        )}

        {!loading && apps.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 10, background: '#fff', borderRadius: 3, border: '1.5px solid #E2E8F0' }}>
            <WorkOutlinedIcon sx={{ fontSize: 52, color: '#CBD5E1', mb: 1.5 }} />
            <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#94A3B8' }}>No applications yet</Typography>
            <Typography sx={{ fontSize: 13, color: '#CBD5E1', mt: 0.5 }}>
              Go to your dashboard, find a job match, and hit Apply
            </Typography>
          </Box>
        )}

        {active.length > 0 && (
          <>
            <Typography sx={{ fontWeight: 700, fontSize: 12, color: '#64748B',
              textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
              In Progress ({active.length})
            </Typography>
            {active.map(a => (
              <ApplicationCard key={a._id} app={a}
                onWithdraw={setWithdrawTarget} onView={setViewTarget} />
            ))}
          </>
        )}

        {concluded.length > 0 && (
          <>
            <Typography sx={{ fontWeight: 700, fontSize: 12, color: '#64748B',
              textTransform: 'uppercase', letterSpacing: '0.08em', mt: 2, mb: 1.5 }}>
              Concluded ({concluded.length})
            </Typography>
            {concluded.map(a => (
              <ApplicationCard key={a._id} app={a}
                onWithdraw={setWithdrawTarget} onView={setViewTarget} />
            ))}
          </>
        )}

        {/* Detail dialog */}
        {viewTarget && <DetailDialog app={viewTarget} onClose={() => setViewTarget(null)} />}

        {/* Withdraw confirm dialog */}
        <Dialog open={!!withdrawTarget} onClose={() => setWithdrawTarget(null)} maxWidth="xs" fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Withdraw Application?</DialogTitle>
          <DialogContent>
            <Typography sx={{ color: '#64748B', fontSize: 14 }}>
              Are you sure you want to withdraw your application for{' '}
              <strong>{withdrawTarget?.job?.title}</strong>? This cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setWithdrawTarget(null)}
              sx={{ color: '#64748B', textTransform: 'none' }}>Keep it</Button>
            <Button onClick={handleWithdraw} disabled={withdrawing} variant="contained" color="error"
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
              {withdrawing ? 'Withdrawing…' : 'Yes, Withdraw'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
}
