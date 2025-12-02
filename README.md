# App de Reembolso - Conatus Ambiental

Base inicial para o aplicativo interno de reembolso, seguindo o PRD fornecido. Este repositório está organizado em duas pastas principais (`backend/` e `frontend/`) e documentação auxiliar em `docs/`.

## Documentação
- [Arquitetura proposta](docs/architecture.md)
- [Entidades e relacionamentos](docs/data-model.md)
- [Backend](backend/README.md)
- [Frontend](frontend/README.md)

## Próximos passos imediatos
1. Confirmar o modelo relacional definitivo e gerar migrations/ORM mantendo compatibilidade com as tabelas fornecidas.
2. Inicializar projetos (Vite + React no `frontend/`; Node + TS no `backend/`) e configurar `.env.example`.
3. Implementar autenticação JWT com RBAC, fluxos de viagem/despesa/quilometragem e pipeline de aprovação conforme PRD.
4. Preparar endpoints e telas de exportação (CSV/Excel, PDF) e painéis de métricas.
