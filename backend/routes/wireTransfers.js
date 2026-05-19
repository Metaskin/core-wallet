const router     = require('express').Router();
const controller = require('../controllers/wireTransferController');
const { authenticate } = require('../middleware/authenticate');

router.use(authenticate);

router.get('/',              controller.getAll);
router.post('/',             controller.initiate);
router.get('/:id',           controller.getOne);
router.patch('/:id/cancel',  controller.cancel);

module.exports = router;
