const tripService = require('../services/tripService');

async function create(req, res) {
  try {
    const trip = await tripService.createTrip({ ...req.body, user_id: req.user.id });
    res.status(201).json(trip);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Erro ao criar viagem' });
  }
}

async function listMyTrips(req, res) {
  try {
    const trips = await tripService.listTripsForUser(req.user.id);
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar viagens' });
  }
}

async function submit(req, res) {
  try {
    await tripService.submitTrip(req.params.id, req.user.id);
    res.status(200).json({ message: 'Viagem enviada para aprovação' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Erro ao enviar viagem' });
  }
}

module.exports = { create, listMyTrips, submit };
