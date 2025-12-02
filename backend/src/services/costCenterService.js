const pool = require('../config/database');

async function listCostCenters() {
  const { rows } = await pool.query('SELECT * FROM cost_centers ORDER BY name ASC');
  return rows;
}

async function createCostCenter(data) {
  const { code, name, description, kind, approver_user_id, is_active } = data;
  const { rows } = await pool.query(
    `INSERT INTO cost_centers (code, name, description, kind, approver_user_id, is_active)
     VALUES ($1, $2, $3, COALESCE($4, 'PROJECT'), $5, COALESCE($6, TRUE))
     RETURNING *`,
    [code || null, name, description || null, kind, approver_user_id || null, is_active]
  );
  return rows[0];
}

async function updateCostCenter(id, data) {
  const current = await pool.query('SELECT * FROM cost_centers WHERE id=$1', [id]);
  if (!current.rows[0]) throw { status: 404, message: 'Centro de custo/projeto não encontrado' };
  const { code, name, description, kind, approver_user_id, is_active } = data;
  const { rows } = await pool.query(
    `UPDATE cost_centers SET code=$1, name=$2, description=$3, kind=$4, approver_user_id=$5, is_active=$6, updated_at=NOW()
     WHERE id=$7 RETURNING *`,
    [code ?? current.rows[0].code, name ?? current.rows[0].name, description ?? current.rows[0].description, kind ?? current.rows[0].kind, approver_user_id ?? current.rows[0].approver_user_id, is_active ?? current.rows[0].is_active, id]
  );
  return rows[0];
}

module.exports = { listCostCenters, createCostCenter, updateCostCenter };
