const router     = require('express').Router();
const controller = require('../controllers/plaidController');
const { authenticate } = require('../middleware/authenticate');

router.use(authenticate);

router.get('/search',            controller.searchInstitutions);
router.post('/link-token',       controller.createLinkToken);
router.post('/exchange-token',   controller.exchangeToken);
router.get('/accounts',          controller.getLinkedAccounts);
router.post('/manual-account',   controller.addManualAccount);
router.delete('/accounts/:id',   controller.unlinkAccount);
router.post('/transfers',        controller.createTransfer);
router.get('/transfers',         controller.getTransfers);
router.get('/transfers/:id',     controller.getOneTransfer);

module.exports = router;
