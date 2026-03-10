/**
 * Gera CSV a partir de candidatos e lista de campos (keys).
 * Usado na exportação filtrada (Banco de Talentos / Relatórios).
 */

import { formatCandidateDate, formatCandidateTimestamp, formatCandidateChildren } from './candidateDisplay';

const UTF8_BOM = '\uFEFF';

/**
 * Escapa um valor para célula CSV (quotes e quebras de linha).
 */
function escapeCsvCell(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Formata o valor de um campo do candidato para exibição no CSV.
 */
function formatCellValue(candidate, key, fieldType) {
  const raw = candidate[key];
  if (raw == null || raw === '') return '';

  switch (fieldType) {
    case 'date':
      return formatCandidateDate(raw) ?? '';
    case 'datetime':
      return formatCandidateTimestamp(raw) ?? '';
    case 'boolean':
      return raw === true ? 'Sim' : raw === false ? 'Não' : '';
    case 'tags':
      return Array.isArray(raw) ? raw.join(', ') : (raw && typeof raw === 'string' ? raw : '');
    case 'number':
      return String(raw);
    default:
      if (key === 'childrenCount') return formatCandidateChildren(raw) ?? String(raw);
      return String(raw);
  }
}

/**
 * Gera o conteúdo CSV (string) a partir dos candidatos e das colunas selecionadas.
 *
 * @param {object[]} candidates - Lista de candidatos (já filtrada)
 * @param {string[]} fieldKeys - Keys dos campos a exportar (ex.: ['email', 'fullName', 'phone'])
 * @param {object} options - Opções
 * @param {object} options.headerLabels - Mapa key -> label para cabeçalho (ex.: de CANDIDATE_FIELDS)
 * @param {string} options.separator - Separador (default ',')
 * @returns {string} Conteúdo CSV (sem BOM; o caller pode adicionar)
 */
export function buildCsvFromCandidates(candidates, fieldKeys, options = {}) {
  const headerLabels = options.headerLabels || {};
  const separator = options.separator || ',';
  const fields = fieldKeys.map(key => ({ key, label: headerLabels[key] || key }));

  const headerRow = fields.map(f => escapeCsvCell(f.label)).join(separator);
  const rows = [headerRow];

  for (const candidate of candidates) {
    const cells = fieldKeys.map(key => {
      const type = (options.fieldTypes && options.fieldTypes[key]) || 'text';
      const value = formatCellValue(candidate, key, type);
      return escapeCsvCell(value);
    });
    rows.push(cells.join(separator));
  }

  return rows.join('\r\n');
}

/**
 * Dispara o download do CSV no navegador.
 * Usa UTF-8 com BOM para o Excel abrir corretamente em pt-BR.
 *
 * @param {string} csvContent - Conteúdo CSV (sem BOM)
 * @param {string} filename - Nome do arquivo (ex.: candidatos_2025-03-10.csv)
 */
export function downloadCsv(csvContent, filename = 'candidatos_export.csv') {
  const blob = new Blob([UTF8_BOM + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Gera nome de arquivo com data (e opcionalmente hora).
 */
export function defaultExportFilename(withTime = true) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  if (!withTime) return `candidatos_${date}.csv`;
  const time = now.toTimeString().slice(0, 5).replace(':', '-');
  return `candidatos_export_${date}_${time}.csv`;
}
