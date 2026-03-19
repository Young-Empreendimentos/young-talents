# YT-06 – Migração: banco de talentos antigo → Young Talents ATS

**Objetivo:** Inserir no sistema novo (Supabase) as pessoas que se inscreveram no banco de talentos antigo, preservando histórico e permitindo uso no ATS atual.

---

## 1. Obter/exportar dados do banco antigo

- Exportar do sistema antigo em **CSV** ou **Excel (XLSX)**.
- Anotar **quais colunas (cabeçalhos)** existem no export — isso define o mapeamento.
- Se possível, enviar uma **amostra anonimizada** (ex.: 5–10 linhas) para alinhar o mapeamento antes da carga completa.

---

## 2. Campos que o Young Talents aceita (candidatos)

| Campo no sistema | Obrigatório | Observação |
|------------------|-------------|------------|
| Nome completo | Sim | `full_name` |
| E-mail | Sim | `email` — usado como identificador |
| Telefone | Sim | `phone` |
| Cidade | Não | Será normalizada (ex.: "Porto Alegre/RS" → "Porto Alegre") |
| Data de nascimento | Não | Formato preferido: YYYY-MM-DD |
| Idade | Não | Número |
| Áreas de interesse | Não | Texto ou lista separada por vírgula |
| Formação / Escolaridade | Não | |
| Experiência | Não | |
| CNH (Sim/Não) | Não | `has_license` |
| Fonte / Onde nos encontrou | Não | Será normalizada |
| Currículo (URL) | Não | `cv_url` |
| Foto (URL) | Não | `photo_url` |
| Estado civil, filhos, instituição, cursos, referências, etc. | Não | Conforme disponível no export |

Vagas e candidaturas: se o banco antigo tiver vagas ou vínculos candidato–vaga, podemos definir um segundo passo (importar vagas e depois candidaturas). Para a **primeira etapa**, o foco é **candidatos**.

---

## 3. Fluxo de importação

1. **Export do antigo** → arquivo CSV ou XLSX.
2. **Ajuste de cabeçalhos (se necessário):** renomear colunas do export para bater com os nomes que o sistema reconhece, ou usar o **mapeamento na importação** (o app permite mapear coluna do CSV → campo do sistema).
3. **Importar pela interface** (Banco de Talentos → Importar CSV/XLSX) **ou** pelo script:
   - `node scripts/import-candidates-from-csv.js` — espera o CSV em `assets/candidates/candidates.csv` com cabeçalhos no formato do Google Forms (ver `scripts/import-candidates-from-csv.js` para o mapa exato).
   - Se o formato do banco antigo for outro, pode ser criado um **script de migração** que lê o CSV do export antigo e aplica um mapeamento específico (envie amostra do CSV para definir o mapa).
4. **Duplicados:** na importação pela UI, escolher como tratar e-mail repetido (pular, substituir ou duplicar). Para migração, em geral **substituir** ou **pular** (manter o que já está no sistema).
5. **Normalização:** cidade, fonte e áreas de interesse são normalizadas automaticamente na importação.

---

## 4. Validação antes de produção

- Rodar a importação em **ambiente de teste** (ou cópia do projeto Supabase) com um subset dos dados.
- Validar com a usuária (Carla) amostra de registros: nomes, e-mails, telefones, cidade, áreas.
- Após aprovação, executar a carga completa e documentar a **data da migração** e a **origem do arquivo** (ex.: "Export Banco Antigo – 2026-03-XX").

---

## 5. Documentar após a migração

- Data em que a migração foi executada.
- Número aproximado de registros importados.
- Origem do arquivo (nome do export) e qualquer tratamento especial (ex.: "removidas X linhas sem e-mail").

---

*Quando a Young tiver o export do banco antigo (ou amostra), o mapeamento pode ser fechado e, se necessário, um script dedicado `scripts/migrate-from-old-bank.js` pode ser criado para ler esse formato exato.*

---

## CSV parcial (ex.: só fev/2026) — só quem ainda não está no Supabase

Para subir **apenas candidatos que ainda não estão cadastrados** (evitando duplicar por e-mail):

- **Script:** `scripts/import-candidates-append-only.js`
- **Arquivo padrão:** `assets/candidates/candidates-202603.csv`
- **Comando:** `npm run import-candidates-append` ou `node scripts/import-candidates-append-only.js [caminho/do.csv]`

O script consulta todos os e-mails já existentes no Supabase, filtra o CSV e insere só os novos.  
**Guia passo a passo:** [IMPORTAR_CSV_APPEND_FEV_2026.md](./IMPORTAR_CSV_APPEND_FEV_2026.md).
