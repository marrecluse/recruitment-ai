import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box, Typography, Chip, Avatar, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogContent, DialogActions, Button, TextField,
  LinearProgress, IconButton, Divider, Tooltip, CircularProgress,
} from '@mui/material';
import WorkOutlinedIcon        from '@mui/icons-material/WorkOutlined';
import AutoAwesomeIcon         from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon  from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon        from '@mui/icons-material/HighlightOff';
import CloseIcon               from '@mui/icons-material/Close';
import EditOutlinedIcon        from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon       from '@mui/icons-material/DeleteOutline';
import CalendarTodayIcon       from '@mui/icons-material/CalendarToday';
import AutoAwesomeMosaicIcon   from '@mui/icons-material/AutoAwesomeMosaic';
import SchoolOutlinedIcon      from '@mui/icons-material/SchoolOutlined';
import WorkHistoryOutlinedIcon from '@mui/icons-material/WorkHistoryOutlined';
import DownloadOutlinedIcon    from '@mui/icons-material/DownloadOutlined';
import VisibilityOutlinedIcon  from '@mui/icons-material/VisibilityOutlined';
import toast from 'react-hot-toast';
import api from '../services/api';
import Layout from '../components/layout/Layout';
import { updateJob, deleteJob } from '../features/jobs/jobsSlice';

const STAGES = [
  { key: 'applied',     label: 'Applied',     color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
  { key: 'shortlisted', label: 'Shortlisted', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { key: 'interview',   label: 'Interview',   color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { key: 'offer',       label: 'Offer',       color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
  { key: 'hired',       label: 'Hired',       color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
  { key: 'rejected',    label: 'Rejected',    color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
];

function daysAgo(date) {
  const d = Math.floor((Date.now() - new Date(date)) / 86400000);
  return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d}d ago`;
}

function ScoreBadge({ score }) {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 70 ? '#10B981' : pct >= 45 ? '#F59E0B' : '#EF4444';
  return (
    <Box sx={{ width: 32, height: 32, borderRadius: '50%', border: `2.5px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 9, fontWeight: 800, color, flexShrink: 0 }}>
      {pct}%
    </Box>
  );
}

function ApplicationCard({ app, stageColor, onClick }) {
  return (
    <Box onClick={() => onClick(app)} sx={{
      background: '#fff', borderRadius: 2, p: 1.75, cursor: 'pointer',
      border: '1.5px solid #F1F5F9', mb: 1,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.15s',
      '&:hover': { borderColor: stageColor, boxShadow: `0 0 0 3px ${stageColor}22` },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.75 }}>
        <Avatar sx={{ width: 30, height: 30, fontSize: 13, fontWeight: 700,
          background: `linear-gradient(135deg,${stageColor},${stageColor}99)` }}>
          {app.candidate?.name?.[0]?.toUpperCase() || '?'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 12, color: '#0F172A',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {app.candidate?.name || 'Unknown'}
          </Typography>
          <Typography sx={{ fontSize: 10, color: '#94A3B8',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {app.candidate?.email}
          </Typography>
        </Box>
        <ScoreBadge score={app.score} />
      </Box>
      {(app.matchedSkills || []).length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.4, flexWrap: 'wrap', mb: 0.5 }}>
          {app.matchedSkills.slice(0, 4).map(s => (
            <Chip key={s} label={s} size="small" sx={{ fontSize: 9, height: 16,
              fontWeight: 600, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }} />
          ))}
          {app.matchedSkills.length > 4 && (
            <Typography sx={{ fontSize: 9, color: '#94A3B8', alignSelf: 'center' }}>
              +{app.matchedSkills.length - 4}
            </Typography>
          )}
        </Box>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: 10, color: '#CBD5E1' }}>
          {app.stage === 'interview' && app.interviewDate
            ? `📅 ${new Date(app.interviewDate).toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}`
            : daysAgo(app.createdAt)}
        </Typography>
        {(app.missingSkills || []).length > 0 && (
          <Box sx={{ fontSize: 9, fontWeight: 700, color: '#EF4444',
            background: '#FEF2F2', px: 0.75, py: 0.2, borderRadius: 0.75 }}>
            {app.missingSkills.length} gap{app.missingSkills.length !== 1 ? 's' : ''}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function KanbanColumn({ stage, apps, onCardClick }) {
  return (
    <Box sx={{ minWidth: 220, width: 220, flexShrink: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, px: 0.5 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
        <Typography sx={{ fontWeight: 700, fontSize: 12, color: '#0F172A', flex: 1 }}>{stage.label}</Typography>
        <Chip label={apps.length} size="small" sx={{ fontSize: 10, height: 18, fontWeight: 700,
          background: stage.bg, color: stage.color, border: `1px solid ${stage.border}` }} />
      </Box>
      <Box sx={{ background: stage.bg, borderRadius: 2.5, border: `1.5px solid ${stage.border}`, p: 1.25, minHeight: 120 }}>
        {apps.length === 0
          ? <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography sx={{ fontSize: 11, color: stage.color, opacity: 0.5 }}>No candidates</Typography>
            </Box>
          : apps.map(app => <ApplicationCard key={app._id} app={app} stageColor={stage.color} onClick={onCardClick} />)
        }
      </Box>
    </Box>
  );
}

// ── Section label helper ──────────────────────────────────────
function SectionLabel({ icon, text }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
      <Box sx={{ color: '#94A3B8', display: 'flex' }}>{icon}</Box>
      <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94A3B8',
        textTransform: 'uppercase', letterSpacing: '0.08em' }}>{text}</Typography>
    </Box>
  );
}

function CandidateDialog({ app, jobTitle, onClose, onSaved }) {
  const [stage,         setStage]         = useState(app.stage);
  const [notes,         setNotes]         = useState(app.recruiterNotes || '');
  const [interviewDate, setInterviewDate] = useState(
    app.interviewDate ? new Date(app.interviewDate).toISOString().slice(0,16) : ''
  );
  const [saving,  setSaving]  = useState(false);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [pdfUrl,  setPdfUrl]  = useState(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  const previewPdf = async () => {
    if (pdfUrl) { setPdfOpen(true); return; }
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/resumes/${resumeId}/file`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) { toast.error('Preview not available for this resume'); return; }
      const blob = await res.blob();
      setPdfUrl(URL.createObjectURL(blob));
      setPdfOpen(true);
    } catch { toast.error('Could not load PDF preview'); }
  };

  const pct   = Math.round((app.score || 0) * 100);
  const color = pct >= 70 ? '#10B981' : pct >= 45 ? '#F59E0B' : '#EF4444';
  const matchedSkills = app.matchedSkills || [];
  const missingSkills = app.missingSkills || [];

  // Fetch candidate's parsed profile
  useEffect(() => {
    api.get(`/resumes/candidate/${app.candidate?._id}`)
      .then(r => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [app.candidate?._id]);

  const save = async () => {
    setSaving(true);
    try {
      if (stage !== app.stage || interviewDate !== (app.interviewDate ? new Date(app.interviewDate).toISOString().slice(0,16) : ''))
        await api.patch(`/applications/${app._id}/stage`, { stage, interviewDate: interviewDate || null });
      await api.patch(`/applications/${app._id}/notes`, { notes });
      toast.success('Saved');
      onSaved(app._id, stage, notes, interviewDate);
      onClose();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const education  = profile?.parsedProfile?.education  || [];
  const experience = profile?.parsedProfile?.experience || [];
  const allSkills  = profile?.parsedProfile?.skills     || [];
  const resumeId   = profile?._id;

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', maxHeight: '90vh' } }}>

      {/* ── Gradient header ── */}
      <Box sx={{ background: 'linear-gradient(135deg,#0F172A 0%,#1E1B4B 100%)', px: 3, py: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 48, height: 48, fontSize: 20, fontWeight: 800,
              background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
              boxShadow: '0 0 0 3px rgba(129,140,248,0.3)' }}>
              {app.candidate?.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 17, color: '#fff', letterSpacing: '-0.3px' }}>
                {app.candidate?.name}
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', mt: 0.25 }}>
                {app.candidate?.email}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.75 }}>
                {jobTitle && (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25,
                    borderRadius: 1, background: 'rgba(79,70,229,0.3)', border: '1px solid rgba(129,140,248,0.4)' }}>
                    <WorkOutlinedIcon sx={{ fontSize: 10, color: '#818CF8' }} />
                    <Typography sx={{ fontSize: 10, color: '#C7D2FE', fontWeight: 600 }}>{jobTitle}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarTodayIcon sx={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }} />
                  <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                    Applied {daysAgo(app.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Score ring */}
            <Box sx={{ position: 'relative', width: 54, height: 54 }}>
              <CircularProgress variant="determinate" value={100}
                size={54} thickness={4}
                sx={{ color: 'rgba(255,255,255,0.08)', position: 'absolute' }} />
              <CircularProgress variant="determinate" value={pct}
                size={54} thickness={4} sx={{ color, position: 'absolute',
                  '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 900, color, lineHeight: 1 }}>{pct}%</Typography>
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

      {/* ── Scrollable body ── */}
      <DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT column */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, borderRight: '1px solid #F1F5F9',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { background: '#E2E8F0', borderRadius: 4 } }}>

          {/* AI Explanation */}
          {app.explanation && (
            <Box sx={{ mb: 2.5, p: 2, borderRadius: 2, background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)',
              border: '1.5px solid #C7D2FE' }}>
              <SectionLabel icon={<AutoAwesomeIcon sx={{ fontSize: 13 }} />} text="AI Analysis" />
              <Typography sx={{ fontSize: 13, color: '#3730A3', lineHeight: 1.65 }}>
                {app.explanation}
              </Typography>
            </Box>
          )}

          {/* Score bar */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
              <SectionLabel icon={<AutoAwesomeMosaicIcon sx={{ fontSize: 13 }} />} text="AI Match Score" />
              <Typography sx={{ fontSize: 12, fontWeight: 800, color }}>{pct}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 8,
              background: '#F1F5F9',
              '& .MuiLinearProgress-bar': {
                background: pct >= 70 ? 'linear-gradient(90deg,#10B981,#059669)'
                  : pct >= 45 ? 'linear-gradient(90deg,#F59E0B,#D97706)'
                  : 'linear-gradient(90deg,#EF4444,#DC2626)',
                borderRadius: 8,
              } }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography sx={{ fontSize: 10, color: '#94A3B8' }}>
                {matchedSkills.length} matched · {missingSkills.length} missing
              </Typography>
              <Typography sx={{ fontSize: 10, color: '#94A3B8' }}>
                {pct >= 70 ? 'Strong match' : pct >= 45 ? 'Good match' : 'Partial match'}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Matched skills — ALL of them */}
          {matchedSkills.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <SectionLabel icon={<CheckCircleOutlineIcon sx={{ fontSize: 13 }} />}
                text={`${matchedSkills.length} Matched Skills`} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                {matchedSkills.map(s => (
                  <Chip key={s} label={s} size="small" sx={{ fontSize: 10, height: 22, fontWeight: 600,
                    background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }} />
                ))}
              </Box>
            </Box>
          )}

          {/* Missing skills — ALL of them */}
          {missingSkills.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <SectionLabel icon={<HighlightOffIcon sx={{ fontSize: 13 }} />}
                text={`${missingSkills.length} Skill Gap${missingSkills.length !== 1 ? 's' : ''}`} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                {missingSkills.map(s => (
                  <Chip key={s} label={s} size="small" sx={{ fontSize: 10, height: 22, fontWeight: 600,
                    background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }} />
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* RIGHT column — profile + actions */}
        <Box sx={{ width: 260, flexShrink: 0, overflowY: 'auto', p: 2.5, background: '#FAFBFC',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { background: '#E2E8F0', borderRadius: 4 } }}>

          {loadingProfile ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ color: '#818CF8' }} />
            </Box>
          ) : (
            <>
              {/* All CV skills */}
              {allSkills.length > 0 && (
                <Box sx={{ mb: 2.5 }}>
                  <SectionLabel icon={<AutoAwesomeIcon sx={{ fontSize: 12 }} />}
                    text={`All CV Skills (${allSkills.length})`} />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {allSkills.map(s => {
                      const matched = matchedSkills.includes(s);
                      return (
                        <Chip key={s} label={s} size="small" sx={{ fontSize: 9, height: 20, fontWeight: 600,
                          background: matched ? '#ECFDF5' : '#EEF2FF',
                          color:      matched ? '#059669' : '#4F46E5',
                          border: `1px solid ${matched ? '#A7F3D0' : '#C7D2FE'}` }} />
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Education */}
              {education.length > 0 && (
                <Box sx={{ mb: 2.5 }}>
                  <SectionLabel icon={<SchoolOutlinedIcon sx={{ fontSize: 12 }} />} text="Education" />
                  {education.map((e, i) => (
                    <Box key={i} sx={{ mb: 1, pl: 1, borderLeft: '2px solid #C7D2FE' }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>
                        {e.degree || e.qualification || e}
                      </Typography>
                      {e.institution && (
                        <Typography sx={{ fontSize: 10, color: '#64748B' }}>{e.institution}</Typography>
                      )}
                      {e.year && (
                        <Typography sx={{ fontSize: 10, color: '#94A3B8' }}>{e.year}</Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}

              {/* Experience */}
              {experience.length > 0 && (
                <Box sx={{ mb: 2.5 }}>
                  <SectionLabel icon={<WorkHistoryOutlinedIcon sx={{ fontSize: 12 }} />} text="Experience" />
                  {experience.map((e, i) => (
                    <Box key={i} sx={{ mb: 1, pl: 1, borderLeft: '2px solid #DDD6FE' }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>
                        {e.title || e.role || e}
                      </Typography>
                      {e.company && (
                        <Typography sx={{ fontSize: 10, color: '#64748B' }}>{e.company}</Typography>
                      )}
                      {e.duration && (
                        <Typography sx={{ fontSize: 10, color: '#94A3B8' }}>{e.duration}</Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}

              {/* Download CV */}
              {resumeId && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button fullWidth size="small" variant="contained" startIcon={<VisibilityOutlinedIcon />}
                    onClick={previewPdf}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, fontSize: 12,
                      background: '#4F46E5', '&:hover': { background: '#4338CA' } }}>
                    Preview CV
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<DownloadOutlinedIcon />}
                    component="a"
                    href={`${import.meta.env.VITE_API_URL || ''}/api/resumes/${resumeId}/file`}
                    download
                    onClick={e => {
                      e.preventDefault();
                      const token = localStorage.getItem('accessToken');
                      fetch(`${import.meta.env.VITE_API_URL || ''}/api/resumes/${resumeId}/file`,
                        { headers: { Authorization: `Bearer ${token}` } })
                        .then(r => r.blob()).then(blob => {
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(blob);
                          a.download = 'resume.pdf';
                          a.click();
                        }).catch(() => toast.error('Download failed'));
                    }}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, fontSize: 12,
                      borderColor: '#C7D2FE', color: '#4F46E5', flexShrink: 0,
                      '&:hover': { background: '#EEF2FF', borderColor: '#818CF8' } }}>
                    ↓
                  </Button>
                </Box>
              )}
              {/* PDF Preview Modal */}
              {pdfOpen && pdfUrl && (
                <Dialog open onClose={() => setPdfOpen(false)} maxWidth="lg" fullWidth
                  PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', height: '90vh' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 2.5, py: 1.5, borderBottom: '1px solid #F1F5F9', background: '#0F172A' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>
                      {app.candidate?.name} — CV Preview
                    </Typography>
                    <IconButton size="small" onClick={() => setPdfOpen(false)}
                      sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#fff' } }}>
                      <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ flex: 1, height: 'calc(100% - 48px)' }}>
                    <iframe src={pdfUrl} width="100%" height="100%"
                      style={{ border: 'none', display: 'block' }}
                      title="Resume Preview" />
                  </Box>
                </Dialog>
              )}
            </>
          )}

          <Divider sx={{ mb: 2 }} />

          {/* Stage selector */}
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Pipeline Stage</InputLabel>
            <Select value={stage} label="Pipeline Stage" onChange={e => setStage(e.target.value)}>
              {STAGES.map(s => (
                <MenuItem key={s.key} value={s.key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                    {s.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Interview Date */}
          {stage === 'interview' && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#64748B',
                textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>
                Interview Date &amp; Time
              </Typography>
              <TextField fullWidth size="small" type="datetime-local"
                value={interviewDate}
                onChange={e => setInterviewDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().slice(0,16) }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 } }}
              />
              {interviewDate && (
                <Typography sx={{ fontSize: 11, color: '#10B981', mt: 0.5, fontWeight: 600 }}>
                  📅 {new Date(interviewDate).toLocaleString('en-GB', {
                    weekday:'short', day:'numeric', month:'short',
                    year:'numeric', hour:'2-digit', minute:'2-digit'
                  })}
                </Typography>
              )}
            </Box>
          )}
          {/* Notes */}
          <TextField fullWidth multiline rows={4} label="Recruiter Notes"
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Interview feedback, red flags, follow-up actions…"
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1, borderTop: '1px solid #F1F5F9' }}>
        <Button onClick={onClose} sx={{ color: '#64748B', textTransform: 'none' }}>Cancel</Button>
        <Button onClick={save} disabled={saving} variant="contained"
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2,
            background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
            '&:hover': { background: 'linear-gradient(135deg,#4338CA,#6D28D9)' } }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── JobFormFields ─────────────────────────────────────────────
function JobFormFields({ form, onChange }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
      <TextField label="Job Title" fullWidth size="small" required
        value={form.title || ''} onChange={e => onChange({ ...form, title: e.target.value })}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
      <TextField label="Location" fullWidth size="small"
        value={form.location || ''} onChange={e => onChange({ ...form, location: e.target.value })}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
      <TextField label="Description" fullWidth size="small" multiline rows={4}
        value={form.description || ''} onChange={e => onChange({ ...form, description: e.target.value })}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
      <TextField label="Required Skills (comma-separated)" fullWidth size="small"
        value={Array.isArray(form.skills) ? form.skills.join(', ') : (form.skills || '')}
        onChange={e => onChange({ ...form, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
        placeholder="e.g. Python, Docker, SQL"
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
    </Box>
  );
}

export default function RecruiterPipelinePage() {
  const dispatch = useDispatch();
  const [jobs,        setJobs]        = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [apps,        setApps]        = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [activeApp,   setActiveApp]   = useState(null);
  const [editOpen,    setEditOpen]    = useState(false);
  const [editForm,    setEditForm]    = useState({});
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  useEffect(() => {
    api.get('/jobs/my').then(r => {
      const list = r.data || [];
      setJobs(list);
      if (list.length) setSelectedJob(list[0]._id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    setLoading(true);
    api.get(`/applications/job/${selectedJob}`)
      .then(r => setApps(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedJob]);

  const handleSaved = (appId, newStage, newNotes, newInterviewDate) =>
    setApps(prev => prev.map(a => a._id === appId
      ? { ...a, stage: newStage, recruiterNotes: newNotes, interviewDate: newInterviewDate || null }
      : a));

  const openEdit = job => {
    if (!job) return;
    setEditForm({ title: job.title||'', location: job.location||'', description: job.description||'', skills: job.skills||[] });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editForm.title?.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      const result = await dispatch(updateJob({ id: selectedJob, body: editForm })).unwrap();
      setJobs(prev => prev.map(j => j._id === selectedJob ? { ...j, ...result } : j));
      toast.success('Job updated');
      setEditOpen(false);
    } catch (err) { toast.error(err || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteJob(deleteTarget._id)).unwrap();
      const remaining = jobs.filter(j => j._id !== deleteTarget._id);
      setJobs(remaining);
      setDeleteTarget(null);
      setApps([]);
      setSelectedJob(remaining.length ? remaining[0]._id : '');
      toast.success('Job deleted');
    } catch (err) { toast.error(err || 'Failed to delete'); }
    finally { setDeleting(false); }
  };

  const currentJob = jobs.find(j => j._id === selectedJob);
  const byStage = {};
  for (const s of STAGES) byStage[s.key] = apps.filter(a => a.stage === s.key);

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
              Hiring Pipeline
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: 14, mt: 0.25 }}>
              Track candidates through your ATS workflow
            </Typography>
          </Box>
          {jobs.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 240 }}>
                <InputLabel>Select Job</InputLabel>
                <Select value={selectedJob} label="Select Job"
                  onChange={e => setSelectedJob(e.target.value)}
                  sx={{ borderRadius: 2, background: '#fff' }}>
                  {jobs.map(j => (
                    <MenuItem key={j._id} value={j._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkOutlinedIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                        {j.title}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedJob && (<>
                <Tooltip title="Edit job">
                  <IconButton size="small" onClick={() => openEdit(currentJob)}
                    sx={{ background: '#EEF2FF', color: '#4F46E5', width: 34, height: 34,
                      border: '1.5px solid #C7D2FE', '&:hover': { background: '#C7D2FE' } }}>
                    <EditOutlinedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete job">
                  <IconButton size="small" onClick={() => setDeleteTarget(currentJob)}
                    sx={{ background: '#FEF2F2', color: '#EF4444', width: 34, height: 34,
                      border: '1.5px solid #FECACA', '&:hover': { background: '#FECACA' } }}>
                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </>)}
            </Box>
          )}
        </Box>

        {/* Stats chips */}
        {apps.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
            <Box sx={{ px: 2, py: 1, borderRadius: 2, background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}>
              <Typography sx={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Total</Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{apps.length}</Typography>
            </Box>
            {STAGES.filter(s => byStage[s.key].length > 0).map(s => (
              <Box key={s.key} sx={{ px: 2, py: 1, borderRadius: 2, background: s.bg, border: `1.5px solid ${s.border}` }}>
                <Typography sx={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</Typography>
                <Typography sx={{ fontSize: 20, fontWeight: 800, color: s.color }}>{byStage[s.key].length}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {jobs.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <WorkOutlinedIcon sx={{ fontSize: 52, color: '#CBD5E1', mb: 1.5 }} />
            <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#94A3B8' }}>No jobs posted yet</Typography>
            <Typography sx={{ fontSize: 13, color: '#CBD5E1', mt: 0.5 }}>Post a job to start receiving applications</Typography>
          </Box>
        )}

        {selectedJob && !loading && jobs.length > 0 && apps.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 10, background: '#fff', borderRadius: 3, border: '1.5px solid #E2E8F0' }}>
            <AutoAwesomeIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1.5 }} />
            <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#94A3B8' }}>No applications yet</Typography>
            <Typography sx={{ fontSize: 13, color: '#CBD5E1', mt: 0.5 }}>Candidates matched to this job can apply from their dashboard</Typography>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <Box sx={{ width: 36, height: 36, border: '3px solid #4F46E5', borderTopColor: 'transparent',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }} />
          </Box>
        )}

        {!loading && apps.length > 0 && (
          <Box sx={{ overflowX: 'auto', pb: 2,
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 4 } }}>
            <Box sx={{ display: 'flex', gap: 2, minWidth: 'max-content' }}>
              {STAGES.map(stage => (
                <KanbanColumn key={stage.key} stage={stage} apps={byStage[stage.key]} onCardClick={setActiveApp} />
              ))}
            </Box>
          </Box>
        )}

        {/* Candidate detail dialog — enriched */}
        {activeApp && (
          <CandidateDialog
            app={activeApp}
            jobTitle={currentJob?.title}
            onClose={() => setActiveApp(null)}
            onSaved={handleSaved}
          />
        )}

        {/* Edit Job Dialog */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}>
          <Box sx={{ px: 3, pt: 3, pb: 1, borderBottom: '1px solid #F1F5F9' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>Edit Job</Typography>
          </Box>
          <DialogContent sx={{ pt: 1 }}>
            <JobFormFields form={editForm} onChange={setEditForm} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setEditOpen(false)} sx={{ color: '#64748B', textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving} variant="contained"
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2,
                background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                '&:hover': { background: 'linear-gradient(135deg,#4338CA,#6D28D9)' } }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}>
          <Box sx={{ px: 3, pt: 3, pb: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>Delete Job?</Typography>
          </Box>
          <DialogContent>
            <Typography sx={{ color: '#64748B', fontSize: 14 }}>
              Permanently delete <strong>{deleteTarget?.title}</strong>?
              All applications for this job will also be removed.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setDeleteTarget(null)} sx={{ color: '#64748B', textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleDelete} disabled={deleting} variant="contained" color="error"
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
}
