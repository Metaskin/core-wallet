const router     = require('express').Router();
const controller = require('../controllers/beneficiaryController');
const { authenticate } = require('../middleware/authenticate');

router.use(authenticate);

router.get('/',      controller.getAll);
router.post('/',     controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
