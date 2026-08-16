const Bull   = require('bull');
const axios  = require('axios');
const Resume = require('../models/Resume');
const Match  = require('../models/Match');

const REDIS_URL   = process.env.REDIS_URL || 'redis://localhost:6379';
const parseQueue  = new Bull('resume-parse', REDIS_URL);
const matchQueue  = new Bull('job-match',    REDIS_URL);

// ── Parse worker ─────────────────────────────────────────────
parseQueue.process(async (job) => {
  const { resumeId } = job.data;
  await Resume.findByIdAndUpdate(resumeId, { status: 'processing' });
  try {
    const resume = await Resume.findById(resumeId);
    const rawText = resume.parsedProfile?.rawText || '';

    const { data } = await axios.post(
      `${process.env.NLP_PARSER_URL}/parse`,
      { resume_id: resumeId, text: rawText },
      { timeout: 30000 }
    );

    const p = data.profile;

    // Use $set on individual sub-fields so parsedProfile.rawText is preserved
    await Resume.findByIdAndUpdate(resumeId, {
      status: 'completed',
      $set: {
        'parsedProfile.name':         p.name         || null,
        'parsedProfile.email':        p.email        || null,
        'parsedProfile.phone':        p.phone        || null,
        'parsedProfile.skills':       p.skills       || [],
        'parsedProfile.degrees':      p.degrees      || [],
        'parsedProfile.institutions': p.institutions || [],
        'parsedProfile.jobTitles':    p.job_titles   || [],
        'parsedProfile.companies':    p.companies    || [],
      },
    });

    // Enqueue matching for all active jobs
    matchQueue.add({ resumeId }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  } catch (err) {
    await Resume.findByIdAndUpdate(resumeId, { status: 'failed', errorMsg: err.message });
    throw err;
  }
});

// ── Match worker ──────────────────────────────────────────────
matchQueue.process(async (job) => {
  const { resumeId } = job.data;
  const resume = await Resume.findById(resumeId).populate('candidate');
  const Job    = require('../models/Job');
  const jobs   = await Job.find({ status: 'active' });

  // Build profile dict — include rawText explicitly so matcher does holistic analysis
  const profileForMatcher = {
    name:         resume.parsedProfile?.name,
    email:        resume.parsedProfile?.email,
    skills:       resume.parsedProfile?.skills       || [],
    degrees:      resume.parsedProfile?.degrees      || [],
    institutions: resume.parsedProfile?.institutions || [],
    jobTitles:    resume.parsedProfile?.jobTitles    || [],
    companies:    resume.parsedProfile?.companies    || [],
    rawText:      resume.parsedProfile?.rawText      || '',
  };

  for (const j of jobs) {
    const jobText = `${j.title} ${j.description} ${(j.skills || []).join(' ')}`;
    const { data } = await axios.post(
      `${process.env.NLP_MATCHER_URL}/match`,
      { resume_profile: profileForMatcher, job_description: jobText },
      { timeout: 30000 }
    );
    await Match.findOneAndUpdate(
      { job: j._id, resume: resumeId },
      {
        candidate:     resume.candidate,
        score:         data.score,
        matchedSkills: data.matched_skills,
        missingSkills: data.missing_skills,
        explanation:   data.explanation,
      },
      { upsert: true }
    );
  }
});

parseQueue.on('failed', (job, err) => console.error(`Parse job ${job.id} failed:`, err.message));
matchQueue.on('failed', (job, err) => console.error(`Match job ${job.id} failed:`, err.message));

module.exports = { parseQueue, matchQueue };
