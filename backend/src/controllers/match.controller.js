const Match  = require('../models/Match');
const Resume = require('../models/Resume');
const User   = require('../models/User');

exports.getMatchesForJob = async (req, res) => {
  const matches = await Match.find({ job: req.params.jobId })
    .sort({ score: -1 })
    .populate('candidate', 'name email')
    .populate('resume', 'filename status parsedProfile');
  const ranked = matches.map((m, i) => ({ ...m.toObject(), rank: i + 1 }));
  res.json(ranked);
};

// Candidate: get my matches, optionally filtered by a specific resume
exports.getMyMatches = async (req, res) => {
  const filter = { candidate: req.user._id };
  if (req.query.resumeId) {
    filter.resume = req.query.resumeId;
  }

  const matches = await Match.find(filter)
    .sort({ score: -1 })
    .populate('job', 'title description');

  // If filtered by specific resume: return all matches for that CV (no dedup)
  if (req.query.resumeId) {
    return res.json(matches);
  }

  // Default (no filter): return best match per job across all resumes
  const seen = new Map();
  for (const m of matches) {
    const jobId = m.job?._id?.toString();
    if (!jobId) continue;
    if (!seen.has(jobId) || m.score > seen.get(jobId).score) {
      seen.set(jobId, m);
    }
  }
  res.json(Array.from(seen.values()).sort((a, b) => b.score - a.score));
};

// Recruiter: all candidates who have matches for their jobs
exports.getCandidatesForRecruiter = async (req, res) => {
  const Job = require('../models/Job');
  const myJobs = await Job.find({ recruiter: req.user._id }).select('_id title');
  const jobIds = myJobs.map(j => j._id);

  const matches = await Match.find({ job: { $in: jobIds } })
    .populate('candidate', 'name email createdAt')
    .populate('job', 'title')
    .populate('resume', 'filename parsedProfile status')
    .sort({ score: -1 });

  // Group by candidate
  const byCandidate = new Map();
  for (const m of matches) {
    const cId = m.candidate?._id?.toString();
    if (!cId) continue;
    if (!byCandidate.has(cId)) {
      byCandidate.set(cId, {
        candidate: m.candidate,
        matches: [],
        topScore: 0,
        skills: [],
      });
    }
    const entry = byCandidate.get(cId);
    entry.matches.push({ job: m.job, score: m.score, rank: m.rank });
    if (m.score > entry.topScore) entry.topScore = m.score;
    const skills = m.resume?.parsedProfile?.skills || [];
    for (const s of skills) {
      if (!entry.skills.includes(s)) entry.skills.push(s);
    }
  }

  res.json(Array.from(byCandidate.values()).sort((a, b) => b.topScore - a.topScore));
};

// Recruiter analytics
exports.getRecruiterAnalytics = async (req, res) => {
  const Job = require('../models/Job');
  const myJobs = await Job.find({ recruiter: req.user._id });
  const jobIds = myJobs.map(j => j._id);

  const matches = await Match.find({ job: { $in: jobIds } })
    .populate('resume', 'parsedProfile');

  const scoresByJob = {};
  myJobs.forEach(j => { scoresByJob[j._id.toString()] = { title: j.title, scores: [], candidateCount: 0 }; });

  const skillFreq = {};
  const scoreBuckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
  const seenCandidates = new Set();

  for (const m of matches) {
    const jobKey = m.job.toString();
    if (scoresByJob[jobKey]) {
      scoresByJob[jobKey].scores.push(m.score);
    }
    seenCandidates.add(m.candidate.toString());

    const pct = m.score * 100;
    if (pct <= 20) scoreBuckets['0-20']++;
    else if (pct <= 40) scoreBuckets['21-40']++;
    else if (pct <= 60) scoreBuckets['41-60']++;
    else if (pct <= 80) scoreBuckets['61-80']++;
    else scoreBuckets['81-100']++;

    for (const s of (m.resume?.parsedProfile?.skills || [])) {
      skillFreq[s] = (skillFreq[s] || 0) + 1;
    }
  }

  const jobStats = Object.values(scoresByJob).map(j => ({
    title: j.title,
    candidateCount: j.scores.length,
    avgScore: j.scores.length ? (j.scores.reduce((a, b) => a + b, 0) / j.scores.length * 100).toFixed(1) : 0,
    maxScore: j.scores.length ? (Math.max(...j.scores) * 100).toFixed(1) : 0,
  }));

  const topSkills = Object.entries(skillFreq).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  res.json({
    totalJobs: myJobs.length,
    totalMatches: matches.length,
    uniqueCandidates: seenCandidates.size,
    jobStats,
    topSkills,
    scoreBuckets,
  });
};
