const bcrypt = require('bcrypt');
const pool = require('../config/database');

async function listUsers() {
  const { rows } = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.position_id, u.is_active, u.created_at, u.updated_at,
            array_remove(array_agg(r.name), NULL) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  );
  return rows;
}

async function createUser({ full_name, email, password, position_id, roles = [] }) {
  const password_hash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertUser = await client.query(
      `INSERT INTO users (full_name, email, password_hash, position_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, position_id, is_active, created_at, updated_at`,
      [full_name, email, password_hash, position_id || null]
    );
    const user = insertUser.rows[0];
    if (roles.length) {
      const roleIds = await client.query('SELECT id, name FROM roles WHERE name = ANY($1)', [roles]);
      for (const role of roleIds.rows) {
        await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [user.id, role.id]);
      }
      user.roles = roleIds.rows.map((r) => r.name);
    } else {
      user.roles = [];
    }
    await client.query('COMMIT');
    return user;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateUser(id, { full_name, email, password, position_id, is_active, roles }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!current.rows[0]) {
      throw { status: 404, message: 'Usuário não encontrado' };
    }
    const password_hash = password ? await bcrypt.hash(password, 10) : current.rows[0].password_hash;
    await client.query(
      `UPDATE users SET full_name=$1, email=$2, password_hash=$3, position_id=$4, is_active=$5, updated_at=NOW()
       WHERE id=$6`,
      [full_name ?? current.rows[0].full_name, email ?? current.rows[0].email, password_hash, position_id ?? current.rows[0].position_id, is_active ?? current.rows[0].is_active, id]
    );
    if (roles) {
      await client.query('DELETE FROM user_roles WHERE user_id=$1', [id]);
      const roleIds = await client.query('SELECT id, name FROM roles WHERE name = ANY($1)', [roles]);
      for (const role of roleIds.rows) {
        await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, role.id]);
      }
    }
    await client.query('COMMIT');
    return { id, full_name: full_name ?? current.rows[0].full_name, email: email ?? current.rows[0].email, position_id: position_id ?? current.rows[0].position_id, is_active: is_active ?? current.rows[0].is_active, roles: roles ?? undefined };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteUser(id) {
  await pool.query('UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id=$1', [id]);
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
