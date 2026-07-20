import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Kanban, List, Briefcase, Building2, MapPin, Clock, Edit3, Check, Ban,
    ChevronLeft, ChevronRight, Star, ChevronsLeft, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { PIPELINE_STAGES as DEFAULT_PIPELINE_STAGES, ALL_STATUSES, STATUS_COLORS, CLOSING_STATUSES } from '../constants';
import { getPhotoPublicUrl } from '../utils/urlUtils';
import { getCandidateTimestamp } from '../utils/timestampUtils';
import { normalizeCity } from '../utils/cityNormalizer';
import { findMatchingJobs } from '../utils/matching';
import { getCandidateRecency, getRecencyRowClass } from '../utils/candidateRecency';

const LEGACY_STATUS_MAP = {
    'Vaga pausada': 'Considerado',
    'Testes': 'Testes realizados',
    'Entrevista I': 'Entrevista realizada',
    'Entrevista II': 'Entrevista realizada',
    'Entrevista I realizada': 'Entrevista realizada',
    'Entrevista II realizada': 'Entrevista realizada',
};
const NON_PIPELINE_STATUSES = new Set(['Inscrito']);

const resolveStage = (status, pipelineStages) => {
    if (!status) return pipelineStages[0] || 'Considerado';
    if (pipelineStages.includes(status)) return status;
    return LEGACY_STATUS_MAP[status] || status;
};

/* ─── Toolbar responsiva ─────────────────────────────────────────────────── */
const Toolbar = ({ children, extra }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="px-4 py-3 border-b border-border bg-background space-y-2">
            {/* Linha principal */}
            <div className="flex items-center gap-2 flex-wrap">
                {children}
                <button
                    onClick={() => setOpen(v => !v)}
                    className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${open ? 'bg-brand-orange text-white border-brand-orange' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
                >
                    <SlidersHorizontal size={13} /> Filtros
                    {open ? <X size={12} /> : <ChevronDown size={12} />}
                </button>
            </div>
            {/* Linha de filtros avançados (colapsável em mobile) */}
            {open && (
                <div className="flex flex-wrap gap-2 pt-1">
                    {extra}
                </div>
            )}
        </div>
    );
};

/* ─── Pipeline principal ─────────────────────────────────────────────────── */
const PipelineView = ({
    candidatesLoading = false, candidatesTotal = 0, filteredCount = 0,
    onClearFilters, candidates, jobs, onDragEnd, onEdit, onCloseStatus,
    companies, applications = [], interviews = [], forceViewMode = null,
    highlightedCandidateId = null, filters = {}, setFilters, onToggleStar,
    pipelineStages: pipelineStagesProp
}) => {
    const PIPELINE_STAGES = pipelineStagesProp || DEFAULT_PIPELINE_STAGES;

    const [viewMode, setViewMode] = useState(forceViewMode || 'kanban');
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [kanbanItemsPerPage, setKanbanItemsPerPage] = useState(10);
    const [selectedIds, setSelectedIds] = useState([]);
    const [localSearch, setLocalSearch] = useState('');
    const [localSort, setLocalSort] = useState('recent');
    const [statusFilter, setStatusFilter] = useState('active');
    const [pipelineStatusFilter, setPipelineStatusFilter] = useState('all');
    const [selectedJobIds, setSelectedJobIds] = useState([]);
    const [jobSearch, setJobSearch] = useState('');
    const [jobDropdownOpen, setJobDropdownOpen] = useState(false);
    const [companyFilter, setCompanyFilter] = useState('all');
    const [cityFilter, setCityFilter] = useState('all');
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Colunas colapsadas — começa com todas vazias colapsadas
    const [collapsedColumns, setCollapsedColumns] = useState(new Set());
    // Rastreia overrides manuais do usuário para não re-colapsar o que ele abriu
    const userExpandedRef = useRef(new Set());

    const toggleColumn = (stage) => {
        setCollapsedColumns(prev => {
            const next = new Set(prev);
            if (next.has(stage)) {
                next.delete(stage);
                userExpandedRef.current.add(stage); // usuário expandiu manualmente
            } else {
                next.add(stage);
                userExpandedRef.current.delete(stage);
            }
            return next;
        });
    };
    const collapseAll = () => { setCollapsedColumns(new Set(PIPELINE_STAGES)); userExpandedRef.current.clear(); };
    const expandAll  = () => { setCollapsedColumns(new Set()); userExpandedRef.current = new Set(PIPELINE_STAGES); };

    useEffect(() => {
        if (highlightedCandidateId) {
            const timer = setTimeout(() => {
                document.getElementById(`candidate-${highlightedCandidateId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [highlightedCandidateId]);

    useEffect(() => {
        setSelectedIds([]);
        setCurrentPage(1);
    }, [candidates, statusFilter, localSearch, localSort, pipelineStatusFilter, selectedJobIds, companyFilter, cityFilter]);

    const handleSelect    = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const handleSelectAll = () => selectedIds.length === processedData.length ? setSelectedIds([]) : setSelectedIds(processedData.map(c => c.id));

    const processedData = useMemo(() => {
        let data = Array.isArray(candidates) ? candidates.filter(c => !c.deletedAt) : [];
        const candidateIdsWithJob = new Set(applications.map(a => a.candidateId));
        data = data.filter(c => candidateIdsWithJob.has(c.id));
        data = data.filter(c => !NON_PIPELINE_STATUSES.has(c.status));

        if (statusFilter === 'active')    data = data.filter(c => PIPELINE_STAGES.includes(c.status) || !c.status || LEGACY_STATUS_MAP[c.status] !== undefined);
        else if (statusFilter === 'archived') data = data.filter(c => c.status === 'Arquivado');

        if (pipelineStatusFilter !== 'all') data = data.filter(c => c.status === pipelineStatusFilter);
        if (selectedJobIds.length > 0) {
            const ids = new Set(applications.filter(a => selectedJobIds.includes(a.jobId)).map(a => a.candidateId));
            data = data.filter(c => ids.has(c.id));
        }
        if (companyFilter !== 'all') {
            const jobIds = new Set(jobs.filter(j => j.company === companyFilter).map(j => j.id));
            const cIds   = new Set(applications.filter(a => jobIds.has(a.jobId)).map(a => a.candidateId));
            data = data.filter(c => cIds.has(c.id));
        }
        if (cityFilter !== 'all') {
            const nf = normalizeCity(cityFilter).toLowerCase().trim();
            data = data.filter(c => c.city && normalizeCity(c.city).toLowerCase().trim() === nf);
        }
        if (localSearch) {
            const s = localSearch.toLowerCase();
            data = data.filter(c =>
                c.fullName?.toLowerCase().includes(s) ||
                c.email?.toLowerCase().includes(s) ||
                c.city?.toLowerCase().includes(s) ||
                c.interestAreas?.toLowerCase().includes(s)
            );
        }
        data.sort((a, b) => {
            if (localSort === 'recent')  return (getCandidateTimestamp(b) || 0) - (getCandidateTimestamp(a) || 0);
            if (localSort === 'oldest')  return (getCandidateTimestamp(a) || 0) - (getCandidateTimestamp(b) || 0);
            if (localSort === 'az')      return (a.fullName || '').localeCompare(b.fullName || '');
            if (localSort === 'za')      return (b.fullName || '').localeCompare(a.fullName || '');
            return 0;
        });
        return data;
    }, [candidates, statusFilter, localSearch, localSort, pipelineStatusFilter, selectedJobIds, companyFilter, cityFilter, jobs, applications]);

    const paginatedListData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return processedData.slice(start, start + itemsPerPage);
    }, [processedData, currentPage, itemsPerPage]);

    const [kanbanDisplayCounts, setKanbanDisplayCounts] = useState(() => {
        try { return JSON.parse(localStorage.getItem('kanban_display_counts') || '{}'); } catch { return {}; }
    });
    useEffect(() => { localStorage.setItem('kanban_display_counts', JSON.stringify(kanbanDisplayCounts)); }, [kanbanDisplayCounts]);

    const visibleStages = useMemo(() => {
        if (statusFilter === 'archived')  return ['Arquivado'];
        if (statusFilter === 'all')       return [...PIPELINE_STAGES, ...CLOSING_STATUSES];
        return PIPELINE_STAGES;
    }, [statusFilter]);

    const kanbanDataByStage = useMemo(() => {
        const byStage = {};
        visibleStages.forEach(stage => {
            const all = processedData.filter(c => resolveStage(c.status, PIPELINE_STAGES) === stage);
            const dc  = kanbanDisplayCounts[stage] || kanbanItemsPerPage;
            byStage[stage] = { all, displayed: all.slice(0, dc), total: all.length, displayCount: dc };
        });
        return byStage;
    }, [processedData, visibleStages, kanbanItemsPerPage, kanbanDisplayCounts]);

    // Auto-colapsar colunas vazias (respeitando expansões manuais do usuário)
    useEffect(() => {
        if (!kanbanDataByStage) return;
        setCollapsedColumns(prev => {
            const next = new Set(prev);
            visibleStages.forEach(stage => {
                const isEmpty = (kanbanDataByStage[stage]?.total || 0) === 0;
                const userExpanded = userExpandedRef.current.has(stage);
                if (isEmpty && !userExpanded) next.add(stage);
                // Não auto-expande: deixa o usuário decidir
            });
            return next;
        });
    }, [kanbanDataByStage, visibleStages]);

    const loadMoreInStage = (stage, amount) => setKanbanDisplayCounts(prev => ({ ...prev, [stage]: (prev[stage] || kanbanItemsPerPage) + amount }));
    const resetStageCount = (stage)  => setKanbanDisplayCounts(prev => { const n = { ...prev }; delete n[stage]; return n; });

    const totalPages       = Math.ceil((processedData?.length || 0) / itemsPerPage);

    if (candidatesLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
    if (processedData.length === 0 && candidatesTotal > 0 && typeof onClearFilters === 'function') {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
                <p className="mb-3">Nenhum candidato corresponde aos filtros.</p>
                <button onClick={onClearFilters} className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium">Limpar filtros</button>
            </div>
        );
    }
    if (processedData.length === 0 && candidatesTotal === 0) {
        return <div className="p-6 flex items-center justify-center min-h-[200px] text-muted-foreground">Nenhum candidato no pipeline ainda.</div>;
    }

    /* Botão de estrela */
    const activeStar = filters.starredFilter ?? (filters.starred === true ? 'starred' : 'all');
    const StarToggle = setFilters ? (
        <div className="flex items-center rounded-lg border border-border bg-card p-0.5" role="group">
            <button type="button" onClick={() => setFilters(p => ({ ...p, starredFilter: 'starred' }))}
                className={`p-1.5 rounded transition-colors ${activeStar === 'starred' ? 'bg-muted shadow-sm' : 'hover:bg-muted/50'}`} title="Com estrela">
                <Star size={15} className="text-amber-400 fill-amber-400" />
            </button>
            <button type="button" onClick={() => setFilters(p => ({ ...p, starredFilter: 'unstarred' }))}
                className={`p-1.5 rounded transition-colors ${activeStar === 'unstarred' ? 'bg-muted shadow-sm' : 'hover:bg-muted/50'}`} title="Sem estrela">
                <Star size={15} className="text-muted-foreground" />
            </button>
            <button type="button" onClick={() => setFilters(p => ({ ...p, starredFilter: 'all' }))}
                className={`p-1.5 rounded transition-colors ${activeStar === 'all' ? 'bg-muted shadow-sm' : 'hover:bg-muted/50'}`} title="Todos">
                <Star size={15} className="text-amber-400" />
            </button>
        </div>
    ) : null;

    return (
        <div className="flex flex-col h-full relative">

            {/* ── Toolbar ── */}
            <Toolbar
                extra={<>
                    {/* Vagas multi-select */}
                    <div className="relative">
                        <div
                            onClick={() => setJobDropdownOpen(v => !v)}
                            className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground cursor-pointer min-w-[160px]"
                        >
                            <Briefcase size={13} className="text-muted-foreground shrink-0" />
                            <span className="truncate flex-1">
                                {selectedJobIds.length === 0 ? 'Todas as Vagas'
                                    : selectedJobIds.length === 1 ? (jobs.find(j => j.id === selectedJobIds[0])?.title || '1 vaga')
                                    : `${selectedJobIds.length} vagas`}
                            </span>
                            {selectedJobIds.length > 0 && (
                                <button type="button" onClick={e => { e.stopPropagation(); setSelectedJobIds([]); }}
                                    className="text-muted-foreground hover:text-foreground">✕</button>
                            )}
                        </div>
                        {jobDropdownOpen && <>
                            <div className="absolute top-full left-0 mt-1 w-72 bg-card border border-border rounded-xl shadow-xl z-50">
                                <div className="p-2 border-b border-border">
                                    <input autoFocus className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-sm outline-none"
                                        placeholder="Buscar vaga..." value={jobSearch} onChange={e => setJobSearch(e.target.value)} onClick={e => e.stopPropagation()} />
                                </div>
                                <div className="max-h-52 overflow-y-auto">
                                    {jobs.filter(j => !jobSearch || j.title.toLowerCase().includes(jobSearch.toLowerCase())).map(j => (
                                        <label key={j.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted cursor-pointer">
                                            <input type="checkbox" className="accent-brand-orange"
                                                checked={selectedJobIds.includes(j.id)}
                                                onChange={() => setSelectedJobIds(prev => prev.includes(j.id) ? prev.filter(id => id !== j.id) : [...prev, j.id])}
                                            />
                                            <span className="truncate text-foreground">{j.title}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="fixed inset-0 z-40" onClick={() => setJobDropdownOpen(false)} />
                        </>}
                    </div>

                    {/* Empresa */}
                    <select className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
                        <option value="all">Todas as Empresas</option>
                        {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>

                    {/* Cidade */}
                    <select className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
                        <option value="all">Todas as Cidades</option>
                        {Array.from(new Set(candidates.map(c => c.city).filter(Boolean))).sort().map(city => <option key={city} value={city}>{city}</option>)}
                    </select>

                    {/* Etapa (só lista) */}
                    {viewMode === 'list' && (
                        <select className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none" value={pipelineStatusFilter} onChange={e => setPipelineStatusFilter(e.target.value)}>
                            <option value="all">Todas as Etapas</option>
                            {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    )}

                    {/* Kanban: cores + colapsar */}
                    {viewMode === 'kanban' && <>
                        <button onClick={() => setShowColorPicker(v => !v)}
                            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${showColorPicker ? 'bg-brand-orange text-white border-brand-orange' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>
                            🎨 Cores
                        </button>
                        {collapsedColumns.size > 0
                            ? <button onClick={expandAll} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border bg-card border-border text-muted-foreground hover:text-foreground transition-colors">
                                <ChevronsLeft size={13} className="rotate-180" /> Expandir todas
                              </button>
                            : <button onClick={collapseAll} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border bg-card border-border text-muted-foreground hover:text-foreground transition-colors">
                                <ChevronsLeft size={13} /> Colapsar todas
                              </button>
                        }
                        <select className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none" value={kanbanItemsPerPage}
                            onChange={e => setKanbanItemsPerPage(Number(e.target.value))}>
                            <option value={5}>5 / coluna</option>
                            <option value={10}>10 / coluna</option>
                            <option value={20}>20 / coluna</option>
                        </select>
                    </>}
                </>}
            >
                {/* Itens sempre visíveis */}
                {!forceViewMode && (
                    <div className="flex bg-card p-0.5 rounded-lg border border-border">
                        <button onClick={() => setViewMode('kanban')} className={`p-2 rounded transition-colors ${viewMode === 'kanban' ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}><Kanban size={15} /></button>
                        <button onClick={() => setViewMode('list')}   className={`p-2 rounded transition-colors ${viewMode === 'list'   ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}><List size={15} /></button>
                    </div>
                )}
                {StarToggle}
                <input
                    className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:border-brand-orange/50 w-44 sm:w-52"
                    placeholder="Buscar candidato..."
                    value={localSearch} onChange={e => setLocalSearch(e.target.value)}
                />
                <select className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="active">Em Andamento</option>
                    <option value="archived">Arquivados</option>
                    <option value="all">Todos</option>
                </select>
                <select className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none" value={localSort} onChange={e => setLocalSort(e.target.value)}>
                    <option value="recent">Mais recentes</option>
                    <option value="oldest">Mais antigos</option>
                    <option value="az">A–Z</option>
                    <option value="za">Z–A</option>
                </select>
                <span className="text-xs text-muted-foreground ml-1">{processedData.length} no pipeline</span>
                {viewMode === 'list' && (
                    <select className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none ml-auto" value={itemsPerPage}
                        onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                        <option value={10}>10 / pág.</option>
                        <option value={25}>25 / pág.</option>
                        <option value={50}>50 / pág.</option>
                        <option value={100}>100 / pág.</option>
                    </select>
                )}
            </Toolbar>

            {/* ── Conteúdo ── */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {viewMode === 'kanban' ? (
                    /* Kanban: scroll horizontal em md+, empilhado em mobile */
                    <div className="flex-1 overflow-auto p-3 custom-scrollbar">
                        <div className="flex flex-col md:flex-row gap-3 md:h-full md:min-w-max">
                            {visibleStages.map(stage => (
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
                                    collapsed={collapsedColumns.has(stage)}
                                    onToggleCollapse={() => toggleColumn(stage)}
                                    highlightedCandidateId={highlightedCandidateId}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {/* Tabela com scroll horizontal em mobile */}
                        <div className="min-w-[800px]">
                            <table className="w-full text-left text-sm text-foreground">
                                <thead className="bg-card text-foreground font-semibold sticky top-0 z-10 shadow-sm border-b border-border">
                                    <tr>
                                        <th className="p-3 w-10"><input type="checkbox" className="accent-brand-orange" checked={selectedIds.length > 0 && selectedIds.length === processedData.length} onChange={handleSelectAll} /></th>
                                        <th className="p-3 w-10"><Star size={13} className="text-amber-400" /></th>
                                        <th className="p-3">Nome</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Vaga</th>
                                        <th className="p-3">Cidade</th>
                                        <th className="p-3">Área</th>
                                        <th className="p-3">CNH</th>
                                        <th className="p-3">Cadastro</th>
                                        <th className="p-3">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {paginatedListData.map(c => {
                                        const apps = applications.filter(a => a.candidateId === c.id);
                                        const primary = apps[0];
                                        const recency = getCandidateRecency(c);
                                        const ts = getCandidateTimestamp(c);
                                        return (
                                            <tr key={c.id} className={`hover:bg-muted/40 transition-colors ${getRecencyRowClass(recency)}`}>
                                                <td className="p-3"><input type="checkbox" className="accent-brand-orange" checked={selectedIds.includes(c.id)} onChange={() => handleSelect(c.id)} /></td>
                                                <td className="p-3">
                                                    {onToggleStar ? (
                                                        <button type="button" onClick={e => { e.stopPropagation(); onToggleStar(c); }} className="p-1 rounded hover:bg-muted">
                                                            <Star size={15} className={c.starred ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground hover:text-amber-300'} />
                                                        </button>
                                                    ) : '—'}
                                                </td>
                                                <td className="p-3 font-medium text-foreground cursor-pointer hover:text-brand-orange transition-colors" onClick={() => onEdit(c)}>
                                                    {c.fullName || 'Sem nome'}
                                                </td>
                                                <td className="p-3">
                                                    {onDragEnd ? (
                                                        <select
                                                            value={c.status || 'Inscrito'}
                                                            onChange={e => onDragEnd(c.id, e.target.value)}
                                                            onClick={e => e.stopPropagation()}
                                                            className={`px-2 py-1 rounded text-xs border font-medium cursor-pointer ${STATUS_COLORS[c.status] || 'bg-muted text-muted-foreground border-border'}`}
                                                        >
                                                            {ALL_STATUSES.map(s => <option key={s} value={s} className="bg-card text-foreground">{s}</option>)}
                                                        </select>
                                                    ) : (
                                                        <span className={`px-2 py-0.5 rounded text-xs border ${STATUS_COLORS[c.status] || 'bg-muted text-muted-foreground border-border'}`}>{c.status || 'Inscrito'}</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-xs text-muted-foreground max-w-[160px] truncate" title={primary?.jobTitle}>{primary?.jobTitle || '—'}</td>
                                                <td className="p-3 text-xs text-muted-foreground">{c.city || '—'}</td>
                                                <td className="p-3 text-xs text-muted-foreground max-w-[120px] truncate" title={c.interestAreas}>{c.interestAreas || '—'}</td>
                                                <td className="p-3 text-xs">
                                                    {c.hasLicense === 'Sim' ? <span className="text-green-600">✓ Sim</span>
                                                        : c.hasLicense === 'Não' ? <span className="text-red-500">✗ Não</span>
                                                        : <span className="text-muted-foreground">—</span>}
                                                </td>
                                                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                                    {ts ? new Date(ts * 1000).toLocaleDateString('pt-BR') : '—'}
                                                </td>
                                                <td className="p-3">
                                                    <button onClick={() => onEdit(c)} className="text-muted-foreground hover:text-brand-orange transition-colors"><Edit3 size={15} /></button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Paginação (lista) */}
                {viewMode === 'list' && processedData.length > itemsPerPage && (
                    <div className="border-t border-border px-5 py-3 bg-card flex items-center justify-between flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                            {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, processedData.length)} de {processedData.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className="p-1.5 rounded hover:bg-muted disabled:opacity-40">
                                <ChevronLeft size={15} />
                            </button>
                            <span className="text-sm text-foreground">{currentPage} / {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                                className="p-1.5 rounded hover:bg-muted disabled:opacity-40">
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─── Coluna do Kanban ───────────────────────────────────────────────────── */
const KanbanColumn = ({
    stage, allCandidates, displayedCandidates, total, displayCount,
    jobs, applications = [], onDragEnd, onEdit, onCloseStatus,
    selectedIds, onSelect, showColorPicker, onLoadMore, onReset,
    kanbanItemsPerPage = 10, onToggleStar, collapsed = false, onToggleCollapse,
    highlightedCandidateId = null, allJobs = []
}) => {
    const [columnColor, setColumnColor] = useState(() => localStorage.getItem(`kanban-color-${stage}`) || STATUS_COLORS[stage]);
    const handleDrop      = (e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) onDragEnd(id, stage); };
    const handleDragStart = (e, id) => { try { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; } catch {} };
    const handleColorChange = (c) => { setColumnColor(c); localStorage.setItem(`kanban-color-${stage}`, c); };

    const presetColors = [
        'bg-muted text-muted-foreground border-border',
        'bg-blue-900/40 text-blue-300 border-blue-700',
        'bg-cyan-900/40 text-cyan-300 border-cyan-700',
        'bg-purple-900/40 text-purple-300 border-purple-700',
        'bg-indigo-900/40 text-indigo-300 border-indigo-700',
        'bg-yellow-900/40 text-yellow-300 border-yellow-700',
        'bg-green-900/40 text-green-300 border-green-700',
        'bg-red-900/40 text-red-300 border-red-700',
        'bg-orange-900/40 text-orange-300 border-orange-700',
        'bg-pink-900/40 text-pink-300 border-pink-700',
    ];

    return (
        /* md+: largura fixa 300px. mobile: largura total quando expandida */
        <div
            className={`flex-shrink-0 flex flex-col bg-card/50 border border-border rounded-xl backdrop-blur-sm transition-all duration-200
                ${collapsed
                    ? 'md:w-12 w-full'           /* mobile colapsado: linha horizontal */
                    : 'md:w-[300px] w-full'}      /* mobile expandido: full width */
            `}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
        >
            {/* Cabeçalho da coluna */}
            <div
                className={`px-3 py-2.5 border-b border-border flex items-center justify-between rounded-t-xl cursor-pointer select-none relative ${columnColor}
                    ${collapsed ? 'rounded-b-xl' : ''}`}
                onClick={onToggleCollapse}
                title={collapsed ? `Expandir ${stage}` : `Colapsar ${stage}`}
            >
                {collapsed ? (
                    /* Mobile: linha horizontal; md+: texto vertical */
                    <div className="flex items-center justify-between w-full md:flex-col md:items-center gap-2 md:gap-1 md:py-1">
                        <span className="text-xs font-bold uppercase md:hidden">{stage}</span>
                        <span className="hidden md:block font-bold text-[10px] uppercase" style={{writingMode:'vertical-rl', transform:'rotate(180deg)', lineHeight:1}}>{stage}</span>
                        <span className="bg-black/20 px-1.5 py-0.5 rounded text-xs font-mono">{total}</span>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-xs uppercase truncate">{stage}</span>
                            {total === 0 && <span className="text-[10px] opacity-60 italic">vazio</span>}
                        </div>
                        <span className="bg-black/20 px-2 py-0.5 rounded text-xs font-mono flex-shrink-0">{total}</span>
                    </>
                )}

                {showColorPicker && !collapsed && (
                    <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-b-xl p-2 z-50 shadow-lg" onClick={e => e.stopPropagation()}>
                        <p className="text-[10px] text-muted-foreground mb-1.5">Cor da coluna</p>
                        <div className="grid grid-cols-5 gap-1">
                            {presetColors.map((c, i) => (
                                <button key={i} onClick={() => handleColorChange(c)}
                                    className={`h-6 rounded border-2 ${c} ${columnColor === c ? 'ring-2 ring-brand-orange' : ''}`} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Cards */}
            {!collapsed && (
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar md:max-h-[calc(100vh-220px)]">
                    {displayedCandidates.length > 0 ? displayedCandidates.map(c => {
                        const apps = applications.filter(a => a.candidateId === c.id);
                        const primary = apps[0];
                        const primaryJob = primary ? jobs.find(j => j.id === primary.jobId) : null;
                        const recency = getCandidateRecency(c);
                        const ts = getCandidateTimestamp(c);
                        const isHighlighted = highlightedCandidateId === c.id;

                        return (
                            <div
                                key={c.id}
                                id={`candidate-${c.id}`}
                                draggable
                                onDragStart={e => handleDragStart(e, c.id)}
                                onClick={() => onEdit(c)}
                                className={`bg-card p-3 rounded-xl border cursor-grab active:cursor-grabbing shadow-sm group relative transition-all
                                    hover:border-brand-orange/50 hover:shadow-md
                                    ${selectedIds.includes(c.id) ? 'border-brand-orange bg-brand-orange/5' : 'border-border'}
                                    ${getRecencyRowClass(recency)}
                                    ${isHighlighted ? 'ring-2 ring-amber-400 border-amber-400' : ''}
                                `}
                            >
                                {/* Checkbox */}
                                <div className={`absolute top-2 left-2 z-20 transition-opacity ${selectedIds.includes(c.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                    onClick={e => e.stopPropagation()}>
                                    <input type="checkbox" className="accent-brand-orange" checked={selectedIds.includes(c.id)} onChange={() => onSelect(c.id)} />
                                </div>

                                {/* Header do card */}
                                <div className="flex items-start gap-2 pl-5 mb-2">
                                    {/* Avatar */}
                                    {(() => {
                                        const url = getPhotoPublicUrl(c.photoUrl);
                                        return url
                                            ? <img src={url} alt={c.fullName} className="w-8 h-8 rounded-full object-cover shrink-0 border border-border" referrerPolicy="no-referrer" onError={e => e.target.style.display='none'} />
                                            : <div className="w-8 h-8 rounded-full bg-muted shrink-0 flex items-center justify-center text-xs font-bold text-muted-foreground border border-border">{c.fullName?.charAt(0)?.toUpperCase() || '?'}</div>;
                                    })()}
                                    {/* Estrela */}
                                    {onToggleStar && (
                                        <button type="button" onClick={e => { e.stopPropagation(); onToggleStar(c); }}
                                            className="shrink-0 p-1 rounded hover:bg-muted/50 z-30 relative mt-0.5">
                                            <Star size={14} className={c.starred ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground hover:text-amber-300'} />
                                        </button>
                                    )}
                                    {/* Info */}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-foreground text-sm truncate">{c.fullName}</p>
                                        <div className="text-xs space-y-0.5 mt-0.5">
                                            {primaryJob && (
                                                <p className="text-blue-500 dark:text-blue-400 flex items-center gap-1 truncate font-medium">
                                                    <Briefcase size={10} className="flex-shrink-0" /> {primaryJob.title}
                                                    {apps.length > 1 && <span className="ml-1 px-1 bg-blue-100 dark:bg-blue-900/30 rounded text-[10px]">+{apps.length - 1}</span>}
                                                </p>
                                            )}
                                            {c.city && (
                                                <p className="text-muted-foreground flex items-center gap-1 truncate">
                                                    <MapPin size={10} className="flex-shrink-0" /> {c.city}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Data de cadastro */}
                                {ts && (
                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground pl-5">
                                        {recency && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${recency === 'today' ? 'bg-green-500 animate-pulse' : 'bg-green-400/60'}`} />}
                                        <Clock size={10} className="flex-shrink-0" />
                                        {new Date(ts * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </div>
                                )}

                                {/* Ações rápidas (hover) */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 bg-card shadow rounded-lg border border-border z-30">
                                    <button onClick={e => { e.stopPropagation(); onEdit(c); }} className="p-1.5 hover:text-blue-400 hover:bg-blue-500/10 rounded-l-lg" title="Abrir"><Edit3 size={13} /></button>
                                    <button onClick={e => { e.stopPropagation(); onCloseStatus(c.id, 'Arquivado'); }} className="p-1.5 hover:text-slate-300 hover:bg-slate-500/10 rounded-r-lg" title="Arquivar"><Ban size={13} /></button>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="text-center py-8 text-muted-foreground/50 text-xs italic">Nenhum candidato nesta etapa</div>
                    )}
                </div>
            )}

            {/* Ver mais */}
            {!collapsed && displayedCandidates.length < total && (
                <div className="p-2 border-t border-border space-y-1 flex-shrink-0">
                    <div className="flex gap-1">
                        {[10, 25, 50].map(n => (
                            <button key={n} onClick={e => { e.stopPropagation(); onLoadMore(n); }}
                                className="flex-1 py-1.5 text-xs font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                                +{n}
                            </button>
                        ))}
                    </div>
                    <button onClick={e => { e.stopPropagation(); onLoadMore(total - displayedCandidates.length); }}
                        className="w-full py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors">
                        Ver todos ({total - displayedCandidates.length} restantes)
                    </button>
                </div>
            )}

            {/* Mostrar menos */}
            {!collapsed && displayCount > (kanbanItemsPerPage || 10) && displayedCandidates.length >= displayCount && (
                <div className="p-2 border-t border-border flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); onReset(); }}
                        className="w-full py-1.5 text-xs text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                        Mostrar menos
                    </button>
                </div>
            )}
        </div>
    );
};

export default PipelineView;
