const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const User        = require('../models/User');
const Job         = require('../models/Job');
const Resume      = require('../models/Resume');
const Match       = require('../models/Match');
const Application = require('../models/Application');

// All admin routes require auth + admin role
router.use(protect, requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  const [totalUsers, totalJobs, totalResumes, totalMatches, totalApplications] = await Promise.all([
    User.countDocuments(),
    Job.countDocuments(),
    Resume.countDocuments(),
    Match.countDocuments(),
    Application.countDocuments(),
  ]);
  const byRole      = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
  const activeUsers = await User.countDocuments({ isActive: { $ne: false } });
  res.json({ totalUsers, totalJobs, totalResumes, totalMatches, totalApplications, byRole, activeUsers });
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const users = await User.find({})
    .select('-password -refreshToken -passwordResetToken')
    .sort({ createdAt: -1 });
  res.json(users);
});

// POST /api/admin/users — create user
router.post('/users', async (req, res) => {
  const { name, email, password, role, isActive } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'name, email and password are required' });
  if (await User.findOne({ email }))
    return res.status(409).json({ error: 'Email already in use' });
  const user = await User.create({
    name, email, password,
    role: role || 'candidate',
    isActive: isActive !== false,
  });
  const safe = await User.findById(user._id).select('-password -refreshToken -passwordResetToken');
  res.status(201).json(safe);
});

// PATCH /api/admin/users/:id — update name, email, role, status, or password
router.patch('/users/:id', async (req, res) => {
  const { role, isActive, name, email, password } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (role     !== undefined) user.role     = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (name)                   user.name     = name;
  if (email)                  user.email    = email;
  if (password)               user.password = password; // triggers bcrypt pre-save hook

  await user.save();
  const safe = await User.findById(user._id).select('-password -refreshToken -passwordResetToken');
  res.json(safe);
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user._id.toString())
    return res.status(400).json({ error: 'Cannot delete yourself' });
  await User.findByIdAndDelete(req.params.id);
  await Resume.deleteMany({ candidate: req.params.id });
  await Match.deleteMany({ candidate: req.params.id });
  res.json({ message: 'User deleted' });
});

// GET /api/admin/jobs
router.get('/jobs', async (req, res) => {
  const jobs = await Job.find({}).populate('recruiter', 'name email').sort({ createdAt: -1 });
  res.json(jobs);
});

// PATCH /api/admin/jobs/:id — toggle status
router.patch('/jobs/:id', async (req, res) => {
  const { status } = req.body;
  const job = await Job.findByIdAndUpdate(req.params.id, { status }, { new: true })
    .populate('recruiter', 'name email');
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// DELETE /api/admin/jobs/:id
router.delete('/jobs/:id', async (req, res) => {
  await Job.findByIdAndDelete(req.params.id);
  res.json({ message: 'Job deleted' });
});

module.exports = router;
