/**
 * Gera CSV, XLS e PDF a partir de candidatos e lista de campos (keys).
 * Usado na exportação filtrada (Banco de Talentos / Relatórios).
 */

import { formatCandidateDate, formatCandidateTimestamp, formatCandidateChildren } from './candidateDisplay';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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
 * Retorna cabeçalhos e linhas formatadas para uso em XLS/PDF (reutiliza formatação do CSV).
 * @returns {{ headers: string[], rows: string[][] }}
 */
export function getExportData(candidates, fieldKeys, options = {}) {
  const headerLabels = options.headerLabels || {};
  const headers = fieldKeys.map(key => headerLabels[key] || key);
  const rows = candidates.map(c =>
    fieldKeys.map(key => {
      const type = (options.fieldTypes && options.fieldTypes[key]) || 'text';
      return formatCellValue(c, key, type);
    })
  );
  return { headers, rows };
}

/**
 * Gera e dispara download de arquivo Excel (.xlsx).
 */
export function downloadXls(candidates, fieldKeys, options = {}, filename) {
  const { headers, rows } = getExportData(candidates, fieldKeys, options);
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Candidatos');
  XLSX.writeFile(wb, filename || defaultExportFilename('xlsx'));
}

/**
 * Gera e dispara download de PDF com tabela de candidatos.
 */
export function downloadPdf(candidates, fieldKeys, options = {}, filename) {
  const { headers, rows } = getExportData(candidates, fieldKeys, options);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.autoTable({
    head: [headers],
    body: rows,
    styles: { fontSize: 8 },
    margin: { top: 10 },
  });
  doc.save(filename || defaultExportFilename('pdf'));
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
 * Gera nome de arquivo com data e hora.
 * @param {string} [ext='csv'] - Extensão: 'csv' | 'xlsx' | 'pdf'
 */
export function defaultExportFilename(ext = 'csv') {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5).replace(':', '-');
  const base = `candidatos_export_${date}_${time}`;
  const suffix = ext === 'xlsx' ? '.xlsx' : ext === 'pdf' ? '.pdf' : '.csv';
  return base + suffix;
}
