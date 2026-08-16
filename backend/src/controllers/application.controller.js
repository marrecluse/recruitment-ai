const Application = require('../models/Application');
const Match       = require('../models/Match');
const Resume      = require('../models/Resume');
const { sendStageChangeEmail, sendNewApplicationEmail } = require('../services/email.service');
const { createNotification } = require('./notification.controller');

// ── Candidate: apply to a job ────────────────────────────────
exports.apply = async (req, res) => {
  const { jobId } = req.body;
  if (!jobId) return res.status(400).json({ error: 'jobId required' });

  const match = await Match.findOne({ candidate: req.user._id, job: jobId })
    .sort({ score: -1 });
  const resume = match
    ? await Resume.findById(match.resume).select('_id')
    : await Resume.findOne({ candidate: req.user._id, status: 'completed' })
        .sort({ createdAt: -1 }).select('_id');

  try {
    const app = await Application.create({
      candidate:     req.user._id,
      job:           jobId,
      resume:        resume?._id,
      match:         match?._id,
      score:         match?.score || 0,
      matchedSkills: match?.matchedSkills || [],
      missingSkills: match?.missingSkills || [],
      stageHistory:  [{ stage: 'applied' }],
    });

    // Email recruiter (fire-and-forget)
    try {
      const Job  = require('../models/Job');
      const User = require('../models/User');
      const job  = await Job.findById(jobId).select('title recruiter').lean();
      if (job) {
        const recruiter = await User.findById(job.recruiter).select('name email').lean();
        if (recruiter?.email) {
          createNotification({
            userId:  recruiter._id,
            type:    'new_application',
            title:   'New Application',
            message: `${req.user.name} applied for ${job.title}`,
            meta:    { jobId: job._id, candidateName: req.user.name, score: match?.score || 0 },
          }).catch(() => {});
          sendNewApplicationEmail({
            to:             recruiter.email,
            recruiterName:  recruiter.name,
            candidateName:  req.user.name,
            candidateEmail: req.user.email,
            jobTitle:       job.title,
            score:          match?.score || 0,
          }).catch(err => console.error('[email] new-application:', err.message));
        }
      }
    } catch (emailErr) {
      console.error('[email] lookup failed:', emailErr.message);
    }

    res.status(201).json(app);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Already applied to this job' });
    throw e;
  }
};

// ── Candidate: my applications ───────────────────────────────
exports.getMyApplications = async (req, res) => {
  const apps = await Application.find({ candidate: req.user._id })
    .populate('job', 'title description location type')
    .sort({ createdAt: -1 });
  res.json(apps);
};

// ── Recruiter: all applications for a job ────────────────────
exports.getApplicationsForJob = async (req, res) => {
  const Job = require('../models/Job');
  const job = await Job.findOne({ _id: req.params.jobId, recruiter: req.user._id });
  if (!job) return res.status(403).json({ error: 'Job not found or not yours' });

  const apps = await Application.find({ job: req.params.jobId })
    .populate('candidate', 'name email createdAt')
    .populate('resume', 'filename status')
    .sort({ score: -1 });
  res.json(apps);
};

// ── Recruiter: move stage ─────────────────────────────────────
exports.updateStage = async (req, res) => {
  const { stage, interviewDate } = req.body;
  const STAGES = ['applied','shortlisted','reviewed','interview','offer','hired','rejected'];
  if (!STAGES.includes(stage)) return res.status(400).json({ error: 'Invalid stage' });

  const app = await Application.findById(req.params.id)
    .populate('job', 'recruiter title')
    .populate('candidate', 'name email');
  if (!app) return res.status(404).json({ error: 'Not found' });
  if (String(app.job.recruiter) !== String(req.user._id))
    return res.status(403).json({ error: 'Forbidden' });

  app.stage = stage;
  app.stageHistory.push({ stage, changedAt: new Date() });
  if (interviewDate !== undefined) app.interviewDate = interviewDate ? new Date(interviewDate) : null;
  await app.save();

  // Email candidate (fire-and-forget)
  if (app.candidate?._id) {
    createNotification({
      userId:  app.candidate._id,
      type:    'stage_change',
      title:   'Application Update',
      message: `Your application for ${app.job.title} moved to ${stage}`,
      meta:    { stage, jobTitle: app.job.title },
    }).catch(() => {});
  }
  if (app.candidate?.email) {
    sendStageChangeEmail({
      to:            app.candidate.email,
      candidateName: app.candidate.name,
      jobTitle:      app.job.title || 'the position',
      company:       req.user.name || 'the recruiter',
      stage,
    }).catch(err => console.error('[email] stage-change:', err.message));
  }

  res.json(app);
};

// ── Recruiter: update notes ───────────────────────────────────
exports.updateNotes = async (req, res) => {
  const app = await Application.findById(req.params.id)
    .populate('job', 'recruiter');
  if (!app) return res.status(404).json({ error: 'Not found' });
  if (String(app.job.recruiter) !== String(req.user._id))
    return res.status(403).json({ error: 'Forbidden' });

  app.recruiterNotes = req.body.notes || '';
  await app.save();
  res.json({ recruiterNotes: app.recruiterNotes });
};

// ── Recruiter: pipeline summary ───────────────────────────────
exports.getPipelineSummary = async (req, res) => {
  const Job = require('../models/Job');
  const jobs = await Job.find({ recruiter: req.user._id }).select('title status createdAt');

  const counts = await Application.aggregate([
    { $match: { job: { $in: jobs.map(j => j._id) } } },
    { $group: { _id: { job: '$job', stage: '$stage' }, count: { $sum: 1 } } },
  ]);

  const byJob = {};
  for (const j of jobs) byJob[j._id] = { ...j.toObject(), stages: {} };
  for (const c of counts) {
    const jid = c._id.job.toString();
    if (byJob[jid]) byJob[jid].stages[c._id.stage] = c.count;
  }

  res.json(Object.values(byJob));
};

// ── Candidate: withdraw ───────────────────────────────────────
exports.withdrawApplication = async (req, res) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, candidate: req.user._id });
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (['hired', 'rejected'].includes(app.stage))
      return res.status(400).json({ error: 'Cannot withdraw a concluded application' });
    await app.deleteOne();
    res.json({ message: 'Application withdrawn' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
