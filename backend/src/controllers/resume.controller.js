const Resume = require('../models/Resume');
const { parseQueue } = require('../services/queue.service');

exports.uploadResume = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const resume = await Resume.create({
    candidate: req.user._id,
    filename:  req.file.originalname,
    mimetype:  req.file.mimetype,
    status:    'pending',
    parsedProfile: { rawText: req.file.buffer.toString('utf-8').slice(0, 5000) },
  });
  await parseQueue.add({ resumeId: resume._id }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });
  res.status(202).json({ resumeId: resume._id, status: 'pending', message: 'Resume queued for parsing' });
};

exports.getResumeStatus = async (req, res) => {
  const resume = await Resume.findById(req.params.id).select('status errorMsg parsedProfile');
  if (!resume) return res.status(404).json({ error: 'Resume not found' });
  res.json(resume);
};

exports.getMyResumes = async (req, res) => {
  const resumes = await Resume.find({ candidate: req.user._id }).select('-parsedProfile.rawText');
  res.json(resumes);
};
