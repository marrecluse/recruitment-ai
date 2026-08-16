const Job = require('../models/Job');

// Auto-close any jobs whose closingDate has passed
const autoClose = () =>
  Job.updateMany(
    { status: 'active', closingDate: { $ne: null, $lt: new Date() } },
    { $set: { status: 'closed' } }
  ).catch(() => {});

exports.getJobs = async (req, res) => {
  await autoClose();
  const jobs = await Job.find({ status: 'active' }).populate('recruiter', 'name email');
  res.json(jobs);
};

exports.getMyJobs = async (req, res) => {
  await autoClose();
  const jobs = await Job.find({ recruiter: req.user._id }).sort({ createdAt: -1 });
  res.json(jobs);
};

exports.getJob = async (req, res) => {
  const job = await Job.findById(req.params.id).populate('recruiter', 'name email');
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
};

exports.createJob = async (req, res) => {
  const { title, description, skills, location, salary, type, closingDate } = req.body;
  const job = await Job.create({
    title, description,
    skills: skills || [],
    location: location || '',
    salary: salary || '',
    type: type || 'full-time',
    closingDate: closingDate || null,
    recruiter: req.user._id,
  });
  res.status(201).json(job);
};

exports.updateJob = async (req, res) => {
  const job = await Job.findOneAndUpdate(
    { _id: req.params.id, recruiter: req.user._id },
    req.body, { new: true }
  );
  if (!job) return res.status(404).json({ error: 'Job not found or not yours' });
  res.json(job);
};

exports.deleteJob = async (req, res) => {
  const job = await Job.findOneAndDelete({ _id: req.params.id, recruiter: req.user._id });
  if (!job) return res.status(404).json({ error: 'Job not found or not yours' });
  res.json({ message: 'Job deleted' });
};
