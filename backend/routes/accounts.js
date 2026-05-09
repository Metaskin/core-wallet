const router     = require('express').Router();
const controller = require('../controllers/accountController');
const { authenticate } = require('../middleware/authenticate');

router.use(authenticate);
router.get('/me', controller.getMyAccount);

module.exports = router;
