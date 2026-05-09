const router = require('express').Router();

router.use('/auth',         require('./auth'));
router.use('/transactions', require('./transactions'));
router.use('/accounts',     require('./accounts'));
router.use('/cards',        require('./cards'));
router.use('/security',     require('./security'));
router.use('/admin',        require('./admin'));
router.use('/support',       require('./support'));
router.use('/notifications', require('./notifications'));

module.exports = router;
