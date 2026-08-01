import { useState } from 'react';
import { Box, Typography, Chip, Collapse, IconButton } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AutoAwesomeIcon       from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon       from '@mui/icons-material/HighlightOff';
import CircularScore from './CircularScore';
import SkillGapChart from './SkillGapChart';

const RANK_STYLES = {
  1: { label: '1st', bg: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff', ring: '#F59E0B' },
  2: { label: '2nd', bg: 'linear-gradient(135deg, #94A3B8, #64748B)', color: '#fff', ring: '#94A3B8' },
  3: { label: '3rd', bg: 'linear-gradient(135deg, #CD7C2F, #9A5B1E)', color: '#fff', ring: '#CD7C2F' },
};

export default function CandidateCard({ match, rank }) {
  const [open, setOpen] = useState(false);
  const rankStyle = RANK_STYLES[rank];

  return (
    <Box sx={{
      background: '#fff',
      border: open ? '1.5px solid #4F46E5' : '1px solid rgba(0,0,0,0.07)',
      borderRadius: 3,
      mb: 1.5,
      overflow: 'hidden',
      boxShadow: open ? '0 4px 20px rgba(79,70,229,0.12)' : '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'all 0.2s ease',
    }}>
      {/* Main row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>

        {/* Rank badge */}
        <Box sx={{
          flexShrink: 0, width: 44, height: 44, borderRadius: 2,
          background: rankStyle ? rankStyle.bg : '#F1F5F9',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: rankStyle ? `0 2px 8px ${rankStyle.ring}44` : 'none',
        }}>
          <Typography sx={{
            fontSize: rankStyle ? 11 : 13,
            fontWeight: 800,
            color: rankStyle ? rankStyle.color : '#64748B',
            lineHeight: 1,
          }}>
            {rankStyle ? rankStyle.label : `#${rank}`}
          </Typography>
          {!rankStyle && (
            <Typography sx={{ fontSize: 9, color: '#94A3B8', lineHeight: 1 }}>rank</Typography>
          )}
        </Box>

        {/* Name & email */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#0F172A', lineHeight: 1.2 }}>
            {match.candidate?.name || 'Candidate'}
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#94A3B8', mt: 0.25 }}>
            {match.candidate?.email}
          </Typography>
          {/* Quick skill pills */}
          {(match.matchedSkills || []).length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75, flexWrap: 'wrap' }}>
              {(match.matchedSkills || []).slice(0, 3).map(s => (
                <Chip key={s} label={s} size="small" sx={{
                  fontSize: 11, height: 20, fontWeight: 600,
                  background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0',
                }} />
              ))}
              {(match.matchedSkills || []).length > 3 && (
                <Chip label={`+${match.matchedSkills.length - 3}`} size="small" sx={{
                  fontSize: 11, height: 20, fontWeight: 600,
                  background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE',
                }} />
              )}
            </Box>
          )}
        </Box>

        {/* Score ring */}
        <CircularScore score={match.score || 0} size={72} strokeWidth={6} />

        {/* Expand toggle */}
        <IconButton
          size="small" onClick={() => setOpen(o => !o)}
          sx={{
            color: '#94A3B8',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            '&:hover': { color: '#4F46E5', background: '#EEF2FF' },
          }}
        >
          <KeyboardArrowDownIcon />
        </IconButton>
      </Box>

      {/* Expandable section */}
      <Collapse in={open}>
        <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.06)', mx: 2, pt: 2, pb: 2.5 }}>

          {/* AI Explanation */}
          {match.explanation && (
            <Box sx={{
              display: 'flex', gap: 1.5, mb: 2.5,
              background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)',
              borderRadius: 2.5, p: 2,
              border: '1px solid #C7D2FE',
            }}>
              <AutoAwesomeIcon sx={{ color: '#4F46E5', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  AI Analysis
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#3730A3', lineHeight: 1.6 }}>
                  {match.explanation}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Matched / Missing skills */}
          <Box sx={{ display: 'flex', gap: 3, mb: 2.5, flexWrap: 'wrap' }}>
            {(match.matchedSkills || []).length > 0 && (
              <Box sx={{ flex: 1, minWidth: 180 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                  <CheckCircleOutlineIcon sx={{ color: '#10B981', fontSize: 16 }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
                    Matched Skills ({match.matchedSkills.length})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {match.matchedSkills.map(s => (
                    <Chip key={s} label={s} size="small" sx={{
                      fontSize: 11, height: 22, fontWeight: 600,
                      background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0',
                    }} />
                  ))}
                </Box>
              </Box>
            )}
            {(match.missingSkills || []).length > 0 && (
              <Box sx={{ flex: 1, minWidth: 180 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                  <HighlightOffIcon sx={{ color: '#EF4444', fontSize: 16 }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>
                    Missing Skills ({match.missingSkills.length})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {match.missingSkills.map(s => (
                    <Chip key={s} label={s} size="small" sx={{
                      fontSize: 11, height: 22, fontWeight: 600,
                      background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
                    }} />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* Radar chart */}
          <SkillGapChart matchedSkills={match.matchedSkills} missingSkills={match.missingSkills} />
        </Box>
      </Collapse>
    </Box>
  );
}
