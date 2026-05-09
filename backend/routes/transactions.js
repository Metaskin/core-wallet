const router     = require('express').Router();
const controller = require('../controllers/transactionController');
const { authenticate } = require('../middleware/authenticate');
const { transfer: transferLimiter } = require('../middleware/rateLimiter');
const validate   = require('../middleware/validate');
const validators = require('../validators/transactionValidators');

router.use(authenticate);

router.post('/send',    transferLimiter, validate(validators.transfer), controller.transfer);
router.get('/',         controller.getMyTransactions);
router.delete('/:id',   controller.deleteTransaction);

module.exports = router;
