const pool = require('../config/database');

async function getKmPolicyForUser(userId) {
  const { rows } = await pool.query(
    `SELECT kp.*
     FROM users u
     JOIN km_policies kp ON kp.position_id = u.position_id AND kp.is_active = TRUE
     WHERE u.id = $1`,
    [userId]
  );
  return rows[0];
}

async function getExpenseCategory(categoryId) {
  const { rows } = await pool.query('SELECT * FROM expense_categories WHERE id=$1', [categoryId]);
  return rows[0];
}

function applyKmPolicy({ kmPolicy, kmQuantity }) {
  if (!kmPolicy) {
    throw { status: 400, message: 'Política de quilometragem não configurada para o cargo do usuário' };
  }
  const rate = Number(kmPolicy.rate_per_km);
  const kmQty = Number(kmQuantity);
  const amountOriginal = kmQty * rate;
  let amountEffective = amountOriginal;
  let kmCapped = false;

  if (kmPolicy.exceed_behavior === 'CAP') {
    if (kmPolicy.max_km_per_trip && kmQty > Number(kmPolicy.max_km_per_trip)) {
      amountEffective = Number(kmPolicy.max_km_per_trip) * rate;
      kmCapped = true;
    }
    if (kmPolicy.max_amount_per_trip && amountEffective > Number(kmPolicy.max_amount_per_trip)) {
      amountEffective = Number(kmPolicy.max_amount_per_trip);
      kmCapped = true;
    }
  }

  return { amountOriginal, amountEffective, rateApplied: rate, kmCapped };
}

async function createExpense({ trip_id, category_id, payment_method_id, cost_center_id, spent_at, description, amount, km_quantity, user_id }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tripRes = await client.query('SELECT * FROM trips WHERE id=$1 FOR UPDATE', [trip_id]);
    const trip = tripRes.rows[0];
    if (!trip) throw { status: 404, message: 'Viagem não encontrada' };
    if (trip.status !== 'DRAFT' && trip.status !== 'REJECTED') throw { status: 400, message: 'Viagem não está editável' };
    if (trip.user_id !== user_id) throw { status: 403, message: 'Usuário não autorizado a adicionar despesa nesta viagem' };

    const category = await getExpenseCategory(category_id);
    if (!category) throw { status: 400, message: 'Categoria inválida' };

    let amount_original = amount;
    let amount_effective = amount;
    let km_rate_applied = null;
    let km_capped = false;
    let km_quantity_value = km_quantity || null;

    if (category.is_km_category) {
      if (!km_quantity) throw { status: 400, message: 'Quilometragem obrigatória para esta categoria' };
      const kmPolicy = await getKmPolicyForUser(trip.user_id);
      const result = applyKmPolicy({ kmPolicy, kmQuantity: km_quantity });
      amount_original = result.amountOriginal;
      amount_effective = result.amountEffective;
      km_rate_applied = result.rateApplied;
      km_capped = result.kmCapped;
      km_quantity_value = km_quantity;
    }

    const { rows } = await client.query(
      `INSERT INTO expenses (
          trip_id, cost_center_id, expense_category_id, payment_method_id, spent_at, description,
          amount_original, amount_effective, currency_code, km_quantity, km_rate_applied, km_capped,
          created_by_user_id, updated_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'BRL',$9,$10,$11,$12,$12)
       RETURNING *`,
      [
        trip_id,
        cost_center_id || trip.cost_center_id,
        category_id,
        payment_method_id || null,
        spent_at,
        description || null,
        amount_original,
        amount_effective,
        km_quantity_value,
        km_rate_applied,
        km_capped,
        user_id
      ]
    );

    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listExpensesForTrip(tripId, requestingUser) {
  const trip = await pool.query('SELECT * FROM trips WHERE id=$1', [tripId]);
  if (!trip.rows[0]) throw { status: 404, message: 'Viagem não encontrada' };
  if (trip.rows[0].user_id !== requestingUser && !(requestingUser.roles || []).includes('admin')) {
    throw { status: 403, message: 'Acesso negado' };
  }
  const { rows } = await pool.query('SELECT * FROM expenses WHERE trip_id=$1 ORDER BY spent_at DESC', [tripId]);
  return rows;
}

module.exports = { createExpense, listExpensesForTrip };
