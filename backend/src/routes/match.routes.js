const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const { getMatchesForJob, getMyMatches } = require('../controllers/match.controller');

// Recruiter: ranked shortlist for a job
router.get('/job/:jobId', protect, requireRole('recruiter'), getMatchesForJob);
// Candidate: their match results
router.get('/mine',       protect, requireRole('candidate'), getMyMatches);

module.exports = router;
