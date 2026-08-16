import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Chip, Grid, LinearProgress, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider,
  CircularProgress as MuiCircularProgress, Avatar,
} from '@mui/material';
import CloudUploadOutlinedIcon  from '@mui/icons-material/CloudUploadOutlined';
import DescriptionOutlinedIcon  from '@mui/icons-material/DescriptionOutlined';
import AutoAwesomeIcon          from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon           from '@mui/icons-material/TrendingUp';
import CheckCircleOutlineIcon   from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon         from '@mui/icons-material/HighlightOff';
import DeleteOutlineIcon        from '@mui/icons-material/DeleteOutline';
import TaskAltIcon              from '@mui/icons-material/TaskAlt';
import PendingIcon              from '@mui/icons-material/Pending';
import ErrorOutlineIcon         from '@mui/icons-material/ErrorOutline';
import FileUploadIcon           from '@mui/icons-material/FileUpload';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import ExpandMoreIcon           from '@mui/icons-material/ExpandMore';
import ExpandLessIcon           from '@mui/icons-material/ExpandLess';
import api from '../services/api';
import toast from 'react-hot-toast';
import { fetchMyMatches } from '../features/matches/matchSlice';
import CircularScore from '../components/dashboard/CircularScore';
import StatCard      from '../components/dashboard/StatCard';
import Layout        from '../components/layout/Layout';

// ── Parse progress config ─────────────────────────────────────
const PARSE_STEPS = [
  { label: 'Uploading',         sub: 'Sending your CV to the server'     },
  { label: 'Parsing Resume',    sub: 'NLP model reading your document'   },
  { label: 'Extracting Skills', sub: 'Identifying technologies & skills' },
  { label: 'Matching Jobs',     sub: 'AI scoring against active listings'},
  { label: 'Complete!',         sub: 'Your matches are ready'            },
];
const STEP_COLORS = ['#4F46E5','#7C3AED','#0EA5E9','#10B981','#059669'];

function ParseProgress({ step, onDismiss }) {
  return (
    <Box sx={{
      borderRadius: 2.5, overflow: 'hidden',
      border: '1.5px solid #E0E7FF',
      boxShadow: '0 4px 24px rgba(79,70,229,0.10)',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
    }}>
      {/* Header bar */}
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#818CF8', flexShrink: 0,
          animation: step < 4 ? 'cvpulse 1.5s ease-in-out infinite' : 'none',
          '@keyframes cvpulse': {
            '0%,100%': { opacity: 1, transform: 'scale(1)' },
            '50%':     { opacity: 0.5, transform: 'scale(0.7)' },
          },
        }} />
        <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#fff', flex: 1 }}>
          {step < 4 ? 'Processing your CV…' : '✓ Analysis complete!'}
        </Typography>
        {step >= 4 && (
          <Button size="small" onClick={onDismiss}
            sx={{ color: '#818CF8', textTransform: 'none', fontSize: 11, minWidth: 0,
              '&:hover': { color: '#fff' } }}>
            Dismiss
          </Button>
        )}
      </Box>
      {/* Steps */}
      <Box sx={{ px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {PARSE_STEPS.map((s, i) => {
          const done    = i < step;
          const current = i === step;
          const color   = STEP_COLORS[i];
          return (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.75,
              opacity: i > step ? 0.4 : 1, transition: 'opacity 0.4s' }}>
              <Box sx={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? color : current ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.05)',
                border: done ? 'none' : current ? `2px solid ${color}` : '2px solid rgba(255,255,255,0.1)',
                transition: 'all 0.4s ease',
              }}>
                {done ? (
                  <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 800, lineHeight: 1 }}>✓</Typography>
                ) : current ? (
                  <Box sx={{ width: 12, height: 12, border: `2.5px solid ${color}`, borderTopColor: 'transparent',
                    borderRadius: '50%', animation: 'cvspin 0.8s linear infinite',
                    '@keyframes cvspin': { to: { transform: 'rotate(360deg)' } } }} />
                ) : (
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: done || current ? 700 : 500,
                  color: done ? '#fff' : current ? '#C7D2FE' : 'rgba(255,255,255,0.4)',
                  transition: 'color 0.3s' }}>
                  {s.label}
                </Typography>
                {current && (
                  <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', mt: 0.1 }}>{s.sub}</Typography>
                )}
              </Box>
              {done && (
                <Box sx={{ px: 0.75, py: 0.15, borderRadius: 0.75,
                  background: 'rgba(16,185,129,0.15)', color: '#34D399', fontSize: 9, fontWeight: 700 }}>
                  done
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
      {/* Progress bar */}
      <Box sx={{ mx: 3, mb: 2.5, height: 3, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <Box sx={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#4F46E5,#10B981)',
          width: `${Math.min(100, (step / (PARSE_STEPS.length - 1)) * 100)}%`,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
      </Box>
    </Box>
  );
}

const TIER_CONFIG = {
  high:   { label: 'Strong Match',  bg: '#ECFDF5', border: '#A7F3D0', dot: '#10B981', bar: 'linear-gradient(90deg,#10B981,#059669)' },
  medium: { label: 'Good Match',    bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B', bar: 'linear-gradient(90deg,#F59E0B,#D97706)' },
  low:    { label: 'Partial Match', bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444', bar: 'linear-gradient(90deg,#EF4444,#DC2626)' },
};

function MatchCard({ match, active, onClick, onApply, isApplied }) {
  const pct  = Math.round((match.score || 0) * 100);
  const tier = pct >= 70 ? 'high' : pct >= 45 ? 'medium' : 'low';
  const cfg  = TIER_CONFIG[tier];
  return (
    <Box onClick={onClick} sx={{
      background: '#fff', borderRadius: 2.5, p: 2.5, cursor: 'pointer',
      border: active ? '2px solid #4F46E5' : '1.5px solid rgba(0,0,0,0.07)',
      boxShadow: active ? '0 0 0 4px rgba(79,70,229,0.08)' : '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'all 0.15s ease',
      '&:hover': { boxShadow: active ? '0 0 0 4px rgba(79,70,229,0.1)' : '0 4px 16px rgba(0,0,0,0.08)', borderColor: active ? '#4F46E5' : '#818CF8' },
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, borderRadius: 1,
            fontSize: 10, fontWeight: 700, background: cfg.bg, color: cfg.dot, border: `1px solid ${cfg.border}`, mb: 0.75 }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />
            {cfg.label}
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#0F172A', mb: 0.5 }}>
            {match.job?.title || 'Job Title'}
          </Typography>
          {match.explanation && (
            <Typography sx={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, mb: 1 }}>
              {match.explanation}
            </Typography>
          )}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>Match strength</Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: cfg.dot }}>{pct}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={pct} sx={{ height: 5, borderRadius: 8,
              background: '#F1F5F9', '& .MuiLinearProgress-bar': { background: cfg.bar } }} />
          </Box>
          {(match.matchedSkills || []).length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', mt: 0.5 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 13, color: '#10B981' }} />
              {match.matchedSkills.slice(0, 4).map(s => (
                <Chip key={s} label={s} size="small" sx={{ fontSize: 10, height: 18, fontWeight: 600,
                  background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }} />
              ))}
              {match.matchedSkills.length > 4 && (
                <Typography sx={{ fontSize: 10, color: '#94A3B8' }}>+{match.matchedSkills.length - 4} more</Typography>
              )}
            </Box>
          )}
          {(match.missingSkills || []).length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', mt: 0.4 }}>
              <HighlightOffIcon sx={{ fontSize: 13, color: '#EF4444' }} />
              {match.missingSkills.slice(0, 3).map(s => (
                <Chip key={s} label={s} size="small" sx={{ fontSize: 10, height: 18, fontWeight: 600,
                  background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }} />
              ))}
            </Box>
          )}
        </Box>
        <CircularScore score={match.score || 0} size={72} strokeWidth={6} />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}
           onClick={e => e.stopPropagation()}>
        {isApplied ? (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5,
            px: 1.25, py: 0.4, borderRadius: 1.5, fontSize: 11, fontWeight: 700,
            background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
            ✓ Applied
          </Box>
        ) : (
          <Button size="small" variant="contained"
            onClick={() => onApply && onApply(match)}
            sx={{ textTransform: 'none', fontWeight: 700, fontSize: 11,
              borderRadius: 1.5, py: 0.5, px: 2,
              background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
              '&:hover': { background: 'linear-gradient(135deg,#4338CA,#6D28D9)' } }}>
            Apply
          </Button>
        )}
      </Box>
    </Box>
  );
}

// ─── Sticky CV Panel ────────────────────────────────────────────────
function CVPanel({ resumes, uploading, onUploadClick, onDelete, selectedMatch, selectedResumeId, onResumeSelect }) {
  const [expanded, setExpanded] = useState(true);

  const selectedIdx = Math.max(0, resumes.findIndex(r => r._id === selectedResumeId));
  const resume = resumes[selectedIdx] || null;
  const skills = resume?.parsedProfile?.skills || [];
  const rawText = resume?.parsedProfile?.rawText || '';

  const matchedSkills = selectedMatch?.matchedSkills || [];
  const missingSkills = selectedMatch?.missingSkills || [];

  const statusIcon  = s => s === 'completed' ? <TaskAltIcon sx={{ fontSize: 12 }} />
    : s === 'failed' ? <ErrorOutlineIcon sx={{ fontSize: 12 }} />
    : <PendingIcon sx={{ fontSize: 12 }} />;
  const statusColor = s => s === 'completed' ? '#059669' : s === 'failed' ? '#DC2626' : '#D97706';
  const statusBg    = s => s === 'completed' ? '#ECFDF5' : s === 'failed' ? '#FEF2F2' : '#FEF3C7';

  return (
    <Box sx={{
      position: 'sticky', top: 24,
      background: '#fff', borderRadius: 3,
      border: '1.5px solid #E2E8F0',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      maxHeight: 'calc(100vh - 48px)',
      display: 'flex', flexDirection: 'column',
    }}>
      <Box sx={{
        px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #F1F5F9',
        background: 'linear-gradient(135deg, #0F172A, #1E1B4B)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 1.5,
            background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <InsertDriveFileOutlinedIcon sx={{ color: '#818CF8', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>Your CV</Typography>
            <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              {resumes.length} file{resumes.length !== 1 ? 's' : ''} uploaded
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Upload new CV">
          <IconButton size="small" onClick={onUploadClick} disabled={uploading}
            sx={{ background: 'rgba(255,255,255,0.1)', color: '#818CF8',
              '&:hover': { background: 'rgba(255,255,255,0.18)' } }}>
            {uploading
              ? <MuiCircularProgress size={14} sx={{ color: '#818CF8' }} />
              : <FileUploadIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { background: '#E2E8F0', borderRadius: 4 } }}>

        {resumes.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 2, mx: 'auto', mb: 1.5,
              background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CloudUploadOutlinedIcon sx={{ color: '#CBD5E1', fontSize: 28 }} />
            </Box>
            <Typography sx={{ fontWeight: 600, fontSize: 13, color: '#94A3B8', mb: 0.5 }}>No CV uploaded</Typography>
            <Typography sx={{ fontSize: 12, color: '#CBD5E1', mb: 2 }}>Upload to see your skills here</Typography>
            <Button size="small" variant="outlined" onClick={onUploadClick}
              startIcon={<FileUploadIcon />}
              sx={{ textTransform: 'none', borderRadius: 2, fontSize: 12, borderColor: '#C7D2FE', color: '#4F46E5',
                '&:hover': { background: '#EEF2FF', borderColor: '#818CF8' } }}>
              Upload CV
            </Button>
          </Box>
        ) : (
          <>
            {resumes.length > 1 && (
              <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                  Select CV
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {resumes.map((r, i) => (
                    <Box key={r._id} onClick={() => onResumeSelect && onResumeSelect(r._id)}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1, p: 1.25, borderRadius: 1.5, cursor: 'pointer',
                        background: selectedIdx === i ? '#EEF2FF' : '#F8FAFC',
                        border: `1.5px solid ${selectedIdx === i ? '#C7D2FE' : '#F1F5F9'}`,
                        transition: 'all 0.1s',
                      }}>
                      <DescriptionOutlinedIcon sx={{ fontSize: 14, color: selectedIdx === i ? '#4F46E5' : '#94A3B8', flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: selectedIdx === i ? '#4F46E5' : '#64748B',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {r.filename}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Divider sx={{ mt: 1.5 }} />
              </Box>
            )}

            {resume && (
              <Box sx={{ px: 2.5, pt: resumes.length > 1 ? 1 : 2, pb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, pb: 2, borderBottom: '1px solid #F1F5F9' }}>
                  <Box sx={{ width: 40, height: 48, borderRadius: 1.5, background: '#EEF2FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    position: 'relative' }}>
                    <DescriptionOutlinedIcon sx={{ color: '#4F46E5', fontSize: 24 }} />
                    <Box sx={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14,
                      borderRadius: '50%', background: statusBg(resume.status),
                      border: '1.5px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: statusColor(resume.status) }}>
                      {statusIcon(resume.status)}
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 12, color: '#0F172A',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {resume.filename}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: '#94A3B8', mt: 0.25 }}>
                      {new Date(resume.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Typography>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 1, py: 0.2, mt: 0.5,
                      borderRadius: 1, background: statusBg(resume.status), color: statusColor(resume.status), fontSize: 10, fontWeight: 700 }}>
                      {statusIcon(resume.status)}
                      {resume.status === 'completed' ? 'Parsed' : resume.status}
                    </Box>
                  </Box>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => onDelete(resume)}
                      sx={{ color: '#CBD5E1', '&:hover': { color: '#EF4444', background: '#FEF2F2' } }}>
                      <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                {selectedMatch && (matchedSkills.length > 0 || missingSkills.length > 0) && (
                  <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid #F1F5F9' }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase',
                      letterSpacing: '0.08em', mb: 1 }}>
                      For: {selectedMatch.job?.title}
                    </Typography>
                    {matchedSkills.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <CheckCircleOutlineIcon sx={{ fontSize: 12, color: '#10B981' }} />
                          <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#10B981' }}>
                            {matchedSkills.length} matched
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {matchedSkills.map(s => (
                            <Chip key={s} label={s} size="small" sx={{ fontSize: 9, height: 18, fontWeight: 600,
                              background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }} />
                          ))}
                        </Box>
                      </Box>
                    )}
                    {missingSkills.length > 0 && (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <HighlightOffIcon sx={{ fontSize: 12, color: '#EF4444' }} />
                          <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#EF4444' }}>
                            {missingSkills.length} missing
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {missingSkills.map(s => (
                            <Chip key={s} label={s} size="small" sx={{ fontSize: 9, height: 18, fontWeight: 600,
                              background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }} />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}

                {skills.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        All Skills Detected
                      </Typography>
                      <Chip label={skills.length} size="small"
                        sx={{ fontSize: 10, height: 18, background: '#EEF2FF', color: '#4F46E5', fontWeight: 700 }} />
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {skills.map(s => {
                        const isMatched = matchedSkills.includes(s);
                        return (
                          <Chip key={s} label={s} size="small" sx={{
                            fontSize: 9, height: 20, fontWeight: 600,
                            background: isMatched ? '#ECFDF5' : '#EEF2FF',
                            color: isMatched ? '#059669' : '#4F46E5',
                            border: isMatched ? '1px solid #A7F3D0' : '1px solid #C7D2FE',
                          }} />
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {rawText && rawText.length > 10 && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, cursor: 'pointer' }}
                      onClick={() => setExpanded(e => !e)}>
                      <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        CV Text Preview
                      </Typography>
                      {expanded ? <ExpandLessIcon sx={{ fontSize: 14, color: '#94A3B8' }} /> : <ExpandMoreIcon sx={{ fontSize: 14, color: '#94A3B8' }} />}
                    </Box>
                    {expanded && (
                      <Box sx={{
                        p: 1.5, borderRadius: 1.5, background: '#F8FAFC', border: '1px solid #E2E8F0',
                        fontSize: 11, color: '#64748B', lineHeight: 1.6,
                        maxHeight: 180, overflowY: 'auto', fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        '&::-webkit-scrollbar': { width: 3 },
                        '&::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 4 },
                      }}>
                        {rawText.slice(0, 800)}{rawText.length > 800 ? '…' : ''}
                      </Box>
                    )}
                  </Box>
                )}

                {skills.length === 0 && resume.status === 'completed' && (
                  <Box sx={{ p: 1.5, borderRadius: 1.5, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                    <Typography sx={{ fontSize: 11, color: '#D97706' }}>
                      ⚠ No skills were extracted. Try re-uploading your CV.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

export default function CandidateDashboard({ view }) {
  const dispatch = useDispatch();
  const { user }      = useSelector(s => s.auth);
  const { myMatches } = useSelector(s => s.matches);
  const fileRef     = useRef();
  const parsePollRef = useRef(null);

  const [dragging,      setDragging]      = useState(false);
  const [dragInvalid,   setDragInvalid]   = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [parseStep,     setParseStep]     = useState(-1);   // -1 = hidden
  const [myResumes,     setMyResumes]     = useState([]);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleting,      setDeleting]      = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedCVId,  setSelectedCVId]  = useState(null);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const isResumeView = view === 'resume';

  const loadResumes = () =>
    api.get('/resumes/my').then(r => setMyResumes(r.data || [])).catch(() => {});

  const loadApplied = () =>
    api.get('/applications/my').then(r => {
      setAppliedJobIds(new Set((r.data || []).map(a => a.job?._id || a.job)));
    }).catch(() => {});

  useEffect(() => { dispatch(fetchMyMatches()); loadResumes(); loadApplied(); }, []);

  useEffect(() => {
    if (selectedCVId) dispatch(fetchMyMatches(selectedCVId));
    else dispatch(fetchMyMatches());
    setSelectedMatch(null);
  }, [selectedCVId]);

  useEffect(() => {
    if (myMatches.length && !selectedMatch) setSelectedMatch(myMatches[0]);
  }, [myMatches]);

  // Cleanup poll on unmount
  useEffect(() => () => { if (parsePollRef.current) clearInterval(parsePollRef.current); }, []);

  const doUpload = async file => {
    if (!file) return;
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPDF) {
      toast.error('Only PDF files are supported — please convert your document to PDF first', { duration: 4500 });
      return;
    }
    setUploading(true);
    setParseStep(0);  // Step 0: Uploading
    const fd = new FormData();
    fd.append('resume', file);
    let newResumeId = null;
    try {
      const resp = await api.post('/resumes/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      newResumeId = resp.data?._id;

      // Advance steps 0→1→2→3 on a timer while real processing happens
      const delays = [600, 1800, 1800];
      let elapsed = 0;
      delays.forEach((delay, idx) => {
        elapsed += delay;
        setTimeout(() => setParseStep(prev => (prev <= idx + 1 ? idx + 1 : prev)), elapsed);
      });

      // Poll for actual completion
      if (parsePollRef.current) clearInterval(parsePollRef.current);
      parsePollRef.current = setInterval(async () => {
        try {
          const { data } = await api.get('/resumes/my');
          const target = newResumeId
            ? data.find(r => r._id === newResumeId)
            : data.find(r => r.status !== 'completed' && r.status !== 'failed');
          if (!target || target.status === 'completed' || target.status === 'failed') {
            clearInterval(parsePollRef.current);
            setMyResumes(data || []);
            setParseStep(4);          // Step 4: Complete
            dispatch(fetchMyMatches());
            setTimeout(() => setParseStep(-1), 3000);  // auto-dismiss after 3s
          }
        } catch {}
      }, 2500);

    } catch {
      setParseStep(-1);
      toast.error('Upload failed — try again');
    } finally {
      setUploading(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/resumes/${deleteTarget._id}`);
      setMyResumes(prev => prev.filter(r => r._id !== deleteTarget._id));
      dispatch(fetchMyMatches());
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  };

  const handleApply = async (match) => {
    try {
      await api.post('/applications', { jobId: match.job?._id });
      setAppliedJobIds(prev => new Set([...prev, match.job?._id]));
      toast.success('Application submitted!');
    } catch (err) {
      if (err?.response?.status === 409) toast.error('Already applied to this job');
      else toast.error('Could not apply — try again');
    }
  };

  const onFile      = e => doUpload(e.target.files[0]);
  const onDrop      = e => {
    e.preventDefault(); setDragging(false); setDragInvalid(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are supported', { duration: 3500 });
      return;
    }
    doUpload(file);
  };
  const onDragOver  = e => {
    e.preventDefault();
    const item = e.dataTransfer.items?.[0];
    const invalid = item && item.type !== 'application/pdf';
    setDragging(!invalid); setDragInvalid(!!invalid);
  };
  const onDragLeave = () => { setDragging(false); setDragInvalid(false); };

  const bestMatch  = myMatches.length ? Math.max(...myMatches.map(m => Math.round((m.score || 0) * 100))) : 0;
  const avgMatch   = myMatches.length ? Math.round(myMatches.reduce((a, m) => a + (m.score || 0), 0) / myMatches.length * 100) : 0;
  const strongOnes = myMatches.filter(m => (m.score || 0) >= 0.7).length;
  const hour       = new Date().getHours();
  const greeting   = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const UploadZone = ({ compact = false }) => (
    <Box
      onClick={() => !uploading && fileRef.current.click()}
      onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
      sx={{
        p: compact ? 2 : 3, borderRadius: 2.5, transition: 'all 0.2s ease', cursor: uploading ? 'default' : 'pointer',
        border: `2px dashed ${dragInvalid ? '#EF4444' : dragging ? '#4F46E5' : '#CBD5E1'}`,
        background: dragInvalid ? 'rgba(254,242,242,0.8)' : dragging ? '#EEF2FF' : '#F8FAFC',
        '&:hover': uploading ? {} : { borderColor: dragInvalid ? '#EF4444' : '#818CF8', background: dragInvalid ? 'rgba(254,242,242,0.9)' : '#EEF2FF' },
      }}
    >
      <input ref={fileRef} type="file" hidden accept=".pdf" onChange={onFile} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? 1.5 : 2 }}>

        {/* Icon with PDF badge */}
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Box sx={{
            width: compact ? 40 : 50, height: compact ? 40 : 50, borderRadius: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: dragInvalid ? '#FEE2E2' : dragging ? '#EEF2FF' : '#F1F5F9',
            transition: 'background 0.2s',
          }}>
            <CloudUploadOutlinedIcon sx={{
              fontSize: compact ? 22 : 27,
              color: dragInvalid ? '#EF4444' : dragging ? '#4F46E5' : '#94A3B8',
              transition: 'color 0.2s',
            }} />
          </Box>
          {!dragInvalid && (
            <Box sx={{
              position: 'absolute', bottom: -3, right: -7,
              px: 0.7, py: 0.15, borderRadius: 0.75,
              background: '#DC2626', color: '#fff',
              fontSize: 8, fontWeight: 900, letterSpacing: '0.04em', lineHeight: 1.5,
            }}>PDF</Box>
          )}
        </Box>

        {/* Text content */}
        <Box sx={{ flex: 1, textAlign: 'left' }}>
          {dragInvalid ? (
            <>
              <Typography sx={{ fontWeight: 700, fontSize: compact ? 13 : 14, color: '#DC2626' }}>
                PDF files only
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#F87171', mt: 0.25 }}>
                Word, images and other formats are not supported
              </Typography>
            </>
          ) : dragging ? (
            <>
              <Typography sx={{ fontWeight: 700, fontSize: compact ? 13 : 14, color: '#4F46E5' }}>
                Drop your PDF here
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#818CF8', mt: 0.25 }}>Release to start uploading</Typography>
            </>
          ) : (
            <>
              <Typography sx={{ fontWeight: 700, fontSize: compact ? 13 : 14, color: '#0F172A' }}>
                Upload your CV
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.3 }}>
                <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>PDF only · Max 10MB</Typography>
                <Tooltip
                  title="Word (.docx) and other formats are not supported. Please save your CV as a PDF for accurate AI parsing."
                  arrow placement="top"
                  componentsProps={{ tooltip: { sx: { fontSize: 11, maxWidth: 230 } } }}
                >
                  <Box component="span" sx={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
                    background: '#E2E8F0', color: '#94A3B8', fontSize: 9, fontWeight: 800,
                    cursor: 'help', userSelect: 'none', lineHeight: 1,
                    '&:hover': { background: '#C7D2FE', color: '#4F46E5' },
                    transition: 'all 0.15s',
                  }}>?</Box>
                </Tooltip>
              </Box>
            </>
          )}
        </Box>

        {/* Browse button */}
        {!uploading && !dragInvalid && !dragging && (
          <Box sx={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 0.6,
            px: 1.75, py: 0.85, borderRadius: 1.75,
            background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
            color: '#fff', fontSize: 12, fontWeight: 700,
            boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
          }}>
            <CloudUploadOutlinedIcon sx={{ fontSize: 14 }} /> Browse
          </Box>
        )}
      </Box>
    </Box>
  );

  // ─── STATUS HELPERS (resume view) ─────────────────────────────
  const statusIcon  = s => s === 'completed' ? <TaskAltIcon sx={{ fontSize: 14 }} />
    : s === 'failed' ? <ErrorOutlineIcon sx={{ fontSize: 14 }} />
    : <PendingIcon sx={{ fontSize: 14 }} />;
  const statusColor = s => s === 'completed' ? '#059669' : s === 'failed' ? '#DC2626' : '#D97706';
  const statusBg    = s => s === 'completed' ? '#ECFDF5' : s === 'failed' ? '#FEF2F2' : '#FEF3C7';

  if (isResumeView) {
    return (
      <Layout>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>My Resume</Typography>
            <Typography sx={{ color: '#64748B', mt: 0.5, fontSize: 14 }}>
              Upload and manage your CVs · AI extracts skills automatically
            </Typography>
          </Box>
          <Box sx={{ mb: 3 }}>
            {parseStep >= 0
              ? <ParseProgress step={parseStep} onDismiss={() => setParseStep(-1)} />
              : <UploadZone />}
          </Box>
          {myResumes.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>Uploaded CVs</Typography>
                <Chip label={`${myResumes.length} file${myResumes.length !== 1 ? 's' : ''}`}
                  sx={{ background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: 12 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {myResumes.map(r => {
                  const skills = r.parsedProfile?.skills || [];
                  return (
                    <Box key={r._id} sx={{ background: '#fff', border: '1.5px solid #E2E8F0',
                      borderRadius: 2.5, p: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: skills.length ? 2 : 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ width: 44, height: 52, borderRadius: 1.5, background: '#EEF2FF',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            border: '1.5px solid #C7D2FE', position: 'relative' }}>
                            <DescriptionOutlinedIcon sx={{ color: '#4F46E5', fontSize: 24 }} />
                            <Box sx={{ position: 'absolute', bottom: -5, right: -5, width: 16, height: 16,
                              borderRadius: '50%', background: statusBg(r.status), border: '2px solid #fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: statusColor(r.status), boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                              {statusIcon(r.status)}
                            </Box>
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{r.filename}</Typography>
                            <Typography sx={{ fontSize: 12, color: '#94A3B8', mt: 0.25 }}>
                              Uploaded {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.3, mt: 0.75,
                              borderRadius: 1.5, background: statusBg(r.status), color: statusColor(r.status), fontSize: 11, fontWeight: 700 }}>
                              {statusIcon(r.status)} {r.status === 'completed' ? 'Parsed Successfully' : r.status}
                            </Box>
                          </Box>
                        </Box>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => setDeleteTarget(r)}
                            sx={{ color: '#CBD5E1', '&:hover': { color: '#EF4444', background: '#FEF2F2' } }}>
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      {skills.length > 0 && (
                        <Box>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', mb: 1,
                            textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Extracted Skills ({skills.length})
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            {skills.map(sk => (
                              <Chip key={sk} label={sk} size="small" sx={{ fontSize: 11, height: 24,
                                fontWeight: 600, background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }} />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
          <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth
            PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
            <DialogTitle sx={{ fontWeight: 700 }}>Delete Resume?</DialogTitle>
            <DialogContent>
              <Typography sx={{ color: '#64748B', fontSize: 14 }}>
                This will permanently delete <strong>{deleteTarget?.filename}</strong> and all match results.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button onClick={() => setDeleteTarget(null)} sx={{ color: '#64748B', textTransform: 'none' }}>Cancel</Button>
              <Button onClick={doDelete} disabled={deleting} variant="contained" color="error"
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Layout>
    );
  }

  // ─── MATCHES VIEW ─────────────────────────────────────────────
  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </Typography>
          <Typography sx={{ color: '#64748B', mt: 0.25, fontSize: 14 }}>
            AI-powered job matches ranked by semantic similarity
          </Typography>
        </Box>

        {myMatches.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}><StatCard icon={<AutoAwesomeIcon />} label="Total Matches" value={myMatches.length} color="#4F46E5" bgColor="#EEF2FF" /></Grid>
            <Grid item xs={6} sm={3}><StatCard icon={<TrendingUpIcon />} label="Best Match" value={`${bestMatch}%`} color="#10B981" bgColor="#ECFDF5" /></Grid>
            <Grid item xs={6} sm={3}><StatCard icon={<CheckCircleOutlineIcon />} label="Strong Matches" value={strongOnes} color="#7C3AED" bgColor="#F5F3FF" sub="≥70%" /></Grid>
            <Grid item xs={6} sm={3}><StatCard icon={<DescriptionOutlinedIcon />} label="Avg Score" value={avgMatch ? `${avgMatch}%` : '—'} color="#F59E0B" bgColor="#FFFBEB" /></Grid>
          </Grid>
        )}

        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          {/* LEFT — Matches */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ mb: 3 }}>
              {parseStep >= 0
                ? <ParseProgress step={parseStep} onDismiss={() => setParseStep(-1)} />
                : <UploadZone compact />}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>Your Job Matches</Typography>
                <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>
                  {selectedMatch ? 'Click a card to see skill breakdown in CV panel →' : 'Ranked by AI semantic similarity'}
                </Typography>
              </Box>
              {myMatches.length > 0 && (
                <Chip label={`${myMatches.length} match${myMatches.length !== 1 ? 'es' : ''}`}
                  sx={{ background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: 12 }} />
              )}
            </Box>

            {myMatches.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, background: '#fff', borderRadius: 3, border: '1.5px solid #E2E8F0' }}>
                <AutoAwesomeIcon sx={{ fontSize: 44, color: '#CBD5E1', mb: 1.5 }} />
                <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#94A3B8', mb: 0.5 }}>No matches yet</Typography>
                <Typography sx={{ fontSize: 13, color: '#CBD5E1', maxWidth: 300, mx: 'auto' }}>
                  Upload your resume above and our AI will match you to active job listings
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {myMatches.map(m => (
                  <MatchCard key={m._id} match={m}
                    active={selectedMatch?._id === m._id}
                    onClick={() => setSelectedMatch(m)}
                    onApply={handleApply}
                    isApplied={appliedJobIds.has(m.job?._id)} />
                ))}
              </Box>
            )}
          </Box>

          {/* RIGHT — CV panel */}
          <Box sx={{ width: 300, flexShrink: 0, display: { xs: 'none', lg: 'block' } }}>
            <CVPanel
              resumes={myResumes}
              uploading={uploading}
              onUploadClick={() => fileRef.current.click()}
              onDelete={r => setDeleteTarget(r)}
              selectedMatch={selectedMatch}
              selectedResumeId={selectedCVId || myResumes[0]?._id}
              onResumeSelect={id => setSelectedCVId(id)}
            />
          </Box>
        </Box>

        <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete Resume?</DialogTitle>
          <DialogContent>
            <Typography sx={{ color: '#64748B', fontSize: 14 }}>
              This will permanently delete <strong>{deleteTarget?.filename}</strong> and all match results.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setDeleteTarget(null)} sx={{ color: '#64748B', textTransform: 'none' }}>Cancel</Button>
            <Button onClick={doDelete} disabled={deleting} variant="contained" color="error"
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
}
