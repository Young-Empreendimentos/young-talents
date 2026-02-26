# SQL para colunas que podem estar faltando no Supabase

Se você ver erros como:

- **"Could not find the 'approved_by' column of 'jobs'"** ao criar ou editar vagas
- **"Could not find the 'closed_at' column of 'candidates'"** ao mover candidatos de etapa (ex.: da etapa 2 para a 3)
- **"Could not find the 'starred' column of 'candidates'"** ao marcar "em consideração"

significa que as migrations que adicionam essas colunas ainda não foram aplicadas no seu projeto Supabase.

## Como aplicar

1. Acesse o **Supabase Dashboard** do seu projeto.
2. Vá em **SQL Editor**.
3. Cole e execute o bloco de SQL correspondente abaixo (pode executar todos de uma vez se quiser).

---

## 1. Coluna "Quem autorizou a abertura" na tabela de vagas (jobs)

Execute este SQL para poder criar e editar vagas sem erro de `approved_by`:

```sql
-- Campo "Quem autorizou a abertura" da vaga
ALTER TABLE young_talents.jobs
  ADD COLUMN IF NOT EXISTS approved_by TEXT;

COMMENT ON COLUMN young_talents.jobs.approved_by IS 'Responsável pela solicitação e autorização da abertura da vaga (não quem abre no sistema).';
```

---

## 2. Coluna "Em consideração" (estrela) na tabela de candidatos

Execute para habilitar a marcação "em consideração" e o filtro por estrela:

```sql
ALTER TABLE young_talents.candidates
ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false;

COMMENT ON COLUMN young_talents.candidates.starred IS 'Marcação "em consideração" para filtro na etapa Inscrito';
```

---

## 3. Colunas de processo do candidato (entrevistas, closed_at, etc.)

Execute para poder mover candidatos entre etapas (ex.: da etapa 2 para a 3) e salvar data/feedback de entrevistas:

```sql
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS interview1_date TIMESTAMPTZ;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS interview1_notes TEXT;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS interview2_date TIMESTAMPTZ;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS interview2_notes TEXT;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS manager_feedback TEXT;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS test_results TEXT;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS return_sent TEXT;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS return_date DATE;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS return_notes TEXT;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
```

---

## Alternativa via CLI

Se você usa a Supabase CLI no projeto:

```bash
supabase db push
```

Isso aplica todas as migrations pendentes da pasta `supabase/migrations/`.

**Se o `db push` falhar** (por exemplo, erro de "duplicate key" em `schema_migrations` quando há duas migrations com o mesmo número), aplique os blocos SQL acima manualmente no **SQL Editor** do Supabase Dashboard.

---

## Se ainda der erro de "starred" ou "closed_at" depois de rodar os SQLs acima

O app acessa candidatos pela **view** `public.candidates`, não pela tabela direto. Essa view foi criada com uma lista fixa de colunas e não inclui `starred` nem as colunas de processo. Por isso, mesmo com as colunas na tabela `young_talents.candidates`, o erro pode continuar.

**Solução:** execute o arquivo **`docs/sql/04_update_public_candidates_view.sql`** no SQL Editor. Ele atualiza a view e os triggers de INSERT/UPDATE para expor as novas colunas.
