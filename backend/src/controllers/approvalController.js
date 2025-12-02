const approvalService = require('../services/approvalService');

async function list(req, res) {
  try {
    const trips = await approvalService.listPendingTripsForApprover(req.user.id);
    res.json(trips);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Erro ao listar viagens em aprovação' });
  }
}

async function approve(req, res) {
  try {
    await approvalService.approveTrip(req.params.id, req.user.id);
    res.json({ message: 'Viagem aprovada' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Erro ao aprovar viagem' });
  }
}

async function reject(req, res) {
  try {
    await approvalService.rejectTrip(req.params.id, req.user.id, req.body.comment);
    res.json({ message: 'Viagem reprovada e reaberta para edição' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Erro ao reprovar viagem' });
  }
}

module.exports = { list, approve, reject };
