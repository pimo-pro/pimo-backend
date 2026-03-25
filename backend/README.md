# PIMO Backend (Render)

Backend Node.js independente para servir endpoints usados pelo PIMO.

## Endpoints

- `GET /health` — healthcheck
- `GET /api/materials` — payload de materiais (mesmo formato do middleware do Vite)
- `GET /api/projects/index.php?scope=mine|all&ownerId=...` — listar projetos
- `GET /api/projects/index.php?action=load&id=...` — carregar projeto
- `POST /api/projects/index.php` — criar/atualizar projeto (corpo = `PimoProjectData`)
- `PUT /api/projects/index.php?action=update&id=...` — renomear (`{ "name": "..." }`)
- `DELETE /api/projects/index.php?action=delete&id=...` — apagar

## Como rodar localmente

```bash
cd backend
npm install
npm run dev
```

Por defeito roda em `http://localhost:3000`.

## Variáveis de ambiente

- `PORT` — porta do servidor (Render define automaticamente)
- `PIMO_PROJECTS_DATA_DIR` — diretório para persistir JSON dos projetos
  - default: `backend/data/projects`

## Render

- **Build command**: `npm install && npm run build`
- **Start command**: `npm run start`

> Nota: este backend reaproveita o gerador de materiais do monorepo (`src/server/materialsApi.ts`).
> Portanto, o deploy no Render deve apontar para o repositório completo e usar `backend/` como Root Directory do serviço.
