import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Avatar, Tooltip, Drawer, IconButton, useMediaQuery, useTheme,
} from '@mui/material';
import MenuIcon          from '@mui/icons-material/Menu';
import AutoAwesomeIcon   from '@mui/icons-material/AutoAwesome';
import DashboardIcon     from '@mui/icons-material/DashboardOutlined';
import WorkIcon          from '@mui/icons-material/WorkOutlined';
import PeopleIcon        from '@mui/icons-material/PeopleOutlined';
import DescriptionIcon   from '@mui/icons-material/DescriptionOutlined';
import BarChartIcon      from '@mui/icons-material/BarChartOutlined';
import AdminPanelIcon    from '@mui/icons-material/AdminPanelSettingsOutlined';
import GroupIcon         from '@mui/icons-material/GroupOutlined';
import AccountTreeIcon    from '@mui/icons-material/AccountTreeOutlined';
import AssignmentIcon     from '@mui/icons-material/AssignmentOutlined';
import LogoutIcon        from '@mui/icons-material/LogoutOutlined';
import CloseIcon         from '@mui/icons-material/Close';
import { logout } from '../../features/auth/authSlice';
import NotificationBell from './NotificationBell';

const RECRUITER_NAV = [
  { icon: <DashboardIcon />, label: 'Dashboard',  path: '/recruiter' },
  { icon: <WorkIcon />,      label: 'Jobs',        path: '/recruiter/jobs' },
  { icon: <PeopleIcon />,    label: 'Candidates',  path: '/recruiter/candidates' },
  { icon: <BarChartIcon />,  label: 'Analytics',   path: '/recruiter/analytics' },
  { icon: <AccountTreeIcon />, label: 'Pipeline',    path: '/recruiter/pipeline' },
];
const CANDIDATE_NAV = [
  { icon: <DashboardIcon />,   label: 'My Matches', path: '/candidate' },
  { icon: <DescriptionIcon />, label: 'My Resume',    path: '/candidate/resume' },
  { icon: <AssignmentIcon />,  label: 'Applications', path: '/candidate/applications' },
];
const ADMIN_NAV = [
  { icon: <AdminPanelIcon />, label: 'Dashboard', path: '/admin' },
  { icon: <GroupIcon />,      label: 'Users',     path: '/admin/users' },
  { icon: <WorkIcon />,       label: 'All Jobs',  path: '/admin/jobs' },
  { icon: <BarChartIcon />,   label: 'Stats',     path: '/admin/stats' },
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

function SidebarContent({ onNavigate, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user }  = useSelector(s => s.auth);

  const nav = user?.role === 'admin' ? ADMIN_NAV
    : user?.role === 'recruiter' ? RECRUITER_NAV : CANDIDATE_NAV;

  const portalLabel = user?.role === 'admin' ? 'Admin Portal'
    : user?.role === 'recruiter' ? 'Recruiter Portal' : 'Candidate Portal';

  const sectionLabel = user?.role === 'admin' ? 'Administration'
    : user?.role === 'recruiter' ? 'Recruitment' : 'My Portal';

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const isActive = (path) => {
    if (path === '/recruiter' || path === '/admin' || path === '/candidate') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const go = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <Box sx={{
      width: 220, minHeight: '100vh', background: '#0F172A',
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Logo + close button (mobile) */}
      <Box sx={{ px: 3, pt: 3.5, pb: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: 1.5,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 18 }} />
            </Box>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px' }}>
              RecruitAI
            </Typography>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, mt: 0.75, pl: 0.25 }}>
            {portalLabel}
          </Typography>
        </Box>
        {onClose && (
          <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.4)', mt: 0.5 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Box sx={{ mx: 2.5, height: '1px', background: 'rgba(255,255,255,0.07)', mb: 1.5 }} />

      <Box sx={{ px: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography sx={{
          px: 1.5, mb: 1, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
        }}>
          {sectionLabel}
        </Typography>
        {nav.map(item => (
          <NavItem key={item.label} icon={item.icon} label={item.label}
            active={isActive(item.path)} onClick={() => go(item.path)} />
        ))}
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, px: 0.5 }}>
          <Avatar sx={{
            width: 34, height: 34, fontSize: 13, fontWeight: 700,
            background: user?.role === 'admin'
              ? 'linear-gradient(135deg, #DC2626, #9B1C1C)'
              : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
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
              {user?.role}
            </Typography>
          </Box>
        </Box>
        <NotificationBell />
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

export default function Sidebar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        {/* Mobile top bar */}
        <Box sx={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200,
          height: 56, background: '#0F172A',
          display: 'flex', alignItems: 'center', px: 2, gap: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <IconButton onClick={() => setOpen(true)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: 1,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 15 }} />
            </Box>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>
              RecruitAI
            </Typography>
          </Box>
        </Box>
        <Drawer
          anchor="left" open={open} onClose={() => setOpen(false)}
          PaperProps={{ sx: { background: 'transparent', border: 'none' } }}
        >
          <SidebarContent onClose={() => setOpen(false)} />
        </Drawer>
      </>
    );
  }

  return (
    <Box sx={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
      <SidebarContent />
    </Box>
  );
}
