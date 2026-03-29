import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { CSV_FIELD_MAPPING_OPTIONS, PIPELINE_STAGES, CLOSING_STATUSES, FILTER_STORAGE_KEY, SAVED_FILTER_PRESETS_KEY } from '../constants';
import { Save, Trash2, Bookmark } from 'lucide-react';

const loadSavedPresets = () => {
    try {
        const raw = localStorage.getItem(SAVED_FILTER_PRESETS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const FilterSidebar = ({ isOpen, onClose, filters, setFilters, clearFilters, options, candidates = [] }) => {
    const [savedPresets, setSavedPresets] = useState(loadSavedPresets);
    const [presetName, setPresetName] = useState('');
    const [searchTexts, setSearchTexts] = useState({
        city: '',
        interestAreas: '',
        source: '',
        schoolingLevel: '',
        tags: ''
    });
    const [showCustomPeriod, setShowCustomPeriod] = useState(filters.createdAtPreset === 'custom');
    const [expandedFilters, setExpandedFilters] = useState({});
    const [openGroups, setOpenGroups] = useState({});
    const toggleGroup = (key) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
    const [lastSearchTexts, setLastSearchTexts] = useState({});

    useEffect(() => {
        setShowCustomPeriod(filters.createdAtPreset === 'custom');
    }, [filters.createdAtPreset]);

    useEffect(() => {
        if (isOpen) setSavedPresets(loadSavedPresets());
    }, [isOpen]);

    // Pré-selecionar automaticamente resultados filtrados quando há busca
    useEffect(() => {
        const fieldsWithSearch = ['city', 'interestAreas', 'source', 'schoolingLevel', 'tags'];
        const timeouts = [];

        fieldsWithSearch.forEach(field => {
            const searchText = searchTexts[field];
            const lastSearch = lastSearchTexts[field];

            // Só pré-seleciona se o texto mudou e há resultados
            if (searchText && searchText !== lastSearch && searchText.length > 0) {
                // Aguarda um pequeno delay para evitar múltiplas atualizações
                const timeoutId = setTimeout(() => {
                    // Busca as opções filtradas
                    let filteredOptions = [];

                    if (field === 'city') {
                        const fromCandidates = Array.from(new Set(candidates.map(x => x.city).filter(Boolean))).map((n, i) => ({ id: i, name: n }));
                        const fromOptions = (options.cities && options.cities.length > 0) ? options.cities.map(c => ({ id: c.id, name: c.name })) : [];
                        const map = new Map();
                        fromCandidates.forEach(c => map.set(String(c.name).toLowerCase(), c));
                        fromOptions.forEach(c => { if (!map.has(String(c.name).toLowerCase())) map.set(String(c.name).toLowerCase(), c); });
                        const allOptions = Array.from(map.values());
                        filteredOptions = filterBySearch(sortAlphabetically(allOptions), searchText);
                    } else if (field === 'interestAreas') {
                        const raw = candidates.flatMap(x => (typeof x.interestAreas === 'string' ? x.interestAreas.split(',').map(s => s.trim()) : (x.interestAreas ? [x.interestAreas] : [])));
                        const fromCandidates = Array.from(new Set(raw.filter(Boolean))).map((n, i) => ({ id: i, name: n }));
                        const fromOptions = (options.interestAreas && options.interestAreas.length > 0) ? options.interestAreas.map(i => ({ id: i.id, name: i.name })) : [];
                        const map = new Map();
                        fromCandidates.forEach(c => map.set(String(c.name).toLowerCase(), c));
                        fromOptions.forEach(c => { if (!map.has(String(c.name).toLowerCase())) map.set(String(c.name).toLowerCase(), c); });
                        const allOptions = Array.from(map.values());
                        filteredOptions = filterBySearch(sortAlphabetically(allOptions), searchText);
                    } else if (field === 'source') {
                        const allOptions = (options.origins && options.origins.length > 0)
                            ? options.origins.map(o => ({ id: o.id, name: o.name }))
                            : Array.from(new Set(candidates.map(x => x.source).filter(Boolean))).map((n, i) => ({ id: i, name: n }));
                        filteredOptions = filterBySearch(sortAlphabetically(allOptions), searchText);
                    } else if (field === 'schoolingLevel') {
                        const allOptions = (options.schooling && options.schooling.length > 0)
                            ? options.schooling.map(s => ({ id: s.id, name: s.name }))
                            : Array.from(new Set(candidates.map(x => x.schoolingLevel).filter(Boolean))).map((n, i) => ({ id: i, name: n }));
                        filteredOptions = filterBySearch(sortAlphabetically(allOptions), searchText);
                    } else if (field === 'tags') {
                        const allTags = new Set();
                        candidates.forEach(c => {
                            if (c.tags && Array.isArray(c.tags)) {
                                c.tags.forEach(tag => allTags.add(tag));
                            }
                            if (c.importTag) allTags.add(c.importTag);
                        });
                        const allOptions = sortAlphabetically(Array.from(allTags).map((t, i) => ({ id: i, name: t })));
                        filteredOptions = filterBySearch(allOptions, searchText);
                    }

                    // Pré-seleciona os resultados filtrados
                    if (filteredOptions.length > 0) {
                        const matchingNames = filteredOptions.map(o => o.name);
                        const currentValues = Array.isArray(filters[field]) ? filters[field] : (filters[field] && filters[field] !== 'all' ? [filters[field]] : []);
                        const newValues = [...new Set([...currentValues, ...matchingNames])];
                        setFilters(prev => ({
                            ...prev,
                            [field]: newValues.length > 0 ? newValues : 'all'
                        }));
                    }

                    setLastSearchTexts(prev => ({ ...prev, [field]: searchText }));
                }, 500); // Delay de 500ms para evitar múltiplas atualizações

                timeouts.push(timeoutId);
            }
        });

        return () => {
            timeouts.forEach(timeoutId => clearTimeout(timeoutId));
        };
    }, [searchTexts, filters, options, candidates, lastSearchTexts]);

    if (!isOpen) return null;

    const dynamicFilters = CSV_FIELD_MAPPING_OPTIONS.filter(opt =>
        ['city', 'interestAreas', 'schoolingLevel', 'source', 'maritalStatus', 'hasLicense'].includes(opt.value)
    );

    // Função para ordenar alfabeticamente
    const sortAlphabetically = (arr) => {
        return [...arr].sort((a, b) => {
            const nameA = (a.name || a).toLowerCase();
            const nameB = (b.name || b).toLowerCase();
            return nameA.localeCompare(nameB, 'pt-BR');
        });
    };

    // Função para filtrar por texto de busca
    const filterBySearch = (optionsList, searchText) => {
        if (!searchText) return optionsList;
        const lowerSearch = searchText.toLowerCase();
        return optionsList.filter(opt => {
            const name = (opt.name || opt).toLowerCase();
            return name.includes(lowerSearch);
        });
    };

    // Função para gerenciar seleção múltipla
    const handleMultiSelect = (field, value) => {
        const currentValues = Array.isArray(filters[field]) ? filters[field] : (filters[field] && filters[field] !== 'all' ? [filters[field]] : []);
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];

        setFilters({
            ...filters,
            [field]: newValues.length > 0 ? newValues : 'all'
        });
    };

    // Função para marcar todos os resultados filtrados
    const handleSelectAllFiltered = (field, filteredOptions) => {
        const matchingNames = filteredOptions.map(o => o.name);
        const currentValues = Array.isArray(filters[field]) ? filters[field] : (filters[field] && filters[field] !== 'all' ? [filters[field]] : []);
        const newValues = [...new Set([...currentValues, ...matchingNames])];
        setFilters({
            ...filters,
            [field]: newValues.length > 0 ? newValues : 'all'
        });
    };

    // Função para desmarcar todos os resultados filtrados
    const handleDeselectAllFiltered = (field, filteredOptions) => {
        const matchingNames = filteredOptions.map(o => o.name);
        const currentValues = Array.isArray(filters[field]) ? filters[field] : (filters[field] && filters[field] !== 'all' ? [filters[field]] : []);
        const newValues = currentValues.filter(v => !matchingNames.includes(v));
        setFilters({
            ...filters,
            [field]: newValues.length > 0 ? newValues : 'all'
        });
    };

    // Função para verificar se todos os resultados filtrados estão selecionados
    const areAllFilteredSelected = (field, filteredOptions) => {
        if (!filteredOptions || filteredOptions.length === 0) return false;
        const currentValues = Array.isArray(filters[field]) ? filters[field] : (filters[field] && filters[field] !== 'all' ? [filters[field]] : []);
        const matchingNames = filteredOptions.map(o => o.name);
        return matchingNames.every(name => currentValues.includes(name));
    };

    // Função para verificar se um valor está selecionado
    const isSelected = (field, value) => {
        if (filters[field] === 'all' || !filters[field]) return false;
        if (Array.isArray(filters[field])) {
            return filters[field].includes(value);
        }
        return filters[field] === value;
    };

    // Função para toggle de expansão
    const toggleExpanded = (field) => {
        setExpandedFilters(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 w-96 bg-card border-l border-border z-50 p-6 shadow-2xl transform transition-transform duration-300 overflow-y-auto flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-foreground text-lg flex items-center gap-2"><Filter size={20} /> Filtros Avançados</h3>
                    <button onClick={onClose}><X className="text-muted-foreground hover:text-gray-900 dark:hover:text-white" /></button>
                </div>

                {/* Filtros Ativos - Badges */}
                {(() => {
                    const activeFilters = [];
                    Object.keys(filters).forEach(key => {
                        if (key === 'createdAtPreset' && filters[key] !== 'all' && filters[key] !== '7d') {
                            activeFilters.push({ key, label: `Período: ${filters[key] === 'today' ? 'Hoje' : filters[key] === 'yesterday' ? 'Ontem' : filters[key] === '7d' ? '7 dias' : filters[key] === '30d' ? '30 dias' : filters[key] === '90d' ? '90 dias' : filters[key] === 'custom' ? 'Personalizado' : filters[key]}` });
                        } else if (key === 'customDateStart' || key === 'customDateEnd') {
                            // Já tratado no createdAtPreset
                        } else if (key === 'ageMin' && filters.ageMin !== 'all' && filters.ageMin !== '') {
                            activeFilters.push({ key, label: `Idade mín.: ${filters.ageMin} anos` });
                        } else if (key === 'ageMax' && filters.ageMax !== 'all' && filters.ageMax !== '') {
                            activeFilters.push({ key, label: `Idade máx.: ${filters.ageMax} anos` });
                        } else if (filters[key] && filters[key] !== 'all' && key !== 'createdAtPreset' && key !== 'ageMin' && key !== 'ageMax') {
                            if (Array.isArray(filters[key]) && filters[key].length > 0) {
                                activeFilters.push({ key, label: `${key === 'status' ? 'Status' : key === 'jobId' ? 'Vaga' : key === 'interestAreas' ? 'Áreas' : key === 'city' ? 'Cidade' : key === 'source' ? 'Fonte' : key === 'schoolingLevel' ? 'Escolaridade' : key === 'maritalStatus' ? 'Estado Civil' : key === 'hasLicense' ? 'CNH' : key === 'tags' ? 'Tags' : key}: ${filters[key].length} selecionado(s)` });
                            } else if (!Array.isArray(filters[key])) {
                                activeFilters.push({ key, label: `${key === 'status' ? 'Status' : key === 'jobId' ? 'Vaga' : key === 'interestAreas' ? 'Áreas' : key === 'city' ? 'Cidade' : key === 'source' ? 'Fonte' : key === 'schoolingLevel' ? 'Escolaridade' : key === 'maritalStatus' ? 'Estado Civil' : key === 'hasLicense' ? 'CNH' : key === 'tags' ? 'Tags' : key}: ${filters[key]}` });
                            }
                        }
                    });

                    if (activeFilters.length === 0) return null;

                    return (
                        <div className="mb-4 pb-4 border-b border-border">
                            <div className="text-xs font-semibold text-muted-foreground mb-2">Filtros Ativos:</div>
                            <div className="flex flex-wrap gap-2">
                                {activeFilters.map((filter, idx) => (
                                    <div key={idx} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
                                        <span>{filter.label}</span>
                                        <button
                                            onClick={() => {
                                                if (filter.key === 'createdAtPreset') {
                                                    setFilters({ ...filters, [filter.key]: 'all', customDateStart: '', customDateEnd: '' });
                                                } else {
                                                    setFilters({ ...filters, [filter.key]: 'all' });
                                                }
                                            }}
                                            className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                <div className="space-y-6 flex-1 custom-scrollbar overflow-y-auto pr-2">
                    {/* Período - Data de Cadastro Original */}
                    <div className="space-y-2">
                        <button onClick={() => toggleGroup('periodo')} className="w-full flex justify-between items-center text-left">
                            <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase cursor-pointer">Período (Data Cadastro Original)</label>
                            {openGroups['periodo'] ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />}
                        </button>
                        {openGroups['periodo'] && <div className="space-y-2 mt-1">
                            <select
                                className="w-full bg-background border border-border rounded p-3 text-sm text-foreground outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                value={filters.createdAtPreset || 'all'}
                                onChange={e => {
                                    const value = e.target.value;
                                    setFilters({ ...filters, createdAtPreset: value, customDateStart: '', customDateEnd: '' });
                                    setShowCustomPeriod(value === 'custom');
                                }}
                            >
                                <option value="all">Qualquer data</option>
                                <option value="today">Hoje</option>
                                <option value="yesterday">Ontem</option>
                                <option value="7d">Últimos 7 dias</option>
                                <option value="30d">Últimos 30 dias</option>
                                <option value="90d">Últimos 90 dias</option>
                                <option value="custom">Período personalizado</option>
                            </select>
                            {showCustomPeriod && (
                                <div className="space-y-2 mt-2">
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Data inicial</label>
                                        <input
                                            type="date"
                                            className="w-full bg-background border border-border rounded p-2 text-sm text-foreground outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            value={filters.customDateStart || ''}
                                            onChange={e => setFilters({ ...filters, customDateStart: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Data final</label>
                                        <input
                                            type="date"
                                            className="w-full bg-background border border-border rounded p-2 text-sm text-foreground outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            value={filters.customDateEnd || ''}
                                            onChange={e => setFilters({ ...filters, customDateEnd: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 italic">Usa a data original de cadastro do candidato</p>
                                </div>
                            )}
                        </div>}
                    </div>

                    {/* SEPARAÇÃO: FILTROS DE VAGA (DEMANDA) */}
                    <div className="pt-4 border-t-2 border-orange-500/30 dark:border-orange-400/30">
                        <h4 className="text-sm font-bold text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            Filtros de Vaga (Demanda)
                        </h4>

                        {/* Vaga */}
                        <div className="space-y-2 mb-4">
                            <button onClick={() => toggleGroup('vaga')} className="w-full flex justify-between items-center text-left">
                                <label className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase cursor-pointer">Vaga</label>
                                {openGroups['vaga'] ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />}
                            </button>
                            {openGroups['vaga'] && (expandedFilters.jobId ? (
                                <div className="max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-900 border border-border rounded p-2 space-y-1">
                                    <label className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={filters.jobId === 'all' || !filters.jobId || (Array.isArray(filters.jobId) && filters.jobId.length === 0)}
                                            onChange={() => setFilters({ ...filters, jobId: 'all' })}
                                            className="accent-blue-600 dark:accent-blue-500"
                                        />
                                        <span className="text-sm text-foreground">Todas as Vagas</span>
                                    </label>
                                    {options.jobs.map(j => (
                                        <label key={j.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={isSelected('jobId', j.id)}
                                                onChange={() => handleMultiSelect('jobId', j.id)}
                                                className="accent-blue-600 dark:accent-blue-500"
                                            />
                                            <span className="text-sm text-white">{j.title}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <select className="w-full bg-background border border-border rounded p-3 text-sm text-foreground outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={Array.isArray(filters.jobId) ? filters.jobId[0] || 'all' : (filters.jobId || 'all')} onChange={e => setFilters({ ...filters, jobId: e.target.value === 'all' ? 'all' : [e.target.value] })}>
                                    <option value="all">Todas as Vagas</option>{options.jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                                </select>
                            ))}
                        </div>
                    </div>

                    {/* SEPARAÇÃO: FILTROS DE CANDIDATO (PERFIL) */}
                    <div className="pt-4 border-t-2 border-blue-500/30 dark:border-blue-400/30">
                        <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Filtros de Candidato (Perfil)
                        </h4>

                        {/* Status (Etapa da Pipeline) - Seleção Múltipla */}
                        <div className="space-y-2">
                            <button onClick={() => toggleGroup('status')} className="w-full flex justify-between items-center text-left">
                                <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase cursor-pointer">Status (Etapa)</label>
                                {openGroups['status'] ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />}
                            </button>
                            {openGroups['status'] && (expandedFilters.status ? (
                                <div className="max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-900 border border-border rounded p-2 space-y-1">
                                    <label className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={filters.status === 'all' || !filters.status || (Array.isArray(filters.status) && filters.status.length === 0)}
                                            onChange={() => setFilters({ ...filters, status: 'all' })}
                                            className="accent-blue-600 dark:accent-blue-500"
                                        />
                                        <span className="text-sm text-foreground">Todas as etapas</span>
                                    </label>
                                    {PIPELINE_STAGES.map(stage => (
                                        <label key={stage} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={isSelected('status', stage)}
                                                onChange={() => handleMultiSelect('status', stage)}
                                                className="accent-blue-600 dark:accent-blue-500"
                                            />
                                            <span className="text-sm text-white">{stage}</span>
                                        </label>
                                    ))}
                                    {CLOSING_STATUSES.map(status => (
                                        <label key={status} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isSelected('status', status)}
                                                onChange={() => handleMultiSelect('status', status)}
                                                className="accent-blue-600 dark:accent-blue-500"
                                            />
                                            <span className="text-sm text-white">{status}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <select
                                    className="w-full bg-background border border-border rounded p-3 text-sm text-foreground outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    value={Array.isArray(filters.status) ? filters.status[0] || 'all' : (filters.status || 'all')}
                                    onChange={e => setFilters({ ...filters, status: e.target.value === 'all' ? 'all' : [e.target.value] })}
                                >
                                    <option value="all">Todas as etapas</option>
                                    {PIPELINE_STAGES.map(stage => (
                                        <option key={stage} value={stage}>{stage}</option>
                                    ))}
                                    {CLOSING_STATUSES.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <button onClick={() => toggleGroup('vagaVinculada')} className="w-full flex justify-between items-center text-left">
                                <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase cursor-pointer">Vaga Vinculada</label>
                                {openGroups['vagaVinculada'] ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />}
                            </button>
                            {openGroups['vagaVinculada'] && (expandedFilters.jobId ? (
                                <div className="max-h-48 overflow-y-auto bg-background border border-border rounded p-2 space-y-1">
                                    <label className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.jobId === 'all' || !filters.jobId || (Array.isArray(filters.jobId) && filters.jobId.length === 0)}
                                            onChange={() => setFilters({ ...filters, jobId: 'all' })}
                                            className="accent-blue-600 dark:accent-blue-500"
                                        />
                                        <span className="text-sm text-white">Todas as Vagas</span>
                                    </label>
                                    {options.jobs.map(j => (
                                        <label key={j.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isSelected('jobId', j.id)}
                                                onChange={() => handleMultiSelect('jobId', j.id)}
                                                className="accent-blue-600 dark:accent-blue-500"
                                            />
                                            <span className="text-sm text-white">{j.title}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <select className="w-full bg-background border border-border rounded p-3 text-sm text-foreground outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={Array.isArray(filters.jobId) ? filters.jobId[0] || 'all' : (filters.jobId || 'all')} onChange={e => setFilters({ ...filters, jobId: e.target.value === 'all' ? 'all' : [e.target.value] })}>
                                    <option value="all">Todas as Vagas</option>{options.jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                                </select>
                            ))}
                        </div>

                        <div className="space-y-3 pt-2 border-t border-dashed border-input">
                            <button onClick={() => toggleGroup('idade')} className="w-full flex justify-between items-center text-left">
                                <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase cursor-pointer">Idade (anos)</label>
                                {openGroups['idade'] ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />}
                            </button>
                            {openGroups['idade'] && <div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block mb-1">Mínima</span>
                                        <input
                                            type="number"
                                            min={0}
                                            max={120}
                                            placeholder="ex: 18"
                                            className="w-full bg-background border border-border rounded p-2 text-sm text-foreground"
                                            value={filters.ageMin === 'all' || filters.ageMin == null ? '' : filters.ageMin}
                                            onChange={e => setFilters({ ...filters, ageMin: e.target.value === '' ? 'all' : e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block mb-1">Máxima</span>
                                        <input
                                            type="number"
                                            min={0}
                                            max={120}
                                            placeholder="ex: 45"
                                            className="w-full bg-background border border-border rounded p-2 text-sm text-foreground"
                                            value={filters.ageMax === 'all' || filters.ageMax == null ? '' : filters.ageMax}
                                            onChange={e => setFilters({ ...filters, ageMax: e.target.value === '' ? 'all' : e.target.value })}
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground">Calculada pela idade cadastrada ou pela data de nascimento.</p>
                            </div>}
                        </div>

                        {dynamicFilters.map(field => {
                            // Prefer options from system lists, fallback to deriving from candidates
                            let optionsList = [];
                            if (field.value === 'city') {
                                // Prioriza cidades dos candidatos
                                const candidateCities = Array.from(new Set(candidates.map(x => x.city).filter(Boolean))).map((n, i) => ({ id: `candidate_${i}`, name: n }));
                                const optionCities = (options.cities && options.cities.length > 0)
                                    ? options.cities.map(c => ({ id: c.id, name: c.name }))
                                    : [];
                                // Combina, priorizando cidades dos candidatos e removendo duplicatas
                                const allOptionsMap = new Map();
                                candidateCities.forEach(c => allOptionsMap.set(c.name.toLowerCase(), c));
                                optionCities.forEach(c => {
                                    if (!allOptionsMap.has(c.name.toLowerCase())) {
                                        allOptionsMap.set(c.name.toLowerCase(), c);
                                    }
                                });
                                optionsList = Array.from(allOptionsMap.values());
                                optionsList = sortAlphabetically(optionsList);
                                optionsList = filterBySearch(optionsList, searchTexts.city);
                            }
                            else if (field.value === 'interestAreas') {
                                const raw = candidates.flatMap(x => (typeof x.interestAreas === 'string' ? x.interestAreas.split(',').map(s => s.trim()) : (x.interestAreas ? [x.interestAreas] : [])));
                                const fromCandidates = Array.from(new Set(raw.filter(Boolean))).map((n, i) => ({ id: i, name: n }));
                                const fromOptions = (options.interestAreas && options.interestAreas.length > 0) ? options.interestAreas.map(i => ({ id: i.id, name: i.name })) : [];
                                const allOptionsMap = new Map();
                                fromCandidates.forEach(c => allOptionsMap.set(String(c.name).toLowerCase(), c));
                                fromOptions.forEach(c => { if (!allOptionsMap.has(String(c.name).toLowerCase())) allOptionsMap.set(String(c.name).toLowerCase(), c); });
                                optionsList = sortAlphabetically(Array.from(allOptionsMap.values()));
                                optionsList = filterBySearch(optionsList, searchTexts.interestAreas);
                            }
                            else if (field.value === 'schoolingLevel') {
                                optionsList = (options.schooling && options.schooling.length > 0)
                                    ? options.schooling.map(s => ({ id: s.id, name: s.name }))
                                    : Array.from(new Set(candidates.map(x => x.schoolingLevel).filter(Boolean))).map((n, i) => ({ id: i, name: n }));
                                optionsList = sortAlphabetically(optionsList);
                                optionsList = filterBySearch(optionsList, searchTexts.schoolingLevel || '');
                            }
                            else if (field.value === 'source') {
                                optionsList = (options.origins && options.origins.length > 0)
                                    ? options.origins.map(o => ({ id: o.id, name: o.name }))
                                    : Array.from(new Set(candidates.map(x => x.source).filter(Boolean))).map((n, i) => ({ id: i, name: n }));
                                optionsList = sortAlphabetically(optionsList);
                                optionsList = filterBySearch(optionsList, searchTexts.source);
                            }
                            else if (field.value === 'maritalStatus') {
                                optionsList = (options.marital && options.marital.length > 0)
                                    ? options.marital.map(m => ({ id: m.id, name: m.name }))
                                    : Array.from(new Set(candidates.map(x => x.maritalStatus).filter(Boolean))).map((n, i) => ({ id: i, name: n }));
                                optionsList = sortAlphabetically(optionsList);
                            }

                            const hasOptions = optionsList.length > 0;
                            const isBoolean = ['hasLicense', 'isStudying', 'canRelocate'].includes(field.value);
                            const needsSearch = ['city', 'interestAreas', 'source', 'schoolingLevel'].includes(field.value);

                            return (
                                <div key={field.value} className="pb-4 border-b border-border">
                                    <button onClick={() => toggleGroup(field.value)} className="w-full flex justify-between items-center text-left py-1 mb-1">
                                        <span className="text-sm font-semibold text-foreground">{field.label.replace(':', '')}</span>
                                        {openGroups[field.value] ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />}
                                    </button>
                                    {openGroups[field.value] && <div className="space-y-3 mt-1">
                                    {needsSearch ? (
                                        <>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                    placeholder={`Digite para buscar ${field.label.replace(':', '').toLowerCase()}...`}
                                                    value={searchTexts[field.value] || ''}
                                                    onChange={e => {
                                                        const searchValue = e.target.value;
                                                        setSearchTexts({ ...searchTexts, [field.value]: searchValue });
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && searchTexts[field.value] && optionsList.length > 0) {
                                                            e.preventDefault();
                                                            handleSelectAllFiltered(field.value, optionsList);
                                                        }
                                                    }}
                                                />
                                                {searchTexts[field.value] && (
                                                    <button
                                                        onClick={() => setSearchTexts({ ...searchTexts, [field.value]: '' })}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>

                                            {optionsList.length > 0 && (
                                                <>
                                                    <div className="flex gap-2 mb-2">
                                                        <button
                                                            onClick={() => handleSelectAllFiltered(field.value, optionsList)}
                                                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${areAllFilteredSelected(field.value, optionsList)
                                                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                                                                }`}
                                                        >
                                                            {areAllFilteredSelected(field.value, optionsList) ? '✓ Todos' : `Marcar Todos (${optionsList.length})`}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeselectAllFiltered(field.value, optionsList)}
                                                            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-muted-foreground text-xs font-medium rounded-lg transition-colors"
                                                        >
                                                            Desmarcar
                                                        </button>
                                                    </div>

                                                    <div className="max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 border border-border rounded-lg p-2 space-y-1">
                                                        <label className="flex items-center gap-2 p-2 hover:bg-white dark:hover:bg-gray-800 rounded cursor-pointer transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                checked={filters[field.value] === 'all' || !filters[field.value] || (Array.isArray(filters[field.value]) && filters[field.value].length === 0)}
                                                                onChange={() => setFilters({ ...filters, [field.value]: 'all' })}
                                                                className="accent-blue-600 dark:accent-blue-500 w-4 h-4"
                                                            />
                                                            <span className="text-sm text-foreground font-medium">Todos</span>
                                                        </label>
                                                        {optionsList.map(o => (
                                                            <label key={o.id || o.name} className="flex items-center gap-2 p-2 hover:bg-white dark:hover:bg-gray-800 rounded cursor-pointer transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected(field.value, o.name)}
                                                                    onChange={() => handleMultiSelect(field.value, o.name)}
                                                                    className="accent-blue-600 dark:accent-blue-500 w-4 h-4"
                                                                />
                                                                <span className="text-sm text-foreground">{o.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                            {searchTexts[field.value] && optionsList.length === 0 && (
                                                <p className="text-xs text-muted-foreground italic">Nenhum resultado encontrado</p>
                                            )}
                                        </>
                                    ) : hasOptions ? (
                                        <div className="max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 border border-border rounded-lg p-2 space-y-1">
                                            <label className="flex items-center gap-2 p-2 hover:bg-white dark:hover:bg-gray-800 rounded cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={filters[field.value] === 'all' || !filters[field.value] || (Array.isArray(filters[field.value]) && filters[field.value].length === 0)}
                                                    onChange={() => setFilters({ ...filters, [field.value]: 'all' })}
                                                    className="accent-blue-600 dark:accent-blue-500 w-4 h-4"
                                                />
                                                <span className="text-sm text-foreground font-medium">Todos</span>
                                            </label>
                                            {optionsList.map(o => (
                                                <label key={o.id || o.name} className="flex items-center gap-2 p-2 hover:bg-white dark:hover:bg-gray-800 rounded cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected(field.value, o.name)}
                                                        onChange={() => handleMultiSelect(field.value, o.name)}
                                                        className="accent-blue-600 dark:accent-blue-500 w-4 h-4"
                                                    />
                                                    <span className="text-sm text-foreground">{o.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    ) : isBoolean ? (
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={filters[field.value] === 'all' || !filters[field.value] || (Array.isArray(filters[field.value]) && filters[field.value].length === 0)}
                                                    onChange={() => setFilters({ ...filters, [field.value]: 'all' })}
                                                    className="accent-blue-600 dark:accent-blue-500 w-4 h-4"
                                                />
                                                <span className="text-sm text-foreground font-medium">Todos</span>
                                            </label>
                                            <label className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected(field.value, 'Sim')}
                                                    onChange={() => handleMultiSelect(field.value, 'Sim')}
                                                    className="accent-blue-600 dark:accent-blue-500 w-4 h-4"
                                                />
                                                <span className="text-sm text-foreground">Sim</span>
                                            </label>
                                            <label className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected(field.value, 'Não')}
                                                    onChange={() => handleMultiSelect(field.value, 'Não')}
                                                    className="accent-blue-600 dark:accent-blue-500 w-4 h-4"
                                                />
                                                <span className="text-sm text-foreground">Não</span>
                                            </label>
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            placeholder={`Filtrar...`}
                                            value={filters[field.value] || ''}
                                            onChange={e => setFilters({ ...filters, [field.value]: e.target.value })}
                                        />
                                    )}
                                    </div>}
                                </div>
                            );
                        })}

                        {/* Filtro por Tags */}
                        {(() => {
                            // Coleta todas as tags únicas dos candidatos
                            const allTags = new Set();
                            candidates.forEach(c => {
                                if (c.tags && Array.isArray(c.tags)) {
                                    c.tags.forEach(tag => allTags.add(tag));
                                }
                                if (c.importTag) allTags.add(c.importTag);
                            });
                            const tagsList = sortAlphabetically(Array.from(allTags).map((t, i) => ({ id: i, name: t })));
                            const filteredTags = filterBySearch(tagsList, searchTexts.tags || '');

                            if (tagsList.length === 0) return null;

                            return (
                                <div className="pb-4 border-b border-border">
                                    <button onClick={() => toggleGroup('tags')} className="w-full flex justify-between items-center text-left py-1 mb-1">
                                        <span className="text-sm font-semibold text-foreground">Tags</span>
                                        {openGroups['tags'] ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />}
                                    </button>
                                    {openGroups['tags'] && <div className="space-y-3 mt-1">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            placeholder="Digite para buscar tags..."
                                            value={searchTexts.tags || ''}
                                            onChange={e => {
                                                const searchValue = e.target.value;
                                                setSearchTexts({ ...searchTexts, tags: searchValue });

                                                // Pré-selecionar automaticamente os resultados filtrados
                                                if (searchValue && filteredTags.length > 0) {
                                                    const matchingNames = filteredTags.map(t => t.name);
                                                    const currentValues = Array.isArray(filters.tags) ? filters.tags : (filters.tags && filters.tags !== 'all' ? [filters.tags] : []);
                                                    const newValues = [...new Set([...currentValues, ...matchingNames])];
                                                    setFilters({
                                                        ...filters,
                                                        tags: newValues.length > 0 ? newValues : 'all'
                                                    });
                                                }
                                            }}
                                        />
                                        {searchTexts.tags && (
                                            <button
                                                onClick={() => setSearchTexts({ ...searchTexts, tags: '' })}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                    {filteredTags.length > 0 && (
                                        <>
                                            <div className="flex gap-2 mb-2">
                                                <button
                                                    onClick={() => handleSelectAllFiltered('tags', filteredTags)}
                                                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${areAllFilteredSelected('tags', filteredTags)
                                                        ? 'bg-green-500 hover:bg-green-600 text-white'
                                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                                        }`}
                                                >
                                                    {areAllFilteredSelected('tags', filteredTags) ? '✓ Todos' : `Marcar Todos (${filteredTags.length})`}
                                                </button>
                                                <button
                                                    onClick={() => handleDeselectAllFiltered('tags', filteredTags)}
                                                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-muted-foreground text-xs font-medium rounded-lg transition-colors"
                                                >
                                                    Desmarcar
                                                </button>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 border border-border rounded-lg p-2 space-y-1">
                                                <label className="flex items-center gap-2 p-2 hover:bg-white dark:hover:bg-gray-800 rounded cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.tags === 'all' || !filters.tags || (Array.isArray(filters.tags) && filters.tags.length === 0)}
                                                        onChange={() => setFilters({ ...filters, tags: 'all' })}
                                                        className="accent-blue-600 dark:accent-blue-500 w-4 h-4"
                                                    />
                                                    <span className="text-sm text-foreground font-medium">Todas as Tags</span>
                                                </label>
                                                {filteredTags.map(t => (
                                                    <label key={t.id || t.name} className="flex items-center gap-2 p-2 hover:bg-white dark:hover:bg-gray-800 rounded cursor-pointer transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected('tags', t.name)}
                                                            onChange={() => handleMultiSelect('tags', t.name)}
                                                            className="accent-blue-600 dark:accent-blue-500 w-4 h-4"
                                                        />
                                                        <span className="text-sm text-foreground">{t.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    {searchTexts.tags && filteredTags.length === 0 && (
                                        <p className="text-xs text-muted-foreground italic">Nenhum resultado encontrado</p>
                                    )}
                                    </div>}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Filtros salvos (presets nomeados) */}
                <div className="mt-6 pt-4 border-t border-border space-y-3">
                    <button onClick={() => toggleGroup('filtrosSalvos')} className="w-full flex justify-between items-center text-left">
                        <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                            <Bookmark size={16} /> Filtros salvos
                        </h4>
                        {openGroups['filtrosSalvos'] ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />}
                    </button>
                    {openGroups['filtrosSalvos'] && <div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder-gray-500 outline-none focus:border-blue-500"
                            placeholder="Ex.: Cidade Porto Alegre"
                            value={presetName}
                            onChange={e => setPresetName(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                const name = presetName.trim();
                                if (!name) return;
                                const preset = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name, filters: { ...filters } };
                                const next = [...savedPresets, preset];
                                setSavedPresets(next);
                                try {
                                    localStorage.setItem(SAVED_FILTER_PRESETS_KEY, JSON.stringify(next));
                                } catch (e) {
                                    console.warn('Erro ao salvar preset', e);
                                }
                                setPresetName('');
                            }}
                            disabled={!presetName.trim()}
                            className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                            <Save size={14} /> Salvar como
                        </button>
                    </div>
                    {savedPresets.length > 0 && (
                        <ul className="space-y-2 max-h-40 overflow-y-auto">
                            {savedPresets.map(p => (
                                <li key={p.id} className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg px-3 py-2 border border-border">
                                    <span className="text-sm text-foreground truncate flex-1">{p.name}</span>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => { setFilters(p.filters); onClose?.(); }}
                                            className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                        >
                                            Aplicar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const next = savedPresets.filter(x => x.id !== p.id);
                                                setSavedPresets(next);
                                                try {
                                                    localStorage.setItem(SAVED_FILTER_PRESETS_KEY, JSON.stringify(next));
                                                } catch (e) {
                                                    console.warn('Erro ao excluir preset', e);
                                                }
                                            }}
                                            className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded"
                                            title="Excluir"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    </div>}
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
                    <button onClick={onClose} className="flex-1 bg-blue-600 text-white py-1.5 rounded text-sm font-medium hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors">Aplicar Filtros</button>
                    <button onClick={clearFilters} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded hover:bg-muted transition-colors">Limpar</button>
                    <button
                        onClick={() => {
                            try {
                                localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
                            } catch (e) {
                                console.warn('Erro ao salvar filtros', e);
                            }
                        }}
                        className="px-3 py-1.5 text-xs text-muted-foreground hover:text-white rounded hover:bg-muted transition-colors"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </>
    );
};

export default FilterSidebar;
