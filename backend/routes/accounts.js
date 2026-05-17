const router     = require('express').Router();
const controller = require('../controllers/accountController');
const { authenticate } = require('../middleware/authenticate');

router.use(authenticate);

router.get('/me',               controller.getMyAccounts);
router.post('/savings',         controller.createSavingsAccount);
router.post('/internal-transfer', controller.internalTransfer);

module.exports = router;
