const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('../config/database');

async function run() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  let client;
  try {
    await waitForDatabase();
    client = await pool.connect();
  } catch (err) {
    console.error(
      'Não foi possível conectar ao PostgreSQL. Confira se o banco está rodando (ex.: `docker compose -f backend/docker-compose.yml up -d db`) e as variáveis DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME ou DATABASE_URL.'
    );
    console.error(err);
    process.exit(1);
  }
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await seedDefaults(client);
    await client.query('COMMIT');
    console.log('Migrations applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

async function waitForDatabase(retries = 10, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const testClient = await pool.connect();
      testClient.release();
      return;
    } catch (err) {
      const isLastAttempt = attempt === retries;
      console.warn(
        `Tentativa ${attempt}/${retries} de conectar ao PostgreSQL falhou (${err.code || err.message}).${
          isLastAttempt ? '' : ` Nova tentativa em ${delayMs}ms...`
        }`
      );
      if (isLastAttempt) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function seedDefaults(client) {
  const [adminRole, approverRole, userRole] = await Promise.all([
    upsertRole(client, 'admin', 'Administrador do sistema'),
    upsertRole(client, 'approver', 'Aprovador de relatórios'),
    upsertRole(client, 'user', 'Usuário comum'),
  ]);

  const positionId = await upsertPosition(client, 'Analista', 'Cargo padrão para seeds');

  await Promise.all([
    upsertExpenseCategory(client, {
      name: 'Quilometragem',
      requires_attachment: false,
      is_km_category: true,
    }),
    upsertExpenseCategory(client, { name: 'Alimentação', requires_attachment: false }),
    upsertExpenseCategory(client, { name: 'Hospedagem', requires_attachment: true }),
  ]);

  await Promise.all([
    upsertPaymentMethod(client, 'Dinheiro'),
    upsertPaymentMethod(client, 'Cartão Pessoal'),
    upsertPaymentMethod(client, 'Cartão Corporativo'),
  ]);

  const costCenterId = await upsertCostCenter(client, {
    code: 'CC-001',
    name: 'Projeto Piloto',
    description: 'Centro de custo inicial para testes',
  });

  const defaultPassword = process.env.SEED_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const adminId = await upsertUser(client, {
    full_name: 'Admin Conatus',
    email: 'admin@conatus.com',
    password_hash: passwordHash,
    position_id: positionId,
    is_active: true,
  });
  await attachRoles(client, adminId, [adminRole.id, approverRole.id, userRole.id]);

  const approverId = await upsertUser(client, {
    full_name: 'Aprovador Padrão',
    email: 'approver@conatus.com',
    password_hash: passwordHash,
    position_id: positionId,
    is_active: true,
  });
  await attachRoles(client, approverId, [approverRole.id]);

  const userId = await upsertUser(client, {
    full_name: 'Usuário Padrão',
    email: 'user@conatus.com',
    password_hash: passwordHash,
    position_id: positionId,
    is_active: true,
  });
  await attachRoles(client, userId, [userRole.id]);

  await setCostCenterApprover(client, costCenterId, approverId);
  await linkUserToCostCenter(client, userId, costCenterId, true);
  await ensureKmPolicy(client, positionId);
  console.log('Seed data inserted (roles, users, cost center, policies). Default password:', defaultPassword);
}

async function upsertRole(client, name, description) {
  const { rows } = await client.query(
    `INSERT INTO roles(name, description)
     VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
     RETURNING *`,
    [name, description]
  );
  return rows[0];
}

async function upsertPosition(client, name, description) {
  const { rows } = await client.query(
    `INSERT INTO positions(name, description)
     VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
     RETURNING id`,
    [name, description]
  );
  return rows[0].id;
}

async function upsertExpenseCategory(client, { name, requires_attachment = false, is_km_category = false }) {
  const { rows } = await client.query(
    `INSERT INTO expense_categories(name, requires_attachment, is_km_category)
     VALUES ($1, $2, $3)
     ON CONFLICT (name) DO UPDATE SET
       requires_attachment = EXCLUDED.requires_attachment,
       is_km_category = EXCLUDED.is_km_category
     RETURNING id`,
    [name, requires_attachment, is_km_category]
  );
  return rows[0].id;
}

async function upsertPaymentMethod(client, name) {
  await client.query(
    `INSERT INTO payment_methods(name)
     VALUES ($1)
     ON CONFLICT (name) DO NOTHING`,
    [name]
  );
}

async function upsertCostCenter(client, { code, name, description }) {
  const { rows } = await client.query(
    `INSERT INTO cost_centers(code, name, description)
     VALUES ($1, $2, $3)
     ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
     RETURNING id`,
    [code, name, description]
  );
  return rows[0].id;
}

async function upsertUser(client, user) {
  const { rows } = await client.query(
    `INSERT INTO users(full_name, email, password_hash, position_id, is_active)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       password_hash = EXCLUDED.password_hash,
       position_id = EXCLUDED.position_id,
       is_active = EXCLUDED.is_active
     RETURNING id`,
    [user.full_name, user.email, user.password_hash, user.position_id, user.is_active]
  );
  return rows[0].id;
}

async function attachRoles(client, userId, roleIds) {
  for (const roleId of roleIds) {
    await client.query(
      `INSERT INTO user_roles(user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId]
    );
  }
}

async function setCostCenterApprover(client, costCenterId, approverId) {
  await client.query(
    `UPDATE cost_centers SET approver_user_id = $2 WHERE id = $1`,
    [costCenterId, approverId]
  );
}

async function linkUserToCostCenter(client, userId, costCenterId, isDefault = false) {
  await client.query(
    `INSERT INTO cost_center_users(cost_center_id, user_id, is_default)
     VALUES ($1, $2, $3)
     ON CONFLICT (cost_center_id, user_id) DO UPDATE SET is_default = EXCLUDED.is_default`,
    [costCenterId, userId, isDefault]
  );
}

async function ensureKmPolicy(client, positionId) {
  await client.query(
    `INSERT INTO km_policies(position_id, rate_per_km, max_km_per_trip, exceed_behavior, is_active)
     VALUES ($1, 2.5, 500, 'CAP', true)
     ON CONFLICT (position_id) DO NOTHING`,
    [positionId]
  );
}

run();
