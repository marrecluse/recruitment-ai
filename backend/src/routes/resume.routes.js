const router = require('express').Router();
const multer = require('multer');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { uploadResume, getResumeStatus, getMyResumes, deleteResume, getCandidateResume, serveResumeFile } = require('../controllers/resume.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, allowed.includes(file.mimetype));
  }
});

router.post('/upload',              protect, requireRole('candidate'), upload.single('resume'), uploadResume);
router.get('/my',                   protect, requireRole('candidate'), getMyResumes);
router.get('/candidate/:candidateId', protect, requireRole('recruiter','admin'), getCandidateResume);
router.get('/:id/status',           protect, getResumeStatus);
router.delete('/:id',               protect, requireRole('candidate'), deleteResume);

router.get('/:id/file', protect, serveResumeFile);
module.exports = router;
