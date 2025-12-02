const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const costCenterRoutes = require('./routes/costCenterRoutes');
const tripRoutes = require('./routes/tripRoutes');
const approvalRoutes = require('./routes/approvalRoutes');

const app = express();
app.use(express.json());
app.use(cors({ origin: config.frontendUrl }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/cost-centers', costCenterRoutes);
app.use('/trips', tripRoutes);
app.use('/approvals', approvalRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Erro interno' });
});

app.listen(config.port, () => {
  console.log(`API ouvindo na porta ${config.port}`);
});
