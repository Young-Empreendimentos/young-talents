# Clerk — legado (isolamento)

**Status (2026-03):** Este app (`young-talents`) **não** declara `@clerk/nextjs` nem variáveis `CLERK_*` no código-fonte atual. Não há `ClerkProvider` no layout.

Se no futuro algum PR reintroduzir Clerk para auth, documente aqui:

- Arquivos e imports (`@clerk/nextjs`, `auth()`, `ClerkProvider`).
- Variáveis de ambiente necessárias.
- Plano de migração de volta para Supabase Auth (padrão do monorepo Admin).

**Caminho canônico:** `apps/clientes/young-talents/plataforma/` (`@cliente/young-plataforma`), fora de `apps/core/admin`.
