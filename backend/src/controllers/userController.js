const userService = require('../services/userService');

async function list(req, res) {
  try {
    const users = await userService.listUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar usuários' });
  }
}

async function create(req, res) {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar usuário', detail: err.message });
  }
}

async function update(req, res) {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Erro ao atualizar usuário' });
  }
}

async function remove(req, res) {
  try {
    await userService.deleteUser(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Erro ao remover usuário' });
  }
}

module.exports = { list, create, update, remove };
