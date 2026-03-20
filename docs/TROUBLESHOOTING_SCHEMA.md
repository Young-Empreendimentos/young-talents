# Erro de schema ao criar empresa, cidade, setor ou cargo

Se ao criar **Empresa**, **Cidade**, **Setor** ou **Cargo** (ou nova **Vaga**) aparecer erro relacionado a **schema** (ex.: "schema young_talents does not exist" ou "The schema must be one of the following"), o motivo é que a API do Supabase (PostgREST) expõe por padrão apenas o schema **public**. As tabelas do projeto estão no schema **young_talents**, então é preciso expor esse schema na API.

## Aplicar migrations via CLI (recomendado)

Assim você aplica as migrations (012, 013, etc.) no projeto remoto sem colar SQL no dashboard.

**No diretório do projeto** (onde está a pasta `supabase/`), rode **na ordem**:

```bash
# 1. Login (abre o navegador; use o token do dashboard)
npx supabase login

# 2. Vincular ao seu projeto (substitua pelo seu project ref)
npx supabase link --project-ref YOUR_PROJECT_REF
```
Quando pedir, informe a **senha do banco** (Settings → Database no dashboard).

```bash
# 3. Enviar as migrations para o remoto
npx supabase db push
```

O `db push` aplica todas as migrations pendentes em `supabase/migrations/` (incluindo 012 e 013). A migration 012 tenta expor o schema `young_talents` na API.

**Se aparecer "Access token not provided"** ao rodar `db push`, rode primeiro `npx supabase login` no mesmo terminal e tente de novo.

Se após o `db push` o erro de schema no app continuar, use uma das opções abaixo (expor o schema no Dashboard ou via SQL).

---

## Solução para erro de schema (escolha uma)

### Opção 1: Dashboard (recomendado)

1. Abra o **Supabase Dashboard** do seu projeto.
2. Vá em **Project Settings** (ícone de engrenagem) → **API**.
3. Em **Data API** (ou **API Settings**), procure por **"Exposed schemas"** ou **"Schema"**.
4. Inclua **`young_talents`** na lista de schemas expostos (além de `public`).
5. Salve e aguarde alguns segundos. Tente criar empresa/cidade/setor/cargo de novo.

### Opção 2: SQL Editor

Se na sua conta não aparecer a opção de Exposed schemas no Dashboard, use o **SQL Editor** do Supabase:

1. Dashboard → **SQL Editor** → **New query**.
2. Cole e execute:

```sql
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, young_talents';
```

3. Pode ser necessário reiniciar o projeto ou aguardar alguns minutos para a alteração do role aplicar.

Depois disso, criar empresa, cidade, setor, cargo e vaga deve funcionar normalmente.
