const router     = require('express').Router();
const controller = require('../controllers/creditScoreController');
const { authenticate } = require('../middleware/authenticate');

router.use(authenticate);

router.get('/', controller.getScore);

module.exports = router;
