const Job         = require('../models/Job');
const Application = require('../models/Application');
const Match       = require('../models/Match');

exports.getRecruiterAnalytics = async (req, res) => {
  try {
    const recruiterId = req.user._id;

    // ── Jobs ─────────────────────────────────────────────────
    const jobs   = await Job.find({ recruiter: recruiterId }).lean();
    const jobIds = jobs.map(j => j._id);

    if (!jobIds.length) {
      return res.json({
        summary: { totalJobs:0, activeJobs:0, totalApplications:0, totalCandidates:0, avgMatchScore:0 },
        appsByJob:[], stageDistribution:[], scoreDistribution:[],
        appsOverTime:[], topJobSkills:[], topCandidateSkills:[],
      });
    }

    // ── Applications ─────────────────────────────────────────
    const applications = await Application.find({ job: { $in: jobIds } }).lean();

    // Apps per job
    const appCountByJob = {};
    applications.forEach(a => {
      const id = a.job.toString();
      appCountByJob[id] = (appCountByJob[id] || 0) + 1;
    });
    const appsByJob = jobs
      .map(j => ({
        name: j.title.length > 24 ? j.title.slice(0, 24) + '…' : j.title,
        applications: appCountByJob[j._id.toString()] || 0,
      }))
      .filter(j => j.applications > 0)
      .sort((a, b) => b.applications - a.applications);

    // Pipeline stage distribution
    const stageCounts = {};
    applications.forEach(a => { stageCounts[a.stage] = (stageCounts[a.stage] || 0) + 1; });
    const STAGES = ['applied','reviewed','interview','offer','hired','rejected'];
    const stageDistribution = STAGES
      .map(s => ({ stage: s, count: stageCounts[s] || 0 }))
      .filter(s => s.count > 0);

    // Apps over time — last 14 days
    const dayMap = {};
    const cutoff = new Date(Date.now() - 14 * 86400000);
    applications.filter(a => new Date(a.createdAt) >= cutoff).forEach(a => {
      const d = new Date(a.createdAt).toISOString().slice(0, 10);
      dayMap[d] = (dayMap[d] || 0) + 1;
    });
    const appsOverTime = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10);
      return { date: d.slice(5), count: dayMap[d] || 0 };
    });

    // ── Matches ───────────────────────────────────────────────
    const matches = await Match.find({ job: { $in: jobIds } }).lean();
    const uniqueCandidates = new Set(matches.map(m => m.resume?.toString())).size;
    const avgMatchScore = matches.length
      ? Math.round(matches.reduce((a, m) => a + (m.score || 0), 0) / matches.length * 100)
      : 0;

    // Score distribution buckets
    const buckets = [
      { range: '0–20%',   min: 0,   max: 0.2  },
      { range: '20–40%',  min: 0.2, max: 0.4  },
      { range: '40–60%',  min: 0.4, max: 0.6  },
      { range: '60–80%',  min: 0.6, max: 0.8  },
      { range: '80–100%', min: 0.8, max: 1.01 },
    ];
    const scoreDistribution = buckets.map(b => ({
      range: b.range,
      candidates: matches.filter(m => (m.score||0) >= b.min && (m.score||0) < b.max).length,
    }));

    // ── Skills ────────────────────────────────────────────────
    const jobSkillCounts = {};
    jobs.forEach(j => (j.skills || []).forEach(s => {
      jobSkillCounts[s] = (jobSkillCounts[s] || 0) + 1;
    }));
    const topJobSkills = Object.entries(jobSkillCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    const candidateSkillCounts = {};
    matches.forEach(m => (m.matchedSkills || []).forEach(s => {
      candidateSkillCounts[s] = (candidateSkillCounts[s] || 0) + 1;
    }));
    const topCandidateSkills = Object.entries(candidateSkillCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    res.json({
      summary: {
        totalJobs:         jobs.length,
        activeJobs:        jobs.filter(j => j.status === 'active').length,
        totalApplications: applications.length,
        totalCandidates:   uniqueCandidates,
        avgMatchScore,
      },
      appsByJob,
      stageDistribution,
      scoreDistribution,
      appsOverTime,
      topJobSkills,
      topCandidateSkills,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: err.message });
  }
};
