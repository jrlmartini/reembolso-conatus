# Entidades e relacionamentos

> Referência inicial com base no PRD. Deve ser ajustada conforme o esquema relacional definitivo para manter compatibilidade.

## Principais entidades
- **users**: colaboradores com campos (id, nome, email, senha hash, cargo, status). Relacionamento com roles e vínculos de centro de custo/projeto.
- **roles** / **user_roles**: papéis Admin, Aprovador, Usuário. Users podem acumular papéis.
- **cost_centers** / **projects**: definem roteamento de aprovação. Possuem aprovador responsável e associação de usuários.
- **travels**: viagem/relatório. Campos: destino, motivo, datas, status (`draft`, `in_approval`, `approved`, `rejected`), total_km, total_valor, cost_center_id, user_id. Uma viagem pertence a um usuário e a um CC/projeto.
- **expenses**: despesas pertencentes a uma viagem. Campos: data, categoria, valor, forma_pagamento, observações, reembolsável, flags de anexo. FK para travel, categoria e CC/projeto (herdado por padrão).
- **expense_categories**: cadastro de categorias (nome, exige_anexo, reembolsavel, limite_opcional, observações). Editável em backoffice.
- **policies**: políticas por cargo/categoria. Incluem valor_km, limite_km (dia/viagem), regra_cap (sinalizar ou capar), limites monetários por categoria se aplicável.
- **attachments**: metadados de recibos (storage_key, mime_type, tamanho, url_presigned opcional), vinculados a expenses.
- **approvals**: trilha de aprovação por viagem (approver_id, status, justificativa, delegated_to, timestamps). Pode registrar delegações e reprovações.
- **audit_logs**: eventos de auditoria (tipo, entidade, usuário, payload resumido, timestamps) para criação/edição/envio/aprovação/reprovação/delegação.
- **exports**: histórico de exportações (tipo CSV/Excel/PDF, filtro aplicado, autor, storage_key/result_path, status).

## Regras de relacionamento
- `users` 1:N `travels`.
- `travels` 1:N `expenses`.
- `travels` N:1 `cost_centers/projects`; `cost_centers` 1:N `approvers` (via tabela de vínculo) e 1:N `user_cost_center`.
- `expenses` N:1 `expense_categories`; `expense_categories` 1:N `policies` (por cargo/categoria).
- `travels` 1:N `approvals` (histórico, última define status atual).
- `expenses` 1:N `attachments`.
- `audit_logs` referenciam usuários e entidades por id (polimórfico).

## Status e campos auxiliares sugeridos
- **Travel.status**: `draft` (em andamento), `in_approval`, `approved`, `rejected`.
- **Approval.status**: `pending`, `approved`, `rejected`, `delegated`.
- **Expense.type**: referencia `expense_categories`; incluir indicador quando for quilometragem para cálculo automático.
- **Flags de travamento**: `travels.locked_at` para indicar travamento após envio/aprovação; `travels.submitted_at`, `travels.approved_at` para métricas.
- **Métricas**: `approvals.decision_at`, `approvals.sla_due_at` para cálculo de SLA e tempo médio.

## Considerações de performance e integridade
- Índices em chaves estrangeiras (travels.user_id, travels.cost_center_id, expenses.travel_id, expenses.category_id, approvals.travel_id, approvals.approver_id).
- Restrições de unicidade: e-mail de usuário; possivelmente aprovador primário por cost_center.
- Soft delete ou status para desativar usuários e categorias sem perder histórico.
- Campos monetários em centavos (integer) para evitar imprecisão.
