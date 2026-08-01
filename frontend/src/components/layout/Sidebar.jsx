import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Avatar, Tooltip } from '@mui/material';
import AutoAwesomeIcon    from '@mui/icons-material/AutoAwesome';
import DashboardIcon      from '@mui/icons-material/DashboardOutlined';
import WorkIcon           from '@mui/icons-material/WorkOutlined';
import PeopleIcon         from '@mui/icons-material/PeopleOutlined';
import DescriptionIcon    from '@mui/icons-material/DescriptionOutlined';
import BarChartIcon       from '@mui/icons-material/BarChartOutlined';
import LogoutIcon         from '@mui/icons-material/LogoutOutlined';
import { logout } from '../../features/auth/authSlice';

const RECRUITER_NAV = [
  { icon: <DashboardIcon />, label: 'Dashboard',  path: '/recruiter' },
  { icon: <WorkIcon />,      label: 'Jobs',       path: '/recruiter' },
  { icon: <PeopleIcon />,    label: 'Candidates', path: '/recruiter' },
  { icon: <BarChartIcon />,  label: 'Analytics',  path: '/recruiter' },
];

const CANDIDATE_NAV = [
  { icon: <DashboardIcon />,   label: 'My Matches', path: '/candidate' },
  { icon: <DescriptionIcon />, label: 'My Resume',  path: '/candidate' },
];

function NavItem({ icon, label, active, onClick }) {
  return (
    <Tooltip title={label} placement="right" arrow>
      <Box
        onClick={onClick}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          px: 2, py: 1.25, borderRadius: 2, cursor: 'pointer',
          color: active ? '#fff' : 'rgba(255,255,255,0.45)',
          background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
          transition: 'all 0.15s ease',
          '&:hover': {
            color: active ? '#fff' : 'rgba(255,255,255,0.85)',
            background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
          },
          position: 'relative',
          '&::before': active ? {
            content: '""', position: 'absolute', left: 0, top: '20%', bottom: '20%',
            width: 3, borderRadius: '0 2px 2px 0',
            background: 'linear-gradient(180deg, #818CF8, #A78BFA)',
          } : {},
        }}
      >
        <Box sx={{ fontSize: 20, display: 'flex', alignItems: 'center', '& svg': { fontSize: 20 } }}>
          {icon}
        </Box>
        <Typography sx={{ fontSize: 14, fontWeight: active ? 600 : 500, lineHeight: 1 }}>
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

export default function Sidebar() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useSelector(s => s.auth);

  const nav = user?.role === 'recruiter' ? RECRUITER_NAV : CANDIDATE_NAV;
  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Box sx={{
      width: 220, minHeight: '100vh', flexShrink: 0,
      background: '#0F172A',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Logo */}
      <Box sx={{ px: 3, pt: 3.5, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: 1.5,
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Typography sx={{
            color: '#fff', fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            RecruitAI
          </Typography>
        </Box>
        <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, mt: 0.75, pl: 0.25 }}>
          {user?.role === 'recruiter' ? 'Recruiter Portal' : 'Candidate Portal'}
        </Typography>
      </Box>

      {/* Divider */}
      <Box sx={{ mx: 2.5, height: '1px', background: 'rgba(255,255,255,0.07)', mb: 1.5 }} />

      {/* Navigation */}
      <Box sx={{ px: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography sx={{ px: 1.5, mb: 1, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
          {user?.role === 'recruiter' ? 'Recruitment' : 'My Portal'}
        </Typography>
        {nav.map(item => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            active={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
      </Box>

      {/* Bottom: user + logout */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, px: 0.5 }}>
          <Avatar sx={{
            width: 34, height: 34, fontSize: 13, fontWeight: 700,
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
          }}>
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 13, lineHeight: 1.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 11,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </Typography>
          </Box>
        </Box>
        <Box
          onClick={() => dispatch(logout())}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.1,
            borderRadius: 2, cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
            transition: 'all 0.15s',
            '&:hover': { color: '#EF4444', background: 'rgba(239,68,68,0.1)' },
          }}
        >
          <LogoutIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Sign out</Typography>
        </Box>
      </Box>
    </Box>
  );
}
