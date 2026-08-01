import { Box, Typography } from '@mui/material';

export default function StatCard({ icon, label, value, sub, color = '#4F46E5', bgColor = '#EEF2FF' }) {
  return (
    <Box sx={{
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 3,
      p: 2.5,
      display: 'flex', alignItems: 'center', gap: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'box-shadow 0.2s, transform 0.2s',
      '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transform: 'translateY(-1px)' },
    }}>
      <Box sx={{
        width: 46, height: 46, borderRadius: 2.5, flexShrink: 0,
        background: bgColor, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        '& svg': { fontSize: 24 },
      }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#64748B', mt: 0.25 }}>
          {label}
        </Typography>
        {sub && (
          <Typography sx={{ fontSize: 11, color: '#94A3B8', mt: 0.25 }}>{sub}</Typography>
        )}
      </Box>
    </Box>
  );
}
