import React, { useState, useMemo } from 'react';
import { Search, Filter, CalendarCheck, ChevronUp, ChevronDown, Edit3, Star } from 'lucide-react';
import { STATUS_COLORS, ALL_STATUSES } from '../constants';
import { getCandidateTimestamp } from '../utils/timestampUtils';
import { getCandidateRecency, getRecencyRowClass } from '../utils/candidateRecency';

const TalentBankView = ({ candidatesLoading = false, candidatesTotal = 0, filteredCount = 0, onClearFilters, candidates, jobs, companies, onEdit, applications = [], onStatusChange, filters = {}, setFilters, onToggleStar }) => {
    const [itemsPerPage, setItemsPerPage] = useState(10);
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
    const [dateFilter, setDateFilter] = useState('all'); // Filtro de data de criação
    const [customDateStart, setCustomDateStart] = useState('');
    const [customDateEnd, setCustomDateEnd] = useState('');
    const [showFilters, setShowFilters] = useState(false); // Painel de filtros colapsável

    const processedData = useMemo(() => {
        let data = candidates.filter(c => !c.deletedAt);

        // Filtro por data de criação
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
                const periods = {
                    'today': 1 * 24 * 60 * 60,
                    '7d': 7 * 24 * 60 * 60,
                    '30d': 30 * 24 * 60 * 60,
                    '90d': 90 * 24 * 60 * 60
                };
                const cutoff = now - (periods[dateFilter] || 0);
                data = data.filter(c => {
                    const ts = getCandidateTimestamp(c);
                    if (!ts) return false;
                    return ts >= cutoff;
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
                if (localSort === 'recent') {
                    const tsA = getCandidateTimestamp(a) || 0;
                    const tsB = getCandidateTimestamp(b) || 0;
                    return tsB - tsA;
                }
                if (localSort === 'oldest') {
                    const tsA = getCandidateTimestamp(a) || 0;
                    const tsB = getCandidateTimestamp(b) || 0;
                    return tsA - tsB;
                }
                if (localSort === 'az') return (a.fullName || '').localeCompare(b.fullName || '');
                if (localSort === 'za') return (b.fullName || '').localeCompare(a.fullName || '');
                return 0;
            });
        }
        return data;
    }, [candidates, localSearch, localSort, sortField, sortOrder, dateFilter, customDateStart, customDateEnd]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return processedData.slice(start, end);
    }, [processedData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(processedData.length / itemsPerPage);

    // Contar filtros ativos
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (dateFilter !== 'all') count++;
        if (localSearch) count++;
        return count;
    }, [dateFilter, localSearch]);

    if (candidatesLoading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <span>Carregando candidatos...</span>
            </div>
        );
    }
    if (processedData.length === 0 && candidatesTotal > 0 && typeof onClearFilters === 'function') {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[200px] text-gray-600 dark:text-gray-400">
                <p className="mb-3">Nenhum candidato corresponde aos filtros atuais.</p>
                <button type="button" onClick={onClearFilters} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    Limpar filtros
                </button>
            </div>
        );
    }
    if (processedData.length === 0 && candidatesTotal === 0) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[200px] text-gray-500 dark:text-gray-400">
                <span>Nenhum candidato cadastrado. Os dados aparecerão após o carregamento ou envio de formulários.</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-6 overflow-hidden bg-white dark:bg-gray-900">
            {/* Header com busca e controles principais */}
            <div className="mb-4 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Banco de Talentos</h2>
                        {/* Contador: Mostrando X a Y de Z candidatos */}
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
                                Mostrando {processedData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, processedData.length)} de {processedData.length} candidatos
                                {activeFiltersCount > 0 && (
                                    <span className="ml-2 text-xs">
                                        ({activeFiltersCount} {activeFiltersCount === 1 ? 'filtro ativo' : 'filtros ativos'})
                                    </span>
                                )}
                            </div>
                            {processedData.length > itemsPerPage && (
                                <button
                                    type="button"
                                    onClick={() => setItemsPerPage(prev => Math.min(prev + 50, processedData.length))}
                                    className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
                                >
                                    Ver mais
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {typeof setFilters === 'function' && (() => {
                            const activeStar = filters.starredFilter ?? (filters.starred === true ? 'starred' : 'all');
                            return (
                            <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5" role="group" aria-label="Filtro por estrela">
                                <button type="button" onClick={() => setFilters(prev => ({ ...prev, starredFilter: 'unstarred' }))} className={`p-2 rounded-md transition-colors ${activeStar === 'unstarred' ? 'bg-gray-100 dark:bg-gray-700 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`} title="Somente não considerados">
                                    <Star size={16} className="text-slate-400" />
                                </button>
                                <button type="button" onClick={() => setFilters(prev => ({ ...prev, starredFilter: 'all' }))} className={`p-2 rounded-md transition-colors ${activeStar === 'all' ? 'bg-gray-100 dark:bg-gray-700 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`} title="Todos">
                                    <Star size={16} className="text-amber-400" />
                                </button>
                                <button type="button" onClick={() => setFilters(prev => ({ ...prev, starredFilter: 'starred' }))} className={`p-2 rounded-md transition-colors ${activeStar === 'starred' ? 'bg-gray-100 dark:bg-gray-700 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`} title="Somente em consideração">
                                    <Star size={16} className="text-amber-400 fill-amber-400" />
                                </button>
                            </div>
                            );
                        })()}
                        {/* Busca global */}
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded pl-10 pr-3 py-1.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 w-64"
                                placeholder="Buscar em todo o cadastro..."
                                value={localSearch}
                                onChange={e => setLocalSearch(e.target.value)}
                            />
                        </div>
                        {/* Ordenação */}
                        <select
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                            value={localSort}
                            onChange={e => setLocalSort(e.target.value)}
                        >
                            <option value="recent">Mais Recentes</option>
                            <option value="oldest">Mais Antigos</option>
                            <option value="az">A-Z</option>
                            <option value="za">Z-A</option>
                        </select>
                        {/* Paginação */}
                        <select
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                            value={itemsPerPage}
                            onChange={e => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={10}>10 por página</option>
                            <option value={25}>25 por página</option>
                            <option value={50}>50 por página</option>
                            <option value={100}>100 por página</option>
                            <option value={500}>500 por página</option>
                            <option value={1000}>1000 por página</option>
                            <option value={5000}>5000 por página</option>
                        </select>
                        {/* Botão de filtros */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${showFilters || activeFiltersCount > 0
                                ? 'bg-blue-600 text-white border border-blue-600'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-500'
                                }`}
                        >
                            <Filter size={16} />
                            Filtros
                            {activeFiltersCount > 0 && (
                                <span className="bg-white/20 dark:bg-gray-900/30 px-2 py-0.5 rounded-full text-xs">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Painel de Filtros Expandido - Melhorado com mais espaçamento */}
                {showFilters && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                        <div className="space-y-6">
                            {/* Seção: Filtros de Data */}
                            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <CalendarCheck size={18} className="text-blue-600 dark:text-blue-400" />
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Filtros de Data</h3>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                            Período de Criação
                                        </label>
                                        <select
                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            value={dateFilter}
                                            onChange={e => {
                                                setDateFilter(e.target.value);
                                                if (e.target.value !== 'custom') {
                                                    setCustomDateStart('');
                                                    setCustomDateEnd('');
                                                }
                                            }}
                                        >
                                            <option value="all">Todas as datas</option>
                                            <option value="today">Hoje</option>
                                            <option value="7d">Últimos 7 dias</option>
                                            <option value="30d">Últimos 30 dias</option>
                                            <option value="90d">Últimos 90 dias</option>
                                            <option value="custom">Período personalizado</option>
                                        </select>
                                    </div>
                                    {dateFilter === 'custom' && (
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                Período Personalizado
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data inicial</label>
                                                    <input
                                                        type="date"
                                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                        value={customDateStart}
                                                        onChange={e => setCustomDateStart(e.target.value)}
                                                    />
                                                </div>
                                                <span className="text-gray-400 dark:text-gray-500 text-sm mt-6">até</span>
                                                <div className="flex-1">
                                                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data final</label>
                                                    <input
                                                        type="date"
                                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                        value={customDateEnd}
                                                        onChange={e => setCustomDateEnd(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Seção: Ações */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setDateFilter('all');
                                        setCustomDateStart('');
                                        setCustomDateEnd('');
                                        setLocalSearch('');
                                    }}
                                    className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium shadow-sm"
                                >
                                    Limpar Todos os Filtros
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                            <th className="p-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-700 w-10">
                                <input type="checkbox" className="accent-blue-600 dark:accent-blue-500" />
                            </th>
                            <th className="p-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-700 w-12" title="Em consideração"><Star size={14} className="inline text-amber-500" /></th>
                            <th className="p-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-700 w-10"></th>
                            <th className="p-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none" onClick={() => handleSort('fullName')}>Nome {sortField === 'fullName' && (sortOrder === 'asc' ? <ChevronUp size={12} className="inline" /> : <ChevronDown size={12} className="inline" />)}</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-700 min-w-[160px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none" onClick={() => handleSort('status')}>Status {sortField === 'status' && (sortOrder === 'asc' ? <ChevronUp size={12} className="inline" /> : <ChevronDown size={12} className="inline" />)}</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none" onClick={() => handleSort('email')}>Email {sortField === 'email' && (sortOrder === 'asc' ? <ChevronUp size={12} className="inline" /> : <ChevronDown size={12} className="inline" />)}</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none" onClick={() => handleSort('phone')}>Telefone {sortField === 'phone' && (sortOrder === 'asc' ? <ChevronUp size={12} className="inline" /> : <ChevronDown size={12} className="inline" />)}</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none" onClick={() => handleSort('city')}>Cidade {sortField === 'city' && (sortOrder === 'asc' ? <ChevronUp size={12} className="inline" /> : <ChevronDown size={12} className="inline" />)}</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-700">CNH</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none" onClick={() => handleSort('interestAreas')}>Área {sortField === 'interestAreas' && (sortOrder === 'asc' ? <ChevronUp size={12} className="inline" /> : <ChevronDown size={12} className="inline" />)}</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none" onClick={() => handleSort('source')}>Fonte {sortField === 'source' && (sortOrder === 'asc' ? <ChevronUp size={12} className="inline" /> : <ChevronDown size={12} className="inline" />)}</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none" onClick={() => handleSort('created_at')}>Data Cadastro {sortField === 'created_at' && (sortOrder === 'asc' ? <ChevronUp size={12} className="inline" /> : <ChevronDown size={12} className="inline" />)}</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none" onClick={() => handleSort('maritalStatus')}>Estado Civil {sortField === 'maritalStatus' && (sortOrder === 'asc' ? <ChevronUp size={12} className="inline" /> : <ChevronDown size={12} className="inline" />)}</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-700">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedData.map(c => {
                            const recency = getCandidateRecency(c);
                            return (
                                <tr
                                    key={c.id}
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${getRecencyRowClass(recency)}`}
                                >
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            className="accent-blue-600 dark:accent-blue-500"
                                            checked={selectedIds.includes(c.id)}
                                            onChange={() => setSelectedIds(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                                        />
                                    </td>
                                    <td className="p-3">
                                        {onToggleStar ? (
                                            <button type="button" onClick={(e) => { e.stopPropagation(); onToggleStar(c); }} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none" title={c.starred ? 'Remover de em consideração' : 'Marcar em consideração'}>
                                                <Star size={16} className={c.starred ? 'text-amber-400 fill-amber-400' : 'text-gray-400 hover:text-amber-300'} />
                                            </button>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-center">
                                        {recency && (
                                            <div className={`w-2 h-2 rounded-full mx-auto ${recency === 'today' ? 'bg-green-500 animate-pulse' : recency === 'yesterday' ? 'bg-green-400' : 'bg-green-400/70'}`} title={recency === 'today' ? 'Hoje' : recency === 'yesterday' ? 'Ontem' : 'Esta semana'}></div>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <span className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={() => onEdit(c)}>
                                            {c.fullName || 'Sem nome'}
                                        </span>
                                    </td>
                                    <td className="p-3 min-w-[160px]">
                                        {onStatusChange ? (
                                            <select
                                                value={c.status || 'Inscrito'}
                                                onChange={(e) => onStatusChange(c.id, e.target.value)}
                                                className={`px-2 py-1 rounded text-xs border font-medium cursor-pointer transition-colors ${STATUS_COLORS[c.status] || 'bg-slate-700 text-slate-200 border-slate-600'} hover:opacity-80`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {ALL_STATUSES.map(status => (
                                                    <option key={status} value={status} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-0.5 rounded text-xs border whitespace-nowrap ${STATUS_COLORS[c.status] || 'bg-slate-700 text-slate-200 border-slate-600'}`}>
                                                {c.status || 'Inscrito'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{c.email || 'N/A'}</td>
                                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{c.phone || 'N/A'}</td>
                                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{c.city || 'N/A'}</td>
                                    <td className="p-3 text-sm font-medium">{c.hasLicense === 'Sim' ? <span className="text-green-600 dark:text-green-400">✓ Sim</span> : c.hasLicense === 'Não' ? <span className="text-red-600 dark:text-red-400">✗ Não</span> : <span className="text-gray-500">N/A</span>}</td>
                                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]" title={c.interestAreas}>{c.interestAreas || 'N/A'}</td>
                                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{c.source || 'N/A'}</td>
                                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                        {(() => {
                                            const ts = getCandidateTimestamp(c);
                                            if (!ts) return 'N/A';
                                            return new Date(ts * 1000).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                        })()}
                                    </td>
                                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{c.maritalStatus || 'N/A'}</td>
                                    <td className="p-3">
                                        <button onClick={() => onEdit(c)} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                            <Edit3 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, processedData.length)} de {processedData.length} candidatos
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Anterior
                        </button>
                        <span className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TalentBankView;
