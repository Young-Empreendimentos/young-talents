import React, { useState, useEffect, useMemo } from 'react';
import { Kanban, List, Briefcase, Building2, MapPin, Mail, Clock, Edit3, Check, Ban, ChevronLeft, ChevronRight, Star, Info } from 'lucide-react';
import { PIPELINE_STAGES, ALL_STATUSES, STATUS_COLORS } from '../constants';
import { getCandidateTimestamp } from '../utils/timestampUtils';
import { normalizeCity } from '../utils/cityNormalizer';
import { findMatchingJobs, getMatchBadgeColor } from '../utils/matching';
import { getCandidateRecency, getRecencyRowClass } from '../utils/candidateRecency';

const PipelineView = ({ candidatesLoading = false, candidatesTotal = 0, filteredCount = 0, onClearFilters, candidates, jobs, onDragEnd, onEdit, onCloseStatus, companies, applications = [], interviews = [], forceViewMode = null, highlightedCandidateId = null, filters = {}, setFilters, onToggleStar }) => {
    const [viewMode, setViewMode] = useState(forceViewMode || 'kanban');
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [kanbanItemsPerPage, setKanbanItemsPerPage] = useState(10); // Itens por coluna no kanban
    const [selectedIds, setSelectedIds] = useState([]);
    const [localSearch, setLocalSearch] = useState('');
    const [localSort, setLocalSort] = useState('recent');
    const [statusFilter, setStatusFilter] = useState('active'); // active, hired, rejected
    const [pipelineStatusFilter, setPipelineStatusFilter] = useState('all'); // Filtro específico por etapa
    const [jobFilter, setJobFilter] = useState('all');

    // Scroll para o candidato destacado quando ele aparecer
    useEffect(() => {
        if (highlightedCandidateId) {
            const timer = setTimeout(() => {
                const element = document.getElementById(`candidate-${highlightedCandidateId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Remove o destaque após 5 segundos
                    setTimeout(() => {
                        // O destaque será removido quando highlightedCandidateId mudar
                    }, 5000);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [highlightedCandidateId]);
    const [companyFilter, setCompanyFilter] = useState('all');
    const [cityFilter, setCityFilter] = useState('all');
    const [showColorPicker, setShowColorPicker] = useState(false); // Para mostrar/ocultar o seletor de cores

    useEffect(() => {
        setSelectedIds([]);
        setCurrentPage(1); // Reset página ao mudar filtros
    }, [candidates, statusFilter, localSearch, localSort, pipelineStatusFilter, jobFilter, companyFilter, cityFilter]);

    const handleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const handleSelectAll = () => selectedIds.length === processedData.length ? setSelectedIds([]) : setSelectedIds(processedData.map(c => c.id));

    const processedData = useMemo(() => {
        // Filtrar registros deletados (soft delete)
        let data = Array.isArray(candidates) ? candidates.filter(c => !c.deletedAt) : [];
        if (statusFilter === 'active') data = data.filter(c => PIPELINE_STAGES.includes(c.status) || !c.status);
        else if (statusFilter === 'hired') data = data.filter(c => c.status === 'Contratado');
        else if (statusFilter === 'rejected') data = data.filter(c => c.status === 'Reprovado');
        else if (statusFilter === 'withdrawn') data = data.filter(c => c.status === 'Desistiu da vaga');

        // Filtros adicionais para modo lista
        if (pipelineStatusFilter !== 'all') {
            data = data.filter(c => (c.status || 'Inscrito') === pipelineStatusFilter);
        }
        if (jobFilter !== 'all') {
            data = data.filter(c => c.jobId === jobFilter);
        }
        if (companyFilter !== 'all') {
            const job = jobs.find(j => j.id === jobFilter);
            if (job) {
                data = data.filter(c => c.jobId === jobFilter);
            } else {
                // Filtra por empresa da vaga
                const companyJobs = jobs.filter(j => j.company === companyFilter).map(j => j.id);
                data = data.filter(c => companyJobs.includes(c.jobId));
            }
        }
        if (cityFilter !== 'all') {
            // Normaliza cidade para comparação case-insensitive usando a função de normalização
            const normalizedFilter = normalizeCity(cityFilter).toLowerCase().trim();
            data = data.filter(c => {
                if (!c.city) return false;
                const normalizedCity = normalizeCity(c.city).toLowerCase().trim();
                return normalizedCity === normalizedFilter || c.city === cityFilter;
            });
        }

        if (localSearch) {
            const s = localSearch.toLowerCase();
            data = data.filter(c =>
                c.fullName?.toLowerCase().includes(s) ||
                c.email?.toLowerCase().includes(s) ||
                c.city?.toLowerCase().includes(s) ||
                c.interestAreas?.toLowerCase().includes(s) ||
                jobs.find(j => j.id === c.jobId)?.title?.toLowerCase().includes(s)
            );
        }
        data.sort((a, b) => {
            if (localSort === 'recent') return (getCandidateTimestamp(b) || 0) - (getCandidateTimestamp(a) || 0);
            if (localSort === 'oldest') return (getCandidateTimestamp(a) || 0) - (getCandidateTimestamp(b) || 0);
            if (localSort === 'az') return (a.fullName || '').localeCompare(b.fullName || '');
            if (localSort === 'za') return (b.fullName || '').localeCompare(a.fullName || '');
            return 0;
        });
        return data;
    }, [candidates, statusFilter, localSearch, localSort, pipelineStatusFilter, jobFilter, companyFilter, cityFilter, jobs, applications, interviews]);

    // Dados paginados para modo lista
    const paginatedListData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return processedData.slice(start, end);
    }, [processedData, currentPage, itemsPerPage]);

    // Estado para controlar quantos itens mostrar por coluna no kanban (paginação "ver mais")
    const [kanbanDisplayCounts, setKanbanDisplayCounts] = useState(() => {
        const saved = localStorage.getItem('kanban_display_counts');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return {};
            }
        }
        return {};
    });

    // Salvar contadores no localStorage
    useEffect(() => {
        localStorage.setItem('kanban_display_counts', JSON.stringify(kanbanDisplayCounts));
    }, [kanbanDisplayCounts]);

    // Dados paginados para modo kanban (por coluna) - usando "ver mais"
    const kanbanDataByStage = useMemo(() => {
        const byStage = {};
        PIPELINE_STAGES.forEach(stage => {
            const stageCandidates = Array.isArray(processedData)
                ? processedData.filter(c => (c.status || 'Inscrito') === stage)
                : [];
            const displayCount = kanbanDisplayCounts[stage] || kanbanItemsPerPage;
            byStage[stage] = {
                all: stageCandidates || [],
                displayed: (stageCandidates || []).slice(0, displayCount),
                total: (stageCandidates || []).length,
                displayCount: displayCount
            };
        });
        return byStage;
    }, [processedData, kanbanItemsPerPage, kanbanDisplayCounts]);

    // Função para carregar mais itens em uma coluna
    const loadMoreInStage = (stage, amount = kanbanItemsPerPage) => {
        setKanbanDisplayCounts(prev => ({
            ...prev,
            [stage]: (prev[stage] || kanbanItemsPerPage) + amount
        }));
    };

    // Função para resetar contador de uma coluna
    const resetStageCount = (stage) => {
        setKanbanDisplayCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[stage];
            return newCounts;
        });
    };

    const totalPages = Math.ceil((processedData?.length || 0) / itemsPerPage);
    const kanbanTotalPages = Math.ceil(
        Math.max(
            ...PIPELINE_STAGES.map(s => kanbanDataByStage[s]?.total || 0),
            0
        ) / kanbanItemsPerPage
    ) || 1;

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
        <div className="flex flex-col h-full relative">
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 justify-between items-center bg-white dark:bg-gray-900">
                <div className="flex gap-3 items-center flex-wrap">
                    {!forceViewMode && (
                        <div className="flex bg-brand-card p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400' : 'text-slate-400'}`}><Kanban size={16} /></button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400' : 'text-slate-400'}`}><List size={16} /></button>
                        </div>
                    )}
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer whitespace-nowrap">
                        <input type="checkbox" checked={filters.starred === true} onChange={e => setFilters && setFilters(prev => ({ ...prev, starred: e.target.checked }))} className="rounded border-gray-500 text-amber-500 focus:ring-amber-500" />
                        <Star size={14} className={filters.starred ? 'text-amber-400 fill-amber-400' : 'text-slate-400'} />
                        <span>Em consideração</span>
                    </label>
                    <input className="bg-brand-card border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 text-sm text-white outline-none focus:border-brand-cyan w-48" placeholder="Buscar..." value={localSearch} onChange={e => setLocalSearch(e.target.value)} />
                    <select className="bg-brand-card border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 text-sm text-white outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="active">Em Andamento</option><option value="hired">Contratados</option><option value="rejected">Reprovados</option><option value="withdrawn">Desistências</option><option value="all">Todos</option>
                    </select>
                    {viewMode === 'list' && (
                        <>
                            <select className="bg-brand-card border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 text-sm text-white outline-none" value={pipelineStatusFilter} onChange={e => setPipelineStatusFilter(e.target.value)}>
                                <option value="all">Todas as Etapas</option>
                                {PIPELINE_STAGES.map(stage => <option key={stage} value={stage}>{stage}</option>)}
                            </select>
                            <select className="bg-brand-card border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 text-sm text-white outline-none" value={jobFilter} onChange={e => setJobFilter(e.target.value)}>
                                <option value="all">Todas as Vagas</option>
                                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                            </select>
                            <select className="bg-brand-card border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 text-sm text-white outline-none" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
                                <option value="all">Todas as Empresas</option>
                                {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                            <select className="bg-brand-card border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 text-sm text-white outline-none" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
                                <option value="all">Todas as Cidades</option>
                                {Array.from(new Set(candidates.map(c => c.city).filter(Boolean))).sort().map(city => <option key={city} value={city}>{city}</option>)}
                            </select>
                        </>
                    )}
                    <select className="bg-brand-card border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 text-sm text-white outline-none" value={localSort} onChange={e => setLocalSort(e.target.value)}>
                        <option value="recent">Mais Recentes</option>
                        <option value="oldest">Mais Antigos</option>
                        <option value="az">A-Z</option>
                        <option value="za">Z-A</option>
                        <option value="rating">⭐ Mais Qualificados</option>
                        <option value="applied">Inscritos Primeiro</option>
                        <option value="appliedLast">Inscritos Último</option>
                        <option value="nextTask">Próxima Tarefa</option>
                    </select>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs text-slate-500">{processedData.length} talentos</div>
                    {viewMode === 'list' && (
                        <select
                            className="bg-brand-card border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-brand-cyan"
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
                        </select>
                    )}
                    {viewMode === 'kanban' && (
                        <>
                            <select
                                className="bg-brand-card border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-brand-cyan"
                                value={kanbanItemsPerPage}
                                onChange={e => {
                                    setKanbanItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                <option value={5}>5 por coluna</option>
                                <option value={10}>10 por coluna</option>
                                <option value={15}>15 por coluna</option>
                                <option value={20}>20 por coluna</option>
                            </select>
                            <button
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded border transition-colors ${showColorPicker
                                    ? 'bg-brand-orange text-white border-brand-orange'
                                    : 'bg-brand-card border-gray-200 dark:border-gray-700 text-slate-400 hover:text-white hover:border-brand-cyan'
                                    }`}
                                title="Personalizar cores das colunas"
                            >
                                🎨 Cores
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className="px-6 py-2 bg-blue-500/10 border-b border-blue-500/20 flex items-center gap-2 text-sm text-blue-200">
                <Info size={16} className="flex-shrink-0" />
                <span>Cada etapa do processo representa uma etapa concluída; o lead na etapa vigente está em processo de avançar para a próxima etapa.</span>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
                {viewMode === 'kanban' ? (
                    <div className="flex-1 overflow-x-auto p-2 custom-scrollbar">
                        <div className="flex gap-2 h-full min-w-max">
                            {PIPELINE_STAGES.map(stage => (
                                <KanbanColumn
                                    key={stage}
                                    stage={stage}
                                    allCandidates={kanbanDataByStage[stage]?.all || []}
                                    displayedCandidates={kanbanDataByStage[stage]?.displayed || []}
                                    total={kanbanDataByStage[stage]?.total || 0}
                                    displayCount={kanbanDataByStage[stage]?.displayCount || kanbanItemsPerPage}
                                    jobs={jobs}
                                    applications={applications}
                                    allJobs={jobs}
                                    onDragEnd={onDragEnd}
                                    onEdit={onEdit}
                                    onCloseStatus={onCloseStatus}
                                    selectedIds={selectedIds}
                                    onSelect={handleSelect}
                                    showColorPicker={showColorPicker}
                                    onLoadMore={(amount) => loadMoreInStage(stage, amount)}
                                    onReset={() => resetStageCount(stage)}
                                    kanbanItemsPerPage={kanbanItemsPerPage}
                                    onToggleStar={onToggleStar}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-brand-card text-white font-bold sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 w-10"><input type="checkbox" className="accent-blue-600 dark:accent-blue-500" checked={selectedIds.length > 0 && selectedIds.length === processedData.length} onChange={handleSelectAll} /></th>
                                    <th className="p-4 w-12" title="Em consideração"><Star size={14} className="inline text-amber-400" /></th>
                                    <th className="p-4">Nome</th>
                                    <th className="p-4 min-w-[160px]">Status</th>
                                    <th className="p-4">Candidatura</th>
                                    <th className="p-4">Vaga</th>
                                    <th className="p-4">Empresa</th>
                                    <th className="p-4">Cidade</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Telefone</th>
                                    <th className="p-4">Área</th>
                                    <th className="p-4">CNH</th>
                                    <th className="p-4">Fonte</th>
                                    <th className="p-4">Data de Criação</th>
                                    <th className="p-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border bg-brand-card/20">
                                {paginatedListData.map(c => {
                                    // USAR APENAS applications como fonte de verdade
                                    const candidateApplications = applications.filter(a => a.candidateId === c.id);
                                    const primaryApplication = candidateApplications[0]; // Primeira candidatura como principal
                                    const ts = getCandidateTimestamp(c);
                                    const recency = getCandidateRecency(c);
                                    const hasApplication = candidateApplications.length > 0;
                                    const isInscrito = (c.status || 'Inscrito') === 'Inscrito';
                                    const needsApplication = !isInscrito && !hasApplication; // A partir de Considerado precisa ter candidatura

                                    return (
                                        <tr key={c.id} className={`hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${needsApplication ? 'bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500' : ''} ${!needsApplication ? getRecencyRowClass(recency) : ''}`}>
                                            <td className="p-4"><input type="checkbox" className="accent-blue-600 dark:accent-blue-500" checked={selectedIds.includes(c.id)} onChange={() => handleSelect(c.id)} /></td>
                                            <td className="p-4">
                                                {onToggleStar ? (
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); onToggleStar(c); }} className="p-1 rounded hover:bg-brand-card focus:outline-none" title={c.starred ? 'Remover de em consideração' : 'Marcar em consideração'}>
                                                        <Star size={16} className={c.starred ? 'text-amber-400 fill-amber-400' : 'text-slate-400 hover:text-amber-300'} />
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-500">—</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white dark:text-white cursor-pointer break-words" onClick={() => onEdit(c)}>{c.fullName || 'Sem nome'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 min-w-[160px]">
                                                {onDragEnd ? (
                                                    <select
                                                        value={c.status || 'Inscrito'}
                                                        onChange={(e) => onDragEnd(c.id, e.target.value)}
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
                                                    <span className={`px-2 py-0.5 rounded text-xs border break-words ${STATUS_COLORS[c.status] || 'bg-slate-700 text-slate-200 border-slate-600'}`}>{c.status || 'Inscrito'}</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {hasApplication ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                                                            ✓ {candidateApplications.length > 1 ? `${candidateApplications.length} candidaturas` : 'Vinculado'}
                                                        </span>
                                                        {primaryApplication && (
                                                            <span className="text-xs text-gray-700 dark:text-gray-300">{primaryApplication.jobTitle}</span>
                                                        )}
                                                    </div>
                                                ) : isInscrito ? (
                                                    <span className="text-xs text-gray-600 dark:text-gray-400">Sem candidatura</span>
                                                ) : (
                                                    <span className="text-xs text-red-700 dark:text-red-300 font-medium">⚠ Precisa vincular</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-xs break-words">{primaryApplication?.jobTitle || 'N/A'}</td>
                                            <td className="p-4 text-xs break-words">{primaryApplication?.jobCompany || 'N/A'}</td>
                                            <td className="p-4 text-xs break-words">{c.city || 'N/A'}</td>
                                            <td className="p-4 text-xs break-words truncate max-w-[200px] text-gray-700 dark:text-gray-300" title={c.email}>{c.email || 'N/A'}</td>
                                            <td className="p-4 text-xs break-words text-gray-700 dark:text-gray-300">{c.phone || 'N/A'}</td>
                                            <td className="p-4 text-xs break-words truncate max-w-[150px] text-gray-700 dark:text-gray-300" title={c.interestAreas}>{c.interestAreas || 'N/A'}</td>
                                            <td className="p-4 text-xs font-medium">{c.hasLicense === 'Sim' ? <span className="text-green-600 dark:text-green-400">✓ Sim</span> : c.hasLicense === 'Não' ? <span className="text-red-600 dark:text-red-400">✗ Não</span> : <span className="text-gray-500">N/A</span>}</td>
                                            <td className="p-4 text-xs break-words truncate max-w-[120px] text-gray-700 dark:text-gray-300" title={c.source}>{c.source || 'N/A'}</td>
                                            <td className="p-4 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                {(() => {
                                                    const ts = getCandidateTimestamp(c);
                                                    if (!ts) return 'N/A';
                                                    return new Date(ts * 1000).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                                })()}
                                            </td>
                                            <td className="p-4"><button onClick={() => onEdit(c)} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Edit3 size={16} /></button></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Paginação */}
                {processedData.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-brand-card flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                            Mostrando {viewMode === 'list'
                                ? `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, processedData.length)} de ${processedData.length} talentos`
                                : `${(currentPage - 1) * kanbanItemsPerPage + 1} - ${Math.min(currentPage * kanbanItemsPerPage, Math.max(...PIPELINE_STAGES.map(s => kanbanDataByStage[s]?.total || 0)))} de ${processedData.length} talentos`
                            }
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${currentPage === 1
                                    ? 'bg-brand-card text-slate-600 cursor-not-allowed'
                                    : 'bg-white dark:bg-gray-900 text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <ChevronLeft size={16} className="inline" />
                            </button>
                            <span className="px-4 py-1.5 text-sm text-slate-300">
                                Página {currentPage} de {viewMode === 'list' ? totalPages : kanbanTotalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(Math.min(viewMode === 'list' ? totalPages : kanbanTotalPages, currentPage + 1))}
                                disabled={currentPage >= (viewMode === 'list' ? totalPages : kanbanTotalPages)}
                                className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${currentPage >= (viewMode === 'list' ? totalPages : kanbanTotalPages)
                                    ? 'bg-brand-card text-slate-600 cursor-not-allowed'
                                    : 'bg-white dark:bg-gray-900 text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <ChevronRight size={16} className="inline" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const KanbanColumn = ({ stage, allCandidates, displayedCandidates, total, displayCount, jobs, applications = [], onDragEnd, onEdit, onCloseStatus, selectedIds, onSelect, showColorPicker, onLoadMore, onReset, highlightedCandidateId = null, allJobs = [], kanbanItemsPerPage = 10, onToggleStar }) => {
    const [columnColor, setColumnColor] = useState(() => {
        const saved = localStorage.getItem(`kanban-color-${stage}`);
        return saved || STATUS_COLORS[stage];
    });
    const handleDrop = (e) => { e.preventDefault(); const cId = e.dataTransfer.getData("text/plain"); if (cId) onDragEnd(cId, stage); };
    const handleDragStart = (e, cId) => { try { e.dataTransfer.setData("text/plain", cId); e.dataTransfer.effectAllowed = 'move'; } catch (err) { console.warn('dragStart err', err); } };

    const handleColorChange = (color) => {
        setColumnColor(color);
        localStorage.setItem(`kanban-color-${stage}`, color);
    };

    const presetColors = [
        'bg-slate-700 text-slate-200 border-slate-600',
        'bg-blue-900/40 text-blue-300 border-blue-700',
        'bg-cyan-900/40 text-cyan-300 border-cyan-700',
        'bg-purple-900/40 text-purple-300 border-purple-700',
        'bg-indigo-900/40 text-indigo-300 border-indigo-700',
        'bg-yellow-900/40 text-yellow-300 border-yellow-700',
        'bg-green-900/40 text-green-300 border-green-700',
        'bg-red-900/40 text-red-300 border-red-700',
        'bg-orange-900/40 text-orange-300 border-orange-700',
        'bg-pink-900/40 text-pink-300 border-pink-700'
    ];

    return (
        <div className="w-[320px] flex-shrink-0 flex flex-col bg-brand-card/40 border border-gray-200 dark:border-gray-700 rounded-xl h-full backdrop-blur-sm" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            <div className={`p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-xl ${columnColor} relative`}>
                <span className="font-bold text-xs uppercase break-words">{stage}</span>
                <span className="bg-black/20 px-2 py-0.5 rounded text-xs font-mono">{total}</span>
                {/* Seletor de cor só aparece quando o botão "Cores" está ativo */}
                {showColorPicker && (
                    <div className="absolute top-full left-0 right-0 bg-brand-card border border-gray-200 dark:border-gray-700 rounded-b-lg p-2 z-50 shadow-lg">
                        <div className="text-xs text-slate-400 mb-1">Cor da coluna:</div>
                        <div className="grid grid-cols-5 gap-1">
                            {presetColors.map((color, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleColorChange(color)}
                                    className={`h-6 rounded border-2 ${color} ${columnColor === color ? 'ring-2 ring-brand-orange' : ''}`}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {displayedCandidates.length > 0 ? displayedCandidates.map(c => {
                    // USAR APENAS applications como fonte de verdade
                    const candidateApplications = applications.filter(a => a.candidateId === c.id);
                    const primaryApplication = candidateApplications[0];
                    const primaryJob = primaryApplication ? jobs.find(j => j.id === primaryApplication.jobId) : null;

                    // Calcular matches para este candidato
                    const matchingJobs = allJobs && allJobs.length > 0 ? findMatchingJobs(c, allJobs) : [];
                    const topMatch = matchingJobs.length > 0 ? matchingJobs[0] : null;

                    const ts = getCandidateTimestamp(c);
                    const recency = getCandidateRecency(c);
                    return (
                        <div key={c.id} id={`candidate-${c.id}`} draggable onDragStart={(e) => handleDragStart(e, c.id)} onClick={() => onEdit(c)} className={`bg-brand-card p-3 rounded-lg border hover:border-brand-cyan cursor-grab shadow-sm group relative ${selectedIds.includes(c.id) ? 'border-brand-orange bg-brand-orange/5' : 'border-gray-200 dark:border-gray-700'} ${getRecencyRowClass(recency)} ${highlightedCandidateId === c.id ? 'ring-4 ring-yellow-400 ring-opacity-75 animate-pulse border-yellow-400' : ''}`}>
                            <div className={`absolute top-2 left-2 z-20 ${selectedIds.includes(c.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} onClick={e => e.stopPropagation()}><input type="checkbox" className="accent-blue-600 dark:accent-blue-500" checked={selectedIds.includes(c.id)} onChange={() => onSelect(c.id)} /></div>

                            {/* Cabeçalho com resumo: estrela à esquerda (sempre clicável) + nome e demais */}
                            <div className="mb-2 border-b border-gray-200 dark:border-gray-700/50 pb-2 flex items-start gap-2 pl-6">
                                {onToggleStar && (
                                    <button type="button" onClick={e => { e.stopPropagation(); onToggleStar(c); }} className="shrink-0 mt-0.5 p-1 rounded hover:bg-white/10 focus:outline-none z-30 relative" title={c.starred ? 'Remover de em consideração' : 'Marcar em consideração'}>
                                        <Star size={18} className={c.starred ? 'text-amber-400 fill-amber-400' : 'text-slate-400 hover:text-amber-300'} />
                                    </button>
                                )}
                                <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm break-words mb-1">{c.fullName}</h4>
                                <div className="text-xs space-y-0.5">
                                    {primaryJob && (
                                        <div className="text-blue-700 dark:text-blue-300 flex items-center gap-1 font-medium">
                                            <Briefcase size={10} /> <span className="break-words">{primaryJob.title}</span>
                                            {candidateApplications.length > 1 && (
                                                <span className="ml-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[10px]">
                                                    +{candidateApplications.length - 1}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 flex-wrap">
                                        {onDragEnd ? (
                                            <select
                                                value={c.status || 'Inscrito'}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    onDragEnd(c.id, e.target.value);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className={`px-1.5 py-0.5 rounded text-xs border font-medium cursor-pointer transition-colors text-white ${STATUS_COLORS[c.status] || 'bg-slate-700 border-slate-600'} hover:opacity-80`}
                                            >
                                                {ALL_STATUSES.map(status => (
                                                    <option key={status} value={status} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className={`px-1.5 py-0.5 rounded text-xs border ${STATUS_COLORS[c.status] || 'bg-slate-700 text-slate-200 border-slate-600'}`}>{c.status || 'Inscrito'}</span>
                                        )}
                                        {matchingJobs && matchingJobs.length > 0 && (
                                            <span className={`px-1.5 py-0.5 rounded text-xs border font-medium ${getMatchBadgeColor(topMatch?.matchLevel || 'low')}`} title={`${matchingJobs.length} vaga(s) com match. Melhor match: ${topMatch?.matchScore || 0}%`}>
                                                {matchingJobs.length} match
                                            </span>
                                        )}
                                    </div>
                                    {c.city && (
                                        <div className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                            <MapPin size={10} /> <span className="break-words">{c.city}</span>
                                        </div>
                                    )}
                                    {c.interestAreas && (
                                        <div className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                            <Building2 size={10} /> <span className="break-words">{c.interestAreas}</span>
                                        </div>
                                    )}
                                    {primaryJob && primaryJob.company && (
                                        <div className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                            <Building2 size={10} /> <span className="break-words">{primaryJob.company}</span>
                                        </div>
                                    )}
                                </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-1 pl-6">
                                <div className="text-xs text-slate-400 truncate flex gap-1"><Mail size={10} /> {c.email || 'N/D'}</div>
                                <div className="text-xs text-slate-400 truncate flex gap-1">📞 {c.phone || 'N/D'}</div>
                                {c.score && <div className="text-xs text-blue-600 dark:text-blue-400 font-bold">Match: {c.score}%</div>}
                                {(() => {
                                    const ts = getCandidateTimestamp(c);
                                    if (!ts) return null;
                                    const date = new Date(ts * 1000);
                                    return (
                                        <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1.5">
                                            {recency && <div className={`w-2 h-2 rounded-full flex-shrink-0 ${recency === 'today' ? 'bg-green-500 animate-pulse' : recency === 'yesterday' ? 'bg-green-400' : 'bg-green-400/70'}`} title={recency === 'today' ? 'Hoje' : recency === 'yesterday' ? 'Ontem' : 'Esta semana'}></div>}
                                            <Clock size={10} className="flex-shrink-0" /> <span title={date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}>{date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-brand-card shadow-lg rounded border border-gray-200 dark:border-gray-700 z-30">
                                <button onClick={(e) => { e.stopPropagation(); onEdit(c) }} className="p-1.5 hover:text-blue-400 hover:bg-blue-500/20" title="Editar">
                                    <Edit3 size={14} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onCloseStatus(c.id, 'Contratado') }} className="p-1.5 hover:text-green-400 hover:bg-green-500/20" title="Contratar">
                                    <Check size={14} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onCloseStatus(c.id, 'Reprovado') }} className="p-1.5 hover:text-red-400 hover:bg-red-500/20" title="Reprovar">
                                    <Ban size={14} />
                                </button>
                            </div>
                        </div>
                    )
                }) : (
                    <div className="text-center py-8 text-slate-500 text-xs">Nenhum candidato nesta etapa</div>
                )}
            </div>
            {/* Botões de paginação */}
            {displayedCandidates.length < total && (
                <div className="p-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onLoadMore(10);
                            }}
                            className="flex-1 px-2 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                            +10
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onLoadMore(25);
                            }}
                            className="flex-1 px-2 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                            +25
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onLoadMore(50);
                            }}
                            className="flex-1 px-2 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                            +50
                        </button>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onLoadMore(total - displayedCandidates.length);
                        }}
                        className="w-full px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors"
                    >
                        Ver tudo ({total - displayedCandidates.length} restantes)
                    </button>
                </div>
            )}
            {/* Botão "Mostrar menos" se houver mais itens exibidos que o padrão */}
            {displayCount > (kanbanItemsPerPage || 10) && displayedCandidates.length >= displayCount && (
                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onReset();
                        }}
                        className="w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Mostrar menos
                    </button>
                </div>
            )}
        </div>
    );
};

export default PipelineView;
