const Match = require('../models/Match');

exports.getMatchesForJob = async (req, res) => {
  const matches = await Match.find({ job: req.params.jobId })
    .sort({ score: -1 })
    .populate('candidate', 'name email')
    .populate('resume', 'filename status');
  // Add rank
  const ranked = matches.map((m, i) => ({ ...m.toObject(), rank: i + 1 }));
  res.json(ranked);
};

exports.getMyMatches = async (req, res) => {
  const matches = await Match.find({ candidate: req.user._id })
    .sort({ score: -1 })
    .populate('job', 'title description');
  res.json(matches);
};
