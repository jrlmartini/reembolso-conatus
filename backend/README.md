# Backend (Node.js)

API de reembolso da Conatus Ambiental implementada com **Express** e **PostgreSQL**, alinhada ao PRD e schema SQL fornecidos.

## Stack
- Node.js + Express
- PostgreSQL via `pg` (Pool) e migrations simples em `src/db/schema.sql`
- JWT + bcrypt para autenticação
- CORS liberado para o frontend (por padrão `http://localhost:3000`)

## Estrutura de pastas
```
src/
  config/        # env e conexão com o banco
  db/            # schema.sql e script de migration
  controllers/   # entrada HTTP
  services/      # regras de negócio e acesso ao banco
  routes/        # rotas Express
  middlewares/   # auth/RBAC
```

## Endpoints implementados
- **Auth**: `POST /auth/login`, `GET /auth/me`
- **Usuários (admin)**: `GET/POST/PUT/DELETE /users`
- **Centros de custo**: `GET /cost-centers`, `POST /cost-centers`, `PUT /cost-centers/:id`
- **Trips**: `POST /trips`, `GET /trips`, `POST /trips/:id/submit`
- **Expenses**: `POST /trips/:tripId/expenses`, `GET /trips/:tripId/expenses`
- **Approvals (approver)**: `POST /approvals/:id/approve`, `POST /approvals/:id/reject`

## Regras de negócio cobertas
- Travamento de edição: somente viagens com status `DRAFT/REJECTED` aceitam novas despesas ou submissão.
- Envio para aprovação: troca status para `IN_APPROVAL` e registra log em `trip_approvals`.
- Aprovação/Reprovação: troca status para `APPROVED` ou `REJECTED` e registra ação com justificativa em `trip_approvals`.
- Quilometragem: se a categoria tiver `is_km_category = TRUE`, calcula `amount_original = km_quantity * rate_per_km` conforme `km_policies` do cargo do usuário, aplica cap (`max_km_per_trip` ou `max_amount_per_trip`) quando `exceed_behavior = 'CAP'`, marcando `km_capped = TRUE`.

## Scripts
- `npm run dev` – inicia servidor com nodemon.
- `npm start` – inicia servidor.
- `npm run migrate` – aplica o schema SQL em `src/db/schema.sql` (usa a conexão configurada).
- `npm run db:up` – (requer Docker) sobe um PostgreSQL local via `docker-compose`.

### Contas seeds para login rápido
O script de migrate cria usuários e papéis iniciais (senha padrão `admin123`, sobrescrevível com `SEED_PASSWORD`):
- Admin: `admin@conatus.com` (roles: admin, approver, user)
- Aprovador: `approver@conatus.com` (role: approver)
- Usuário: `user@conatus.com` (role: user)

## Variáveis de ambiente
Você pode usar `DATABASE_URL` ou definir credenciais individuais:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=conatus_reembolso
JWT_SECRET=super-secret
FRONTEND_URL=http://localhost:3000
PORT=4000
```

Para facilidade, copie `.env.example` para `.env` e ajuste conforme necessário:
```
cp .env.example .env
```

Se a porta 4000 estiver ocupada, defina `PORT=4001` (ou outra) ao rodar `npm run dev`.

## Como rodar
```
cd backend
npm install
npm run db:up     # opcional: sobe PostgreSQL via Docker
npm run migrate   # aplica schema
npm run dev       # sobe API em modo desenvolvimento
```
