# Como popular candidatos a partir do CSV (Supabase + frontend)

Este guia explica como fazer o upload dos dados do CSV para o Supabase e por que eles aparecem no frontend.

---

## 1. Onde colocar o CSV

- **Caminho do arquivo:** `assets/candidates/candidates.csv`
- O script de importação lê **sempre** esse arquivo. Coloque aí a planilha exportada (CSV) do seu banco de talentos.

Se o CSV tiver outro nome ou pasta, você pode:
- copiar/colar o conteúdo para `assets/candidates/candidates.csv`, ou  
- alterar a constante `CSV_PATH` no script `scripts/import-candidates-from-csv.js`.

---

## 2. Formato do CSV (cabeçalhos)

O script mapeia as **colunas pelo nome exato** do cabeçalho. Os nomes esperados estão no objeto `CSV_TO_DB` dentro do script. Exemplos:

| Cabeçalho no CSV (exato) | Coluna no banco |
|--------------------------|-----------------|
| Carimbo de data/hora     | original_timestamp |
| Nome completo:           | full_name |
| E-mail principal:        | email |
| Nº telefone celular / Whatsapp: | phone |
| Cidade onde reside:      | city |
| Áreas de interesse profissional | interest_areas |
| Nos envie uma foto atual que você goste: | photo_url |
| Onde você nos encontrou?  | source |
| Se tem filhos, quantos?  | children_count |
| … (outros no script)     | … |

- **Obrigatório:** pelo menos `E-mail principal:` (email). Linhas sem email são ignoradas.
- Se a sua planilha tiver nomes de coluna diferentes (ex.: “Nome” em vez de “Nome completo:”), é preciso ajustar o mapa `CSV_TO_DB` no script para incluir esses nomes e o nome da coluna no banco.

---

## 2.1. Importar só os que ainda não estão no banco (append-only)

Se você tem um CSV **parcial** (ex.: `candidates-202603.csv`, só fevereiro em diante) e quer **apenas incluir quem ainda não está cadastrado** (validação por e-mail):

- **Script:** `node scripts/import-candidates-append-only.js` (ou `npm run import-candidates-append`).
- **Arquivo padrão:** `assets/candidates/candidates-202603.csv`. Para outro arquivo: `node scripts/import-candidates-append-only.js caminho/arquivo.csv`.

O script busca todos os e-mails já existentes no Supabase, filtra o CSV e insere só registros novos.  
Guia completo: **[IMPORTAR_CSV_APPEND_FEV_2026.md](./IMPORTAR_CSV_APPEND_FEV_2026.md)**.

---

## 3. Como rodar a importação (popular os dados)

### Pré-requisitos

- Node.js instalado.
- Variáveis do Supabase disponíveis (URL e chave **anon** ou **service_role**).

### Opção A: Usando o script npm

```bash
npm run import-candidates
```

O script usa por padrão `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` do ambiente (por exemplo do `.env`).

### Opção B: Definindo variáveis na hora

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co \
VITE_SUPABASE_ANON_KEY=sua_anon_key \
node scripts/import-candidates-from-csv.js
```

Ou, se preferir nomes sem `VITE_`:

```bash
SUPABASE_URL=https://seu-projeto.supabase.co \
SUPABASE_ANON_KEY=sua_anon_key \
node scripts/import-candidates-from-csv.js
```

### O que o script faz

1. Lê `assets/candidates/candidates.csv`.
2. Para cada linha:
   - Mapeia colunas do CSV → colunas do banco (snake_case).
   - **Normaliza** antes de enviar:
     - **Cidade:** `normalizeCity()` (ex.: “porto alegre” → “Porto Alegre/RS”).
     - **Onde nos encontrou:** `normalizeSource()`.
     - **Áreas de interesse:** `normalizeInterestAreasString()`.
     - **Filhos:** `normalizeChildrenForStorage()`.
     - **Foto (Drive):** converte link `drive.google.com/open?id=XXX` para `https://drive.google.com/uc?export=view&id=XXX`.
     - Datas/carimbo: parse para ISO quando possível.
3. Envia em **lotes de 100** para o Supabase.
4. **Duplicatas (email já existente):** o script pula a linha e avisa no console; não quebra a importação.

---

## 4. Para onde vão os dados no Supabase

- O app usa a **view** `public.candidates` na API.
- O script faz:

  `supabase.from('candidates').insert(rows)`  
  → isso grava na view **public.candidates**.

- No banco, a view redireciona a escrita para a tabela real **young_talents.candidates** através de um trigger `INSTEAD OF INSERT`:
  - Os dados ficam armazenados em **young_talents.candidates**.
  - Quem lê/escreve pela API continua usando `public.candidates` (e o trigger cuida de ler/escrever em `young_talents.candidates`).

Resumo: **os dados do CSV vão para a tabela young_talents.candidates** (via view public.candidates). É a mesma tabela que o formulário público e o painel usam.

---

## 5. Por que os dados aparecem no frontend

1. No **App.jsx**, quando há usuário logado (ou usuário efetivo), é chamado `loadAllData()`.
2. `loadAllData()` chama, entre outras coisas, **loadCandidates()**.
3. **loadCandidates()** faz:
   - `supabase.from('candidates').select('*').order('created_at', { ascending: false })`
   - Ou seja, lê da view **public.candidates** (que reflete **young_talents.candidates**).
4. O resultado (snake_case) é convertido com **mapCandidatesFromSupabase()** para o formato do app (camelCase: fullName, photoUrl, etc.).
5. O estado **candidates** é atualizado com **setCandidates(...)**.

Esse estado é usado em:

- **Dashboard**
- **Pipeline (funil)**
- **Banco de Talentos**
- **Filtros** (cidade, áreas de interesse, etc.)
- **Perfil do candidato**
- **Candidaturas** (quando há vínculo com vagas)

Ou seja: **depois que o script popula o Supabase, basta abrir o app logado e os candidatos passam a aparecer** em todas essas telas (e novos envios do formulário público também vão para a mesma tabela e aparecem da mesma forma).

---

## 6. Resumo rápido

| Etapa | O que fazer |
|-------|-------------|
| 1 | Colocar o CSV em `assets/candidates/candidates.csv` (ou ajustar o caminho no script). |
| 2 | Ter `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (ou passar na linha de comando). |
| 3 | Rodar `npm run import-candidates` (ou o comando `node` com as variáveis). |
| 4 | Dados vão para **young_talents.candidates** (via view public.candidates). |
| 5 | No app, **loadCandidates()** lê da mesma view, mapeia e preenche o estado **candidates** → dados aparecem no frontend (Dashboard, Pipeline, Banco de Talentos, filtros, etc.). |

---

## 7. Por que só apareciam 1000 no front?

O Supabase (PostgREST) retorna **no máximo 1000 linhas** por consulta por padrão. Por isso, mesmo com 2193 registros no banco, o front mostrava só 1000.

**Correção aplicada:** em `loadCandidates()` no App.jsx foi adicionado `.range(0, 9999)`, para trazer até **10.000** candidatos. Após atualizar o app e recarregar a página (logado), todos os candidatos carregados do Supabase passam a aparecer.

---

## 8. CSV com mais linhas que o banco (ex.: 2698 no CSV, 2193 no Supabase)

Se no CSV você tem **2698 linhas** e no Supabase só **2193**, as demais (~505) podem não ter entrado por:

- **Email duplicado:** mesma pessoa em mais de uma linha no CSV (ou email já existente no banco). O script e o import do front **pulam** essas linhas.
- **Linha sem email:** linhas sem “E-mail principal” são ignoradas.
- **Erro em lote:** antes da correção de `phone` vazio, linhas sem telefone falhavam (NOT NULL). Hoje o script usa string vazia para `phone` quando faltar.

**Como completar os dados:**

1. **Arquivos SQL para colar no Supabase (não depende de chave)**  
   Gera vários `.sql` pequenos (cada um com até ~300 linhas) para caber no **SQL Editor** do Supabase.
   ```bash
   npm run generate-candidates-sql
   ```
   Os arquivos saem em **`scripts/output/`**: `seed-candidates-part-01.sql`, `part-02.sql`, … No Supabase: **SQL Editor → New query → cole o conteúdo do part-01 → Run**. Depois repita com part-02, part-03, … **em ordem**, até o último. (Desde a migration 011 a tabela permite múltiplos envios por email; o SQL gerado não usa mais `ON CONFLICT (email)`.)

2. **Script Node (precisa de chave no .env)**  
   Coloque a chave anon **real** no `.env` e rode:
   ```bash
   npm run import-candidates
   ```
   Se ainda houver constraint única em email, duplicatas serão ignoradas; caso contrário todas as linhas do CSV são inseridas.

3. **Import pelo frontend**  
   Configurações → Importação em massa (CSV). Envie o mesmo CSV; o sistema insere em lotes e pula emails duplicados (quando houver constraint).

Depois de importar, **recarregue a página** (com usuário logado). Com o `.range(0, 9999)`, o front passa a exibir até 10.000 candidatos.

---

## 9. Igualar a contagem ao backup original (ex.: CSV com 25.528 linhas, banco com 4.948)

Se você rodou só **parte** dos arquivos SQL (ex.: 9 partes ≈ 2.700 linhas) e o **backup em CSV tem bem mais linhas** (ex.: 25.528), para ficar com a **mesma quantidade de linhas do backup** faça **uma** das opções abaixo.

### Opção recomendada: truncar e importar o CSV inteiro via script

1. **No Supabase → SQL Editor**, execute **uma vez** (isso apaga todos os candidatos e reinicia a sequência de IDs):
   ```sql
   TRUNCATE young_talents.candidates RESTART IDENTITY CASCADE;
   ```
2. No projeto, com `.env` configurado (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), rode:
   ```bash
   npm run import-candidates
   ```
3. O script lê **todo** o `assets/candidates/candidates.csv` e insere em lotes. Com a migration 011 (múltiplos envios por email), **todas** as linhas com email são inseridas. Ao final você fica com o mesmo número de linhas do CSV (ex.: 25.528).
4. Recarregue o app (logado); os candidatos aparecem no painel.

### Opção alternativa: gerar todas as partes SQL e rodar no Supabase

1. Garanta que o CSV completo está em `assets/candidates/candidates.csv` (ex.: 25.529 linhas = 1 cabeçalho + 25.528 dados).
2. Rode o gerador:
   ```bash
   npm run generate-candidates-sql
   ```
   Serão criadas **várias partes** em `scripts/output/` (ex.: ~86 partes de 300 linhas).
3. No Supabase → SQL Editor, execute **uma vez**:
   ```sql
   TRUNCATE young_talents.candidates RESTART IDENTITY CASCADE;
   ```
4. Execute **cada** arquivo em ordem: `seed-candidates-part-01.sql`, `part-02.sql`, … até o último. Assim a tabela fica com a mesma quantidade de linhas do backup.

---

## 10. Ajustar cabeçalhos do CSV (planilha diferente)

Se a sua planilha tiver **2698 linhas e colunas de A a AG** com nomes diferentes dos listados no script, edite o objeto **CSV_TO_DB** em `scripts/import-candidates-from-csv.js`: à esquerda coloque o **nome exato da coluna no CSV** (como aparece na primeira linha), à direita o nome da coluna no banco (snake_case). Consulte também `docs/MAPEAMENTO_CAMPOS.md` e a tabela `young_talents.candidates` (ou a view em `supabase/migrations/006_public_candidates_view.sql`) para ver todos os campos disponíveis.
