const router     = require('express').Router();
const controller = require('../controllers/cashbackController');
const { authenticate } = require('../middleware/authenticate');

router.use(authenticate);

router.get('/',              controller.getOverview);
router.get('/transactions',  controller.getTransactions);
router.post('/redeem',       controller.redeem);

module.exports = router;
