const router     = require('express').Router();
const controller = require('../controllers/checkDepositController');
const { authenticate } = require('../middleware/authenticate');

router.use(authenticate);

router.get('/',     controller.getAll);
router.post('/',    controller.submit);
router.get('/:id',  controller.getOne);

module.exports = router;
