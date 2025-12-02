const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const config = require('../config/env');

async function findUserWithRolesByEmail(email) {
  const { rows } = await pool.query(
    `SELECT u.*, array_remove(array_agg(r.name), NULL) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.email = $1
     GROUP BY u.id`,
    [email]
  );
  return rows[0];
}

async function findUserWithRolesById(id) {
  const { rows } = await pool.query(
    `SELECT u.*, array_remove(array_agg(r.name), NULL) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.id = $1
     GROUP BY u.id`,
    [id]
  );
  return rows[0];
}

async function login(email, password) {
  const user = await findUserWithRolesByEmail(email);
  if (!user || !user.is_active) {
    throw { status: 401, message: 'Credenciais inválidas' };
  }
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw { status: 401, message: 'Credenciais inválidas' };
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, roles: user.roles || [] },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
  return { token, user };
}

module.exports = {
  login,
  findUserWithRolesById
};
