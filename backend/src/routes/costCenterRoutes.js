const express = require('express');
const router = express.Router();
const costCenterController = require('../controllers/costCenterController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.use(authenticate);
router.get('/', costCenterController.list);
router.post('/', requireRole('admin'), costCenterController.create);
router.put('/:id', requireRole('admin'), costCenterController.update);

module.exports = router;
