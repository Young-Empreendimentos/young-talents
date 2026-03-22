import React, { useState, useMemo } from 'react';
import { X, Download, CheckSquare, Square, FileSpreadsheet, FileText } from 'lucide-react';
import { CANDIDATE_FIELDS } from '../../constants';
import { buildCsvFromCandidates, downloadCsv, downloadXls, downloadPdf, defaultExportFilename } from '../../utils/csvExport';

const DEFAULT_SELECTED_KEYS = ['fullName', 'email', 'phone', 'city', 'status'];
const CONTACT_ONLY_KEYS = ['fullName', 'email', 'phone'];

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', desc: 'Planilha texto (Excel, Google Sheets)' },
  { value: 'xls', label: 'XLS / Excel', desc: 'Arquivo Excel (.xlsx)' },
  { value: 'pdf', label: 'PDF', desc: 'Documento para impressão' },
];

export default function ExportCandidatesCsvModal({ isOpen, onClose, candidates = [] }) {
  const allKeys = useMemo(() => CANDIDATE_FIELDS.map(f => f.key), []);
  const [selectedKeys, setSelectedKeys] = useState(() => new Set(DEFAULT_SELECTED_KEYS));
  const [exportFormat, setExportFormat] = useState('csv');

  const headerLabels = useMemo(() => {
    const map = {};
    CANDIDATE_FIELDS.forEach(f => { map[f.key] = f.displayName; });
    return map;
  }, []);

  const fieldTypes = useMemo(() => {
    const map = {};
    CANDIDATE_FIELDS.forEach(f => { map[f.key] = f.type; });
    return map;
  }, []);

  const byCategory = useMemo(() => {
    const groups = {};
    CANDIDATE_FIELDS.forEach(f => {
      const cat = f.category || 'outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(f);
    });
    const order = ['pessoal', 'profissional', 'processo', 'etapas', 'links', 'adicional', 'sistema', 'outros'];
    return order.filter(c => groups[c]).map(c => ({ category: c, fields: groups[c] }));
  }, []);

  const toggleKey = (key) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelectedKeys(new Set(allKeys));
  const selectNone = () => setSelectedKeys(new Set());
  const selectContactOnly = () => setSelectedKeys(new Set(CONTACT_ONLY_KEYS));
  const selectDefault = () => setSelectedKeys(new Set(DEFAULT_SELECTED_KEYS));

  const handleExport = () => {
    const keys = Array.from(selectedKeys);
    if (keys.length === 0) return;
    const opts = { headerLabels, fieldTypes };
    if (exportFormat === 'csv') {
      const csv = buildCsvFromCandidates(candidates, keys, opts);
      downloadCsv(csv, defaultExportFilename('csv'));
    } else if (exportFormat === 'xls') {
      downloadXls(candidates, keys, opts, defaultExportFilename('xlsx'));
    } else {
      downloadPdf(candidates, keys, opts, defaultExportFilename('pdf'));
    }
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-border">
        <div className="p-6 border-b border-border flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <div>
            <h3 className="font-bold text-xl text-foreground">Exportar candidatos</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {candidates.length} {candidates.length === 1 ? 'candidato' : 'candidatos'} na lista. Escolha o formato e as colunas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="text-muted-foreground" size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-border space-y-3">
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-2">Formato de exportação</span>
            <div className="flex flex-wrap gap-3">
              {EXPORT_FORMATS.map((f) => (
                <label
                  key={f.value}
                  className={`flex items-center gap-2 cursor-pointer rounded-lg border px-4 py-2.5 transition-colors ${
                    exportFormat === f.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 bg-card hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportFormat"
                    value={f.value}
                    checked={exportFormat === f.value}
                    onChange={() => setExportFormat(f.value)}
                    className="sr-only"
                  />
                  {f.value === 'csv' && <FileText size={18} className="shrink-0" />}
                  {f.value === 'xls' && <FileSpreadsheet size={18} className="shrink-0" />}
                  {f.value === 'pdf' && <FileText size={18} className="shrink-0" />}
                  <div>
                    <span className="font-medium text-sm">{f.label}</span>
                    <span className="block text-xs opacity-80">{f.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium text-muted-foreground self-center">Atalhos colunas:</span>
          <button
            type="button"
            onClick={selectContactOnly}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-muted text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Apenas contato
          </button>
          <button
            type="button"
            onClick={selectDefault}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-muted text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Padrão (nome, email, telefone, cidade, status)
          </button>
          <button
            type="button"
            onClick={selectAll}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-muted text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Selecionar todos
          </button>
          <button
            type="button"
            onClick={selectNone}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-muted text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Desmarcar todos
          </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {byCategory.map(({ category, fields }) => (
            <div key={category} className="mb-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 capitalize">{category}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {fields.map(f => (
                  <label
                    key={f.key}
                    className="flex items-center gap-2 cursor-pointer text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded px-2 py-1"
                  >
                    {selectedKeys.has(f.key) ? (
                      <CheckSquare size={18} className="text-blue-600 shrink-0" />
                    ) : (
                      <Square size={18} className="text-gray-400 shrink-0" />
                    )}
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(f.key)}
                      onChange={() => toggleKey(f.key)}
                      className="sr-only"
                    />
                    <span className="truncate">{f.displayName}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-border flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <p className="text-sm text-muted-foreground">
            {selectedKeys.size} {selectedKeys.size === 1 ? 'coluna' : 'colunas'} selecionada(s)
            {selectedKeys.size === 0 && (
              <span className="text-amber-600 dark:text-amber-400 ml-1">— selecione ao menos uma.</span>
            )}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={selectedKeys.size === 0 || candidates.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Download size={18} /> Exportar {exportFormat === 'csv' ? 'CSV' : exportFormat === 'xls' ? 'Excel' : 'PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
