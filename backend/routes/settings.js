const router     = require('express').Router();
const controller = require('../controllers/settingsController');
const { authenticate } = require('../middleware/authenticate');

router.use(authenticate);

router.get   ('/profile',       controller.getProfile);
router.patch ('/profile',       controller.updateProfile);

router.get   ('/notifications', controller.getNotifPrefs);
router.patch ('/notifications', controller.updateNotifPrefs);

router.get   ('/security',      controller.getSecuritySettings);
router.patch ('/security',      controller.updateSecuritySettings);

router.get   ('/sessions',      controller.getActiveSessions);

module.exports = router;
