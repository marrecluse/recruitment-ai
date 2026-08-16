const pdfParse = require('pdf-parse');
const Resume   = require('../models/Resume');
const { parseQueue } = require('../services/queue.service');

exports.uploadResume = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Extract plain text from PDF; fall back to raw buffer for .txt
  let rawText = '';
  try {
    if (req.file.mimetype === 'application/pdf') {
      const parsed = await pdfParse(req.file.buffer);
      rawText = parsed.text.slice(0, 8000);
    } else {
      rawText = req.file.buffer.toString('utf-8').slice(0, 8000);
    }
  } catch (e) {
    rawText = req.file.buffer.toString('utf-8').slice(0, 8000);
  }

  const resume = await Resume.create({
    candidate:     req.user._id,
    filename:      req.file.originalname,
    mimetype:      req.file.mimetype,
    fileData:      req.file.buffer,
    fileMime:      req.file.mimetype,
    status:        'pending',
    parsedProfile: { rawText },
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

exports.deleteResume = async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, candidate: req.user._id });
  if (!resume) return res.status(404).json({ error: 'Not found' });
  await resume.deleteOne();
  // Also delete associated matches
  const Match = require('../models/Match');
  await Match.deleteMany({ resume: req.params.id });
  res.json({ message: 'Deleted' });
};

exports.getCandidateResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ candidate: req.params.candidateId })
      .sort({ createdAt: -1 })
      .select('filename status parsedProfile createdAt _id');
    if (!resume) return res.status(404).json({ error: 'No resume found' });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Serve resume file for inline preview ─────────────────────
exports.serveResumeFile = async (req, res) => {
  try {
    // Recruiter can view file for any candidate who applied to their job
    const resume = await Resume.findById(req.params.id).select('fileData fileMime filename candidate');
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    if (!resume.fileData) return res.status(410).json({ error: 'File not stored — was uploaded before preview support was added' });

    // Auth: candidate owns it OR recruiter has an application for it
    const isOwner = String(resume.candidate) === String(req.user._id);
    if (!isOwner) {
      const Application = require('../models/Application');
      const Job = require('../models/Job');
      const jobs = await Job.find({ recruiter: req.user._id }).select('_id').lean();
      const jobIds = jobs.map(j => j._id);
      const app = await Application.findOne({ resume: resume._id, job: { $in: jobIds } });
      if (!app) return res.status(403).json({ error: 'Forbidden' });
    }

    res.set('Content-Type', resume.fileMime || 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${resume.filename}"`);
    res.set('X-Content-Type-Options', 'nosniff');
    res.send(resume.fileData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
