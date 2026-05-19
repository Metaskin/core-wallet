const router     = require('express').Router();
const controller = require('../controllers/travelNoticeController');
const { authenticate } = require('../middleware/authenticate');

router.use(authenticate);

router.get('/',      controller.getAll);
router.post('/',     controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.cancel);

module.exports = router;
