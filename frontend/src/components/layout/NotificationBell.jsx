import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box, Typography, IconButton, Badge, Popover,
  CircularProgress, Divider, Button,
} from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import CheckCircleOutlineIcon    from '@mui/icons-material/CheckCircleOutline';
import WorkOutlineIcon           from '@mui/icons-material/WorkOutline';
import PeopleOutlineIcon         from '@mui/icons-material/PeopleOutline';
import AutoAwesomeIcon           from '@mui/icons-material/AutoAwesome';
import api from '../../services/api';

const TYPE_META = {
  new_application: { icon: <PeopleOutlineIcon sx={{ fontSize: 16 }} />, color: '#4F46E5', bg: '#EEF2FF' },
  stage_change:    { icon: <WorkOutlineIcon   sx={{ fontSize: 16 }} />, color: '#10B981', bg: '#ECFDF5' },
  match_ready:     { icon: <AutoAwesomeIcon   sx={{ fontSize: 16 }} />, color: '#F59E0B', bg: '#FFFBEB' },
};

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)   return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationBell() {
  const [notes,    setNotes]    = useState([]);
  const [unread,   setUnread]   = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [anchor,   setAnchor]   = useState(null);
  const intervalRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotes(data.notifications || []);
      setUnread(data.unread || 0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(intervalRef.current);
  }, [load]);

  const open = async (e) => {
    setAnchor(e.currentTarget);
    setLoading(true);
    await load();
    setLoading(false);
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotes(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const markOne = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotes(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const meta = (type) => TYPE_META[type] || TYPE_META.match_ready;

  return (
    <>
      <IconButton onClick={open} size="small"
        sx={{ color: 'inherit', '&:hover': { background: 'rgba(255,255,255,0.08)' } }}>
        <Badge badgeContent={unread || null} color="error"
          sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 16, height: 16, fontWeight: 800 } }}>
          <NotificationsOutlinedIcon sx={{ fontSize: 20 }} />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top',    horizontal: 'right' }}
        PaperProps={{ sx: {
          width: 340, borderRadius: 2.5, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0',
        }}}>

        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
              Notifications
            </Typography>
            {unread > 0 && (
              <Box sx={{ px: 0.75, py: 0.1, borderRadius: 1, background: '#EEF2FF',
                fontSize: 11, fontWeight: 700, color: '#4F46E5' }}>
                {unread} new
              </Box>
            )}
          </Box>
          {unread > 0 && (
            <Button size="small" onClick={markAllRead}
              sx={{ fontSize: 11, textTransform: 'none', color: '#4F46E5',
                p: 0.5, minWidth: 0, '&:hover': { background: '#EEF2FF' } }}>
              Mark all read
            </Button>
          )}
        </Box>

        {/* Body */}
        <Box sx={{ maxHeight: 380, overflowY: 'auto',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { background: '#E2E8F0', borderRadius: 4 } }}>
          {loading && notes.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ color: '#4F46E5' }} />
            </Box>
          ) : notes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <NotificationsOutlinedIcon sx={{ fontSize: 36, color: '#E2E8F0', mb: 1 }} />
              <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>No notifications yet</Typography>
            </Box>
          ) : (
            notes.map((n, i) => {
              const m = meta(n.type);
              return (
                <Box key={n._id}>
                  <Box onClick={() => !n.read && markOne(n._id)}
                    sx={{
                      px: 2, py: 1.5, display: 'flex', gap: 1.5, alignItems: 'flex-start',
                      background: n.read ? 'transparent' : '#FAFBFF',
                      cursor: n.read ? 'default' : 'pointer',
                      '&:hover': { background: '#F8FAFC' },
                      transition: 'background 0.15s',
                    }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: m.bg, color: m.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {m.icon}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 0.5 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: n.read ? 500 : 700, color: '#0F172A', lineHeight: 1.35 }}>
                          {n.title}
                        </Typography>
                        {!n.read && (
                          <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: '#4F46E5', flexShrink: 0, mt: 0.5 }} />
                        )}
                      </Box>
                      <Typography sx={{ fontSize: 11, color: '#64748B', mt: 0.25, lineHeight: 1.4 }}>
                        {n.message}
                      </Typography>
                      <Typography sx={{ fontSize: 10, color: '#94A3B8', mt: 0.5 }}>
                        {timeAgo(n.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                  {i < notes.length - 1 && <Divider sx={{ mx: 2, borderColor: '#F1F5F9' }} />}
                </Box>
              );
            })
          )}
        </Box>
      </Popover>
    </>
  );
}
