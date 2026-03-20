# SQL para rodar no Supabase

Arquivos para executar no **SQL Editor** do [Supabase Dashboard](https://supabase.com/dashboard) quando as colunas opcionais ainda não existirem no banco.

## O que pode dar erro de SQL se não rodar

| Sintoma no app | Solução |
|----------------|--------|
| Ao criar/editar vaga: erro "approved_by" ou "column not found" em jobs | Rodar **01** |
| Ao marcar estrela "em consideração": erro "starred" ou "column not found" em candidates | Rodar **02** e depois **04** (o app usa a view `public.candidates`) |
| Ao mover candidato de etapa ou salvar entrevista: erro "closed_at" ou outras colunas em candidates | Rodar **03** e depois **04** |
| Ao editar vaga: erro "posting_channels" ou "column not found" em jobs | Rodar **05** |
| Erro persiste após rodar 01, 02 e 03 | O app lê da **view** `public.candidates`, não da tabela direta. Rodar **04** para atualizar a view e os triggers. |

**Como usar:** abra cada arquivo `.sql`, copie o conteúdo, cole no SQL Editor do seu projeto e execute (Run).

**Ordem recomendada:** 01 → 02 → 03 → **04** (o 04 depende de 02 e 03).

| Arquivo | Quando rodar |
|---------|--------------|
| `01_add_approved_by_to_jobs.sql` | Erro ao criar/editar vaga: *"Could not find the 'approved_by' column of 'jobs'"* |
| `02_add_starred_to_candidates.sql` | Adiciona coluna `starred` na **tabela** young_talents.candidates |
| `03_add_candidate_process_columns.sql` | Adiciona colunas de processo (closed_at, entrevistas, etc.) na **tabela** |
| `04_update_public_candidates_view.sql` | **Obrigatório se ainda der erro de "starred" ou "closed_at".** O app usa a *view* public.candidates; esta atualiza a view e os triggers para expor as colunas novas. Rode depois de 02 e 03. |
| `05_add_posting_channels_to_jobs.sql` | Erro ao editar/criar vaga: *"Could not find the 'posting_channels' column of 'jobs'"* |

Os arquivos 01–03 e 05 usam `ADD COLUMN IF NOT EXISTS`. O 04 recria a view e as funções de trigger; é seguro executar mais de uma vez.

**Segurança / RLS / acesso ao ATS:** ver `wiki/Young-Talents-ATS-Seguranca.md` e `docs/young-talents/sql/README.md` na raiz do monorepo (migrations **037–039** no app `plataforma`).
