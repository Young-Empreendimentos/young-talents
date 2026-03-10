# Exportação de candidatos filtrados (CSV, XLS, PDF)

**Data:** 10/03/2025  
**Escopo:** Young Talents — Banco de Talentos e Relatórios

> **C-Suite / relatório diário:** Uma cópia deste documento está em `knowledge/06_CONHECIMENTO/young-talents-export-candidatos-2025-03-10.md` (base de conhecimento do monorepo). Ela é consumida pela API `/api/csuite/context-docs` e pelo workflow n8n (Build Context) para visibilidade do C-Suite.

---

## Resumo

Foi implementada a funcionalidade de **exportar a lista de candidatos filtrados** em três formatos: **CSV**, **XLS (Excel)** e **PDF**. O usuário escolhe o formato e as colunas que deseja no arquivo; a exportação usa sempre a lista já filtrada (filtros da sidebar, filtros salvos e, no Banco de Talentos, busca e ordenação locais).

---

## O que foi feito

### 1. Exportação a partir de filtros

- **Banco de Talentos:** botão **"Exportar CSV"** na barra de ações (ao lado de "Filtros"). Exporta a lista exibida na tela (`processedData`: candidatos após filtros globais + busca local + filtro por data + ordenação).
- **Relatórios:** botão **"Exportar candidatos (CSV)"** ao lado de "Exportar Excel". Exporta os candidatos do período selecionado no relatório (`filteredByPeriod`).
- Os **filtros salvos** (presets) continuam funcionando como antes: ao aplicar um preset na sidebar, a lista em Banco de Talentos ou Relatórios já fica filtrada; o novo botão exporta essa mesma lista.

### 2. Modal de exportação

- Ao clicar em "Exportar CSV" ou "Exportar candidatos (CSV)", abre um **modal** onde o usuário:
  - **Escolhe o formato:** CSV, XLS/Excel ou PDF.
  - **Seleciona as colunas** a serem incluídas no arquivo (checkboxes por campo, agrupados por categoria: pessoal, profissional, processo, etapas, etc.).
  - Pode usar atalhos: **Apenas contato**, **Padrão** (nome, email, telefone, cidade, status), **Selecionar todos**, **Desmarcar todos**.
- Validação: é obrigatório ter pelo menos uma coluna selecionada; o botão de exportar fica desabilitado se não houver colunas ou candidatos.

### 3. Formatos de arquivo

| Formato | Extensão | Descrição |
|--------|----------|-----------|
| **CSV** | `.csv` | Texto separado por vírgulas, UTF-8 com BOM (abre bem no Excel em pt-BR). |
| **XLS / Excel** | `.xlsx` | Planilha Excel com aba "Candidatos". |
| **PDF** | `.pdf` | Documento em paisagem com tabela (uma página por vez, quebra automática). |

### 4. Formatação dos dados

- Datas e datas/hora são formatadas em pt-BR (dd/mm/yyyy e dd/mm/yyyy, hh:mm).
- Campos booleanos saem como "Sim" / "Não".
- Tags (array) saem como texto separado por vírgula.
- Campos de candidato seguem as mesmas regras de exibição do app (ex.: filhos, idade calculada quando necessário).

---

## Arquivos criados e alterados

### Novos arquivos

- **`src/utils/csvExport.js`**  
  Funções de geração e download:
  - `buildCsvFromCandidates`, `downloadCsv` (CSV com BOM)
  - `getExportData` (cabeçalhos + linhas formatadas, reutilizado por XLS e PDF)
  - `downloadXls` (Excel via biblioteca `xlsx`)
  - `downloadPdf` (PDF em paisagem com tabela via `jspdf` + `jspdf-autotable`)
  - `defaultExportFilename(ext)` para nome do arquivo com data e hora

- **`src/components/modals/ExportCandidatesCsvModal.jsx`**  
  Modal com:
  - Seletor de formato (CSV, XLS, PDF)
  - Lista de campos por categoria com checkboxes
  - Atalhos de seleção de colunas
  - Botão de exportar que chama a função correta conforme o formato

### Arquivos alterados

- **`package.json`**  
  Novas dependências: `jspdf`, `jspdf-autotable` (para PDF).

- **`src/components/TalentBankView.jsx`**  
  Botão "Exportar CSV", estado do modal e renderização de `ExportCandidatesCsvModal` com `candidates={processedData}`.

- **`src/components/ReportsPage.jsx`**  
  Botão "Exportar candidatos (CSV)", estado do modal e renderização de `ExportCandidatesCsvModal` com `candidates={filteredByPeriod}`.

---

## Fluxo para o usuário

1. (Opcional) Aplicar filtros na sidebar ou um **filtro salvo**.
2. Ir em **Banco de Talentos** ou **Relatórios** (e, em Relatórios, escolher o período se quiser).
3. Clicar em **Exportar CSV** (Banco de Talentos) ou **Exportar candidatos (CSV)** (Relatórios).
4. No modal: escolher **CSV**, **XLS/Excel** ou **PDF**, marcar as colunas desejadas e clicar em **Exportar CSV** / **Exportar Excel** / **Exportar PDF**.
5. O navegador baixa o arquivo (ex.: `candidatos_export_2025-03-10_14-30.csv` ou `.xlsx` / `.pdf`).

---

## Dependências adicionadas

- `jspdf` (^2.5.2)
- `jspdf-autotable` (^3.8.3)

O projeto já utilizava `xlsx` para o export de resumo em Excel na página de Relatórios; passou a ser usado também para a exportação da lista de candidatos em XLS.

---

## Referências no código

- Campos disponíveis para exportação: `CANDIDATE_FIELDS` em `src/constants.js`.
- Formatação de datas e exibição: `src/utils/candidateDisplay.js`.
- Filtros e presets: `FilterSidebar.jsx`, chaves `FILTER_STORAGE_KEY` e `SAVED_FILTER_PRESETS_KEY` em `constants.js`.
