const router = require('express').Router();
const multer = require('multer');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { uploadResume, getResumeStatus, getMyResumes } = require('../controllers/resume.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, allowed.includes(file.mimetype));
  }
});

router.post('/upload', protect, requireRole('candidate'), upload.single('resume'), uploadResume);
router.get('/mine',    protect, requireRole('candidate'), getMyResumes);
router.get('/:id/status', protect, getResumeStatus);

module.exports = router;
