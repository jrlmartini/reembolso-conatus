const expenseService = require('../services/expenseService');

async function create(req, res) {
  const { tripId } = req.params;
  try {
    const expense = await expenseService.createExpense({
      trip_id: tripId,
      category_id: req.body.expense_category_id,
      payment_method_id: req.body.payment_method_id,
      cost_center_id: req.body.cost_center_id,
      spent_at: req.body.spent_at,
      description: req.body.description,
      amount: req.body.amount,
      km_quantity: req.body.km_quantity,
      user_id: req.user.id
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Erro ao criar despesa' });
  }
}

async function list(req, res) {
  const { tripId } = req.params;
  try {
    const expenses = await expenseService.listExpensesForTrip(tripId, { id: req.user.id, roles: req.user.roles });
    res.json(expenses);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Erro ao listar despesas' });
  }
}

module.exports = { create, list };
