# Site-Labdec

Sistema web de gestão de materiais, equipamentos e projetos do laboratório **LABDEC** da **UFCI-RJ** (antigo CEFET-RJ).

- **Frontend:** React 18 (SPA responsiva) + Tailwind CSS v4 + React Router v6, empacotado com Vite
- **Backend:** Node.js + Express + SQLite (`better-sqlite3`), autenticação JWT e senhas com bcrypt

## Como rodar

Requisitos: Node.js 20 ou superior.

```bash
npm install          # instala backend e frontend (npm workspaces)
npm run seed         # cria o banco SQLite com dados de exemplo
npm run dev          # API em http://localhost:3001 e site em http://localhost:5173
```

Para recriar o banco do zero: `npm run seed -- --reset`.

**Produção:** `npm run build` e depois `JWT_SECRET=um-segredo-forte npm start` — a API passa a servir também o site já compilado em `http://localhost:3001`.

### Variáveis de ambiente (backend)

| Variável      | Padrão                       | Descrição                               |
| ------------- | ---------------------------- | --------------------------------------- |
| `PORT`        | `3001`                       | Porta da API                            |
| `JWT_SECRET`  | segredo de desenvolvimento   | **Defina em produção**                  |
| `DB_PATH`     | `backend/data/labdec.db`     | Arquivo do banco SQLite                 |
| `CORS_ORIGIN` | qualquer origem              | Origem permitida para o frontend        |

### Usuários de exemplo (criados pelo seed)

| Perfil        | Usuário              | Senha            |
| ------------- | -------------------- | ---------------- |
| Responsável   | `MariaSouza20151`    | `10000000120151` |
| Administrador | `CarlosPereira20192` | `10000000220192` |
| Padrão        | `JoaoSilva20241`     | `12345678920241` |
| Padrão        | `AnaOliveira20232`   | `98765432120232` |

## Regras de negócio implementadas

| Regra | Onde |
| --- | --- |
| RBAC com 3 perfis e apenas **1 Responsável** por vez (índice único no banco; transferência pela edição de usuário) | `backend/src/middleware/auth.js`, `routes/usuarios.js`, `frontend/src/routes/ProtectedRoute.jsx` |
| Usuário Padrão sempre vinculado a **pelo menos um projeto ativo** (validado no cadastro, edição de membros e exclusão de projetos) | `routes/usuarios.js`, `routes/projetos.js` |
| Credenciais automáticas: usuário `NomeSobrenomePeriodo`, senha `MatriculaPeriodo`; o usuário não pode alterar nem ver a senha | `backend/src/utils/credenciais.js` |
| **Aprovação imediata** de reservas/patriações e **veto posterior** só pelo Responsável (com motivo, devolvendo o estoque) | `routes/movimentacoes.js`, `/admin/vetos` |
| Máquinas fixas reservadas por horário, com bloqueio de conflitos na agenda | `routes/movimentacoes.js` |
| Reagentes patriados podem ter **Uso Total** sinalizado → item marcado com necessidade de reposição | `routes/movimentacoes.js` |
| Projetos de **Iniciação Científica** podem ser estendidos uma única vez por **+1 ano** | `routes/projetos.js` |
| Relatórios de acervo (com alertas de reposição) e de uso anual por projeto, usuário e área, com exportação CSV e impressão/PDF | `routes/relatorios.js`, `/admin/relatorios` |

## Estrutura

```
backend/
  src/
    schema.sql           # modelagem da seção 6 do documento de contexto
    db.js  server.js  seed.js
    middleware/auth.js   # JWT + permitir(...roles)
    routes/              # auth, usuarios, projetos, equipamentos, movimentacoes, relatorios
    utils/               # credenciais, datas, http
frontend/
  src/
    components/{ui,layout,feedback}
    context/             # AuthContext (RBAC), LabContext (toasts e filtros)
    hooks/               # useAuth, useEquipamentos, useVetos, useAsync, useLab
    layouts/             # AuthLayout, AppLayout, AdminLayout
    pages/{auth,app,admin}
    routes/              # index.jsx (mapa de rotas), ProtectedRoute.jsx
    services/            # api.js + serviços por recurso
    utils/               # formatters.js, validators.js
```

## API (resumo)

Todas as rotas, exceto o login, exigem `Authorization: Bearer <token>`.

| Método | Rota | Perfis |
| --- | --- | --- |
| POST | `/api/auth/login` · GET `/api/auth/me` | público · todos |
| GET/POST/PUT | `/api/usuarios`, `/api/usuarios/:id`, `/:id/redefinir-credenciais`, PATCH `/:id/ativo` | Responsável |
| GET | `/api/projetos`, `/api/projetos/:id` | todos |
| POST/PUT/DELETE | `/api/projetos`, `/:id`, PUT `/:id/membros`, POST `/:id/estender` | Responsável |
| GET | `/api/equipamentos`, `/api/equipamentos/:id` · POST `/:id/sinalizar-reposicao` | todos |
| POST/PUT/DELETE | `/api/equipamentos`, `/:id` | Responsável, Admin |
| POST | `/api/movimentacoes` · GET `/minhas` · POST `/:id/concluir`, `/:id/uso-total` | todos |
| GET · POST | `/api/movimentacoes` · `/:id/vetar` | Responsável |
| GET | `/api/relatorios/acervo`, `/api/relatorios/uso-anual?ano=AAAA` | Responsável, Admin |

## Observações sobre o documento de contexto

- Os valores `MAQUINA_MOVELE` e `PATRIACAO_MOVELE` foram corrigidos para `MAQUINA_MOVEL` e `PATRIACAO_MOVEL`.
- Campos acrescentados: `usuarios.ativo` (desativar contas sem perder o histórico), `projetos.descricao`, `equipamentos.descricao` e `equipamentos.localizacao`.
- A extensão de IC não altera `fim_previsto`; o fim efetivo (`fim_previsto` + 1 ano) é calculado quando `extendido_um_ano = 1`.
- Reservas de máquinas fixas cujo horário já terminou são concluídas automaticamente.
