const costCenterService = require('../services/costCenterService');

async function list(req, res) {
  try {
    const centers = await costCenterService.listCostCenters();
    res.json(centers);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar centros de custo/projetos' });
  }
}

async function create(req, res) {
  try {
    const center = await costCenterService.createCostCenter(req.body);
    res.status(201).json(center);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar centro de custo/projeto', detail: err.message });
  }
}

async function update(req, res) {
  try {
    const center = await costCenterService.updateCostCenter(req.params.id, req.body);
    res.json(center);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Erro ao atualizar centro de custo/projeto' });
  }
}

module.exports = { list, create, update };
