import { Box, Typography } from '@mui/material';

const COLORS = {
  high:   { stroke: '#10B981', bg: '#ECFDF5', text: '#059669' },
  medium: { stroke: '#F59E0B', bg: '#FFFBEB', text: '#D97706' },
  low:    { stroke: '#EF4444', bg: '#FEF2F2', text: '#DC2626' },
};

export default function CircularScore({ score = 0, size = 80, strokeWidth = 7, label = 'Match' }) {
  const pct    = Math.round(score * 100);
  const tier   = pct >= 70 ? 'high' : pct >= 45 ? 'medium' : 'low';
  const c      = COLORS[tier];
  const r      = (size - strokeWidth) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth}
        />
        {/* progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={c.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {/* Center text */}
      <Box sx={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <Typography sx={{ fontWeight: 800, fontSize: size * 0.22, lineHeight: 1, color: c.text }}>
          {pct}%
        </Typography>
        <Typography sx={{ fontSize: size * 0.13, color: '#94A3B8', lineHeight: 1, fontWeight: 500 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}
