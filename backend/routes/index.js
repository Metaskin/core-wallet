const router = require('express').Router();

router.use('/auth',           require('./auth'));
router.use('/transactions',   require('./transactions'));
router.use('/accounts',       require('./accounts'));
router.use('/cards',          require('./cards'));
router.use('/security',       require('./security'));
router.use('/admin',          require('./admin'));
router.use('/support',        require('./support'));
router.use('/notifications',  require('./notifications'));
router.use('/autopay',        require('./autopay'));
router.use('/loans',          require('./loans'));
router.use('/investments',    require('./investments'));
router.use('/beneficiaries',  require('./beneficiaries'));
router.use('/travel-notices', require('./travelNotices'));
router.use('/check-deposits', require('./checkDeposits'));
router.use('/wire-transfers', require('./wireTransfers'));
router.use('/bill-pay',       require('./billPay'));
router.use('/credit-score',   require('./creditScore'));
router.use('/cashback',       require('./cashback'));
router.use('/settings',       require('./settings'));

module.exports = router;
