# Frontend (React + Vite)

Interface web (SPA) do app de reembolsos da Conatus Ambiental, focada em mobile-first e integração com o backend Express (porta 4000).

## Stack
- React 18
- React Router v6
- Axios para chamadas HTTP (baseURL configurada via `VITE_API_URL`, fallback `http://localhost:4000`)
- Vite para build/dev server

## Estrutura de pastas
```
frontend/
  src/
    api/          # cliente HTTP
    components/   # UI reutilizável (Layout, ExpenseForm)
    context/      # AuthContext (token + usuário)
    pages/        # Login, viagens, detalhe, aprovações
    styles/       # CSS global
  index.html
  package.json
  vite.config.js
```

## Rotas principais
- `/login` — autenticação por e-mail/senha.
- `/` — lista de viagens do usuário logado e formulário de nova viagem.
- `/trips/:id` — detalhe da viagem, lista de despesas, criação de despesa e envio para aprovação.
- `/approvals` — fila de aprovação para usuários com papel `approver` (aprovar/reprovar com justificativa).

## Como rodar o frontend
1. Entre na pasta `frontend/`.
2. Instale dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento (porta 3000):
   ```bash
   npm run dev
   ```
4. Configure `VITE_API_URL` em um `.env` (opcional) para apontar para o backend. Por padrão usa `http://localhost:4000`.

### Contas de teste (geradas pelo `npm run migrate` do backend)
- Admin: `admin@conatus.com` / senha `admin123`
- Aprovador: `approver@conatus.com` / senha `admin123`
- Usuário: `user@conatus.com` / senha `admin123`

## Integração com backend
- Endpoints usados: `/auth/login`, `/auth/me`, `/trips`, `/trips/:id/submit`, `/trips/:tripId/expenses`, `/approvals`, `/approvals/:id/approve`, `/approvals/:id/reject`.
- O token JWT é armazenado em `localStorage` e enviado no header `Authorization: Bearer <token>` via interceptor do Axios.

## Notas de UX
- Layout responsivo e minimalista, com ênfase em fluxo enxuto de despesa (foto → tipo/CC → valor → salvar).
- Telas de aprovação exibem informações essenciais e ações rápidas de aprovar/reprovar com justificativa.
