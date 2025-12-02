const jwt = require('jsonwebtoken');
const config = require('../config/env');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

function requireRole(roleName) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles || !req.user.roles.includes(roleName)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
