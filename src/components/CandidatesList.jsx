import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Settings, X, Edit3, Trash2, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { CANDIDATE_FIELDS, STATUS_COLORS } from '../constants';
import { getCandidateTimestamp } from '../utils/timestampUtils';
import { formatChildrenForDisplay } from '../utils/childrenNormalizer';
import { formatCandidateDate } from '../utils/candidateDisplay';

const CandidatesList = ({ candidates, jobs, onAdd, onEdit, onDelete }) => {
    const [localSearch, setLocalSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortField, setSortField] = useState('fullName');
    const [sortOrder, setSortOrder] = useState('asc');
    const [showColumnSelector, setShowColumnSelector] = useState(false);

    // Todas as colunas disponíveis - usando nomes visuais do CANDIDATE_FIELDS
    const ALL_COLUMNS = useMemo(() => {
        const defaultColumns = ['fullName', 'email', 'phone', 'city', 'hasLicense', 'interestAreas', 'source', 'original_timestamp', 'status', 'maritalStatus'];
        return CANDIDATE_FIELDS.map(f => ({
            key: f.key,
            label: f.displayName,
            csvLabel: f.csvLabel, // Nome original do CSV para referência
            default: defaultColumns.includes(f.key)
        }));
    }, []);

    // Colunas visíveis - carregar do localStorage ou usar default
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('candidates_visible_columns');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return ALL_COLUMNS.filter(c => c.default).map(c => c.key);
            }
        }
        return ALL_COLUMNS.filter(c => c.default).map(c => c.key);
    });

    // Salvar colunas visíveis no localStorage
    useEffect(() => {
        localStorage.setItem('candidates_visible_columns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    const toggleColumn = (key) => {
        setVisibleColumns(prev =>
            prev.includes(key)
                ? prev.filter(k => k !== key)
                : [...prev, key]
        );
    };

    const selectAllColumns = () => setVisibleColumns(ALL_COLUMNS.map(c => c.key));
    const selectDefaultColumns = () => setVisibleColumns(ALL_COLUMNS.filter(c => c.default).map(c => c.key));

    // Função para renderizar o conteúdo de cada célula
    const renderCellContent = (c, key) => {
        const formatDate = (value) => {
            if (!value) return 'N/A';
            try {
                let date;
                if (typeof value === 'string') {
                    date = new Date(value);
                } else if (value.toDate) {
                    date = value.toDate();
                } else if (value.seconds || value._seconds) {
                    date = new Date((value.seconds || value._seconds) * 1000);
                } else {
                    date = new Date(value);
                }
                return !isNaN(date.getTime())
                    ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'N/A';
            } catch {
                return 'N/A';
            }
        };

        const formatDateOnly = (value) => formatCandidateDate(value) ?? 'N/A';

        const renderBoolField = (value, trueText = '✓ Sim', falseText = '✗ Não') => {
            if (value === 'Sim' || value === true) {
                return <span className="text-green-600 dark:text-green-400">{trueText}</span>;
            } else if (value === 'Não' || value === false) {
                return <span className="text-red-600 dark:text-red-400">{falseText}</span>;
            }
            return <span className="text-gray-500">N/A</span>;
        };

        const renderUrl = (url, label = 'Ver') => {
            if (!url) return <span className="text-gray-500">N/A</span>;
            return (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                >
                    {label} ↗
                </a>
            );
        };

        const renderTruncated = (value, maxWidth = '150px') => {
            if (!value) return <span className="text-gray-500">N/A</span>;
            return (
                <div className="text-xs text-muted-foreground truncate" style={{ maxWidth }} title={value}>
                    {value}
                </div>
            );
        };

        switch (key) {
            case 'fullName':
                return <div className="font-semibold text-foreground text-sm">{c.fullName || 'N/A'}</div>;
            case 'email':
                return <div className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[200px]" title={c.email}>{c.email || 'N/A'}</div>;
            case 'email_secondary':
                return <div className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[200px]" title={c.email_secondary}>{c.email_secondary || 'N/A'}</div>;
            case 'phone':
                return <div className="text-xs text-gray-600 dark:text-gray-300">{c.phone || 'N/A'}</div>;
            case 'city':
                return <div className="text-xs text-gray-600 dark:text-gray-300">{c.city || 'N/A'}</div>;
            case 'source':
                return <div className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate max-w-[150px]" title={c.source}>{c.source || 'N/A'}</div>;
            case 'interestAreas':
                return <div className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate max-w-[150px]" title={c.interestAreas}>{c.interestAreas || 'N/A'}</div>;
            case 'education':
                return renderTruncated(c.education);
            case 'schoolingLevel':
                return renderTruncated(c.schoolingLevel, '120px');
            case 'institution':
                return renderTruncated(c.institution);
            case 'hasLicense':
                return <div className="text-xs">{renderBoolField(c.hasLicense)}</div>;
            case 'status':
                return (
                    <span className={`px-2 py-1 rounded text-xs border font-medium whitespace-nowrap ${STATUS_COLORS[c.status] || 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-input'}`}>
                        {c.status || 'Sem Status'}
                    </span>
                );
            case 'original_timestamp': {
                const ts = getCandidateTimestamp(c);
                if (!ts) return <div className="text-xs text-gray-500">N/A</div>;
                const d = new Date(ts * 1000);
                return <div className="text-xs text-muted-foreground font-medium whitespace-nowrap">{!isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div>;
            }
            case 'birthDate':
                return <div className="text-xs text-muted-foreground whitespace-nowrap">{formatDateOnly(c.birthDate)}</div>;
            case 'age':
                return <div className="text-xs text-muted-foreground">{c.age || 'N/A'}</div>;
            case 'maritalStatus':
                return <div className="text-xs text-muted-foreground">{c.maritalStatus || 'N/A'}</div>;
            case 'childrenCount':
                return <div className="text-xs text-muted-foreground">{formatChildrenForDisplay(c.childrenCount) || 'N/A'}</div>;
            case 'graduationDate':
                return <div className="text-xs text-muted-foreground whitespace-nowrap">{formatDateOnly(c.graduationDate)}</div>;
            case 'isStudying':
                return <div className="text-xs">{renderBoolField(c.isStudying)}</div>;
            case 'experience':
                return renderTruncated(c.experience, '200px');
            case 'courses':
                return renderTruncated(c.courses);
            case 'certifications':
                return renderTruncated(c.certifications);
            case 'cvUrl':
                return renderUrl(c.cvUrl, 'CV');
            case 'portfolioUrl':
                return renderUrl(c.portfolioUrl, 'Portfolio');
            case 'photoUrl':
                return c.photoUrl ? (
                    <a href={c.photoUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-blue-600 dark:text-blue-400 hover:underline text-xs">
                        Ver Foto ↗
                    </a>
                ) : <span className="text-gray-500">N/A</span>;
            case 'referral':
                return renderTruncated(c.referral);
            case 'salaryExpectation':
                return renderTruncated(c.salaryExpectation, '120px');
            case 'canRelocate':
                return <div className="text-xs">{renderBoolField(c.canRelocate)}</div>;
            case 'references':
                return renderTruncated(c.references, '200px');
            case 'typeOfApp':
                return renderTruncated(c.typeOfApp);
            case 'freeField':
                return renderTruncated(c.freeField, '200px');
            case 'external_id':
                return <div className="text-xs text-gray-500 font-mono">{c.external_id || 'N/A'}</div>;
            default:
                return <div className="text-xs text-muted-foreground">{c[key] || 'N/A'}</div>;
        }
    };

    // Filtrar por busca
    const filtered = useMemo(() => {
        let data = [...candidates];
        if (localSearch) {
            const search = localSearch.toLowerCase();
            data = data.filter(c =>
                c.fullName?.toLowerCase().includes(search) ||
                c.email?.toLowerCase().includes(search) ||
                c.email_secondary?.toLowerCase().includes(search) ||
                c.phone?.toLowerCase().includes(search) ||
                c.city?.toLowerCase().includes(search) ||
                c.source?.toLowerCase().includes(search) ||
                c.interestAreas?.toLowerCase().includes(search) ||
                c.education?.toLowerCase().includes(search) ||
                c.schoolingLevel?.toLowerCase().includes(search) ||
                c.institution?.toLowerCase().includes(search) ||
                c.experience?.toLowerCase().includes(search) ||
                c.courses?.toLowerCase().includes(search) ||
                c.certifications?.toLowerCase().includes(search) ||
                c.referral?.toLowerCase().includes(search) ||
                c.salaryExpectation?.toLowerCase().includes(search) ||
                c.references?.toLowerCase().includes(search) ||
                c.typeOfApp?.toLowerCase().includes(search) ||
                c.freeField?.toLowerCase().includes(search) ||
                c.external_id?.toLowerCase().includes(search) ||
                c.maritalStatus?.toLowerCase().includes(search)
            );
        }
        // Ordenar
        data.sort((a, b) => {
            if (sortField === 'original_timestamp') {
                const aTs = (getCandidateTimestamp(a) || 0) * 1000;
                const bTs = (getCandidateTimestamp(b) || 0) * 1000;
                return sortOrder === 'asc' ? aTs - bTs : bTs - aTs;
            }
            if (sortField === 'birthDate') {
                const aDate = a.birthDate ? new Date(a.birthDate) : new Date(0);
                const bDate = b.birthDate ? new Date(b.birthDate) : new Date(0);
                return sortOrder === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
            }
            let aVal = a[sortField] || '';
            let bVal = b[sortField] || '';
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return sortOrder === 'asc' ? cmp : -cmp;
        });
        return data;
    }, [candidates, localSearch, sortField, sortOrder]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedCandidates = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">Banco de Talentos</h2>
                <button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded flex items-center gap-2 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600">
                    <UserPlus size={18} /> Adicionar
                </button>
            </div>

            {/* Barra de Busca e Controles */}
            <div className="bg-card rounded-lg border border-border p-4 flex flex-wrap gap-4 items-center shadow-sm">
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Buscar por nome, email, telefone, cidade, fonte, área..."
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-input rounded px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={localSearch}
                        onChange={e => { setLocalSearch(e.target.value); setCurrentPage(1); }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Itens:</label>
                    <select
                        className="bg-gray-50 dark:bg-gray-900 border border-input rounded px-2 py-1.5 text-xs text-foreground"
                        value={itemsPerPage}
                        onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={500}>500</option>
                        <option value={1000}>1000</option>
                    </select>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowColumnSelector(!showColumnSelector)}
                        className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                    >
                        <Settings size={14} /> Colunas ({visibleColumns.length}/{ALL_COLUMNS.length})
                    </button>
                    {showColumnSelector && (
                        <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-50 w-80 max-h-96 overflow-y-auto">
                            <div className="p-3 border-b border-border flex justify-between items-center sticky top-0 bg-card">
                                <span className="text-sm font-bold text-foreground">Colunas Visíveis</span>
                                <div className="flex gap-2">
                                    <button onClick={selectAllColumns} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Todas</button>
                                    <button onClick={selectDefaultColumns} className="text-xs text-gray-500 hover:underline">Padrão</button>
                                    <button onClick={() => setShowColumnSelector(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-2 grid grid-cols-2 gap-1">
                                {ALL_COLUMNS.map(col => (
                                    <label key={col.key} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns.includes(col.key)}
                                            onChange={() => toggleColumn(col.key)}
                                            className="rounded text-blue-600"
                                        />
                                        <span className="text-xs text-muted-foreground">{col.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                    {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-gray-900 text-muted-foreground font-medium sticky top-0 z-10">
                            <tr>
                                {ALL_COLUMNS.filter(col => visibleColumns.includes(col.key)).map(col => (
                                    <th
                                        key={col.key}
                                        className="px-3 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                                        onClick={() => toggleSort(col.key)}
                                    >
                                        <div className="flex items-center gap-1 text-xs font-semibold">
                                            {col.label} {sortField === col.key && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </div>
                                    </th>
                                ))}
                                <th className="px-3 py-2 text-right text-xs font-semibold sticky right-0 bg-gray-100 dark:bg-gray-900">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedCandidates.length > 0 ? (
                                paginatedCandidates.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors" onClick={() => onEdit(c)}>
                                        {ALL_COLUMNS.filter(col => visibleColumns.includes(col.key)).map(col => (
                                            <td key={col.key} className="px-3 py-2">
                                                {renderCellContent(c, col.key)}
                                            </td>
                                        ))}
                                        <td className="px-3 py-2 text-right sticky right-0 bg-card">
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={(e) => { e.stopPropagation(); onEdit(c); }} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300" title="Editar">
                                                    <Edit3 size={16} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400" title="Excluir">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={visibleColumns.length + 1} className="px-6 py-8 text-center text-muted-foreground">
                                        Nenhum candidato encontrado
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {filtered.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900 border-t border-border px-6 py-3 flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                            Mostrando{' '}
                            {String((currentPage - 1) * itemsPerPage + 1)}
                            {' - '}
                            {String(Math.min(currentPage * itemsPerPage, filtered.length))}
                            {' de '}
                            {String(filtered.length)} candidatos
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${currentPage === 1
                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                <ChevronLeft size={16} className="inline" /> Anterior
                            </button>
                            <span className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-300">
                                Página {currentPage} de {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${currentPage === totalPages
                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                Próxima <ChevronRight size={16} className="inline" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandidatesList;
