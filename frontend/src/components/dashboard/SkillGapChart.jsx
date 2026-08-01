import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { Box, Typography } from '@mui/material';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      background: '#0F172A', borderRadius: 2, px: 2, py: 1.25,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    }}>
      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 13, mb: 0.5 }}>{label}</Typography>
      {payload.map(p => (
        <Box key={p.dataKey} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
            {p.name}: <strong style={{ color: '#fff' }}>{p.value}%</strong>
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default function SkillGapChart({ matchedSkills = [], missingSkills = [] }) {
  // Merge both skill lists into radar points
  const allSkills = [
    ...matchedSkills.slice(0, 5).map(s => ({ skill: s, Matched: 100, Missing: 0 })),
    ...missingSkills.slice(0, 3).map(s => ({ skill: s, Matched: 0,   Missing: 85 })),
  ];
  if (!allSkills.length) return (
    <Typography sx={{ color: '#94A3B8', fontSize: 13 }}>No skill data available</Typography>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
          Skill Coverage Radar
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
            <Typography sx={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
              Matched ({matchedSkills.length})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
            <Typography sx={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
              Missing ({missingSkills.length})
            </Typography>
          </Box>
        </Box>
      </Box>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={allSkills} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500, fontFamily: 'Plus Jakarta Sans' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Matched"
            dataKey="Matched"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Radar
            name="Missing"
            dataKey="Missing"
            stroke="#EF4444"
            fill="#EF4444"
            fillOpacity={0.18}
            strokeWidth={2}
            strokeDasharray="4 2"
          />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
}
