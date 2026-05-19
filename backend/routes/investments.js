const router     = require('express').Router();
const controller = require('../controllers/investmentController');
const { authenticate } = require('../middleware/authenticate');

router.use(authenticate);

router.get('/',              controller.getOverview);
router.post('/transfer',     controller.transfer);
router.get('/transactions',  controller.getTransactions);

module.exports = router;
