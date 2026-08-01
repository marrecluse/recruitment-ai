const Job = require('../models/Job');

exports.getJobs = async (req, res) => {
  const jobs = await Job.find({ status: 'active' }).populate('recruiter', 'name email');
  res.json(jobs);
};

exports.getJob = async (req, res) => {
  const job = await Job.findById(req.params.id).populate('recruiter', 'name email');
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
};

exports.createJob = async (req, res) => {
  const job = await Job.create({ ...req.body, recruiter: req.user._id });
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
  await Job.findOneAndDelete({ _id: req.params.id, recruiter: req.user._id });
  res.json({ message: 'Job deleted' });
};
