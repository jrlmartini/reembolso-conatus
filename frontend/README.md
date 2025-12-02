# Frontend (React)

## Stack sugerida
- React + TypeScript (Vite)
- React Router para rotas públicas/protegidas
- React Query para dados, Zustand/Redux Toolkit para estado global
- Tailwind ou Chakra UI para componentes
- Form validation com React Hook Form + Zod

## Páginas e fluxos
- Login
- Lista de viagens (status: Em andamento, Em aprovação, Reprovado, Aprovado)
- Detalhe da viagem (despesas, botão nova despesa, fechar relatório)
- Formulário de despesa (fluxo foto → tipo → valor → salvar; inclui quilometragem)
- Aprovação (fila do aprovador, detalhe do relatório com aprovar/reprovar/delegar)
- Backoffice (desktop-first): Usuários, Projetos/CC, Categorias, Políticas, Relatórios, Auditoria

## Estrutura sugerida
```
src/
  app/ (providers, rotas, layout)
  components/ (UI compartilhada)
  features/
    auth/
    travel/
    expenses/
    approvals/
    admin/
  services/ (clients da API)
  store/
  hooks/
  utils/
  types/
```

## Boas práticas de UX
- Mobile-first; botões grandes e textos claros.
- Fluxo rápido de despesa: capturar foto → selecionar tipo → inserir valor → salvar.
- Mostrar indicadores de cap por política e status de aprovação.
- Mensagens em PT-BR e feedbacks de erro/sucesso.

## Próximos passos
1. Configurar Vite com Tailwind/Chakra e fontes.
2. Implementar roteamento protegido por papel; guards para Admin/Aprovador.
3. Integrar endpoints de viagens, despesas, aprovação e backoffice.
4. Adicionar telas de exportação (CSV/Excel, PDF por viagem) e painéis de métricas.
5. Preparar hooks e serviços para futuras extensões (OCR/sugestão de categoria).
