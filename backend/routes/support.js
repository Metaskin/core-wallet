const router     = require('express').Router();
const controller = require('../controllers/supportController');
const { authenticate, requireAdmin } = require('../middleware/authenticate');
const validate   = require('../middleware/validate');
const validators = require('../validators/supportValidators');

router.use(authenticate);

// User routes
router.get('/tickets',                   controller.getMyTickets);
router.post('/tickets',                  validate(validators.createTicket), controller.createTicket);
router.get('/tickets/:id',               controller.getTicketDetail);
router.post('/tickets/:id/messages',     validate(validators.addMessage),   controller.addMessage);

// Admin routes — also use getTicketDetail (authorises by role inside service)
router.get('/admin/tickets',                       requireAdmin, controller.getAllTickets);
router.patch('/admin/tickets/:id/status',          requireAdmin, validate(validators.updateStatus), controller.updateStatus);
router.post('/admin/tickets/:id/messages',         requireAdmin, validate(validators.addMessage),   controller.addMessage);

module.exports = router;
