const router = require('express').Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { register, login, refresh, logout, deleteAccount } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

router.post('/register', authLimiter, [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['recruiter', 'candidate']),
], register);

router.post('/login',   authLimiter, [
  body('email').isEmail(),
  body('password').notEmpty(),
], login);

router.post('/refresh', refresh);
router.post('/logout',  protect, logout);
router.delete('/me',    protect, deleteAccount);

module.exports = router;
