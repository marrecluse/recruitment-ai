const router = require('express').Router();
const { body } = require('express-validator');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { getJobs, getJob, createJob, updateJob, deleteJob } = require('../controllers/job.controller');

router.get('/',    protect, getJobs);
router.get('/:id', protect, getJob);
router.post('/',   protect, requireRole('recruiter'), [
  body('title').notEmpty(),
  body('description').notEmpty(),
], createJob);
router.put('/:id',    protect, requireRole('recruiter'), updateJob);
router.delete('/:id', protect, requireRole('recruiter'), deleteJob);

module.exports = router;
