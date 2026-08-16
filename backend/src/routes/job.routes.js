const router = require('express').Router();
const { body } = require('express-validator');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { getJobs, getJob, getMyJobs, createJob, updateJob, deleteJob } = require('../controllers/job.controller');

router.get('/',      protect, getJobs);
router.get('/my',    protect, requireRole('recruiter', 'admin'), getMyJobs);
router.get('/:id',   protect, getJob);

router.post('/', protect, requireRole('recruiter', 'admin'), [
  body('title').notEmpty(),
  body('description').notEmpty(),
], createJob);

router.put('/:id',    protect, requireRole('recruiter', 'admin'), updateJob);
router.patch('/:id',  protect, requireRole('recruiter', 'admin'), updateJob);
router.delete('/:id', protect, requireRole('recruiter', 'admin'), deleteJob);

module.exports = router;
