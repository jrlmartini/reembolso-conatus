const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);
router.post('/', tripController.create);
router.get('/', tripController.listMyTrips);
router.post('/:id/submit', tripController.submit);
router.post('/:tripId/expenses', expenseController.create);
router.get('/:tripId/expenses', expenseController.list);

module.exports = router;
