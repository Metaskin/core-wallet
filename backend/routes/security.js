const router     = require('express').Router();
const controller = require('../controllers/securityController');
const { authenticate } = require('../middleware/authenticate');
const validate   = require('../middleware/validate');
const { pinSchema } = require('../validators/securityValidators');
const { auth: authLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);

router.get('/has-pin',     controller.hasPin);
router.post('/set-pin',    authLimiter, validate(pinSchema), controller.setPin);
router.post('/verify-pin', authLimiter, validate(pinSchema), controller.verifyPin);

module.exports = router;
