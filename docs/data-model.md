# Entidades e relacionamentos

> Fonte de verdade: PRD e schema SQL fornecidos (PostgreSQL). Nomes de tabelas/campos devem ser mantidos conforme o DDL.

## Principais entidades
- **roles / user_roles**: papéis do sistema (admin, approver, user) associados a usuários (N:N).
- **positions / km_policies**: cargos dos colaboradores e política de quilometragem por cargo (rate_per_km, limites, comportamento de cap).
- **users**: colaboradores com vínculo opcional a cargo (position_id), status de atividade e associação a roles.
- **cost_centers / cost_center_users**: centros de custo/projetos, aprovador padrão (`approver_user_id`) e vínculo de usuários elegíveis.
- **trips**: viagens/relatórios; pertencem a um usuário e a um centro de custo; status `DRAFT` → `IN_APPROVAL` → `APPROVED`/`REJECTED`; timestamps de submissão/decisões.
- **expense_categories**: categorias configuráveis (flags de anexo, reembolsável, se é quilometragem, limite opcional por despesa).
- **payment_methods**: formas de pagamento configuráveis.
- **expenses**: despesas de uma viagem, com valores original/efetivo, FK para categoria e forma de pagamento, suporte a quilometragem (km_quantity, rate, cap) e anexo.
- **trip_approvals**: histórico do fluxo (SUBMITTED, APPROVED, REJECTED, REOPENED, DELEGATED) com ator, aprovador e comentários.
- **approval_delegations**: delegações de aprovador → delegado com janela de validade.
- **audit_logs**: rastreabilidade polimórfica de ações em entidades.
- **notifications**: envios de notificações (tipo, canal, status, erros).
- **system_settings**: configurações chave/valor (ex.: SLA de aprovação alvo).
- **password_resets**: tokens de redefinição de senha.

## Relações essenciais
- `users` 1:N `trips`.
- `trips` 1:N `expenses`.
- `cost_centers` 1:N `trips`; `cost_centers` 1:N `cost_center_users` (usuários elegíveis) e `cost_centers.approver_user_id` define aprovador padrão.
- `positions` 1:N `users`; `positions` 1:1 `km_policies` (ativa) via UNIQUE parcial em `km_policies.position_id`.
- `expense_categories` 1:N `expenses`; categorias com `is_km_category = TRUE` habilitam cálculo de km.
- `users` N:N `roles` via `user_roles`.
- `trip_approvals` N:1 `trips` e apontam ator/aprovador (FK em `users`).
- `approval_delegations` relacionam aprovadores entre si; consulta usada no fluxo de aprovação.
- `notifications` e `audit_logs` referenciam usuários e entidades para rastreabilidade.

## Status e regras de integridade
- **Trip.status**: `DRAFT` (edição), `IN_APPROVAL` (travado para usuário), `APPROVED` (travado definitivo), `REJECTED` (reaberto para edição). Envio exige ao menos 1 despesa.
- **Quilometragem**: se `expense_categories.is_km_category` for TRUE, calcular `amount_original = km_quantity * km_rate_applied`; aplicar limites de `km_policies` (por km ou valor) com `exceed_behavior` (`CAP` ou `WARN`). Registrar `km_capped` quando capado.
- **Aprovação**: `trip_approvals` registra submissão, aprovação, reprovação (com justificativa) e reabertura; `approval_delegations` habilita delegar responsabilidade.
- **Anexos**: `expenses.attachment_url` e `attachment_mime_type` armazenam metadados; upload via provider de storage abstraído.
- **Notificações**: status `PENDING`, `SENT`, `FAILED` com erro opcional.

## Considerações de performance e consistência
- Índices em FKs e campos de busca (`trips.status`, `expenses.spent_at`, `notifications.status`).
- Unicidade em `users.email`, `roles.name`, `positions.name`, `payment_methods.name`, `expense_categories.name`.
- Soft-disable via `is_active` em usuários, cargos, centros de custo, categorias, métodos de pagamento e políticas.
