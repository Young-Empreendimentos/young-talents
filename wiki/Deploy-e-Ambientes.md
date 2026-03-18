# Deploy e ambientes

## Frontend (Vercel)

1. Conectar o repositório `adventurelabsbrasil/young-talents`.  
2. Variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

Build: `npm run build` (Vite). Saída: `dist/`.

Referências no repo: `docs/CONFIGURACAO_VERCEL.md`, `vercel.json`.

## Produção (referência)

- App cliente: domínio Adventure Labs (ex.: `youngempreendimentos.adventurelabs.com.br`).  
- **Login:** apenas recrutadores/admins.  
- **Redirect URLs** no Supabase Auth devem incluir o domínio de produção.  
- Formulário público: `/apply`.

## Pré-deploy

Checklist: `CHECKLIST_PRE_DEPLOY.md` ou cópia em `docs/`.

## Troubleshooting

- Login: `docs/TROUBLESHOOTING_LOGIN.md`  
- Deploy: `docs/TROUBLESHOOTING_DEPLOY.md`
