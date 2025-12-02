const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.use(authenticate, requireRole('admin'));
router.get('/', userController.list);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.remove);

module.exports = router;
