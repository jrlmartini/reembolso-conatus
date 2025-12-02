const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.use(authenticate, requireRole('approver'));
router.post('/:id/approve', approvalController.approve);
router.post('/:id/reject', approvalController.reject);

module.exports = router;
