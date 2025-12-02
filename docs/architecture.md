# Arquitetura proposta

Este documento resume a arquitetura e as decisões iniciais para o app interno de reembolso da Conatus Ambiental, seguindo o PRD fornecido.

## Visão geral
- **Front-end:** React (SPA) em TypeScript, React Router, React Query, Zustand/Redux Toolkit para estado global, Tailwind ou Chakra para UI. Layout responsivo mobile-first, textos e mensagens em PT-BR. Controle de acesso por papéis no roteamento e em componentes.
- **Back-end:** Node.js com Express/Fastify em TypeScript. Rotas REST versionadas (`/api/v1`). Camada de serviços com regras de negócio de aprovação, caps e cálculo de km. Middlewares para autenticação JWT e RBAC. Logger estruturado e tratamento padrão de erros.
- **Banco de dados:** PostgreSQL com migrations e seeds iniciais (roles, categorias, políticas). Índices em FKs e campos de busca.
- **Storage de anexos:** Abstração de storage (interface) com implementação S3 ou GCS; uso de URLs assinadas para upload/download de recibos.
- **Autenticação:** E-mail + senha, hashes com bcrypt/argon2, JWT + refresh token. Papéis: Admin, Aprovador, Usuário.

## Fluxos principais
1. **Criação de viagem**: destino, motivo, datas, centro de custo/projeto → status "Em andamento".
2. **Lançamento de despesa**: foto/anexo, data, categoria, valor, forma de pagamento, observações. Herda CC/projeto da viagem (editável).
3. **Quilometragem**: tipo específico com total de km, cálculo `km * valor/km` por cargo, aplicação de cap conforme política.
4. **Fechamento do relatório**: resumo + envio para aprovação → status "Em aprovação"; trava edição pelo usuário.
5. **Aprovação**: aprovador por CC/projeto aprova, reprova (com justificativa e reabertura) ou delega. Aprovado → travado definitivamente.
6. **Exportação**: CSV/Excel por período/filtros; PDF consolidado por viagem.
7. **Backoffice**: gestão de usuários/perfis, centros de custo/projetos, categorias, políticas, auditoria.

## Regras de negócio-chave
- Uma viagem pertence a um usuário e a um centro de custo/projeto (1:1 no escopo atual).
- Uma despesa sempre pertence a uma viagem e a uma categoria configurável (com flags de anexo obrigatório e reembolsável).
- Envio para aprovação exige ao menos uma despesa; após envio o usuário não edita até reprovação; após aprovado fica travado.
- Quilometragem usa valor/km por cargo; se exceder limite, aplicar cap ou apenas sinalizar conforme política.
- Aprovação é roteada pelo CC/projeto da viagem; delegação registra log de auditoria.
- Notificações por e-mail: novo relatório para aprovador; aprovação/reprovação para usuário.

## Extensibilidade futura
- Pontos de extensão para OCR e sugestão de categoria (serviços plugáveis, sem implementação atual).
- Placeholder para cálculo automático de distância via APIs de mapas.
- Estrutura de notificações preparada para outros canais (Teams/WhatsApp) e futura integração SSO.

## Segurança e observabilidade
- Helmet, CORS, rate limiting básico, logs estruturados, correlação por request-id.
- Validação de payloads com Zod/celebrate; mensagens de erro amigáveis.
- Auditoria de eventos: criação/edição de viagens e despesas, envio, aprovação, reprovação, delegação.

## Próximos passos sugeridos
1. Criar migrations e seeds iniciais com base no modelo relacional fornecido (roles, categorias, políticas e vínculos de CC/projeto).
2. Implementar autenticação JWT, RBAC e autorização contextual por CC/projeto.
3. Entregar fluxos CRUD de viagem e despesa (incluindo quilometragem) e o pipeline de aprovação.
4. Adicionar exportações CSV/Excel e PDF consolidado por viagem.
5. Documentar API em OpenAPI e incluir testes unitários/integrados para regras críticas.
