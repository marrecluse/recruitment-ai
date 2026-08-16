import { useEffect, useState } from 'react';
import {
  Box, Typography, CircularProgress, Alert, Paper, Chip, Avatar,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Select, MenuItem, FormControl, InputLabel, TextField, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, InputAdornment,
} from '@mui/material';
import DeleteIcon                from '@mui/icons-material/DeleteOutlined';
import EditIcon                  from '@mui/icons-material/EditOutlined';
import BlockIcon                 from '@mui/icons-material/BlockOutlined';
import CheckCircleIcon           from '@mui/icons-material/CheckCircleOutlined';
import PeopleIcon                from '@mui/icons-material/PeopleOutlined';
import WorkIcon                  from '@mui/icons-material/WorkOutlined';
import AssessmentIcon            from '@mui/icons-material/AssessmentOutlined';
import DescriptionIcon           from '@mui/icons-material/DescriptionOutlined';
import AddIcon                   from '@mui/icons-material/Add';
import FileDownloadOutlinedIcon  from '@mui/icons-material/FileDownloadOutlined';
import VisibilityOutlinedIcon    from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import AssignmentIcon            from '@mui/icons-material/AssignmentOutlined';
import CloseIcon                 from '@mui/icons-material/Close';
import api    from '../services/api';
import toast  from 'react-hot-toast';
import Layout from '../components/layout/Layout';

const ROLE_COLOR = { admin: '#DC2626', recruiter: '#4F46E5', candidate: '#10B981' };
const rc       = r => ROLE_COLOR[r] || '#94A3B8';
const initials = n => (n || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const fmtDate  = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function StatCard({ label, value, color, icon }) {
  return (
    <Paper elevation={0} sx={{
      p: 2.5, borderRadius: 2.5, border: '1.5px solid #E2E8F0',
      display: 'flex', gap: 2, alignItems: 'center', flex: 1, minWidth: 160,
    }}>
      <Box sx={{ width: 44, height: 44, borderRadius: 1.5, background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{value ?? '—'}</Typography>
        <Typography sx={{ fontSize: 12, color: '#64748B', mt: 0.25 }}>{label}</Typography>
      </Box>
    </Paper>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <Box sx={{ px: 2.5, py: 1.5, borderRadius: 2, background: '#fff', border: '1.5px solid #E2E8F0',
      display: 'flex', gap: 1.5, alignItems: 'center' }}>
      <Typography sx={{ fontSize: 20, fontWeight: 800, color: color || '#0F172A' }}>{value ?? 0}</Typography>
      <Typography sx={{ fontSize: 12, color: '#64748B' }}>{label}</Typography>
    </Box>
  );
}

const emptyNewUser = { name: '', email: '', password: '', role: 'candidate', isActive: true };

const thSx = { fontWeight: 700, fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F8FAFC' };
const trSx = { '&:hover': { background: '#F8FAFC' }, '& td': { fontSize: 13 } };

export default function AdminDashboard({ view = 'dashboard' }) {
  const [stats,      setStats]      = useState(null);
  const [users,      setUsers]      = useState([]);
  const [jobs,       setJobs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [editUser,   setEditUser]   = useState(null);
  const [delUser,    setDelUser]    = useState(null);
  const [newUser,    setNewUser]    = useState(null);
  const [delJob,     setDelJob]     = useState(null);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [jobSearch,  setJobSearch]  = useState('');
  const [jobStatus,  setJobStatus]  = useState('all');
  const [saving,     setSaving]     = useState(false);
  const [showPw,     setShowPw]     = useState(false);
  const [showEditPw, setShowEditPw] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetchStats = api.get('/admin/stats');
    const fetchUsers = api.get('/admin/users');
    const fetchJobs  = api.get('/admin/jobs');

    const load = view === 'dashboard'
      ? Promise.all([fetchStats, fetchUsers, fetchJobs])
          .then(([s, u, j]) => { setStats(s.data); setUsers(u.data); setJobs(j.data); })
      : view === 'users'
      ? Promise.all([fetchStats, fetchUsers])
          .then(([s, u]) => { setStats(s.data); setUsers(u.data); })
      : view === 'jobs'
      ? Promise.all([fetchStats, fetchJobs])
          .then(([s, j]) => { setStats(s.data); setJobs(j.data); })
      : fetchStats.then(s => setStats(s.data));

    load.catch(e => setError(e.response?.data?.error || 'Failed to load'))
        .finally(() => setLoading(false));
  }, [view]);

  // ── User actions ─────────────────────────────────────────────────────────────
  const createUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Name, email and password are required'); return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/admin/users', newUser);
      setUsers(u => [data, ...u]);
      setNewUser(null);
      toast.success('User created');
    } catch (e) { toast.error(e.response?.data?.error || 'Create failed'); }
    setSaving(false);
  };

  const saveUser = async () => {
    setSaving(true);
    try {
      const { name, email, role, isActive, newPassword } = editUser;
      const payload = { name, email, role, isActive };
      if (newPassword) payload.password = newPassword;
      const { data } = await api.patch(`/admin/users/${editUser._id}`, payload);
      setUsers(u => u.map(x => x._id === data._id ? data : x));
      setEditUser(null);
      toast.success('User updated');
    } catch (e) { toast.error(e.response?.data?.error || 'Save failed'); }
    setSaving(false);
  };

  const deleteUser = async () => {
    try {
      await api.delete(`/admin/users/${delUser._id}`);
      setUsers(u => u.filter(x => x._id !== delUser._id));
      setDelUser(null);
      toast.success('User deleted');
    } catch (e) { toast.error(e.response?.data?.error || 'Delete failed'); }
  };

  const toggleUserActive = async (u) => {
    try {
      const { data } = await api.patch(`/admin/users/${u._id}`, { isActive: !(u.isActive !== false) });
      setUsers(prev => prev.map(x => x._id === data._id ? data : x));
    } catch { toast.error('Update failed'); }
  };

  // ── Job actions ───────────────────────────────────────────────────────────────
  const toggleJobStatus = async (job) => {
    try {
      const ns = job.status === 'active' ? 'closed' : 'active';
      const { data } = await api.patch(`/admin/jobs/${job._id}`, { status: ns });
      setJobs(j => j.map(x => x._id === data._id ? data : x));
    } catch { toast.error('Update failed'); }
  };

  const confirmDeleteJob = async () => {
    try {
      await api.delete(`/admin/jobs/${delJob._id}`);
      setJobs(j => j.filter(x => x._id !== delJob._id));
      setDelJob(null);
      toast.success('Job deleted');
    } catch { toast.error('Delete failed'); }
  };

  // ── Export CSV ────────────────────────────────────────────────────────────────
  const exportUsersCSV = () => {
    const rows = [['Name', 'Email', 'Role', 'Status', 'Joined']];
    filteredUsers.forEach(u => rows.push([
      u.name, u.email, u.role,
      u.isActive !== false ? 'Active' : 'Suspended',
      fmtDate(u.createdAt),
    ]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'users.csv'; a.click();
  };

  // ── Filters ───────────────────────────────────────────────────────────────────
  const q  = search.toLowerCase();
  const filteredUsers = users.filter(u => {
    const matchText = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchText && matchRole;
  });

  const jq = jobSearch.toLowerCase();
  const filteredJobs = jobs.filter(j => {
    const matchText = !jq || j.title?.toLowerCase().includes(jq) ||
      j.recruiter?.name?.toLowerCase().includes(jq) || j.recruiter?.email?.toLowerCase().includes(jq);
    const matchStatus = jobStatus === 'all' || j.status === jobStatus;
    return matchText && matchStatus;
  });

  // ── Derived counts ────────────────────────────────────────────────────────────
  const recruiters  = users.filter(u => u.role === 'recruiter').length;
  const candidates  = users.filter(u => u.role === 'candidate').length;
  const admins      = users.filter(u => u.role === 'admin').length;
  const activeUsers = users.filter(u => u.isActive !== false).length;
  const suspended   = users.filter(u => u.isActive === false).length;
  const activeJobs  = jobs.filter(j => j.status === 'active').length;
  const closedJobs  = jobs.filter(j => j.status === 'closed').length;

  // ── User table row ────────────────────────────────────────────────────────────
  const UserRow = ({ u, showActions }) => (
    <TableRow sx={trSx}>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 700, background: rc(u.role) }}>
            {initials(u.name)}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>{u.name}</Typography>
            <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>{u.email}</Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Chip label={u.role} size="small" sx={{ fontSize: 11, fontWeight: 600,
          background: `${rc(u.role)}18`, color: rc(u.role) }} />
      </TableCell>
      <TableCell>
        <Chip label={u.isActive !== false ? 'Active' : 'Suspended'} size="small" sx={{
          fontSize: 11, fontWeight: 600,
          background: u.isActive !== false ? '#DCFCE7' : '#FEE2E2',
          color:      u.isActive !== false ? '#16A34A' : '#DC2626',
        }} />
      </TableCell>
      <TableCell sx={{ color: '#94A3B8', fontSize: 12 }}>{fmtDate(u.createdAt)}</TableCell>
      {showActions && (
        <TableCell align="right">
          <Tooltip title="Edit user">
            <IconButton size="small" onClick={() => setEditUser({ ...u, newPassword: '' })} sx={{ color: '#4F46E5' }}>
              <EditIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={u.isActive !== false ? 'Suspend' : 'Activate'}>
            <IconButton size="small" onClick={() => toggleUserActive(u)}
              sx={{ color: u.isActive !== false ? '#F59E0B' : '#10B981' }}>
              {u.isActive !== false ? <BlockIcon sx={{ fontSize: 15 }} /> : <CheckCircleIcon sx={{ fontSize: 15 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete user">
            <IconButton size="small" onClick={() => setDelUser(u)} sx={{ color: '#EF4444' }}>
              <DeleteIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </TableCell>
      )}
    </TableRow>
  );

  return (
    <Layout>
      <Box sx={{ p: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <CircularProgress sx={{ color: '#DC2626' }} />
          </Box>
        ) : (
          <>
            {/* ════════════════════════ DASHBOARD ════════════════════════════ */}
            {view === 'dashboard' && (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Admin Dashboard</Typography>
                  <Typography sx={{ fontSize: 13, color: '#64748B', mt: 0.25 }}>Platform overview and management</Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                  <StatCard label="Total Users"        value={stats?.totalUsers}        color="#4F46E5" icon={<PeopleIcon />} />
                  <StatCard label="Total Jobs"         value={stats?.totalJobs}         color="#10B981" icon={<WorkIcon />} />
                  <StatCard label="Total Resumes"      value={stats?.totalResumes}      color="#F59E0B" icon={<DescriptionIcon />} />
                  <StatCard label="Total Applications" value={stats?.totalApplications} color="#8B5CF6" icon={<AssignmentIcon />} />
                  <StatCard label="Total Matches"      value={stats?.totalMatches}      color="#06B6D4" icon={<AssessmentIcon />} />
                </Box>

                <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, border: '1.5px solid #E2E8F0', minWidth: 200 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0F172A', mb: 2 }}>Users by Role</Typography>
                    {(stats?.byRole || []).map(r => (
                      <Box key={r._id} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                          <Chip label={r._id} size="small" sx={{ fontSize: 11, fontWeight: 600, background: `${rc(r._id)}18`, color: rc(r._id) }} />
                          <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{r.count}</Typography>
                        </Box>
                        <Box sx={{ height: 5, borderRadius: 3, background: '#F1F5F9' }}>
                          <Box sx={{ height: '100%', borderRadius: 3, background: rc(r._id),
                            width: `${stats?.totalUsers ? (r.count / stats.totalUsers) * 100 : 0}%` }} />
                        </Box>
                      </Box>
                    ))}
                  </Paper>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, border: '1.5px solid #E2E8F0', minWidth: 200 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0F172A', mb: 2 }}>Jobs by Status</Typography>
                    {[{ label: 'Active', value: activeJobs, color: '#10B981' }, { label: 'Closed', value: closedJobs, color: '#94A3B8' }].map(r => (
                      <Box key={r.label} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                          <Chip label={r.label} size="small" sx={{ fontSize: 11, fontWeight: 600, background: `${r.color}18`, color: r.color }} />
                          <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{r.value}</Typography>
                        </Box>
                        <Box sx={{ height: 5, borderRadius: 3, background: '#F1F5F9' }}>
                          <Box sx={{ height: '100%', borderRadius: 3, background: r.color,
                            width: `${jobs.length ? (r.value / jobs.length) * 100 : 0}%` }} />
                        </Box>
                      </Box>
                    ))}
                  </Paper>
                </Box>

                <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#0F172A', mb: 1.5 }}>Recent Users</Typography>
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2.5, border: '1.5px solid #E2E8F0', mb: 4 }}>
                  <Table size="small">
                    <TableHead><TableRow sx={{ '& th': thSx }}>
                      <TableCell>User</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell>Joined</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {users.slice(0, 5).map(u => <UserRow key={u._id} u={u} showActions={false} />)}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#0F172A', mb: 1.5 }}>Recent Jobs</Typography>
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2.5, border: '1.5px solid #E2E8F0' }}>
                  <Table size="small">
                    <TableHead><TableRow sx={{ '& th': thSx }}>
                      <TableCell>Title</TableCell><TableCell>Recruiter</TableCell><TableCell>Status</TableCell><TableCell>Posted</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {jobs.slice(0, 5).map(j => (
                        <TableRow key={j._id} sx={trSx}>
                          <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>{j.title}</TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{j.recruiter?.name || '—'}</Typography>
                            <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>{j.recruiter?.email}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={j.status} size="small" sx={{ fontSize: 11, fontWeight: 600,
                              background: j.status === 'active' ? '#DCFCE7' : '#F1F5F9',
                              color: j.status === 'active' ? '#16A34A' : '#94A3B8' }} />
                          </TableCell>
                          <TableCell sx={{ color: '#94A3B8', fontSize: 12 }}>{fmtDate(j.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* ════════════════════════ USERS VIEW ═══════════════════════════ */}
            {view === 'users' && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>All Users</Typography>
                    <Typography sx={{ fontSize: 13, color: '#64748B', mt: 0.25 }}>Manage accounts, roles and access</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button size="small" variant="outlined" startIcon={<FileDownloadOutlinedIcon />}
                      onClick={exportUsersCSV} disabled={filteredUsers.length === 0}
                      sx={{ textTransform: 'none', fontSize: 13, borderRadius: 2, borderColor: '#E2E8F0', color: '#64748B',
                        '&:hover': { borderColor: '#4F46E5', color: '#4F46E5' } }}>
                      Export CSV
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setShowPw(false); setNewUser({ ...emptyNewUser }); }}
                      sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2,
                        background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                        '&:hover': { background: 'linear-gradient(135deg, #4338CA, #6D28D9)' } }}>
                      Add User
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
                  <MiniStat label="Total"      value={users.length}  color="#4F46E5" />
                  <MiniStat label="Recruiters" value={recruiters}    color="#4F46E5" />
                  <MiniStat label="Candidates" value={candidates}    color="#10B981" />
                  <MiniStat label="Admins"     value={admins}        color="#DC2626" />
                  <MiniStat label="Active"     value={activeUsers}   color="#10B981" />
                  <MiniStat label="Suspended"  value={suspended}     color="#EF4444" />
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
                  <TextField size="small" placeholder="Search by name or email…" value={search}
                    onChange={e => setSearch(e.target.value)}
                    sx={{ width: 280, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 } }} />
                  <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel>Role</InputLabel>
                    <Select value={roleFilter} label="Role" onChange={e => setRoleFilter(e.target.value)} sx={{ borderRadius: 2, fontSize: 13 }}>
                      <MenuItem value="all">All Roles</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="recruiter">Recruiter</MenuItem>
                      <MenuItem value="candidate">Candidate</MenuItem>
                    </Select>
                  </FormControl>
                  {(search || roleFilter !== 'all') && (
                    <Button size="small" variant="text" onClick={() => { setSearch(''); setRoleFilter('all'); }}
                      sx={{ textTransform: 'none', fontSize: 12, color: '#94A3B8', '&:hover': { color: '#4F46E5' } }}>
                      Clear filters
                    </Button>
                  )}
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2.5, border: '1.5px solid #E2E8F0' }}>
                  <Table size="small">
                    <TableHead><TableRow sx={{ '& th': thSx }}>
                      <TableCell>User</TableCell><TableCell>Role</TableCell>
                      <TableCell>Status</TableCell><TableCell>Joined</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: '#94A3B8' }}>No users found</TableCell></TableRow>
                      ) : filteredUsers.map(u => <UserRow key={u._id} u={u} showActions />)}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* ════════════════════════ JOBS VIEW ════════════════════════════ */}
            {view === 'jobs' && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>All Jobs</Typography>
                  <Typography sx={{ fontSize: 13, color: '#64748B', mt: 0.25 }}>Platform-wide job postings</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
                  <MiniStat label="Total"  value={jobs.length} color="#4F46E5" />
                  <MiniStat label="Active" value={activeJobs}  color="#10B981" />
                  <MiniStat label="Closed" value={closedJobs}  color="#94A3B8" />
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
                  <TextField size="small" placeholder="Search by title or recruiter…" value={jobSearch}
                    onChange={e => setJobSearch(e.target.value)}
                    sx={{ width: 280, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 } }} />
                  <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={jobStatus} label="Status" onChange={e => setJobStatus(e.target.value)} sx={{ borderRadius: 2, fontSize: 13 }}>
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="closed">Closed</MenuItem>
                    </Select>
                  </FormControl>
                  {(jobSearch || jobStatus !== 'all') && (
                    <Button size="small" variant="text" onClick={() => { setJobSearch(''); setJobStatus('all'); }}
                      sx={{ textTransform: 'none', fontSize: 12, color: '#94A3B8', '&:hover': { color: '#4F46E5' } }}>
                      Clear
                    </Button>
                  )}
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2.5, border: '1.5px solid #E2E8F0' }}>
                  <Table size="small">
                    <TableHead><TableRow sx={{ '& th': thSx }}>
                      <TableCell>Title</TableCell><TableCell>Recruiter</TableCell>
                      <TableCell>Location / Type</TableCell><TableCell>Status</TableCell>
                      <TableCell>Posted</TableCell><TableCell align="right">Actions</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {filteredJobs.length === 0 ? (
                        <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: '#94A3B8' }}>No jobs found</TableCell></TableRow>
                      ) : filteredJobs.map(j => (
                        <TableRow key={j._id} sx={trSx}>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>{j.title}</Typography>
                            {(j.skills || []).length > 0 && (
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                {(j.skills || []).slice(0, 3).map(s => (
                                  <Chip key={s} label={s} size="small"
                                    sx={{ fontSize: 10, height: 17, background: '#F1F5F9', color: '#475569' }} />
                                ))}
                                {(j.skills || []).length > 3 && (
                                  <Chip label={`+${j.skills.length - 3}`} size="small"
                                    sx={{ fontSize: 10, height: 17, background: '#F1F5F9', color: '#94A3B8' }} />
                                )}
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{j.recruiter?.name || '—'}</Typography>
                            <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>{j.recruiter?.email}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 12, color: '#64748B' }}>{j.location || '—'}</Typography>
                            <Chip label={j.type || 'full-time'} size="small"
                              sx={{ fontSize: 10, height: 17, mt: 0.5, background: '#EEF2FF', color: '#4F46E5', fontWeight: 600 }} />
                          </TableCell>
                          <TableCell>
                            <Chip label={j.status} size="small" sx={{ fontSize: 11, fontWeight: 600,
                              background: j.status === 'active' ? '#DCFCE7' : '#F1F5F9',
                              color: j.status === 'active' ? '#16A34A' : '#94A3B8' }} />
                          </TableCell>
                          <TableCell sx={{ color: '#94A3B8', fontSize: 12 }}>{fmtDate(j.createdAt)}</TableCell>
                          <TableCell align="right">
                            <Tooltip title={j.status === 'active' ? 'Close job' : 'Activate job'}>
                              <IconButton size="small" onClick={() => toggleJobStatus(j)}
                                sx={{ color: j.status === 'active' ? '#F59E0B' : '#10B981' }}>
                                {j.status === 'active' ? <BlockIcon sx={{ fontSize: 15 }} /> : <CheckCircleIcon sx={{ fontSize: 15 }} />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete job">
                              <IconButton size="small" onClick={() => setDelJob(j)} sx={{ color: '#EF4444' }}>
                                <DeleteIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* ════════════════════════ STATS VIEW ═══════════════════════════ */}
            {view === 'stats' && stats && (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>System Statistics</Typography>
                  <Typography sx={{ fontSize: 13, color: '#64748B', mt: 0.25 }}>Platform-wide metrics and insights</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                  <StatCard label="Total Users"        value={stats.totalUsers}        color="#4F46E5" icon={<PeopleIcon />} />
                  <StatCard label="Total Jobs"         value={stats.totalJobs}         color="#10B981" icon={<WorkIcon />} />
                  <StatCard label="Total Resumes"      value={stats.totalResumes}      color="#F59E0B" icon={<DescriptionIcon />} />
                  <StatCard label="Total Applications" value={stats.totalApplications} color="#8B5CF6" icon={<AssignmentIcon />} />
                  <StatCard label="Total Matches"      value={stats.totalMatches}      color="#06B6D4" icon={<AssessmentIcon />} />
                  <StatCard label="Active Users"       value={stats.activeUsers}       color="#10B981" icon={<PeopleIcon />} />
                </Box>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, border: '1.5px solid #E2E8F0', minWidth: 240 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0F172A', mb: 2 }}>Users by Role</Typography>
                    {(stats.byRole || []).map(r => (
                      <Box key={r._id} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                          <Chip label={r._id} size="small" sx={{ fontSize: 11, fontWeight: 600, background: `${rc(r._id)}18`, color: rc(r._id) }} />
                          <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{r.count}</Typography>
                        </Box>
                        <Box sx={{ height: 6, borderRadius: 3, background: '#F1F5F9' }}>
                          <Box sx={{ height: '100%', borderRadius: 3, background: rc(r._id),
                            width: `${stats.totalUsers ? (r.count / stats.totalUsers) * 100 : 0}%` }} />
                        </Box>
                      </Box>
                    ))}
                  </Paper>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, border: '1.5px solid #E2E8F0', minWidth: 240 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0F172A', mb: 2 }}>Jobs by Status</Typography>
                    {[{ label: 'Active', value: activeJobs, color: '#10B981' }, { label: 'Closed', value: closedJobs, color: '#94A3B8' }].map(r => (
                      <Box key={r.label} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                          <Chip label={r.label} size="small" sx={{ fontSize: 11, fontWeight: 600, background: `${r.color}18`, color: r.color }} />
                          <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{r.value}</Typography>
                        </Box>
                        <Box sx={{ height: 6, borderRadius: 3, background: '#F1F5F9' }}>
                          <Box sx={{ height: '100%', borderRadius: 3, background: r.color,
                            width: `${stats.totalJobs ? (r.value / stats.totalJobs) * 100 : 0}%` }} />
                        </Box>
                      </Box>
                    ))}
                  </Paper>
                </Box>
              </>
            )}
          </>
        )}

        {/* ══════════════════════════ DIALOGS ════════════════════════════════ */}

        {/* Create User */}
        <Dialog open={!!newUser} onClose={() => setNewUser(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>
            Add New User
            <IconButton onClick={() => setNewUser(null)} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            <TextField label="Full Name *" value={newUser?.name || ''} size="small" fullWidth
              onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} />
            <TextField label="Email Address *" type="email" value={newUser?.email || ''} size="small" fullWidth
              onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} />
            <TextField label="Password *" type={showPw ? 'text' : 'password'} value={newUser?.password || ''} size="small" fullWidth
              onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
              InputProps={{ endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPw(p => !p)}>
                    {showPw ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              )}} />
            <FormControl size="small" fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={newUser?.role || 'candidate'} label="Role"
                onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                <MenuItem value="candidate">Candidate</MenuItem>
                <MenuItem value="recruiter">Recruiter</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={newUser?.isActive !== false ? 'active' : 'suspended'} label="Status"
                onChange={e => setNewUser(u => ({ ...u, isActive: e.target.value === 'active' }))}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button onClick={() => setNewUser(null)} sx={{ textTransform: 'none', color: '#64748B' }}>Cancel</Button>
            <Button variant="contained" onClick={createUser}
              disabled={saving || !newUser?.name || !newUser?.email || !newUser?.password}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2,
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
              {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Create User'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit User */}
        <Dialog open={!!editUser} onClose={() => setEditUser(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>
            Edit User
            <IconButton onClick={() => setEditUser(null)} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            <TextField label="Full Name" value={editUser?.name || ''} size="small" fullWidth
              onChange={e => setEditUser(u => ({ ...u, name: e.target.value }))} />
            <TextField label="Email Address" type="email" value={editUser?.email || ''} size="small" fullWidth
              onChange={e => setEditUser(u => ({ ...u, email: e.target.value }))} />
            <FormControl size="small" fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={editUser?.role || 'candidate'} label="Role"
                onChange={e => setEditUser(u => ({ ...u, role: e.target.value }))}>
                <MenuItem value="candidate">Candidate</MenuItem>
                <MenuItem value="recruiter">Recruiter</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={editUser?.isActive !== false ? 'active' : 'suspended'} label="Status"
                onChange={e => setEditUser(u => ({ ...u, isActive: e.target.value === 'active' }))}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
            <TextField label="New Password (optional)" type={showEditPw ? 'text' : 'password'}
              value={editUser?.newPassword || ''} size="small" fullWidth
              placeholder="Leave blank to keep existing"
              helperText="Only fill in if you want to change the password"
              onChange={e => setEditUser(u => ({ ...u, newPassword: e.target.value }))}
              InputProps={{ endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowEditPw(p => !p)}>
                    {showEditPw ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              )}} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button onClick={() => setEditUser(null)} sx={{ textTransform: 'none', color: '#64748B' }}>Cancel</Button>
            <Button variant="contained" onClick={saveUser} disabled={saving}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2,
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
              {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete User */}
        <Dialog open={!!delUser} onClose={() => setDelUser(null)} maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete User?</DialogTitle>
          <DialogContent>
            <Typography fontSize={14} color="text.secondary">
              This permanently deletes <strong>{delUser?.name}</strong> ({delUser?.email}) and all their data. Cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDelUser(null)} sx={{ textTransform: 'none', color: '#64748B' }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={deleteUser}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Job */}
        <Dialog open={!!delJob} onClose={() => setDelJob(null)} maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete Job?</DialogTitle>
          <DialogContent>
            <Typography fontSize={14} color="text.secondary">
              This permanently deletes <strong>{delJob?.title}</strong>. Cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDelJob(null)} sx={{ textTransform: 'none', color: '#64748B' }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDeleteJob}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
}
