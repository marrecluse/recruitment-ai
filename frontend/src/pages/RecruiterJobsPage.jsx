import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Tooltip, Badge,
} from '@mui/material';
import AddIcon       from '@mui/icons-material/Add';
import EditIcon      from '@mui/icons-material/EditOutlined';
import DeleteIcon    from '@mui/icons-material/DeleteOutlined';
import WorkIcon      from '@mui/icons-material/WorkOutlined';
import CloseIcon     from '@mui/icons-material/Close';
import api           from '../services/api';
import toast         from 'react-hot-toast';
import Layout        from '../components/layout/Layout';

const emptyForm = { title: '', description: '', skills: '', location: '', salary: '', type: 'full-time', status: 'active', closingDate: '' };

export default function RecruiterJobsPage() {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [dialog,  setDialog]  = useState(null); // null | 'create' | 'edit'
  const [form,    setForm]    = useState(emptyForm);
  const [saving,  setSaving]  = useState(false);
  const [delId,   setDelId]   = useState(null);
  const [search,  setSearch]  = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/jobs/my');
      setJobs(data);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to load jobs'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setDialog('create'); };
  const openEdit   = job => {
    setForm({
      title: job.title, description: job.description,
      skills: (job.skills || []).join(', '),
      location: job.location || '', salary: job.salary || '',
      type: job.type || 'full-time', status: job.status || 'active',
      closingDate: job.closingDate ? new Date(job.closingDate).toISOString().slice(0, 10) : '',
      _id: job._id,
    });
    setDialog('edit');
  };

  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errs = {};
    if (!form.title.trim())       errs.title = 'Job title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(), description: form.description.trim(),
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        location: form.location.trim(), salary: form.salary.trim(),
        type: form.type, status: form.status,
        closingDate: form.closingDate || null,
      };
      if (dialog === 'create') {
        const { data } = await api.post('/jobs', payload);
        setJobs(j => [data, ...j]);
      } else {
        const { data } = await api.put(`/jobs/${form._id}`, payload);
        setJobs(j => j.map(x => x._id === data._id ? data : x));
      }
      setDialog(null);
    } catch (e) { toast.error(e.response?.data?.error || 'Save failed'); }
    setSaving(false);
  };

  const deleteJob = async () => {
    try {
      await api.delete(`/jobs/${delId}`);
      setJobs(j => j.filter(x => x._id !== delId));
    } catch (e) { setError(e.response?.data?.error || 'Delete failed'); }
    setDelId(null);
  };

  const q = search.toLowerCase();
  const filtered = jobs.filter(j => {
    const matchesText = !q || j.title.toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q) ||
      (j.skills || []).some(s => s.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchesText && matchesStatus;
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <Layout>
      <Box sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Jobs</Typography>
            <Typography sx={{ fontSize: 13, color: '#64748B', mt: 0.25 }}>
              Manage your job postings
            </Typography>
          </Box>
          <Button
            variant="contained" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              '&:hover': { background: 'linear-gradient(135deg, #4338CA, #6D28D9)' } }}
          >
            Post Job
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Search + filter bar */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
          <TextField
            size="small" placeholder="Search by title, location or skill…" value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ width: 300, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 } }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status"
              onChange={e => setStatusFilter(e.target.value)}
              sx={{ borderRadius: 2, fontSize: 13 }}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
          {(search || statusFilter !== 'all') && (
            <Button size="small" variant="text"
              onClick={() => { setSearch(''); setStatusFilter('all'); }}
              sx={{ textTransform: 'none', fontSize: 12, color: '#94A3B8',
                '&:hover': { color: '#4F46E5' } }}>
              Clear filters
            </Button>
          )}
        </Box>

        {/* Stats row */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          {[
            { label: 'Total', value: jobs.length, color: '#4F46E5' },
            { label: 'Active', value: jobs.filter(j => j.status === 'active').length, color: '#10B981' },
            { label: 'Closed', value: jobs.filter(j => j.status === 'closed').length, color: '#94A3B8' },
          ].map(s => (
            <Box key={s.label} sx={{
              px: 3, py: 1.5, borderRadius: 2, background: '#fff',
              border: '1.5px solid #E2E8F0', display: 'flex', gap: 1.5, alignItems: 'center',
            }}>
              <Typography sx={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</Typography>
              <Typography sx={{ fontSize: 13, color: '#64748B' }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#4F46E5' }} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, color: '#94A3B8' }}>
            <WorkIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography fontWeight={600}>No jobs yet</Typography>
            <Typography fontSize={13} mt={0.5}>Click "Post Job" to create your first listing</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F8FAFC' } }}>
                  <TableCell>Title</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Skills</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Posted / Closes</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(job => (
                  <TableRow key={job._id} sx={{ '&:hover': { background: '#F8FAFC' }, '& td': { fontSize: 13 } }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>{job.title}</Typography>
                      {job.salary && <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>{job.salary}</Typography>}
                    </TableCell>
                    <TableCell sx={{ color: '#64748B' }}>{job.location || '—'}</TableCell>
                    <TableCell>
                      <Chip label={job.type || 'full-time'} size="small"
                        sx={{ fontSize: 11, height: 20, background: '#EEF2FF', color: '#4F46E5', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 200 }}>
                        {(job.skills || []).slice(0, 3).map(s => (
                          <Chip key={s} label={s} size="small"
                            sx={{ fontSize: 10, height: 18, background: '#F1F5F9', color: '#475569' }} />
                        ))}
                        {(job.skills || []).length > 3 && (
                          <Chip label={`+${job.skills.length - 3}`} size="small"
                            sx={{ fontSize: 10, height: 18, background: '#F1F5F9', color: '#94A3B8' }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={job.status} size="small"
                        sx={{
                          fontSize: 11, height: 20, fontWeight: 600,
                          background: job.status === 'active' ? '#DCFCE7' : '#F1F5F9',
                          color: job.status === 'active' ? '#16A34A' : '#94A3B8',
                        }} />
                    </TableCell>
                    <TableCell sx={{ color: '#94A3B8', fontSize: 12 }}>
                      {new Date(job.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {job.closingDate && (() => {
                        const cd = new Date(job.closingDate);
                        const daysLeft = Math.ceil((cd - new Date()) / 86400000);
                        return (
                          <Typography sx={{ fontSize: 11, mt: 0.25 }}>
                            {daysLeft < 0
                              ? <span style={{ color: '#DC2626', fontWeight: 600 }}>Expired</span>
                              : daysLeft <= 7
                              ? <span style={{ color: '#D97706', fontWeight: 600 }}>⏰ {daysLeft}d left</span>
                              : <span style={{ color: '#94A3B8' }}>Closes {cd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                          </Typography>
                        );
                      })()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(job)} sx={{ color: '#4F46E5' }}>
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => setDelId(job._id)} sx={{ color: '#EF4444' }}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="sm" fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>
            {dialog === 'create' ? 'Post New Job' : 'Edit Job'}
            <IconButton onClick={() => setDialog(null)} sx={{ position: 'absolute', right: 12, top: 12 }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2.5 }}>
            <TextField label="Job Title *" value={form.title} onChange={set('title')}
              fullWidth size="small" placeholder="e.g. Senior Frontend Engineer" />
            <TextField label="Description *" value={form.description} onChange={set('description')}
              fullWidth multiline rows={4} size="small"
              placeholder="Describe the role, responsibilities, requirements…" />
            <TextField label="Skills (comma-separated)" value={form.skills} onChange={set('skills')}
              fullWidth size="small" placeholder="e.g. React, TypeScript, Node.js" />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Location" value={form.location} onChange={set('location')}
                size="small" sx={{ flex: 1 }} placeholder="e.g. London, UK or Remote" />
              <TextField label="Salary" value={form.salary} onChange={set('salary')}
                size="small" sx={{ flex: 1 }} placeholder="e.g. £60,000–£80,000" />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Type</InputLabel>
                <Select value={form.type} onChange={set('type')} label="Type">
                  {['full-time', 'part-time', 'contract', 'internship', 'remote'].map(t => (
                    <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Status</InputLabel>
                <Select value={form.status} onChange={set('status')} label="Status">
                  <MenuItem value="active" sx={{ fontSize: 13 }}>Active</MenuItem>
                  <MenuItem value="closed" sx={{ fontSize: 13 }}>Closed</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              label="Closing Date (optional)" type="date" value={form.closingDate}
              onChange={set('closingDate')} size="small" fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Job auto-closes on this date — leave blank for no expiry"
              sx={{ '& .MuiFormHelperText-root': { fontSize: 11 } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button onClick={() => setDialog(null)} sx={{ textTransform: 'none', color: '#64748B' }}>Cancel</Button>
            <Button variant="contained" onClick={save} disabled={saving || !form.title.trim() || !form.description.trim()}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2,
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
              {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : dialog === 'create' ? 'Post Job' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete confirm */}
        <Dialog open={!!delId} onClose={() => setDelId(null)} maxWidth="xs"
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete Job?</DialogTitle>
          <DialogContent>
            <Typography fontSize={14} color="text.secondary">
              This will permanently delete the job posting. This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDelId(null)} sx={{ textTransform: 'none', color: '#64748B' }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={deleteJob}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
}
