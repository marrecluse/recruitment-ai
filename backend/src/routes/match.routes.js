const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const { getMatchesForJob, getMyMatches, getCandidatesForRecruiter, getRecruiterAnalytics } = require('../controllers/match.controller');

router.get('/job/:jobId',   protect, requireRole('recruiter', 'admin'), getMatchesForJob);
router.get('/mine',         protect, requireRole('candidate'),           getMyMatches);
router.get('/candidates',   protect, requireRole('recruiter', 'admin'), getCandidatesForRecruiter);
router.get('/analytics',    protect, requireRole('recruiter', 'admin'), getRecruiterAnalytics);

module.exports = router;
