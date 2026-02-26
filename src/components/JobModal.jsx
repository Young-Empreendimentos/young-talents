import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, ChevronLeft, ChevronDown, ChevronUp, Plus, Edit3, Trash2, ExternalLink, FileText } from 'lucide-react';
import { JOB_STATUSES, POSTING_CHANNELS } from '../constants';
import InputField from './InputField';
import UrlField from './UrlField';

const JobModal = ({ isOpen, job, onClose, onSave, options, isSaving, candidates = [], isPageMode = false }) => {
    const [d, setD] = useState(() => {
        if (job?.id) {
            return { ...job };
        }
        return {
            title: '',
            code: '',
            company: '',
            city: '',
            interestArea: '',
            sector: '',
            position: '',
            function: '',
            status: 'Aberta',
            contractType: 'CLT',
            workModel: 'Presencial',
            vacancies: 1,
            priority: 'Média',
            description: '',
            requirements: '',
            benefits: '',
            salaryRange: '',
            workload: '',
            deadline: '',
            recruiter: '',
            hiringManager: '',
            approvedBy: '',
            postingChannels: { selected: [], faculdade: '', agencia: '', outro: '' }
        };
    });
    const [showNewCompany, setShowNewCompany] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState('');
    const [newCompanyCity, setNewCompanyCity] = useState('');
    const [showNewCity, setShowNewCity] = useState(false);
    const [newCityName, setNewCityName] = useState('');
    const [showNewSector, setShowNewSector] = useState(false);
    const [newSectorName, setNewSectorName] = useState('');
    const [showNewPosition, setShowNewPosition] = useState(false);
    const [newPositionName, setNewPositionName] = useState('');
    const [newPositionLevel, setNewPositionLevel] = useState('');
    const [showOptionalFields, setShowOptionalFields] = useState(false);

    // Setores, cargos e funções vêm de options (App já carrega do Supabase)
    const sectors = options?.sectors ?? [];
    const positions = options?.roles ?? [];
    const functions = options?.functions ?? [];

    // Inicialização do formulário apenas quando job ou isOpen mudam (evita reset ao escolher empresa/cidade)
    useEffect(() => {
        if (job?.id) {
            const pc = job.postingChannels;
            const postingChannels = pc && typeof pc === 'object'
                ? {
                    selected: Array.isArray(pc.selected) ? pc.selected : (pc.channels ? [...pc.channels] : []),
                    faculdade: pc.faculdade ?? '',
                    agencia: pc.agencia ?? '',
                    outro: pc.outro ?? ''
                }
                : { selected: [], faculdade: '', agencia: '', outro: '' };
            setD({ ...job, postingChannels });
        } else {
            setD({
                title: '', code: '', company: '', city: '', interestArea: '',
                sector: '', position: '', function: '',
                status: 'Aberta', contractType: 'CLT', workModel: 'Presencial',
                vacancies: 1, priority: 'Média',
                description: '', requirements: '', benefits: '', salaryRange: '',
                workload: '', deadline: '', recruiter: '', hiringManager: '', approvedBy: '',
                postingChannels: { selected: [], faculdade: '', agencia: '', outro: '' }
            });
        }
        setShowNewCompany(false);
        setShowNewCity(false);
        setShowNewSector(false);
        setShowNewPosition(false);
        setShowOptionalFields(false);
    }, [job, isOpen]);

    const handleCreateCompany = async () => {
        if (!newCompanyName.trim()) {
            alert('Digite o nome da empresa');
            return;
        }
        try {
            const newCompany = {
                name: newCompanyName.trim(),
                city: newCompanyCity || '',
                createdAt: new Date().toISOString(),
                createdBy: options.user?.email || 'system'
            };
            // TODO: Migrar para Supabase
            console.log('Create company:', newCompany);
            setD({ ...d, company: newCompanyName.trim(), city: newCompanyCity || d.city });
            setShowNewCompany(false);
            setNewCompanyName('');
            setNewCompanyCity('');
            alert('Empresa criada com sucesso!');
        } catch (error) {
            console.error('Erro ao criar empresa:', error);
            alert('Erro ao criar empresa');
        }
    };

    const handleCreateCity = async () => {
        if (!newCityName.trim()) {
            alert('Digite o nome da cidade');
            return;
        }
        try {
            const newCity = {
                name: newCityName.trim(),
                createdAt: new Date().toISOString(),
                createdBy: options.user?.email || 'system'
            };
            // TODO: Migrar para Supabase
            console.log('Create city:', newCity);
            setD({ ...d, city: newCityName.trim() });
            setShowNewCity(false);
            setNewCityName('');
            alert('Cidade criada com sucesso!');
        } catch (error) {
            console.error('Erro ao criar cidade:', error);
            alert('Erro ao criar cidade');
        }
    };

    const handleCreateSector = async () => {
        if (!newSectorName.trim()) {
            alert('Digite o nome do setor');
            return;
        }
        const ok = options.onCreateSector ? await options.onCreateSector({ name: newSectorName.trim() }) : false;
        if (ok) {
            const current = (d.sector || '').split(',').map(x => x.trim()).filter(Boolean);
            const next = current.includes(newSectorName.trim()) ? current : [...current, newSectorName.trim()];
            setD({ ...d, sector: next.join(', ') });
            setShowNewSector(false);
            setNewSectorName('');
        }
    };

    const handleCreatePosition = async () => {
        if (!newPositionName.trim()) {
            alert('Digite o nome do cargo');
            return;
        }
        const ok = options.onCreatePosition ? await options.onCreatePosition({ name: newPositionName.trim(), level: newPositionLevel?.trim() || null }) : false;
        if (ok) {
            const current = (d.position || '').split(',').map(x => x.trim()).filter(Boolean);
            const next = current.includes(newPositionName.trim()) ? current : [...current, newPositionName.trim()];
            setD({ ...d, position: next.join(', ') });
            setShowNewPosition(false);
            setNewPositionName('');
            setNewPositionLevel('');
        }
    };

    // Auto-preenche cidade quando empresa muda
    useEffect(() => {
        if (d.company && !d.city) {
            const selectedCompany = (options?.companies ?? []).find(c => c.name === d.company);
            if (selectedCompany?.city) {
                setD(prev => ({ ...prev, city: selectedCompany.city }));
            }
        }
    }, [d.company, options?.companies]);

    // Buscar cidades únicas dos candidatos cadastrados
    const candidateCities = useMemo(() => {
        const citiesSet = new Set();
        candidates.forEach(c => {
            if (c.city && c.city.trim()) {
                citiesSet.add(c.city.trim());
            }
        });
        return Array.from(citiesSet).sort();
    }, [candidates]);

    // Buscar áreas de interesse únicas dos candidatos cadastrados
    const candidateInterestAreas = useMemo(() => {
        const areasSet = new Set();
        candidates.forEach(c => {
            if (c.interestAreas) {
                // interestAreas pode ser string separada por vírgula ou array
                const areas = typeof c.interestAreas === 'string'
                    ? c.interestAreas.split(',').map(a => a.trim()).filter(Boolean)
                    : Array.isArray(c.interestAreas) ? c.interestAreas : [];
                areas.forEach(area => {
                    if (area && area.trim()) {
                        areasSet.add(area.trim());
                    }
                });
            }
        });
        return Array.from(areasSet).sort();
    }, [candidates]);

    if (!isOpen && !isPageMode) return null;

    // Lista de usuários para seleção de recrutador
    const availableRecruiters = options?.userRoles ?? [];

    const formContent = (
        <>
            <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 ${isPageMode ? 'rounded-t-xl' : ''}`}>
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">{d.id ? 'Editar' : 'Nova'} Vaga</h3>
                <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white flex items-center gap-2">
                    {isPageMode ? <><ChevronLeft size={20} /> Voltar</> : <X size={20} />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                {/* Campos Principais em Destaque */}
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">Informações Principais</h4>

                    {/* Título / Nome da vaga */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Título da vaga</label>
                        <input
                            type="text"
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Ex.: Cargo - Empresa"
                            value={d.title || ''}
                            onChange={e => setD({ ...d, title: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Nome exibido na lista de vagas. Se vazio, será gerado a partir do cargo e empresa ao salvar.</p>
                    </div>

                    {/* Empresa */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Empresa *</label>
                        <div className="flex gap-2">
                            <select
                                className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                value={d.company || ''}
                                onChange={e => setD({ ...d, company: e.target.value })}
                            >
                                <option value="">Selecione uma empresa...</option>
                                {(options?.companies ?? []).map(c => (
                                    <option key={c.id} value={c.name}>{c.name} {c.city ? `- ${c.city}` : ''}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => setShowNewCompany(!showNewCompany)}
                                className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                            >
                                <Plus size={16} className="inline mr-1" /> Nova
                            </button>
                        </div>
                        {showNewCompany && (
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2">
                                <input
                                    type="text"
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                    placeholder="Nome da empresa/unidade"
                                    value={newCompanyName}
                                    onChange={e => setNewCompanyName(e.target.value)}
                                />
                                <select
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                    value={newCompanyCity}
                                    onChange={e => setNewCompanyCity(e.target.value)}
                                >
                                    <option value="">Cidade (opcional)</option>
                                    {(options?.cities ?? []).map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                                <div className="flex gap-2">
                                    <button onClick={handleCreateCompany} className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700">Criar</button>
                                    <button onClick={() => setShowNewCompany(false)} className="px-3 py-1.5 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200">Cancelar</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cidade (auto-preenchida da empresa) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Cidade *</label>
                        <div className="flex gap-2">
                            <select
                                className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                value={d.city || ''}
                                onChange={e => setD({ ...d, city: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {candidateCities.length > 0 && (
                                    <optgroup label="Cidades dos Candidatos">
                                        {candidateCities.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </optgroup>
                                )}
                                {(options?.cities ?? []).length > 0 && (
                                    <optgroup label="Cidades Cadastradas">
                                        {(options?.cities ?? []).map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                            <button
                                onClick={() => setShowNewCity(!showNewCity)}
                                className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                            >
                                <Plus size={16} className="inline mr-1" /> Nova
                            </button>
                        </div>
                        {showNewCity && (
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2">
                                <input
                                    type="text"
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                    placeholder="Nome da cidade"
                                    value={newCityName}
                                    onChange={e => setNewCityName(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleCreateCity} className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700">Criar</button>
                                    <button onClick={() => setShowNewCity(false)} className="px-3 py-1.5 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200">Cancelar</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Setor (multi-seleção) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Setor</label>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                            {sectors.map(s => {
                                const selectedNames = (d.sector || '').split(',').map(x => x.trim()).filter(Boolean);
                                const isChecked = selectedNames.includes(s.name);
                                return (
                                    <label key={s.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {
                                                const next = isChecked ? selectedNames.filter(n => n !== s.name) : [...selectedNames, s.name];
                                                setD({ ...d, sector: next.join(', ') });
                                            }}
                                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>{s.name}</span>
                                    </label>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => setShowNewSector(!showNewSector)}
                                className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors whitespace-nowrap"
                            >
                                <Plus size={14} className="inline mr-1" /> Novo
                            </button>
                        </div>
                        {showNewSector && (
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2">
                                <input
                                    type="text"
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                    placeholder="Nome do setor"
                                    value={newSectorName}
                                    onChange={e => setNewSectorName(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleCreateSector} className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700">Criar</button>
                                    <button onClick={() => setShowNewSector(false)} className="px-3 py-1.5 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200">Cancelar</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cargo (multi-seleção) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Cargo</label>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                            {positions.map(p => {
                                const selectedNames = (d.position || '').split(',').map(x => x.trim()).filter(Boolean);
                                const isChecked = selectedNames.includes(p.name);
                                return (
                                    <label key={p.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {
                                                const next = isChecked ? selectedNames.filter(n => n !== p.name) : [...selectedNames, p.name];
                                                setD({ ...d, position: next.join(', ') });
                                            }}
                                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>{p.name}{p.level ? ` (${p.level})` : ''}</span>
                                    </label>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => setShowNewPosition(!showNewPosition)}
                                className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors whitespace-nowrap"
                            >
                                <Plus size={14} className="inline mr-1" /> Novo
                            </button>
                        </div>
                        {showNewPosition && (
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2">
                                <input
                                    type="text"
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                    placeholder="Nome do cargo"
                                    value={newPositionName}
                                    onChange={e => setNewPositionName(e.target.value)}
                                />
                                <input
                                    type="text"
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                    placeholder="Nível (opcional, ex: Júnior, Pleno, Sênior)"
                                    value={newPositionLevel}
                                    onChange={e => setNewPositionLevel(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleCreatePosition} className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700">Criar</button>
                                    <button onClick={() => setShowNewPosition(false)} className="px-3 py-1.5 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200">Cancelar</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Prazo */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Prazo para Preenchimento</label>
                        <input
                            type="date"
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={d.deadline || ''}
                            onChange={e => setD({ ...d, deadline: e.target.value })}
                        />
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Observações</label>
                        <textarea
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-24 resize-none"
                            placeholder="Informações adicionais sobre a vaga..."
                            value={d.description || ''}
                            onChange={e => setD({ ...d, description: e.target.value })}
                        />
                    </div>

                    {/* Recrutador Responsável */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Recrutador Responsável</label>
                        <select
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={d.recruiter || ''}
                            onChange={e => setD({ ...d, recruiter: e.target.value })}
                        >
                            <option value="">Selecione um recrutador...</option>
                            {availableRecruiters.map(u => (
                                <option key={u.email || u.id} value={u.email || ''}>{u.name || u.email || '—'}</option>
                            ))}
                        </select>
                    </div>

                    {/* Quem autorizou a abertura */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Quem autorizou a abertura</label>
                        <select
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={d.approvedBy || ''}
                            onChange={e => setD({ ...d, approvedBy: e.target.value })}
                        >
                            <option value="">Selecione quem autorizou...</option>
                            {availableRecruiters.map(u => (
                                <option key={u.email || u.id} value={u.email || ''}>{u.name || u.email || '—'}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Responsável pela solicitação e aprovação da vaga (não quem abre no sistema).</p>
                    </div>

                    {/* Onde a vaga será divulgada */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Onde a vaga será divulgada</label>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {POSTING_CHANNELS.map(ch => {
                                const selected = Array.isArray(d.postingChannels?.selected) ? d.postingChannels.selected : [];
                                const isChecked = selected.includes(ch.id);
                                return (
                                    <div key={ch.id} className="flex items-center gap-2 flex-wrap">
                                        <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => {
                                                    const next = isChecked ? selected.filter(x => x !== ch.id) : [...selected, ch.id];
                                                    setD({ ...d, postingChannels: { ...d.postingChannels, selected: next } });
                                                }}
                                                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>{ch.label}</span>
                                        </label>
                                        {ch.hasCustomText && isChecked && (
                                            <input
                                                type="text"
                                                placeholder={ch.customKey === 'faculdade' ? 'Ex: USP' : ch.customKey === 'agencia' ? 'Ex: Nome da agência' : 'Especifique'}
                                                className="ml-1 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                                value={(d.postingChannels && d.postingChannels[ch.customKey]) || ''}
                                                onChange={e => setD({ ...d, postingChannels: { ...d.postingChannels, [ch.customKey]: e.target.value } })}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Campos Opcionais Colapsados */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <button
                        onClick={() => setShowOptionalFields(!showOptionalFields)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        {showOptionalFields ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        Campos Opcionais
                    </button>

                    {showOptionalFields && (
                        <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Código da Vaga</label>
                                    <input
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="Ex: VAG-2024-001"
                                        value={d.code || ''}
                                        onChange={e => setD({ ...d, code: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Status</label>
                                    <select
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        value={d.status || 'Aberta'}
                                        onChange={e => setD({ ...d, status: e.target.value })}
                                    >
                                        {JOB_STATUSES.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Área de Interesse</label>
                                    <select
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        value={d.interestArea || ''}
                                        onChange={e => setD({ ...d, interestArea: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {candidateInterestAreas.length > 0 && (
                                            <optgroup label="Áreas dos Candidatos">
                                                {candidateInterestAreas.map(area => (
                                                    <option key={area} value={area}>{area}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                        {(options?.interestAreas ?? []).length > 0 && (
                                            <optgroup label="Áreas Cadastradas">
                                                {(options?.interestAreas ?? []).map(area => (
                                                    <option key={area.id} value={area.name}>{area.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Função</label>
                                    <select
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        value={d.function || ''}
                                        onChange={e => setD({ ...d, function: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {functions.map(f => (
                                            <option key={f.id} value={f.name}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Nº de Vagas</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        value={d.vacancies || 1}
                                        onChange={e => setD({ ...d, vacancies: parseInt(e.target.value) || 1 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Prioridade</label>
                                    <select
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        value={d.priority || 'Média'}
                                        onChange={e => setD({ ...d, priority: e.target.value })}
                                    >
                                        <option value="Alta">🔴 Alta</option>
                                        <option value="Média">🟡 Média</option>
                                        <option value="Baixa">🟢 Baixa</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Tipo de Contrato</label>
                                    <select
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        value={d.contractType || 'CLT'}
                                        onChange={e => setD({ ...d, contractType: e.target.value })}
                                    >
                                        <option value="CLT">CLT</option>
                                        <option value="PJ">PJ</option>
                                        <option value="Estágio">Estágio</option>
                                        <option value="Temporário">Temporário</option>
                                        <option value="Trainee">Trainee</option>
                                        <option value="Freelancer">Freelancer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Modelo de Trabalho</label>
                                    <select
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        value={d.workModel || 'Presencial'}
                                        onChange={e => setD({ ...d, workModel: e.target.value })}
                                    >
                                        <option value="Presencial">Presencial</option>
                                        <option value="Híbrido">Híbrido</option>
                                        <option value="Remoto">Remoto</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Carga Horária</label>
                                    <input
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="Ex: 44h semanais"
                                        value={d.workload || ''}
                                        onChange={e => setD({ ...d, workload: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Faixa Salarial</label>
                                    <input
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="Ex: R$ 3.000 - R$ 5.000"
                                        value={d.salaryRange || ''}
                                        onChange={e => setD({ ...d, salaryRange: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Gestor Contratante</label>
                                    <input
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="Nome do gestor"
                                        value={d.hiringManager || ''}
                                        onChange={e => setD({ ...d, hiringManager: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Requisitos</label>
                                <textarea
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-24 resize-none"
                                    placeholder="Requisitos e qualificações..."
                                    value={d.requirements || ''}
                                    onChange={e => setD({ ...d, requirements: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Benefícios</label>
                                <textarea
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-20 resize-none"
                                    placeholder="VT, VR, Plano de Saúde..."
                                    value={d.benefits || ''}
                                    onChange={e => setD({ ...d, benefits: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 bg-gray-50 dark:bg-gray-900/50">
                <button onClick={onClose} className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Cancelar</button>
                <button
                    onClick={() => {
                        const company = (d.company || '').toString().trim();
                        const city = (d.city || '').toString().trim();
                        if (!company || !city) {
                            alert('Preencha os campos obrigatórios: Empresa e Cidade');
                            return;
                        }
                        const toSave = { ...d, company, city };
                        if (!toSave.title && toSave.position && toSave.company) {
                            toSave.title = `${toSave.position} - ${toSave.company}`;
                        } else if (!toSave.title) {
                            toSave.title = `Vaga - ${toSave.company}`;
                        }
                        onSave(toSave);
                    }}
                    disabled={isSaving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
            </div>
        </>
    );

    if (isPageMode) {
        return (
            <div className="p-6 bg-white dark:bg-gray-900 min-h-full">
                <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col shadow-lg">
                    {formContent}
                </div>
            </div>
        );
    }
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] border border-gray-200 dark:border-gray-700 flex flex-col shadow-2xl">
                {formContent}
            </div>
        </div>
    );
};

export default JobModal;
