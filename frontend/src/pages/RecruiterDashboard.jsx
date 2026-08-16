import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Grid, Button, TextField, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, Divider, IconButton, Tooltip,
} from '@mui/material';
import AddIcon              from '@mui/icons-material/Add';
import SearchIcon           from '@mui/icons-material/SearchOutlined';
import WorkOutlineIcon      from '@mui/icons-material/WorkOutline';
import PeopleOutlineIcon    from '@mui/icons-material/PeopleOutline';
import TrendingUpIcon       from '@mui/icons-material/TrendingUp';
import AutoAwesomeIcon      from '@mui/icons-material/AutoAwesome';
import CalendarTodayIcon    from '@mui/icons-material/CalendarTodayOutlined';
import EditOutlinedIcon     from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon    from '@mui/icons-material/DeleteOutline';
import { fetchMyJobs, createJob, updateJob, deleteJob, selectJob } from '../features/jobs/jobsSlice';
import { fetchMatchesForJob } from '../features/matches/matchSlice';
import CandidateCard from '../components/dashboard/CandidateCard';
import StatCard      from '../components/dashboard/StatCard';
import Layout        from '../components/layout/Layout';
import toast         from 'react-hot-toast';

const EMPTY_FORM = { title: '', description: '', skills: '', location: '', type: 'full-time' };

function JobCard({ job, active, onClick, onEdit, onDelete }) {
  const [hover, setHover] = useState(false);
  return (
    <Box
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      sx={{
        p: 2, borderRadius: 2.5, cursor: 'pointer', mb: 1.5, position: 'relative',
        border: active ? '2px solid #4F46E5' : '1.5px solid rgba(0,0,0,0.07)',
        background: active ? '#EEF2FF' : '#fff',
        boxShadow: active ? '0 4px 12px rgba(79,70,229,0.12)' : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: active ? '#4F46E5' : '#818CF8',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            fontWeight: 700, fontSize: 14, color: active ? '#3730A3' : '#0F172A',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pr: hover ? 5 : 0,
            transition: 'padding 0.1s',
          }}>
            {job.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <CalendarTodayIcon sx={{ fontSize: 11, color: '#94A3B8' }} />
            <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>
              {new Date(job.createdAt || Date.now()).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
            </Typography>
          </Box>
        </Box>
        <Box sx={{
          ml: 1.5, px: 1.25, py: 0.4, borderRadius: 1.5, flexShrink: 0,
          background: active ? '#C7D2FE' : '#F1F5F9',
          color: active ? '#3730A3' : '#64748B', fontSize: 11, fontWeight: 700,
        }}>
          Active
        </Box>
      </Box>

      {(job.skills || []).length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1.25, flexWrap: 'wrap' }}>
          {(job.skills || []).slice(0, 3).map(s => (
            <Chip key={s} label={s} size="small" sx={{
              fontSize: 10, height: 18, fontWeight: 600,
              background: active ? '#E0E7FF' : '#F8FAFC',
              color: active ? '#4F46E5' : '#64748B',
              border: `1px solid ${active ? '#C7D2FE' : '#E2E8F0'}`,
            }} />
          ))}
          {(job.skills || []).length > 3 && (
            <Typography sx={{ fontSize: 10, color: '#94A3B8', alignSelf: 'center' }}>
              +{job.skills.length - 3}
            </Typography>
          )}
        </Box>
      )}

      {/* Action buttons — shown on hover */}
      {hover && (
        <Box
          sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 0.5 }}
          onClick={e => e.stopPropagation()}
        >
          <Tooltip title="Edit job">
            <IconButton size="small" onClick={() => onEdit(job)}
              sx={{ width: 26, height: 26, background: '#EEF2FF', color: '#4F46E5',
                '&:hover': { background: '#C7D2FE' } }}>
              <EditOutlinedIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete job">
            <IconButton size="small" onClick={() => onDelete(job)}
              sx={{ width: 26, height: 26, background: '#FEF2F2', color: '#EF4444',
                '&:hover': { background: '#FECACA' } }}>
              <DeleteOutlineIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}


function JobFormFields({ values, onChange }) {
  return (
    <>
      <TextField label="Job Title" fullWidth required value={values.title}
        onChange={e => onChange({ ...values, title: e.target.value })}
        placeholder="e.g. Senior React Developer" />
      <TextField label="Location" fullWidth value={values.location}
        onChange={e => onChange({ ...values, location: e.target.value })}
        placeholder="e.g. Remote · London, UK" />
      <TextField label="Job Description" fullWidth multiline rows={5} required value={values.description}
        onChange={e => onChange({ ...values, description: e.target.value })}
        placeholder="Describe responsibilities, requirements, and the ideal candidate…" />
      <TextField label="Required Skills (comma-separated)" fullWidth value={values.skills}
        onChange={e => onChange({ ...values, skills: e.target.value })}
        placeholder="e.g. React, TypeScript, Node.js, MongoDB"
        helperText="Separate each skill with a comma" />
    </>
  );
}
export default function RecruiterDashboard() {
  const dispatch = useDispatch();
  const { user }            = useSelector(s => s.auth);
  const { list, selected }  = useSelector(s => s.jobs);
  const { byJob }           = useSelector(s => s.matches);

  const [createOpen,   setCreateOpen]   = useState(false);
  const [editOpen,     setEditOpen]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search,       setSearch]       = useState('');
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [editForm,     setEditForm]     = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  useEffect(() => { dispatch(fetchMyJobs()); }, []);
  useEffect(() => {
    if (selected) dispatch(fetchMatchesForJob(selected._id));
  }, [selected]);

  /* ── Create ── */
  const handleCreate = async () => {
    if (!form.title || !form.description) return;
    setSaving(true);
    try {
      await dispatch(createJob({
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      })).unwrap();
      toast.success('Job posted!');
      setCreateOpen(false);
      setForm(EMPTY_FORM);
    } catch { toast.error('Could not create job'); }
    setSaving(false);
  };

  /* ── Edit ── */
  const openEdit = (job) => {
    setEditForm({
      title:       job.title || '',
      description: job.description || '',
      skills:      (job.skills || []).join(', '),
      location:    job.location || '',
      type:        job.type || 'full-time',
    });
    setEditOpen(job);  // store job as truthy + data source
  };

  const handleUpdate = async () => {
    if (!editForm.title || !editForm.description) return;
    setSaving(true);
    try {
      await dispatch(updateJob({
        id: editOpen._id,
        body: {
          ...editForm,
          skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean),
        },
      })).unwrap();
      toast.success('Job updated!');
      setEditOpen(false);
    } catch { toast.error('Could not update job'); }
    setSaving(false);
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteJob(deleteTarget._id)).unwrap();
      toast.success('Job deleted');
      setDeleteTarget(null);
    } catch { toast.error('Could not delete job'); }
    setDeleting(false);
  };

  const matches      = selected ? (byJob[selected._id] || []) : [];
  const filteredJobs = list.filter(j =>
    !search || j.title.toLowerCase().includes(search.toLowerCase())
  );
  const avgScore = matches.length
    ? Math.round(matches.reduce((a, m) => a + (m.score || 0), 0) / matches.length * 100)
    : 0;
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';


  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </Typography>
          <Typography sx={{ color: '#64748B', mt: 0.5, fontSize: 15 }}>
            {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </Typography>
        </Box>

        {/* Stats row */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<WorkOutlineIcon />}   label="My Jobs"           value={list.length}    color="#4F46E5" bgColor="#EEF2FF" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<PeopleOutlineIcon />} label="Matched Candidates" value={matches.length}  color="#7C3AED" bgColor="#F5F3FF" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<TrendingUpIcon />}    label="Avg Match Score"   value={avgScore ? `${avgScore}%` : '—'} color="#10B981" bgColor="#ECFDF5" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<AutoAwesomeIcon />}   label="AI Powered"        value="3 Models"       color="#F59E0B" bgColor="#FFFBEB" sub="NER · SBERT · BERT" />
          </Grid>
        </Grid>

        {/* Main content */}
        <Grid container spacing={3}>

          {/* Jobs panel */}
          <Grid item xs={12} md={4}>
            <Box sx={{
              background: '#fff', borderRadius: 3,
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5, pb: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>Job Listings</Typography>
                  <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>{list.length} position{list.length !== 1 ? 's' : ''}</Typography>
                </Box>
                <Button variant="contained" size="small" startIcon={<AddIcon />}
                  onClick={() => setCreateOpen(true)}
                  sx={{ fontSize: 13, py: 0.75, px: 1.75,
                    background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: 'none' }}>
                  Post Job
                </Button>
              </Box>

              <Box sx={{ px: 2.5, pb: 1.5 }}>
                <TextField fullWidth placeholder="Search jobs…" size="small" value={search}
                  onChange={e => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94A3B8', fontSize: 18 }} /></InputAdornment>,
                    sx: { fontSize: 13, borderRadius: 2, background: '#F8FAFC' },
                  }} />
              </Box>

              <Divider sx={{ mx: 2.5 }} />

              <Box sx={{ p: 2, maxHeight: 520, overflowY: 'auto' }}>
                {filteredJobs.length ? filteredJobs.map(job => (
                  <JobCard key={job._id} job={job} active={selected?._id === job._id}
                    onClick={() => dispatch(selectJob(job))}
                    onEdit={openEdit}
                    onDelete={j => setDeleteTarget(j)} />
                )) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <WorkOutlineIcon sx={{ fontSize: 40, color: '#CBD5E1', mb: 1 }} />
                    <Typography sx={{ color: '#94A3B8', fontSize: 14 }}>
                      {search ? 'No matching jobs' : 'No jobs yet. Post one!'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Shortlist panel */}
          <Grid item xs={12} md={8}>
            <Box sx={{
              background: '#fff', borderRadius: 3,
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              minHeight: 400,
            }}>
              {selected ? (
                <>
                  <Box sx={{ p: 2.5, pb: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>
                          Candidate Shortlist
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: '#64748B', mt: 0.25 }}>
                          {selected.title}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Chip label={`${matches.length} candidate${matches.length !== 1 ? 's' : ''}`}
                          size="small" sx={{ background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: 12 }} />
                        {avgScore > 0 && (
                          <Chip label={`Avg ${avgScore}% match`}
                            size="small" sx={{ background: '#ECFDF5', color: '#059669', fontWeight: 700, fontSize: 12 }} />
                        )}
                        <Tooltip title="Edit this job">
                          <IconButton size="small" onClick={() => openEdit(selected)}
                            sx={{ background: '#EEF2FF', color: '#4F46E5', '&:hover': { background: '#C7D2FE' } }}>
                            <EditOutlinedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete this job">
                          <IconButton size="small" onClick={() => setDeleteTarget(selected)}
                            sx={{ background: '#FEF2F2', color: '#EF4444', '&:hover': { background: '#FECACA' } }}>
                            <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    {(selected.skills || []).length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', mr: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Required:
                        </Typography>
                        {selected.skills.map(s => (
                          <Chip key={s} label={s} size="small" sx={{
                            fontSize: 11, height: 20, fontWeight: 600,
                            background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0',
                          }} />
                        ))}
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ p: 2 }}>
                    {matches.length ? (
                      matches.map((m, i) => <CandidateCard key={m._id} match={m} rank={i + 1} />)
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <PeopleOutlineIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1.5 }} />
                        <Typography sx={{ fontWeight: 600, color: '#94A3B8', mb: 0.5 }}>No candidates yet</Typography>
                        <Typography sx={{ fontSize: 13, color: '#CBD5E1' }}>
                          Candidates need to upload their resumes to appear here
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 }}>
                  <Box sx={{ width: 72, height: 72, borderRadius: 3,
                    background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <AutoAwesomeIcon sx={{ fontSize: 32, color: '#818CF8' }} />
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#0F172A', mb: 0.5 }}>
                    Select a job posting
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: '#94A3B8' }}>
                    Pick a job on the left to see AI-ranked candidates
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* ── Create Job Dialog ── */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18, pb: 0 }}>Post New Job</DialogTitle>
        <Box sx={{ px: 3, pt: 0.5, pb: 0 }}>
          <Typography sx={{ color: '#64748B', fontSize: 13 }}>
            Fill in the details — our AI will start matching candidates immediately.
          </Typography>
        </Box>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <JobFormFields values={form} onChange={setForm} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => { setCreateOpen(false); setForm(EMPTY_FORM); }}
            sx={{ color: '#64748B', textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.title || !form.description || saving}
            sx={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', px: 3, textTransform: 'none', fontWeight: 700 }}>
            {saving ? 'Posting…' : 'Post Job'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Job Dialog ── */}
      <Dialog open={!!editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18, pb: 0 }}>Edit Job</DialogTitle>
        <Box sx={{ px: 3, pt: 0.5, pb: 0 }}>
          <Typography sx={{ color: '#64748B', fontSize: 13 }}>
            Changes will reflect in candidate matches immediately.
          </Typography>
        </Box>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <JobFormFields values={editForm} onChange={setEditForm} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ color: '#64748B', textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={!editForm.title || !editForm.description || saving}
            sx={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', px: 3, textTransform: 'none', fontWeight: 700 }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Job?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#64748B', fontSize: 14 }}>
            This will permanently delete <strong>{deleteTarget?.title}</strong> and remove it from all candidate pipelines. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ color: '#64748B', textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleDelete} disabled={deleting} variant="contained" color="error"
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
            {deleting ? 'Deleting…' : 'Delete Job'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
