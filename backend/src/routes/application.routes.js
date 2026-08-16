const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/application.controller');

// Candidate
router.post('/',         protect, requireRole('candidate'), ctrl.apply);
router.get('/my',        protect, requireRole('candidate'), ctrl.getMyApplications);
router.delete('/:id',    protect, requireRole('candidate'), ctrl.withdrawApplication);

// Recruiter
router.get('/pipeline',      protect, requireRole('recruiter','admin'), ctrl.getPipelineSummary);
router.get('/job/:jobId',    protect, requireRole('recruiter','admin'), ctrl.getApplicationsForJob);
router.patch('/:id/stage',   protect, requireRole('recruiter','admin'), ctrl.updateStage);
router.patch('/:id/notes',   protect, requireRole('recruiter','admin'), ctrl.updateNotes);

module.exports = router;
