# Scripts e dados

## NPM

| Comando | Uso |
|---------|-----|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build produção |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run import-candidates` | Importar CSV |
| `npm run delete-candidates-supabase` | Limpar candidatos (cuidado) |
| `npm run verify-csv-supabase` | Conferir CSV vs Supabase |

## Scripts Node (`scripts/`)

- `setup-supabase-users.js`, `create-admin-user.js` — usuários iniciais  
- `add-roles-to-existing-users.js` — papéis em massa  
- `import-candidates-from-csv.js`, `generate-candidates-sql.js`, `seed-candidates-db.js`  
- `diagnostico-supabase.js` — checagens  

Credenciais apenas via `.env` / CI secrets — **não commitar**.

## Backup

Workflow de backup em `.github/workflows/` e guias em `docs/GUIA_BACKUP_SUPABASE.md`.

## CSV / modelo

Modelos e regras: `docs/GUIA_IMPORTACAO_CSV.md`, `docs/GUIA_NORMALIZACAO_CIDADES.md`.
