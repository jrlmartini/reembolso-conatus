# Backend (Node.js)

## Stack sugerida
- Node.js + TypeScript
- Fastify ou Express
- PostgreSQL via Prisma/Knex/TypeORM
- JWT + bcrypt/argon2
- Zod para validação, pino para logs, Swagger/OpenAPI para docs

## Módulos principais
- Auth (login, refresh, logout)
- Users e Roles (RBAC)
- Cost Centers/Projects (roteamento de aprovação)
- Travels (criação, submissão, travas)
- Expenses (inclui quilometragem e anexos)
- Approvals (aprovar/reprovar/delegar)
- Policies (caps por cargo/categoria, valor/km)
- Exports (CSV/Excel/PDF)
- Storage (interface + provider S3/GCS)
- Audit Logs

## Estrutura sugerida
```
src/
  config/
  db/
    migrations/
    seeds/
    prisma|entities|models/
  modules/
    auth/
    users/
    travels/
    expenses/
    approvals/
    policies/
    cost-centers/
    projects/
    exports/
    reports/
    storage/
  middlewares/
  utils/
  docs/
```

## Próximos passos
1. Gerar arquivo `.env.example` com variáveis (DATABASE_URL, JWT_SECRET, STORAGE_PROVIDER, etc.).
2. Subir migrations iniciais (roles, users seed admin, categorias, políticas base).
3. Implementar middlewares de auth e RBAC; travas de edição após submissão/aprovação.
4. Criar endpoints de exportação e geração de PDF consolidado por viagem.
5. Adicionar testes unitários/integrados para cálculo de km/caps e fluxo de aprovação.
