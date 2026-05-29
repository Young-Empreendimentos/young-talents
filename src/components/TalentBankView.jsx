import React, { useState, useMemo } from 'react';
import { Search, Filter, CalendarCheck, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Edit3, Star, Download, UserPlus, X, Users } from 'lucide-react';
import ExportCandidatesCsvModal from './modals/ExportCandidatesCsvModal';
import AddCandidateModal from './AddCandidateModal';
import { STATUS_COLORS, ALL_STATUSES } from '../constants';
import { getCandidateTimestamp } from '../utils/timestampUtils';
import { getCandidateRecency, getRecencyRowClass } from '../utils/candidateRecency';

const SortIcon = ({ field, sortField, sortOrder }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp size={12} className="inline ml-0.5" /> : <ChevronDown size={12} className="inline ml-0.5" />;
};

const TalentBankView = ({ candidatesLoading = false, candidatesTotal = 0, filteredCount = 0, onClearFilters, candidates, jobs, companies, onEdit, applications = [], onStatusChange, filters = {}, setFilters, onToggleStar, onAddCandidate, isSaving = false, interestAreas = [], showToast }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    const [localSearch, setLocalSearch] = useState('');
    const [localSort, setLocalSort] = useState('recent');
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState('asc');
    const [selectedIds, setSelectedIds] = useState([]);
    const handleSort = (field) => {
        if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortOrder('asc'); }
    };
    const [dateFilter, setDateFilter] = useState('all');
    const [customDateStart, setCustomDateStart] = useState('');
    const [customDateEnd, setCustomDateEnd] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [isExportCsvModalOpen, setIsExportCsvModalOpen] = useState(false);

    const processedData = useMemo(() => {
        let data = candidates.filter(c => !c.deletedAt);

        if (dateFilter !== 'all') {
            const now = Date.now() / 1000;
            if (dateFilter === 'custom' && customDateStart && customDateEnd) {
                const startDate = new Date(customDateStart).getTime() / 1000;
                const endDate = new Date(customDateEnd).getTime() / 1000 + 86400;
                data = data.filter(c => {
                    const ts = getCandidateTimestamp(c);
                    if (!ts) return false;
                    return ts >= startDate && ts <= endDate;
                });
            } else {
                const periods = { 'today': 86400, '7d': 604800, '30d': 2592000, '90d': 7776000 };
                const cutoff = now - (periods[dateFilter] || 0);
                data = data.filter(c => {
                    const ts = getCandidateTimestamp(c);
                    return ts ? ts >= cutoff : false;
                });
            }
        }

        if (localSearch) {
            const s = localSearch.toLowerCase();
            data = data.filter(c =>
                c.fullName?.toLowerCase().includes(s) ||
                c.email?.toLowerCase().includes(s) ||
                c.phone?.toLowerCase().includes(s) ||
                c.city?.toLowerCase().includes(s) ||
                c.interestAreas?.toLowerCase().includes(s) ||
                c.source?.toLowerCase().includes(s)
            );
        }

        if (sortField) {
            const key = sortField === 'created_at' ? (c => getCandidateTimestamp(c) || 0) : (c => (c[sortField] ?? ''));
            const mult = sortOrder === 'asc' ? 1 : -1;
            data.sort((a, b) => {
                const va = typeof key(a) === 'number' ? key(a) : String(key(a)).toLowerCase();
                const vb = typeof key(b) === 'number' ? key(b) : String(key(b)).toLowerCase();
                if (typeof va === 'number' && typeof vb === 'number') return mult * (va - vb);
                return mult * (va < vb ? -1 : va > vb ? 1 : 0);
            });
        } else {
            data.sort((a, b) => {
                if (localSort === 'recent') return (getCandidateTimestamp(b) || 0) - (getCandidateTimestamp(a) || 0);
                if (localSort === 'oldest') return (getCandidateTimestamp(a) || 0) - (getCandidateTimestamp(b) || 0);
                if (localSort === 'az') return (a.fullName || '').localeCompare(b.fullName || '');
                if (localSort === 'za') return (b.fullName || '').localeCompare(a.fullName || '');
                return 0;
            });
        }
        return data;
    }, [candidates, localSearch, localSort, sortField, sortOrder, dateFilter, customDateStart, customDateEnd]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return processedData.slice(start, start + itemsPerPage);
    }, [processedData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(processedData.length / itemsPerPage);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (dateFilter !== 'all') count++;
        if (localSearch) count++;
        return count;
    }, [dateFilter, localSearch]);

    const activeStar = filters.starredFilter ?? (filters.starred === true ? 'starred' : 'all');

    // Estados vazios
    if (candidatesLoading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
                <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                <span>Carregando candidatos...</span>
            </div>
        );
    }
    if (processedData.length === 0 && candidatesTotal > 0 && typeof onClearFilters === 'function') {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
                <Users size={40} className="mb-3 opacity-40" />
                <p className="mb-1 font-medium text-foreground">Nenhum candidato encontrado</p>
                <p className="mb-4 text-sm">Os filtros atuais não correspondem a nenhum registro.</p>
                <button type="button" onClick={onClearFilters} className="px-5 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-brand-orange/90 transition-colors">
                    Limpar filtros
                </button>
            </div>
        );
    }
    if (processedData.length === 0 && candidatesTotal === 0) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
                <Users size={40} className="mb-3 opacity-40" />
                <p className="mb-1 font-medium text-foreground">Nenhum candidato cadastrado</p>
                <p className="text-sm">Os dados aparecerão após o carregamento ou envio de formulários.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">

            {/* ===== HEADER ===== */}
            <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 space-y-3 border-b border-border bg-card/50">

                {/* Linha 1: Título + Ações principais */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Banco de Talentos</h2>
                        <span className="px-2.5 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-semibold tabular-nums">
                            {processedData.length} candidato{processedData.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {onAddCandidate && (
                            <button
                                type="button"
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-brand-orange hover:bg-brand-orange/90 transition-colors shadow-sm"
                            >
                                <UserPlus size={15} />
                                <span className="hidden sm:inline">Adicionar</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsExportCsvModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground bg-card border border-border hover:bg-muted transition-colors"
                        >
                            <Download size={15} />
                            <span className="hidden sm:inline">Exportar</span>
                        </button>
                    </div>
                </div>

                {/* Linha 2: Busca + Controles */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
                    {/* Busca */}
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                        <input
                            className="w-full bg-background border border-border rounded-lg pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
                            placeholder="Buscar por nome, email, telefone, cidade..."
                            value={localSearch}
                            onChange={e => { setLocalSearch(e.target.value); setCurrentPage(1); }}
                        />
                        {localSearch && (
                            <button onClick={() => setLocalSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Estrela */}
                        {typeof setFilters === 'function' && (
                            <div className="flex items-center rounded-lg border border-border bg-card overflow-hidden" role="group">
                                <button type="button" onClick={() => setFilters(prev => ({ ...prev, starredFilter: 'all' }))} className={`px-2.5 py-1.5 text-xs transition-colors ${activeStar === 'all' ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}>Todos</button>
                                <button type="button" onClick={() => setFilters(prev => ({ ...prev, starredFilter: 'starred' }))} className={`px-2 py-1.5 transition-colors border-l border-border ${activeStar === 'starred' ? 'bg-muted' : 'hover:bg-muted/50'}`} title="Com estrela">
                                    <Star size={14} className="text-amber-400 fill-amber-400" />
                                </button>
                                <button type="button" onClick={() => setFilters(prev => ({ ...prev, starredFilter: 'unstarred' }))} className={`px-2 py-1.5 transition-colors border-l border-border ${activeStar === 'unstarred' ? 'bg-muted' : 'hover:bg-muted/50'}`} title="Sem estrela">
                                    <Star size={14} className="text-muted-foreground/40" />
                                </button>
                            </div>
                        )}

                        {/* Ordenação */}
                        <select
                            className="bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange"
                            value={localSort}
                            onChange={e => { setLocalSort(e.target.value); setSortField(null); }}
                        >
                            <option value="recent">Mais Recentes</option>
                            <option value="oldest">Mais Antigos</option>
                            <option value="az">A-Z</option>
                            <option value="za">Z-A</option>
                        </select>

                        {/* Período */}
                        <select
                            className="bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange"
                            value={dateFilter}
                            onChange={e => {
                                setDateFilter(e.target.value);
                                setCurrentPage(1);
                                if (e.target.value !== 'custom') { setCustomDateStart(''); setCustomDateEnd(''); }
                            }}
                        >
                            <option value="all">Todo o período</option>
                            <option value="today">Hoje</option>
                            <option value="7d">Últimos 7 dias</option>
                            <option value="30d">Últimos 30 dias</option>
                            <option value="90d">Últimos 90 dias</option>
                            <option value="custom">Personalizado</option>
                        </select>

                        {/* Itens por página */}
                        <select
                            className="bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange"
                            value={itemsPerPage}
                            onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        >
                            <option value={10}>10 / pág</option>
                            <option value={25}>25 / pág</option>
                            <option value={50}>50 / pág</option>
                            <option value={100}>100 / pág</option>
                            <option value={500}>500 / pág</option>
                        </select>
                    </div>
                </div>

                {/* Datas personalizadas (quando selecionado) */}
                {dateFilter === 'custom' && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <CalendarCheck size={14} className="text-muted-foreground" />
                        <input type="date" className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30" value={customDateStart} onChange={e => setCustomDateStart(e.target.value)} />
                        <span className="text-xs text-muted-foreground">até</span>
                        <input type="date" className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30" value={customDateEnd} onChange={e => setCustomDateEnd(e.target.value)} />
                    </div>
                )}

                {/* Badges de filtros ativos */}
                {(activeFiltersCount > 0 || activeStar !== 'all') && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Filtros:</span>
                        {localSearch && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                                Busca: "{localSearch}"
                                <button onClick={() => setLocalSearch('')}><X size={12} /></button>
                            </span>
                        )}
                        {dateFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                                Período: {dateFilter === 'today' ? 'Hoje' : dateFilter === '7d' ? '7 dias' : dateFilter === '30d' ? '30 dias' : dateFilter === '90d' ? '90 dias' : 'Personalizado'}
                                <button onClick={() => { setDateFilter('all'); setCustomDateStart(''); setCustomDateEnd(''); }}><X size={12} /></button>
                            </span>
                        )}
                        {activeStar !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs">
                                {activeStar === 'starred' ? 'Com estrela' : 'Sem estrela'}
                                <button onClick={() => setFilters(prev => ({ ...prev, starredFilter: 'all' }))}><X size={12} /></button>
                            </span>
                        )}
                        <button
                            onClick={() => { setLocalSearch(''); setDateFilter('all'); setCustomDateStart(''); setCustomDateEnd(''); if (onClearFilters) onClearFilters(); }}
                            className="text-xs text-muted-foreground hover:text-foreground underline"
                        >
                            Limpar todos
                        </button>
                    </div>
                )}
            </div>

            {/* ===== TABELA ===== */}
            <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse min-w-[900px]">
                    <thead className="bg-muted/60 sticky top-0 z-[1]">
                        <tr>
                            <th className="px-3 py-2.5 text-left w-10">
                                <input type="checkbox" className="accent-brand-orange rounded" />
                            </th>
                            <th className="px-2 py-2.5 text-center w-10" title="Mapeado como interesse">
                                <Star size={13} className="inline text-amber-400" />
                            </th>
                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none" onClick={() => handleSort('fullName')}>
                                Nome <SortIcon field="fullName" sortField={sortField} sortOrder={sortOrder} />
                            </th>
                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none min-w-[140px]" onClick={() => handleSort('status')}>
                                Status <SortIcon field="status" sortField={sortField} sortOrder={sortOrder} />
                            </th>
                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none" onClick={() => handleSort('email')}>
                                Email <SortIcon field="email" sortField={sortField} sortOrder={sortOrder} />
                            </th>
                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none" onClick={() => handleSort('phone')}>
                                Telefone <SortIcon field="phone" sortField={sortField} sortOrder={sortOrder} />
                            </th>
                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none" onClick={() => handleSort('city')}>
                                Cidade <SortIcon field="city" sortField={sortField} sortOrder={sortOrder} />
                            </th>
                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none" onClick={() => handleSort('interestAreas')}>
                                Área <SortIcon field="interestAreas" sortField={sortField} sortOrder={sortOrder} />
                            </th>
                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none" onClick={() => handleSort('source')}>
                                Fonte <SortIcon field="source" sortField={sortField} sortOrder={sortOrder} />
                            </th>
                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none whitespace-nowrap" onClick={() => handleSort('created_at')}>
                                Cadastro <SortIcon field="created_at" sortField={sortField} sortOrder={sortOrder} />
                            </th>
                            <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-16">
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((c, idx) => {
                            const recency = getCandidateRecency(c);
                            return (
                                <tr
                                    key={c.id}
                                    className={`border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer ${getRecencyRowClass(recency)} ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                                    onClick={() => onEdit(c)}
                                >
                                    <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="accent-brand-orange rounded"
                                            checked={selectedIds.includes(c.id)}
                                            onChange={() => setSelectedIds(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                                        />
                                    </td>
                                    <td className="px-2 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                                        {onToggleStar ? (
                                            <button type="button" onClick={() => onToggleStar(c)} className="p-0.5 rounded hover:bg-muted focus:outline-none">
                                                <Star size={15} className={c.starred ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30 hover:text-amber-300'} />
                                            </button>
                                        ) : null}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2">
                                            {recency && (
                                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${recency === 'today' ? 'bg-green-500 animate-pulse' : recency === 'yesterday' ? 'bg-green-400' : 'bg-green-400/60'}`} />
                                            )}
                                            <span className="font-medium text-sm text-foreground hover:text-brand-orange transition-colors truncate max-w-[200px]">
                                                {c.fullName || 'Sem nome'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                                        {onStatusChange ? (
                                            <select
                                                value={c.status || 'Inscrito'}
                                                onChange={(e) => onStatusChange(c.id, e.target.value)}
                                                className={`px-2 py-0.5 rounded text-[11px] border font-semibold cursor-pointer ${STATUS_COLORS[c.status] || 'bg-slate-600 text-white border-slate-500'} hover:opacity-80 transition-opacity`}
                                            >
                                                {ALL_STATUSES.map(status => (
                                                    <option key={status} value={status} className="bg-card text-foreground">{status}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-0.5 rounded text-[11px] border font-semibold whitespace-nowrap ${STATUS_COLORS[c.status] || 'bg-slate-600 text-white border-slate-500'}`}>
                                                {c.status || 'Inscrito'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5 text-sm text-muted-foreground truncate max-w-[180px]">{c.email || '—'}</td>
                                    <td className="px-3 py-2.5 text-sm text-muted-foreground whitespace-nowrap">{c.phone || '—'}</td>
                                    <td className="px-3 py-2.5 text-sm text-muted-foreground">{c.city || '—'}</td>
                                    <td className="px-3 py-2.5 text-sm text-muted-foreground truncate max-w-[150px]" title={c.interestAreas}>{c.interestAreas || '—'}</td>
                                    <td className="px-3 py-2.5 text-sm text-muted-foreground">{c.source || '—'}</td>
                                    <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                                        {(() => {
                                            const ts = getCandidateTimestamp(c);
                                            if (!ts) return '—';
                                            return new Date(ts * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                        })()}
                                    </td>
                                    <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => onEdit(c)} className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-orange hover:bg-muted transition-colors">
                                            <Edit3 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ===== PAGINAÇÃO ===== */}
            <div className="px-4 sm:px-6 py-3 border-t border-border bg-card/50 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground tabular-nums">
                    {processedData.length > 0
                        ? `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, processedData.length)} de ${processedData.length}`
                        : '0 resultados'
                    }
                </p>
                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            Primeira
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={14} />
                        </button>

                        {/* Números de página */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let page;
                            if (totalPages <= 5) page = i + 1;
                            else if (currentPage <= 3) page = i + 1;
                            else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                            else page = currentPage - 2 + i;
                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 text-xs rounded transition-colors ${
                                        currentPage === page
                                            ? 'bg-brand-orange text-white font-semibold shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                >
                                    {page}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={14} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            Última
                        </button>
                    </div>
                )}
            </div>

            {/* ===== MODAIS ===== */}
            <ExportCandidatesCsvModal
                isOpen={isExportCsvModalOpen}
                onClose={() => setIsExportCsvModalOpen(false)}
                candidates={processedData}
            />
            {showAddModal && (
                <AddCandidateModal
                    onClose={() => setShowAddModal(false)}
                    onSave={async (data) => {
                        if (!onAddCandidate) return;
                        try {
                            await onAddCandidate(data, () => {
                                setShowAddModal(false);
                                if (onClearFilters) onClearFilters();
                                setLocalSearch('');
                                setDateFilter('all');
                                setCurrentPage(1);
                            });
                        } catch (err) {
                            console.error('Erro ao adicionar candidato:', err);
                        }
                    }}
                    isSaving={isSaving}
                    interestAreas={interestAreas}
                />
            )}
        </div>
    );
};

export default TalentBankView;
