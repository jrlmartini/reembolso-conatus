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
2. Configure variáveis de ambiente (ver `.env` ou use `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`).
3. Aplique o schema do PostgreSQL:
   ```bash
   npm run migrate
   ```
4. Suba a API em modo desenvolvimento:
   ```bash
   npm run dev
   ```

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
