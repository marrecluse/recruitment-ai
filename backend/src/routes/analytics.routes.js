const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/analytics.controller');

router.get('/recruiter', protect, requireRole('recruiter', 'admin'), ctrl.getRecruiterAnalytics);

module.exports = router;
