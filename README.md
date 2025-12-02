# App de Reembolso - Conatus Ambiental

Base inicial para o aplicativo interno de reembolso, seguindo o PRD fornecido. Este repositório está organizado em duas pastas principais (`backend/` e `frontend/`) e documentação auxiliar em `docs/`.

## Documentação
- [Guia de arquitetura e esqueleto](docs/architecture.md)
- [Entidades e relacionamentos](docs/data-model.md)
- [Backend](backend/README.md)
- [Frontend](frontend/README.md)

## Como rodar o backend
1. Acesse a pasta `backend/` e instale dependências:
   ```bash
   cd backend
   npm install
   ```
2. Configure variáveis de ambiente (copie `.env.example` para `.env` ou use `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`).
3. Suba o PostgreSQL local (requer Docker) **antes** de migrar:
   ```bash
   npm run db:up
   ```
   > Se já tiver um Postgres rodando em outra porta/host, ajuste `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME` ou `DATABASE_URL`.
4. Aplique o schema do PostgreSQL e seeds de usuários:
   ```bash
   npm run migrate
   ```
5. Suba a API em modo desenvolvimento (defina `PORT` se 4000 estiver ocupado):
   ```bash
   npm run dev
   ```
6. Login rápido (gerado pelo migrate, senha padrão `admin123`, alterável via `SEED_PASSWORD`):
   - Admin: `admin@conatus.com`
   - Aprovador: `approver@conatus.com`
   - Usuário: `user@conatus.com`

## Como rodar o frontend
1. Acesse a pasta `frontend/` e instale dependências:
   ```bash
   cd frontend
   npm install
   ```
2. (Opcional) Crie um arquivo `.env` com `VITE_API_URL=http://localhost:4000` se quiser customizar a URL do backend.
3. Rode o projeto em modo desenvolvimento (porta 3000):
   ```bash
   npm run dev
   ```
4. Abra no navegador `http://localhost:3000`.

## Próximos passos imediatos
1. Confirmar o modelo relacional definitivo e gerar migrations/ORM mantendo compatibilidade com as tabelas fornecidas.
2. Completar integrações de backoffice (usuários, categorias, políticas) e UX mobile-first para lançamento de despesas.
3. Preparar endpoints e telas de exportação (CSV/Excel, PDF) e painéis de métricas.
