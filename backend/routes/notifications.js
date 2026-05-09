const router     = require('express').Router();
const controller = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authenticate');

router.use(authenticate);

// Order matters: /read-all before /:id so the literal path wins
router.get('/',            controller.getNotifications);
router.get('/unread-count', controller.getUnreadCount);
router.patch('/read-all',  controller.markAllRead);
router.patch('/:id/read',  controller.markRead);
router.delete('/:id',      controller.deleteNotification);

module.exports = router;
