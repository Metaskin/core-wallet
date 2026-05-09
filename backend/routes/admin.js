const router     = require('express').Router();
const controller = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/authenticate');
const validate   = require('../middleware/validate');
const validators = require('../validators/transactionValidators');
const Joi        = require('joi');

router.use(authenticate, requireAdmin);

const createUserSchema = Joi.object({
  email:          Joi.string().email().trim().lowercase().required(),
  password:       Joi.string().min(8).required(),
  fullName:       Joi.string().trim().min(2).required(),
  avatarColor:    Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
  initialBalance: Joi.number().min(0).default(0),
});

router.get('/users',                             controller.getAllUsers);
router.post('/users',  validate(createUserSchema), controller.createUser);
router.get('/transactions',                      controller.getAllTransactions);
router.post('/credit', validate(validators.adminAction), controller.creditAccount);
router.post('/debit',  validate(validators.adminAction), controller.debitAccount);
router.patch('/accounts/:accountId/toggle-status', controller.toggleAccountStatus);

module.exports = router;
