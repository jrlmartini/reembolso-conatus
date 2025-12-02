const pool = require('../config/database');

async function createTrip({ user_id, cost_center_id, destination, purpose, start_date, end_date }) {
  const { rows } = await pool.query(
    `INSERT INTO trips (user_id, cost_center_id, destination, purpose, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [user_id, cost_center_id, destination, purpose, start_date, end_date || null]
  );
  return rows[0];
}

async function listTripsForUser(userId) {
  const { rows } = await pool.query('SELECT * FROM trips WHERE user_id=$1 ORDER BY created_at DESC', [userId]);
  return rows;
}

async function getTripById(id) {
  const { rows } = await pool.query('SELECT * FROM trips WHERE id=$1', [id]);
  return rows[0];
}

async function submitTrip(tripId, actorUserId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tripRes = await client.query('SELECT * FROM trips WHERE id=$1 FOR UPDATE', [tripId]);
    const trip = tripRes.rows[0];
    if (!trip) throw { status: 404, message: 'Viagem não encontrada' };
    if (trip.user_id !== actorUserId) throw { status: 403, message: 'Não autorizado a enviar esta viagem' };
    if (trip.status !== 'DRAFT' && trip.status !== 'REJECTED') throw { status: 400, message: 'Viagem não está editável' };

    await client.query(
      `UPDATE trips SET status='IN_APPROVAL', submitted_at=NOW(), updated_at=NOW() WHERE id=$1`,
      [tripId]
    );
    await client.query(
      `INSERT INTO trip_approvals (trip_id, actor_user_id, approver_user_id, action_type, comment)
       VALUES ($1, $2, $3, 'SUBMITTED', $4)`,
      [tripId, actorUserId, trip.cost_center_id ? null : null, 'Enviado para aprovação']
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createTrip, listTripsForUser, getTripById, submitTrip };
