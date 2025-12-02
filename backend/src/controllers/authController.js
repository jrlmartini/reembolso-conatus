const authService = require('../services/authService');

async function login(req, res) {
  const { email, password } = req.body;
  try {
    const { token, user } = await authService.login(email, password);
    res.json({ token, user: { id: user.id, full_name: user.full_name, email: user.email, roles: user.roles } });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Erro ao fazer login' });
  }
}

async function me(req, res) {
  try {
    const user = await authService.findUserWithRolesById(req.user.id);
    res.json({ user: { id: user.id, full_name: user.full_name, email: user.email, roles: user.roles } });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao recuperar usuário' });
  }
}

module.exports = { login, me };
