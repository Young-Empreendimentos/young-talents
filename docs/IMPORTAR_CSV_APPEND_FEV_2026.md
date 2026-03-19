# Importar só candidatos novos (append-only) — CSV fev/2026

Este guia descreve como subir para o Supabase **apenas os candidatos do CSV que ainda não estão cadastrados**, usando validação por e-mail. Ideal para o arquivo `candidates-202603.csv` (fevereiro em diante) sem duplicar quem já foi importado.

---

## 1. Formato do CSV

O arquivo `assets/candidates/candidates-202603.csv` usa os **mesmos cabeçalhos** do Google Forms já mapeados no projeto:

| Cabeçalho no CSV | Coluna no banco |
|------------------|-----------------|
| Carimbo de data/hora | original_timestamp |
| COD | (ignorado) |
| Nome completo: | full_name |
| E-mail principal: | email |
| Nº telefone celular / Whatsapp: | phone |
| Cidade onde reside: | city |
| Áreas de interesse profissional | interest_areas |
| … | (demais em `scripts/lib/import-candidates-shared.js`) |

O mapeamento completo está em **`scripts/lib/import-candidates-shared.js`** (usado pelo import normal e pelo append-only).

---

## 2. O que o script append-only faz

1. **Conecta** ao Supabase (variáveis de ambiente como no import normal).
2. **Busca todos os e-mails** já presentes na tabela `candidates` (com paginação).
3. **Lê o CSV** e aplica o mesmo mapeamento e normalização (cidade, fonte, áreas, datas, etc.).
4. **Filtra**: só mantém linhas cujo **e-mail (normalizado: trim + lowercase) não está no banco**.
5. **Insere em lotes de 100** apenas esses registros novos.
6. **Loga**: total no CSV, já cadastrados (ignorados), novos a inserir, inseridos e falhas.

Assim, quem já existe (por e-mail) não é inserido de novo.

---

## 3. Como rodar

### Pré-requisitos

- Node.js instalado.
- Variáveis do Supabase: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (ou `SUPABASE_URL` e `SUPABASE_ANON_KEY`), por exemplo no `.env.local`.

### Arquivo padrão (fev/2026)

Por padrão o script usa **`assets/candidates/candidates-202603.csv`**:

```bash
npm run import-candidates-append
```

Ou:

```bash
node scripts/import-candidates-append-only.js
```

### Outro arquivo CSV

Pode passar o caminho como argumento ou variável:

```bash
node scripts/import-candidates-append-only.js assets/candidates/outro-arquivo.csv
```

Ou:

```bash
CSV_PATH_APPEND=caminho/para/arquivo.csv node scripts/import-candidates-append-only.js
```

---

## 4. Saída esperada (exemplo)

```
Conectado ao Supabase. Projeto: xxxxx
CSV: /path/to/assets/candidates/candidates-202603.csv

Buscando e-mails já cadastrados no Supabase...
E-mails já no banco: 1200

Lendo CSV...
Linhas no CSV: 1820
Com e-mail válido: 1819
Já cadastrados (serão ignorados): 400
Novos a inserir: 1419

Inseridos 500 / 1419
Inseridos 1000 / 1419
Inseridos 1419 / 1419

Concluído. Inseridos: 1419  Falhas: 0
Total de candidatos no banco após importação: 2619
```

---

## 5. Relação com outros fluxos

- **Import completo (subir tudo de novo):** `npm run import-candidates` — lê `assets/candidates/candidates.csv` e insere todos (duplicatas por constraint ou retry um a um no script antigo).
- **Seed via SQL (truncar + re-subir):** ver **`docs/SEED_CANDIDATOS_CLI.md`** — gera `seed-candidates-part-*.sql` a partir do CSV e aplica com `npm run seed-candidates-db`.
- **Import pela UI:** Banco de Talentos → Importar CSV/XLSX — permite mapear colunas e escolher tratamento de duplicados.

O **append-only** é o fluxo indicado quando você tem um CSV parcial (ex.: fev/2026) e quer **apenas acrescentar** quem ainda não está no Supabase, sem apagar nada e sem duplicar por e-mail.
