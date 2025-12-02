# Arquitetura proposta

Documento de referência para implementação do app interno de reembolso da Conatus Ambiental. Baseado no PRD e no schema SQL fornecidos (PostgreSQL). Não recria o PRD; foca em arquitetura, esqueleto de código e regras críticas.

## Resumo da arquitetura (texto)
- **Front-end:** React SPA (Vite + TypeScript), React Router, React Query, Zustand/Redux Toolkit. UI mobile-first, minimalista, PT-BR. RBAC no roteamento e componentes. Upload de anexos via URL assinada. Serviços prontos para extensões (OCR, sugestão de categoria).
- **Back-end:** Node.js + Express/Fastify (TS). Rotas REST versionadas `/api/v1`. Camada de serviços para regras de negócio (caps de km, travas de relatório, aprovação/reprovação/delegação). Middlewares de autenticação JWT, RBAC (roles em `user_roles`) e autorização contextual por centro de custo. Documentação OpenAPI.
- **Banco de dados:** PostgreSQL com migrations alinhadas ao DDL fornecido (roles, positions, users, cost_centers, trips, expenses, etc.). Índices em FKs e campos de busca. Seeds para papéis e categorias básicas.
- **Storage de anexos:** Interface `StorageProvider` com implementação S3/GCS. Upload/download via URLs assinadas. Metadados em `expenses.attachment_url` + `attachment_mime_type`.
- **Autenticação/Autorização:** Login por e-mail/senha (bcrypt/argon2), JWT + refresh. RBAC admin/approver/user; aprovadores vinculados a `cost_centers`. Delegação consultando `approval_delegations`.
- **Extensibilidade futura:** Serviços plugáveis para OCR e sugestão automática de categoria; placeholder para cálculo de distância via API de mapas.

## Entidades e relações essenciais (resumo ER)
- `users` 1:N `trips`; `users` N:N `roles` via `user_roles`.
- `cost_centers` 1:N `trips` e 1:N `cost_center_users`; aprovador padrão em `cost_centers.approver_user_id`.
- `positions` 1:N `users`; `positions` 1:1 `km_policies` (ativa).
- `trips` 1:N `expenses`; `expense_categories` 1:N `expenses`; `payment_methods` 1:N `expenses`.
- `trips` 1:N `trip_approvals`; delegações em `approval_delegations`.
- `audit_logs`, `notifications`, `system_settings`, `password_resets` para rastreabilidade e operações auxiliares.

## Estrutura de pastas sugerida
### Backend
```
backend/
  src/
    config/            # env, logger, cors, helmet
    db/
      migrations/      # knex/prisma/typeorm alinhado ao DDL
      seeds/           # roles, admin, categorias, policies
      models/          # schemas/ORM
    modules/
      auth/
      users/
      roles/
      cost-centers/
      trips/
      expenses/
      approvals/
      policies/        # km_policies e validações
      notifications/
      storage/
      exports/
      audit/
    middlewares/
    utils/
    docs/              # OpenAPI/Swagger
```

### Frontend
```
frontend/
  src/
    app/               # providers, Router, layouts
    components/        # UI compartilhada (Button, Input, Modal, Table)
    features/
      auth/
      trips/
      expenses/
      approvals/
      admin/
    services/          # API clients (axios/fetch) + storage
    hooks/
    store/
    utils/
    types/
``` 

## Comandos de criação dos projetos
### Backend (TypeScript + Express)
```bash
mkdir backend && cd backend
npm init -y
npm install express cors helmet pino zod bcrypt jsonwebtoken multer uuid pg
npm install -D typescript ts-node-dev @types/node @types/express @types/jsonwebtoken @types/bcrypt
npx tsc --init
```

### Frontend (Vite + React + TS)
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install react-router-dom @tanstack/react-query zustand axios
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Esqueleto de arquivos principais
### Backend
`src/server.ts`
```ts
import express from 'express';
import cors from 'cors';
import { router as api } from './routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/v1', api);

app.listen(process.env.PORT || 3000, () => {
  console.log('API running');
});
```

`src/routes/index.ts`
```ts
import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { tripRouter } from '../modules/trips/trip.routes';
import { expenseRouter } from '../modules/expenses/expense.routes';
import { approvalRouter } from '../modules/approvals/approval.routes';

export const router = Router();
router.use('/auth', authRouter);
router.use('/trips', tripRouter);
router.use('/expenses', expenseRouter);
router.use('/approvals', approvalRouter);
```

`src/modules/trips/trip.service.ts` (regras principais)
```ts
import { TripStatus } from './trip.types';
import { tripRepo, expenseRepo, approvalRepo } from './trip.repositories';

export async function submitTrip(tripId: number, userId: number) {
  const trip = await tripRepo.findEditable(tripId, userId);
  const expenseCount = await expenseRepo.countByTrip(tripId);
  if (!expenseCount) throw new Error('Necessário ao menos 1 despesa');

  await tripRepo.updateStatus(tripId, TripStatus.IN_APPROVAL, { submittedAt: new Date() });
  await approvalRepo.log(tripId, userId, 'SUBMITTED');
}

export async function approveTrip(tripId: number, approverId: number) {
  const trip = await tripRepo.findInApproval(tripId, approverId);
  await tripRepo.updateStatus(tripId, TripStatus.APPROVED, { approvedAt: new Date() });
  await approvalRepo.log(tripId, approverId, 'APPROVED');
}

export async function rejectTrip(tripId: number, approverId: number, comment: string) {
  if (!comment) throw new Error('Justificativa obrigatória');
  const trip = await tripRepo.findInApproval(tripId, approverId);
  await tripRepo.updateStatus(tripId, TripStatus.REJECTED, { rejectedAt: new Date() });
  await approvalRepo.log(tripId, approverId, 'REJECTED', comment);
}
```

`src/modules/expenses/expense.service.ts` (quilometragem)
```ts
import { kmPolicyRepo } from '../policies/km-policy.repo';
import { expenseRepo } from './expense.repo';

export async function createKmExpense(input: {
  tripId: number;
  userId: number;
  expenseCategoryId: number;
  kmQuantity: number;
}) {
  const policy = await kmPolicyRepo.findActiveByUser(input.userId);
  const rate = policy.rate_per_km;
  const amountOriginal = input.kmQuantity * rate;

  let amountEffective = amountOriginal;
  let kmCapped = false;
  if (policy.max_km_per_trip && input.kmQuantity > policy.max_km_per_trip && policy.exceed_behavior === 'CAP') {
    amountEffective = policy.max_km_per_trip * rate;
    kmCapped = true;
  }
  if (policy.max_amount_per_trip && amountEffective > policy.max_amount_per_trip && policy.exceed_behavior === 'CAP') {
    amountEffective = policy.max_amount_per_trip;
    kmCapped = true;
  }

  return expenseRepo.create({
    ...input,
    amountOriginal,
    amountEffective,
    kmRateApplied: rate,
    kmCapped,
  });
}
```

### Frontend
`src/main.tsx` (roteamento básico)
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './app/auth-context';
import TripsPage from './features/trips/TripsPage';
import TripDetailPage from './features/trips/TripDetailPage';
import ExpenseFormPage from './features/expenses/ExpenseFormPage';
import ApprovalsPage from './features/approvals/ApprovalsPage';
import LoginPage from './features/auth/LoginPage';

const client = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/trips/:id" element={<TripDetailPage />} />
            <Route path="/trips/:id/expenses/new" element={<ExpenseFormPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

`src/features/trips/TripDetailPage.tsx` (trava de edição)
```tsx
const isLocked = trip.status === 'IN_APPROVAL' || trip.status === 'APPROVED';
return (
  <section>
    {/* detalhes da viagem */}
    {!isLocked && <Link to={`/trips/${trip.id}/expenses/new`}>Nova despesa</Link>}
    <button disabled={isLocked || trip.expenses.length === 0} onClick={submitTrip}>Fechar relatório</button>
    {isLocked && <p>Relatório em aprovação ou aprovado. Edição bloqueada.</p>}
  </section>
);
```

`src/features/expenses/ExpenseFormPage.tsx` (quilometragem)
```tsx
const isKm = category.is_km_category;
const amount = isKm ? kmQuantity * policy.rate_per_km : enteredAmount;
const cappedAmount = isKm && policy.exceed_behavior === 'CAP'
  ? Math.min(amount, policy.max_amount_per_trip ?? amount)
  : amount;
```

## Endpoints e regras cobertas
- **Auth**: `/auth/login`, `/auth/me` (JWT).
- **Users/Roles**: CRUD e associação via `user_roles` (admin-only).
- **Cost centers**: CRUD, vínculo de usuários, definição de aprovador.
- **Trips**: criar (status `DRAFT`), listar por usuário/CC/status, enviar para aprovação (muda para `IN_APPROVAL`, registra `trip_approvals`), aprovar/reprovar/delegar (muda status e registra histórico), travar edição quando `IN_APPROVAL`/`APPROVED`.
- **Expenses**: CRUD em `DRAFT`/`REJECTED`; validação de `expense_category` (anexo obrigatório, `is_reimbursable`), cálculo de km com `km_policies`.
- **Exportações**: endpoints para CSV/Excel; geração de PDF consolidado por viagem.
- **Notificações/Auditoria**: gravação em `notifications` e `audit_logs` nos eventos-chave.

## Sugestão de próximos passos
1. Gerar migrations a partir do DDL fornecido e seeds mínimos (roles padrão, admin, categorias base, políticas de km por cargo).
2. Implementar middlewares de auth + RBAC, guards por CC/projeto para aprovadores.
3. Entregar CRUDs iniciais (users, cost_centers, trips, expenses) e o fluxo submit/approve/reject com delegação e auditoria.
4. Integrar upload assinado de anexos e endpoints de exportação (CSV/Excel + PDF por viagem).
5. Documentar com OpenAPI e criar testes (unit e integração) para caps de quilometragem e travamento de relatórios.
