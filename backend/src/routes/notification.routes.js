const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/notification.controller');

router.get('/',              protect, ctrl.getNotifications);
router.patch('/read-all',    protect, ctrl.markAllRead);
router.patch('/:id/read',    protect, ctrl.markRead);

module.exports = router;
