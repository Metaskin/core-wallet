const router     = require('express').Router();
const controller = require('../controllers/loanController');
const { authenticate } = require('../middleware/authenticate');

router.use(authenticate);

router.get('/',               controller.getAll);
router.get('/:id',            controller.getOne);
router.post('/:id/payment',   controller.makePayment);

module.exports = router;
