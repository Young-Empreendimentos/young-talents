import React, { useState, useEffect, useMemo } from 'react';
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Search, Save, Trash2, Bookmark } from 'lucide-react';
import { PIPELINE_STAGES, CLOSING_STATUSES, FILTER_STORAGE_KEY, SAVED_FILTER_PRESETS_KEY } from '../constants';

const loadSavedPresets = () => {
    try {
        const raw = localStorage.getItem(SAVED_FILTER_PRESETS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
};

// Componente de seção de filtro colapsável
const FilterSection = ({ title, count, defaultOpen = false, children }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-border/60">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-3 px-1 group">
                <span className="text-[13px] font-semibold text-foreground group-hover:text-brand-orange transition-colors">
                    {title}
                    {count > 0 && <span className="ml-1.5 bg-brand-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{count}</span>}
                </span>
                {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
            </button>
            {open && <div className="pb-3 px-1">{children}</div>}
        </div>
    );
};

// Lista de checkboxes com busca opcional
const CheckboxList = ({ options, selected, onToggle, onClear, searchable = false, placeholder = 'Buscar...' }) => {
    const [search, setSearch] = useState('');
    const filtered = useMemo(() => {
        if (!search) return options;
        const s = search.toLowerCase();
        return options.filter(o => o.name.toLowerCase().includes(s));
    }, [options, search]);

    const selectedSet = useMemo(() => new Set(Array.isArray(selected) ? selected : []), [selected]);
    const allSelected = filtered.length > 0 && filtered.every(o => selectedSet.has(o.name));

    return (
        <div className="space-y-1.5">
            {searchable && options.length > 6 && (
                <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                    <input
                        type="text"
                        className="w-full bg-background border border-border rounded-lg pl-8 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-brand-orange/30 focus:border-brand-orange"
                        placeholder={placeholder}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground">
                            <X size={12} />
                        </button>
                    )}
                </div>
            )}

            {filtered.length > 1 && (
                <div className="flex gap-1.5">
                    <button
                        onClick={() => {
                            const names = filtered.map(o => o.name);
                            const current = Array.isArray(selected) ? selected : [];
                            if (allSelected) {
                                onToggle(current.filter(v => !names.includes(v)));
                            } else {
                                onToggle([...new Set([...current, ...names])]);
                            }
                        }}
                        className="text-[10px] text-brand-orange hover:underline font-medium"
                    >
                        {allSelected ? 'Desmarcar todos' : `Marcar todos (${filtered.length})`}
                    </button>
                    {selectedSet.size > 0 && (
                        <>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <button onClick={() => onClear()} className="text-[10px] text-muted-foreground hover:text-foreground hover:underline">
                                Limpar
                            </button>
                        </>
                    )}
                </div>
            )}

            <div className="max-h-40 overflow-y-auto space-y-0.5 custom-scrollbar">
                {filtered.map(o => (
                    <label key={o.id ?? o.name} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/60 cursor-pointer text-xs transition-colors">
                        <input
                            type="checkbox"
                            checked={selectedSet.has(o.name)}
                            onChange={() => {
                                const current = Array.isArray(selected) ? selected : [];
                                if (selectedSet.has(o.name)) {
                                    onToggle(current.filter(v => v !== o.name));
                                } else {
                                    onToggle([...current, o.name]);
                                }
                            }}
                            className="accent-brand-orange w-3.5 h-3.5 rounded"
                        />
                        <span className="text-foreground truncate">{o.name}</span>
                    </label>
                ))}
                {search && filtered.length === 0 && (
                    <p className="text-[11px] text-muted-foreground italic px-2 py-1">Nenhum resultado</p>
                )}
            </div>
        </div>
    );
};

const FilterSidebar = ({ isOpen, onClose, filters, setFilters, clearFilters, options, candidates = [] }) => {
    const [savedPresets, setSavedPresets] = useState(loadSavedPresets);
    const [presetName, setPresetName] = useState('');
    const [showCustomPeriod, setShowCustomPeriod] = useState(filters.createdAtPreset === 'custom');

    useEffect(() => { setShowCustomPeriod(filters.createdAtPreset === 'custom'); }, [filters.createdAtPreset]);
    useEffect(() => { if (isOpen) setSavedPresets(loadSavedPresets()); }, [isOpen]);

    // Helpers
    const sort = (arr) => [...arr].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));

    const getSelected = (key) => {
        if (!filters[key] || filters[key] === 'all') return [];
        return Array.isArray(filters[key]) ? filters[key] : [filters[key]];
    };

    const setSelected = (key, values) => {
        setFilters(prev => ({ ...prev, [key]: values.length > 0 ? values : 'all' }));
    };

    // Opções derivadas dos candidatos + sistema
    const cityOptions = useMemo(() => {
        const fromCandidates = candidates.map(c => c.city).filter(Boolean);
        const fromSystem = (options.cities || []).map(c => c.name);
        return sort([...new Set([...fromCandidates, ...fromSystem])].map((n, i) => ({ id: i, name: n })));
    }, [candidates, options.cities]);

    const areaOptions = useMemo(() => {
        const raw = candidates.flatMap(c => typeof c.interestAreas === 'string' ? c.interestAreas.split(',').map(s => s.trim()) : c.interestAreas ? [c.interestAreas] : []);
        const fromSystem = (options.interestAreas || []).map(a => a.name);
        return sort([...new Set([...raw.filter(Boolean), ...fromSystem])].map((n, i) => ({ id: i, name: n })));
    }, [candidates, options.interestAreas]);

    const sourceOptions = useMemo(() => {
        const fromCandidates = candidates.map(c => c.source).filter(Boolean);
        return sort([...new Set(fromCandidates)].map((n, i) => ({ id: i, name: n })));
    }, [candidates]);

    const schoolingOptions = useMemo(() => {
        const fromCandidates = candidates.map(c => c.schoolingLevel).filter(Boolean);
        return sort([...new Set(fromCandidates)].map((n, i) => ({ id: i, name: n })));
    }, [candidates]);

    const maritalOptions = useMemo(() => {
        const fromCandidates = candidates.map(c => c.maritalStatus).filter(Boolean);
        return sort([...new Set(fromCandidates)].map((n, i) => ({ id: i, name: n })));
    }, [candidates]);

    const tagOptions = useMemo(() => {
        const allTags = new Set();
        candidates.forEach(c => {
            if (Array.isArray(c.tags)) c.tags.forEach(t => allTags.add(t));
            if (c.importTag) allTags.add(c.importTag);
        });
        return sort([...allTags].map((t, i) => ({ id: i, name: t })));
    }, [candidates]);

    const statusOptions = useMemo(() => [
        ...PIPELINE_STAGES.map(s => ({ id: s, name: s })),
        ...CLOSING_STATUSES.map(s => ({ id: s, name: s })),
    ], []);

    // Contagem de filtros ativos por seção
    const countActive = (...keys) => keys.reduce((n, k) => n + (getSelected(k).length > 0 ? 1 : 0), 0);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={onClose} />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 w-[340px] sm:w-[380px] bg-card border-l border-border z-50 shadow-2xl flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-5 h-14 border-b border-border flex-shrink-0">
                    <h3 className="font-bold text-foreground text-[15px] flex items-center gap-2">
                        <SlidersHorizontal size={17} className="text-brand-orange" /> Filtros
                    </h3>
                    <div className="flex items-center gap-2">
                        <button onClick={clearFilters} className="text-[11px] text-muted-foreground hover:text-foreground hover:underline">Limpar</button>
                        <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                            <X size={16} className="text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-2 custom-scrollbar">

                    {/* Período */}
                    <FilterSection title="Período" count={filters.createdAtPreset !== 'all' && filters.createdAtPreset ? 1 : 0} defaultOpen>
                        <select
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-brand-orange/30 focus:border-brand-orange"
                            value={filters.createdAtPreset || 'all'}
                            onChange={e => {
                                setFilters(prev => ({ ...prev, createdAtPreset: e.target.value, customDateStart: '', customDateEnd: '' }));
                            }}
                        >
                            <option value="all">Qualquer data</option>
                            <option value="today">Hoje</option>
                            <option value="yesterday">Ontem</option>
                            <option value="7d">Últimos 7 dias</option>
                            <option value="30d">Últimos 30 dias</option>
                            <option value="90d">Últimos 90 dias</option>
                            <option value="custom">Personalizado</option>
                        </select>
                        {showCustomPeriod && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                    <label className="text-[10px] text-muted-foreground mb-0.5 block">Início</label>
                                    <input type="date" className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-brand-orange/30" value={filters.customDateStart || ''} onChange={e => setFilters(prev => ({ ...prev, customDateStart: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-muted-foreground mb-0.5 block">Fim</label>
                                    <input type="date" className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-brand-orange/30" value={filters.customDateEnd || ''} onChange={e => setFilters(prev => ({ ...prev, customDateEnd: e.target.value }))} />
                                </div>
                            </div>
                        )}
                    </FilterSection>

                    {/* Status */}
                    <FilterSection title="Status / Etapa" count={countActive('status')} defaultOpen>
                        <CheckboxList
                            options={statusOptions}
                            selected={getSelected('status')}
                            onToggle={v => setSelected('status', v)}
                            onClear={() => setSelected('status', [])}
                        />
                    </FilterSection>

                    {/* Vaga */}
                    <FilterSection title="Vaga" count={countActive('jobId')}>
                        <CheckboxList
                            options={(options.jobs || []).map(j => ({ id: j.id, name: j.title || j.id }))}
                            selected={getSelected('jobId')}
                            onToggle={v => setSelected('jobId', v)}
                            onClear={() => setSelected('jobId', [])}
                            searchable
                            placeholder="Buscar vaga..."
                        />
                    </FilterSection>

                    {/* Cidade */}
                    <FilterSection title="Cidade" count={countActive('city')}>
                        <CheckboxList
                            options={cityOptions}
                            selected={getSelected('city')}
                            onToggle={v => setSelected('city', v)}
                            onClear={() => setSelected('city', [])}
                            searchable
                            placeholder="Buscar cidade..."
                        />
                    </FilterSection>

                    {/* Área de Interesse */}
                    <FilterSection title="Área de Interesse" count={countActive('interestArea')}>
                        <CheckboxList
                            options={areaOptions}
                            selected={getSelected('interestArea')}
                            onToggle={v => setSelected('interestArea', v)}
                            onClear={() => setSelected('interestArea', [])}
                            searchable
                            placeholder="Buscar área..."
                        />
                    </FilterSection>

                    {/* Fonte / Origem */}
                    {sourceOptions.length > 0 && (
                        <FilterSection title="Fonte / Origem" count={countActive('origin')}>
                            <CheckboxList
                                options={sourceOptions}
                                selected={getSelected('origin')}
                                onToggle={v => setSelected('origin', v)}
                                onClear={() => setSelected('origin', [])}
                                searchable
                                placeholder="Buscar fonte..."
                            />
                        </FilterSection>
                    )}

                    {/* Escolaridade */}
                    {schoolingOptions.length > 0 && (
                        <FilterSection title="Escolaridade" count={countActive('schooling')}>
                            <CheckboxList
                                options={schoolingOptions}
                                selected={getSelected('schooling')}
                                onToggle={v => setSelected('schooling', v)}
                                onClear={() => setSelected('schooling', [])}
                            />
                        </FilterSection>
                    )}

                    {/* Estado Civil */}
                    {maritalOptions.length > 0 && (
                        <FilterSection title="Estado Civil" count={countActive('marital')}>
                            <CheckboxList
                                options={maritalOptions}
                                selected={getSelected('marital')}
                                onToggle={v => setSelected('marital', v)}
                                onClear={() => setSelected('marital', [])}
                            />
                        </FilterSection>
                    )}

                    {/* CNH */}
                    <FilterSection title="CNH" count={countActive('cnh')}>
                        <CheckboxList
                            options={[{ id: 'sim', name: 'Sim' }, { id: 'nao', name: 'Não' }]}
                            selected={getSelected('cnh')}
                            onToggle={v => setSelected('cnh', v)}
                            onClear={() => setSelected('cnh', [])}
                        />
                    </FilterSection>

                    {/* Idade */}
                    <FilterSection title="Idade" count={(filters.ageMin && filters.ageMin !== 'all' ? 1 : 0) + (filters.ageMax && filters.ageMax !== 'all' ? 1 : 0)}>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] text-muted-foreground mb-0.5 block">Mínima</label>
                                <input type="number" min={0} max={120} placeholder="18" className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-brand-orange/30" value={filters.ageMin === 'all' || !filters.ageMin ? '' : filters.ageMin} onChange={e => setFilters(prev => ({ ...prev, ageMin: e.target.value || 'all' }))} />
                            </div>
                            <div>
                                <label className="text-[10px] text-muted-foreground mb-0.5 block">Máxima</label>
                                <input type="number" min={0} max={120} placeholder="45" className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-brand-orange/30" value={filters.ageMax === 'all' || !filters.ageMax ? '' : filters.ageMax} onChange={e => setFilters(prev => ({ ...prev, ageMax: e.target.value || 'all' }))} />
                            </div>
                        </div>
                    </FilterSection>

                    {/* Tags */}
                    {tagOptions.length > 0 && (
                        <FilterSection title="Tags" count={countActive('tags')}>
                            <CheckboxList
                                options={tagOptions}
                                selected={getSelected('tags')}
                                onToggle={v => setSelected('tags', v)}
                                onClear={() => setSelected('tags', [])}
                                searchable
                                placeholder="Buscar tag..."
                            />
                        </FilterSection>
                    )}

                    {/* Filtros Salvos */}
                    <FilterSection title="Filtros Salvos" count={0}>
                        <div className="space-y-2">
                            <div className="flex gap-1.5">
                                <input
                                    type="text"
                                    className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-brand-orange/30"
                                    placeholder="Nome do preset..."
                                    value={presetName}
                                    onChange={e => setPresetName(e.target.value)}
                                />
                                <button
                                    onClick={() => {
                                        const name = presetName.trim();
                                        if (!name) return;
                                        const preset = { id: `${Date.now()}`, name, filters: { ...filters } };
                                        const next = [...savedPresets, preset];
                                        setSavedPresets(next);
                                        try { localStorage.setItem(SAVED_FILTER_PRESETS_KEY, JSON.stringify(next)); } catch {}
                                        setPresetName('');
                                    }}
                                    disabled={!presetName.trim()}
                                    className="px-2 py-1.5 bg-brand-orange text-white rounded-lg text-[11px] font-medium hover:bg-brand-orange/90 disabled:opacity-40 flex items-center gap-1"
                                >
                                    <Save size={12} /> Salvar
                                </button>
                            </div>
                            {savedPresets.length > 0 && (
                                <div className="space-y-1">
                                    {savedPresets.map(p => (
                                        <div key={p.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-muted/50 rounded-lg">
                                            <span className="text-xs text-foreground truncate">{p.name}</span>
                                            <div className="flex gap-1 flex-shrink-0">
                                                <button onClick={() => { setFilters(p.filters); onClose?.(); }} className="text-[10px] text-brand-orange hover:underline font-medium">Aplicar</button>
                                                <button onClick={() => {
                                                    const next = savedPresets.filter(x => x.id !== p.id);
                                                    setSavedPresets(next);
                                                    try { localStorage.setItem(SAVED_FILTER_PRESETS_KEY, JSON.stringify(next)); } catch {}
                                                }} className="p-0.5 text-muted-foreground hover:text-red-500"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </FilterSection>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-border flex-shrink-0 flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-brand-orange text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-orange/90 transition-colors"
                    >
                        Aplicar Filtros
                    </button>
                    <button
                        onClick={() => { clearFilters(); }}
                        className="px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                        Limpar
                    </button>
                </div>
            </div>
        </>
    );
};

export default FilterSidebar;
