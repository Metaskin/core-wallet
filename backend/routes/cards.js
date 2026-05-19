const router      = require('express').Router();
const controller  = require('../controllers/cardController');
const { authenticate }              = require('../middleware/authenticate');
const { cardReveal: revealLimiter } = require('../middleware/rateLimiter');
const validate    = require('../middleware/validate');
const validators  = require('../validators/cardValidators');

router.use(authenticate);

router.get('/',   controller.getMyCards);
router.post('/',  validate(validators.issueCard), controller.issueCard);

// Both paths do exactly the same thing.
// /details  — canonical name matching the API spec
// /secure-details — kept so any existing frontend code doesn't break
router.post('/:id/details',         revealLimiter, controller.getSecureDetails);
router.post('/:id/secure-details',  revealLimiter, controller.getSecureDetails);

router.patch('/:id/freeze',       controller.toggleFreeze);
router.post('/:id/replace',       controller.requestReplacement);
router.get('/:id/replacement',    controller.getReplacement);

module.exports = router;
