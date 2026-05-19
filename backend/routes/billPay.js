const router     = require('express').Router();
const controller = require('../controllers/billPayController');
const { authenticate } = require('../middleware/authenticate');

router.use(authenticate);

router.get('/billers',       controller.getBillers);
router.post('/billers',      controller.addBiller);
router.delete('/billers/:id', controller.removeBiller);

router.get('/payments',       controller.getPayments);
router.post('/payments',      controller.schedulePayment);
router.delete('/payments/:id', controller.cancelPayment);

module.exports = router;
