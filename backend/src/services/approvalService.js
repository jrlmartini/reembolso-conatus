const pool = require('../config/database');

async function approveTrip(tripId, approverId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tripRes = await client.query('SELECT * FROM trips WHERE id=$1 FOR UPDATE', [tripId]);
    const trip = tripRes.rows[0];
    if (!trip) throw { status: 404, message: 'Viagem não encontrada' };
    if (trip.status !== 'IN_APPROVAL') throw { status: 400, message: 'Viagem não está em aprovação' };

    // opcional: validar se approverId é o aprovador do cost center
    const costCenter = await client.query('SELECT approver_user_id FROM cost_centers WHERE id=$1', [trip.cost_center_id]);
    const approverUserId = costCenter.rows[0]?.approver_user_id;
    if (approverUserId && approverUserId !== approverId) {
      throw { status: 403, message: 'Usuário não é aprovador deste centro de custo' };
    }

    await client.query('UPDATE trips SET status=\'APPROVED\', approved_at=NOW(), updated_at=NOW() WHERE id=$1', [tripId]);
    await client.query(
      `INSERT INTO trip_approvals (trip_id, actor_user_id, approver_user_id, action_type)
       VALUES ($1, $2, $2, 'APPROVED')`,
      [tripId, approverId]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function rejectTrip(tripId, approverId, comment) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tripRes = await client.query('SELECT * FROM trips WHERE id=$1 FOR UPDATE', [tripId]);
    const trip = tripRes.rows[0];
    if (!trip) throw { status: 404, message: 'Viagem não encontrada' };
    if (trip.status !== 'IN_APPROVAL') throw { status: 400, message: 'Viagem não está em aprovação' };

    const costCenter = await client.query('SELECT approver_user_id FROM cost_centers WHERE id=$1', [trip.cost_center_id]);
    const approverUserId = costCenter.rows[0]?.approver_user_id;
    if (approverUserId && approverUserId !== approverId) {
      throw { status: 403, message: 'Usuário não é aprovador deste centro de custo' };
    }

    await client.query("UPDATE trips SET status='REJECTED', rejected_at=NOW(), updated_at=NOW() WHERE id=$1", [tripId]);
    await client.query(
      `INSERT INTO trip_approvals (trip_id, actor_user_id, approver_user_id, action_type, comment)
       VALUES ($1, $2, $2, 'REJECTED', $3)`
      , [tripId, approverId, comment || '']
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { approveTrip, rejectTrip };
