const Bull = require('bull');
const axios = require('axios');
const Resume = require('../models/Resume');
const Match  = require('../models/Match');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const parseQueue = new Bull('resume-parse', REDIS_URL);
const matchQueue = new Bull('job-match',    REDIS_URL);

// ── Parse worker ─────────────────────────────────────────────
parseQueue.process(async (job) => {
  const { resumeId } = job.data;
  await Resume.findByIdAndUpdate(resumeId, { status: 'processing' });
  try {
    const resume = await Resume.findById(resumeId);
    const { data } = await axios.post(
      `${process.env.NLP_PARSER_URL}/parse`,
      { resume_id: resumeId, text: resume.parsedProfile?.rawText || '' },
      { timeout: 30000 }
    );
    await Resume.findByIdAndUpdate(resumeId, {
      status: 'completed',
      parsedProfile: data.profile,
    });
    // Enqueue matching for all active jobs
    matchQueue.add({ resumeId }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
  } catch (err) {
    await Resume.findByIdAndUpdate(resumeId, { status: 'failed', errorMsg: err.message });
    throw err; // triggers Bull retry
  }
});

// ── Match worker ──────────────────────────────────────────────
matchQueue.process(async (job) => {
  const { resumeId } = job.data;
  const resume = await Resume.findById(resumeId).populate('candidate');
  const Job = require('../models/Job');
  const jobs = await Job.find({ status: 'active' });
  for (const j of jobs) {
    const { data } = await axios.post(
      `${process.env.NLP_MATCHER_URL}/match`,
      { resume_profile: resume.parsedProfile, job_description: `${j.title} ${j.description} ${j.skills.join(' ')}` },
      { timeout: 30000 }
    );
    await Match.findOneAndUpdate(
      { job: j._id, resume: resumeId },
      { candidate: resume.candidate, score: data.score,
        matchedSkills: data.matched_skills, missingSkills: data.missing_skills,
        explanation: data.explanation },
      { upsert: true }
    );
  }
});

parseQueue.on('failed', (job, err) => console.error(`Parse job ${job.id} failed:`, err.message));
matchQueue.on('failed', (job, err) => console.error(`Match job ${job.id} failed:`, err.message));

module.exports = { parseQueue, matchQueue };
