import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, History, X, AlertCircle, Info, Trophy, CalendarCheck, Plus } from 'lucide-react';
import { PIPELINE_STAGES, CLOSING_STATUSES, STATUS_COLORS } from '../constants';
import InputField from './InputField';
import UrlField from './UrlField';
import { validateCandidate, checkDuplicateEmail } from '../utils/validation';
import { normalizeCity, getMainCitiesOptions } from '../utils/cityNormalizer';
import { normalizeSource, getMainSourcesOptions } from '../utils/sourceNormalizer';
import { normalizeInterestAreasString, getMainInterestAreasOptions } from '../utils/interestAreaNormalizer';
import { getCandidateTimestamp } from '../utils/timestampUtils';
import { CHILDREN_OPTIONS, normalizeChildrenForStorage } from '../utils/childrenNormalizer';

const CandidateModal = ({ candidate, onClose, onSave, options, isSaving, onAdvanceStage, statusMovements = [], onAddNote, interviews = [], onScheduleInterview, allCandidates = [], applications = [], onCreateApplication, jobs = [] }) => {
    // Normaliza cidade ao carregar candidato
    const normalizedCandidate = candidate?.city ? { ...candidate, city: normalizeCity(candidate.city) } : candidate;
    const [d, setD] = useState({ ...normalizedCandidate });
    const [activeSection, setActiveSection] = useState('pessoal');
    const [newNote, setNewNote] = useState('');
    const [savingNote, setSavingNote] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [validationWarnings, setValidationWarnings] = useState({});
    const [showValidationSummary, setShowValidationSummary] = useState(false);
    const [showLinkJobDropdown, setShowLinkJobDropdown] = useState(false);
    const [linkJobSelectedId, setLinkJobSelectedId] = useState('');

    // Filtrar movimentações deste candidato
    const candidateMovements = useMemo(() => {
        if (!candidate?.id) return [];
        return statusMovements
            .filter(m => m.candidateId === candidate.id)
            .sort((a, b) => {
                const timeA = a.timestamp?.seconds || a.timestamp?._seconds || 0;
                const timeB = b.timestamp?.seconds || b.timestamp?._seconds || 0;
                return timeB - timeA; // Mais recente primeiro
            });
    }, [statusMovements, candidate?.id]);

    // Notas do candidato
    const candidateNotes = useMemo(() => {
        return (d.notes || []).sort((a, b) => {
            const timeA = a.timestamp?.seconds || a.timestamp?._seconds || new Date(a.timestamp).getTime() / 1000 || 0;
            const timeB = b.timestamp?.seconds || b.timestamp?._seconds || new Date(b.timestamp).getTime() / 1000 || 0;
            return timeB - timeA;
        });
    }, [d.notes]);

    // Entrevistas do candidato
    const candidateInterviews = useMemo(() => {
        if (!candidate?.id) return [];
        return interviews
            .filter(i => i.candidateId === candidate.id)
            .sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));
    }, [interviews, candidate?.id]);

    // Determina próxima etapa disponível
    const getCurrentStageIndex = () => {
        const currentStatus = d.status || 'Inscrito';
        return PIPELINE_STAGES.indexOf(currentStatus);
    };

    const getNextStages = () => {
        const currentIndex = getCurrentStageIndex();
        if (currentIndex === -1 || currentIndex >= PIPELINE_STAGES.length - 1) {
            return CLOSING_STATUSES; // Se já está na última etapa, mostra apenas status de fechamento
        }
        return [PIPELINE_STAGES[currentIndex + 1], ...CLOSING_STATUSES];
    };

    const handleInputChange = (field, value) => {
        // Normaliza campos específicos quando o usuário digita
        if (field === 'city' && value) {
            value = normalizeCity(value);
        } else if (field === 'source' && value) {
            value = normalizeSource(value);
        } else if (field === 'interestAreas' && value) {
            value = normalizeInterestAreasString(value);
        }
        setD(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        // Validação antes de salvar
        const validation = validateCandidate(d, {
            checkRequired: true,
            strictMode: false,
            stage: d.status
        });

        // Verificar duplicata de email (apenas para novos candidatos ou se email mudou)
        if (d.email) {
            const duplicateCheck = checkDuplicateEmail(d.email, allCandidates, d.id);
            if (duplicateCheck.isDuplicate) {
                validation.valid = false;
                validation.errors.email = duplicateCheck.message;
            }
        }

        setValidationErrors(validation.errors);
        setValidationWarnings(validation.warnings);

        if (!validation.valid) {
            setShowValidationSummary(true);
            // Rolar para o topo do modal para mostrar erros
            return;
        }

        // Garante que os campos estão normalizados antes de salvar
        const dataToSave = { ...d };
        if (dataToSave.city) {
            dataToSave.city = normalizeCity(dataToSave.city);
        }
        if (dataToSave.source) {
            dataToSave.source = normalizeSource(dataToSave.source);
        }
        if (dataToSave.interestAreas) {
            dataToSave.interestAreas = normalizeInterestAreasString(dataToSave.interestAreas);
        }

        // Limpar erros e salvar
        setShowValidationSummary(false);
        onSave(dataToSave);
    };

    const handleAddNote = async () => {
        if (!newNote.trim() || !onAddNote) return;
        setSavingNote(true);
        try {
            await onAddNote(d.id, newNote.trim());
            // Atualiza localmente para feedback imediato
            const newNoteObj = {
                text: newNote.trim(),
                timestamp: new Date().toISOString(),
                userEmail: 'current_user', // Será substituído pelo App
                userName: 'Você'
            };
            setD(prev => ({
                ...prev,
                notes: [newNoteObj, ...(prev.notes || [])]
            }));
            setNewNote('');
        } catch (e) {
            console.error('Erro ao adicionar nota:', e);
        } finally {
            setSavingNote(false);
        }
    };

    // Formatar data de timestamp
    const formatTimestamp = (ts) => {
        if (!ts) return 'N/A';
        let date;
        if (ts.seconds || ts._seconds) {
            date = new Date((ts.seconds || ts._seconds) * 1000);
        } else if (ts.toDate) {
            date = ts.toDate();
        } else {
            date = new Date(ts);
        }
        return date.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 dark:bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-brand-card dark:bg-brand-card rounded-xl w-full max-w-4xl h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between bg-brand-card dark:bg-brand-card">
                    <div><h3 className="font-bold text-xl text-white">{d.id ? 'Editar' : 'Novo'} Candidato</h3></div>
                    <button onClick={onClose}><X /></button>
                </div>

                {/* Resumo de Validação */}
                {showValidationSummary && Object.keys(validationErrors).length > 0 && (
                    <div className="mx-6 mt-4 bg-red-900/30 border border-red-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-300 font-bold mb-2">
                            <AlertCircle size={18} /> {Object.keys(validationErrors).length} erro(s) encontrado(s)
                        </div>
                        <ul className="text-sm text-red-400 space-y-1 ml-6">
                            {Object.entries(validationErrors).map(([field, message]) => (
                                <li key={field}>• {message}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {showValidationSummary && Object.keys(validationWarnings).length > 0 && Object.keys(validationErrors).length === 0 && (
                    <div className="mx-6 mt-4 bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-yellow-300 font-bold mb-2">
                            <Info size={18} /> {Object.keys(validationWarnings).length} aviso(s)
                        </div>
                        <ul className="text-sm text-yellow-400 space-y-1 ml-6">
                            {Object.entries(validationWarnings).map(([field, message]) => (
                                <li key={field}>• {message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex border-b border-gray-200 dark:border-gray-700 dark:border-gray-200 dark:border-gray-700">
                    {['pessoal', 'profissional', 'processo', 'etapas', 'histórico', 'adicional'].map(tab => (
                        <button key={tab} onClick={() => setActiveSection(tab)} className={`flex-1 py-3 px-4 text-sm font-bold uppercase ${activeSection === tab ? 'text-blue-600 dark:text-blue-400 border-b-2 border-brand-orange' : 'text-slate-500 dark:text-slate-500'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="p-8 overflow-y-auto flex-1 bg-white dark:bg-gray-900">
                    {activeSection === 'pessoal' && (
                        <>
                            {/* Menu de Avanço de Etapa - Destaque */}
                            {d.id && onAdvanceStage && (
                                <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-2 border-blue-500/50 rounded-lg p-4 mb-6">
                                    <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
                                        <Trophy size={18} className="text-yellow-400" /> Avançar Etapa do Processo
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                            value=""
                                            onChange={(e) => {
                                                if (e.target.value && onAdvanceStage) {
                                                    onAdvanceStage(d, e.target.value);
                                                }
                                                e.target.value = '';
                                            }}
                                        >
                                            <option value="">Selecione a próxima etapa...</option>
                                            {getNextStages().map(stage => (
                                                <option key={stage} value={stage}>
                                                    {stage}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="text-xs text-slate-300 self-center px-2">
                                            Etapa atual: <span className="font-bold text-blue-300">{d.status || 'Inscrito'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <InputField label="Nome Completo" field="fullName" value={d.fullName} onChange={handleInputChange} />
                                <InputField label="Email Principal" field="email" value={d.email} onChange={handleInputChange} />
                                <InputField label="Email Secundário" field="email_secondary" value={d.email_secondary} onChange={handleInputChange} />
                                <InputField label="Telefone/Celular" field="phone" value={d.phone} onChange={handleInputChange} />
                                <div className="mb-3">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Cidade</label>
                                    <select className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={d.city || ''} onChange={e => handleInputChange('city', e.target.value)}>
                                        <option value="">Selecione...</option>
                                        <optgroup label="Cidades Principais">
                                            {getMainCitiesOptions().map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </optgroup>
                                        {options.cities && options.cities.length > 0 && (
                                            <optgroup label="Outras Cidades">
                                                {options.cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                            </optgroup>
                                        )}
                                    </select>
                                    <p className="text-xs text-slate-400 mt-1">Digite ou selecione - será normalizado automaticamente</p>
                                </div>
                                <InputField label="Data de Nascimento" field="birthDate" type="date" value={d.birthDate} onChange={handleInputChange} />
                                <InputField label="Idade" field="age" type="number" value={d.age} onChange={handleInputChange} />
                                <div className="mb-3">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Estado Civil</label>
                                    <select className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={d.maritalStatus || ''} onChange={e => setD({ ...d, maritalStatus: e.target.value })}>
                                        <option value="">Selecione...</option>
                                        {options.marital && options.marital.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Quantidade de Filhos</label>
                                    <select className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={d.childrenCount != null && d.childrenCount !== '' ? normalizeChildrenForStorage(d.childrenCount) : ''} onChange={e => handleInputChange('childrenCount', e.target.value === '' ? '' : normalizeChildrenForStorage(e.target.value))}>
                                        <option value="">Selecione...</option>
                                        {CHILDREN_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <UrlField label="URL da Foto" field="photoUrl" value={d.photoUrl} onChange={handleInputChange} placeholder="Cole a URL da foto aqui..." />
                                <div className="mb-3">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Possui CNH Tipo B?</label>
                                    <select className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={d.hasLicense || ''} onChange={e => setD({ ...d, hasLicense: e.target.value })}>
                                        <option value="">Selecione...</option>
                                        <option value="Sim">Sim</option>
                                        <option value="Não">Não</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}
                    {activeSection === 'profissional' && (
                        <div className="grid grid-cols-2 gap-6">
                            <InputField label="Formação" field="education" value={d.education} onChange={handleInputChange} />
                            <div className="mb-3">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Nível de Escolaridade</label>
                                <select className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={d.schoolingLevel || ''} onChange={e => setD({ ...d, schoolingLevel: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {options.schooling && options.schooling.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            <InputField label="Instituição de Ensino" field="institution" value={d.institution} onChange={handleInputChange} />
                            <InputField label="Data de Formatura" field="graduationDate" type="date" value={d.graduationDate} onChange={handleInputChange} />
                            <div className="mb-3">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Está Cursando Atualmente?</label>
                                <select className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={d.isStudying || ''} onChange={e => setD({ ...d, isStudying: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    <option value="Sim">Sim</option>
                                    <option value="Não">Não</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Área de Interesse</label>
                                <select className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={d.interestAreas || ''} onChange={e => handleInputChange('interestAreas', e.target.value)}>
                                    <option value="">Selecione...</option>
                                    <optgroup label="Áreas Principais">
                                        {getMainInterestAreasOptions().map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
                                    </optgroup>
                                    {options.interestAreas && options.interestAreas.length > 0 && (
                                        <optgroup label="Outras Áreas">
                                            {options.interestAreas.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
                                        </optgroup>
                                    )}
                                </select>
                                <p className="text-xs text-slate-400 mt-1">Digite ou selecione - será normalizado automaticamente</p>
                            </div>
                            <div className="mb-3 col-span-2">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Experiências Anteriores</label>
                                <textarea className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-24" value={d.experience || ''} onChange={e => setD({ ...d, experience: e.target.value })} placeholder="Descreva as experiências profissionais..." />
                            </div>
                            <div className="mb-3 col-span-2">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Cursos e Certificações</label>
                                <textarea className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-20" value={d.courses || ''} onChange={e => setD({ ...d, courses: e.target.value })} placeholder="Liste cursos e certificações..." />
                            </div>
                            <UrlField label="Link CV" field="cvUrl" value={d.cvUrl} onChange={handleInputChange} placeholder="Cole a URL do currículo aqui..." />
                            <UrlField label="Link Portfolio" field="portfolioUrl" value={d.portfolioUrl} onChange={handleInputChange} placeholder="Cole a URL do portfólio aqui..." />
                        </div>
                    )}
                    {activeSection === 'processo' && (
                        <div className="grid grid-cols-2 gap-6">
                            {/* Candidaturas Vinculadas */}
                            <div className="mb-3 col-span-2">
                                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-bold text-gray-900 dark:text-white uppercase">Candidaturas Vinculadas</label>
                                        {onCreateApplication && (() => {
                                            const availableJobs = (options.jobs || jobs || []).filter(j => j.status === 'Aberta');
                                            if (availableJobs.length === 0) return null;
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowLinkJobDropdown(!showLinkJobDropdown); setLinkJobSelectedId(''); }}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                                >
                                                    <Plus size={16} /> Vincular a Nova Vaga
                                                </button>
                                            );
                                        })()}
                                    </div>
                                    {showLinkJobDropdown && onCreateApplication && candidate?.id && (() => {
                                        const availableJobs = (options.jobs || jobs || []).filter(j => j.status === 'Aberta');
                                        const alreadyLinkedIds = (applications || []).filter(a => a.candidateId === candidate.id).map(a => a.jobId);
                                        const jobsToShow = availableJobs.filter(j => !alreadyLinkedIds.includes(j.id));
                                        return (
                                            <div className="mt-3 p-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg space-y-2">
                                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Selecione a vaga e confirme</label>
                                                <select
                                                    value={linkJobSelectedId}
                                                    onChange={e => setLinkJobSelectedId(e.target.value)}
                                                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Selecione uma vaga...</option>
                                                    {jobsToShow.map(j => (
                                                        <option key={j.id} value={j.id}>{j.title} – {j.company}{j.city ? ` (${j.city})` : ''}</option>
                                                    ))}
                                                </select>
                                                {jobsToShow.length === 0 && (
                                                    <p className="text-xs text-amber-600 dark:text-amber-400">Este candidato já está vinculado a todas as vagas abertas.</p>
                                                )}
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={!linkJobSelectedId}
                                                        onClick={async () => {
                                                            if (!linkJobSelectedId) return;
                                                            await onCreateApplication(candidate.id, linkJobSelectedId);
                                                            setLinkJobSelectedId('');
                                                            setShowLinkJobDropdown(false);
                                                        }}
                                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium"
                                                    >
                                                        Vincular
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setShowLinkJobDropdown(false); setLinkJobSelectedId(''); }}
                                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    {(() => {
                                        const candidateApplications = applications.filter(a => a.candidateId === candidate?.id);
                                        if (candidateApplications.length === 0) {
                                            return (
                                                <div className="text-center py-4 text-gray-600 dark:text-gray-400 text-sm">
                                                    <p>Nenhuma candidatura vinculada ainda.</p>
                                                    <p className="text-xs mt-1">Clique em "Vincular a Nova Vaga" para criar uma candidatura.</p>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div className="space-y-2">
                                                {candidateApplications.map(app => {
                                                    const job = (options.jobs || jobs || []).find(j => j.id === app.jobId);
                                                    return (
                                                        <div key={app.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <h5 className="font-semibold text-gray-900 dark:text-white text-sm">
                                                                        {job?.title || app.jobTitle || 'Vaga não encontrada'}
                                                                    </h5>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                                        {job?.company || app.jobCompany || ''} {job?.city ? `• ${job.city}` : ''}
                                                                    </p>
                                                                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs border ${STATUS_COLORS[app.status] || 'bg-slate-700 text-slate-200 border-slate-600'}`}>
                                                                        {app.status || 'Inscrito'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Onde encontrou (Fonte)</label>
                                <select className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={d.source || ''} onChange={e => handleInputChange('source', e.target.value)}>
                                    <option value="">Selecione...</option>
                                    <optgroup label="Origens Principais">
                                        {getMainSourcesOptions().map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                                    </optgroup>
                                    {options.origins && options.origins.length > 0 && (
                                        <optgroup label="Outras Origens">
                                            {options.origins.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                                        </optgroup>
                                    )}
                                </select>
                                <p className="text-xs text-slate-400 mt-1">Digite ou selecione - será normalizado automaticamente</p>
                            </div>
                            <InputField label="Indicação (Quem indicou?)" field="referral" value={d.referral} onChange={handleInputChange} />
                            <InputField label="Expectativa Salarial" field="salaryExpectation" value={d.salaryExpectation} onChange={handleInputChange} />
                            <div className="mb-3">
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Disponibilidade para Mudança de Cidade?</label>
                                <select className="w-full bg-white dark:bg-gray-900 dark:bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-200 dark:border-gray-700 p-2.5 rounded text-white dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={d.canRelocate || ''} onChange={e => setD({ ...d, canRelocate: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    <option value="Sim">Sim</option>
                                    <option value="Não">Não</option>
                                </select>
                            </div>
                            <div className="mb-3 col-span-2">
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Referências Profissionais</label>
                                <textarea className="w-full bg-white dark:bg-gray-900 dark:bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-200 dark:border-gray-700 p-2.5 rounded text-white dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-20" value={d.references || ''} onChange={e => setD({ ...d, references: e.target.value })} placeholder="Liste referências profissionais..." />
                            </div>

                            {/* Entrevistas Agendadas */}
                            <div className="col-span-2 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-white flex items-center gap-2">
                                        <CalendarCheck size={18} className="text-purple-400" /> Entrevistas Agendadas
                                    </h4>
                                    {onScheduleInterview && d.id && (
                                        <button
                                            type="button"
                                            onClick={() => onScheduleInterview(d)}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                                        >
                                            <Plus size={14} /> Agendar
                                        </button>
                                    )}
                                </div>
                                {candidateInterviews.length > 0 ? (
                                    <div className="space-y-2">
                                        {candidateInterviews.map(interview => {
                                            const interviewDate = new Date(interview.date);
                                            const isPast = interviewDate < new Date();
                                            return (
                                                <div key={interview.id} className={`p-3 rounded-lg border ${interview.status === 'Cancelada' ? 'bg-red-900/20 border-red-800' :
                                                    interview.status === 'Realizada' ? 'bg-green-900/20 border-green-800' :
                                                        isPast ? 'bg-yellow-900/20 border-yellow-800' :
                                                            'bg-gray-900/50 border-gray-600'
                                                    }`}>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-medium text-white text-sm">{interview.type}</div>
                                                            <div className="text-xs text-gray-400">
                                                                {interviewDate.toLocaleDateString('pt-BR')} às {interview.time}
                                                                {interview.duration && ` (${interview.duration}min)`}
                                                            </div>
                                                            {interview.jobTitle && <div className="text-xs text-gray-500">Vaga: {interview.jobTitle}</div>}
                                                        </div>
                                                        <span className={`text-xs px-2 py-0.5 rounded ${interview.status === 'Agendada' ? 'bg-blue-600 text-white' :
                                                            interview.status === 'Confirmada' ? 'bg-green-600 text-white' :
                                                                interview.status === 'Realizada' ? 'bg-gray-600 text-white' :
                                                                    interview.status === 'Cancelada' ? 'bg-red-600 text-white' :
                                                                        'bg-yellow-600 text-white'
                                                            }`}>
                                                            {interview.status}
                                                        </span>
                                                    </div>
                                                    {interview.isOnline && interview.meetingLink && (
                                                        <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline mt-1 inline-block">
                                                            Link da reunião
                                                        </a>
                                                    )}
                                                    {!interview.isOnline && interview.location && (
                                                        <div className="text-xs text-gray-400 mt-1">{interview.location}</div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-4 text-sm">
                                        Nenhuma entrevista agendada
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeSection === 'etapas' && (
                        <div className="space-y-6">
                            {/* Status atual */}
                            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/50 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase">Status Atual</label>
                                        <div className="text-xl font-bold text-white">{d.status || 'Inscrito'}</div>
                                    </div>
                                    {d.id && onAdvanceStage && (
                                        <select
                                            className="bg-gray-800 border border-gray-600 px-4 py-2 rounded-lg text-white text-sm font-medium"
                                            value=""
                                            onChange={(e) => {
                                                if (e.target.value && onAdvanceStage) {
                                                    onAdvanceStage(d, e.target.value);
                                                }
                                                e.target.value = '';
                                            }}
                                        >
                                            <option value="">Avançar para...</option>
                                            {getNextStages().map(stage => (
                                                <option key={stage} value={stage}>{stage}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            {/* 1ª Entrevista */}
                            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-xs">1</span>
                                    1ª Entrevista (RH)
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Data e Hora</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            value={d.interview1Date || ''}
                                            onChange={e => setD({ ...d, interview1Date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Status</label>
                                        <select
                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            value={d.interview1Status || ''}
                                            onChange={e => setD({ ...d, interview1Status: e.target.value })}
                                        >
                                            <option value="">Não realizada</option>
                                            <option value="Agendada">Agendada</option>
                                            <option value="Realizada">Realizada</option>
                                            <option value="Cancelada">Cancelada</option>
                                            <option value="NoShow">No-show</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Observações</label>
                                        <textarea
                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-20"
                                            value={d.interview1Notes || ''}
                                            onChange={e => setD({ ...d, interview1Notes: e.target.value })}
                                            placeholder="Anotações sobre a entrevista..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Testes */}
                            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs">T</span>
                                    Testes
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Resultado</label>
                                        <select
                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            value={d.testResults || ''}
                                            onChange={e => setD({ ...d, testResults: e.target.value })}
                                        >
                                            <option value="">Não realizado</option>
                                            <option value="Aprovado">Aprovado</option>
                                            <option value="Aprovado com ressalvas">Aprovado com ressalvas</option>
                                            <option value="Reprovado">Reprovado</option>
                                            <option value="Não aplicável">Não aplicável</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Data do Teste</label>
                                        <input
                                            type="date"
                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            value={d.testDate || ''}
                                            onChange={e => setD({ ...d, testDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Observações dos Testes</label>
                                        <textarea
                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-20"
                                            value={d.testNotes || ''}
                                            onChange={e => setD({ ...d, testNotes: e.target.value })}
                                            placeholder="Detalhes sobre os testes realizados..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 2ª Entrevista */}
                            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-xs">2</span>
                                    2ª Entrevista (Gestor)
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Data e Hora</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            value={d.interview2Date || ''}
                                            onChange={e => setD({ ...d, interview2Date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Status</label>
                                        <select
                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            value={d.interview2Status || ''}
                                            onChange={e => setD({ ...d, interview2Status: e.target.value })}
                                        >
                                            <option value="">Não realizada</option>
                                            <option value="Agendada">Agendada</option>
                                            <option value="Realizada">Realizada</option>
                                            <option value="Cancelada">Cancelada</option>
                                            <option value="NoShow">No-show</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Observações</label>
                                        <textarea
                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-20"
                                            value={d.interview2Notes || ''}
                                            onChange={e => setD({ ...d, interview2Notes: e.target.value })}
                                            placeholder="Anotações sobre a entrevista com gestor..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Retorno */}
                            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-xs">✓</span>
                                    Retorno ao Candidato
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Retorno Dado?</label>
                                        <select
                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            value={d.returnSent || ''}
                                            onChange={e => setD({ ...d, returnSent: e.target.value })}
                                        >
                                            <option value="">Não informado</option>
                                            <option value="Sim">Sim, retorno dado</option>
                                            <option value="Não">Não, ainda não dado</option>
                                            <option value="Pendente">Pendente</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Data do Retorno</label>
                                        <input
                                            type="date"
                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            value={d.returnDate || ''}
                                            onChange={e => setD({ ...d, returnDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Observações do Retorno</label>
                                        <textarea
                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 rounded text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-20"
                                            value={d.returnNotes || ''}
                                            onChange={e => setD({ ...d, returnNotes: e.target.value })}
                                            placeholder="Detalhes sobre o retorno dado ao candidato..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeSection === 'histórico' && (
                        <div className="space-y-6">
                            {/* Seção de Notas/Comentários */}
                            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                                    <MessageSquare size={18} className="text-blue-400" /> Notas e Comentários
                                </h4>

                                {/* Adicionar nova nota */}
                                <div className="flex gap-2 mb-4">
                                    <textarea
                                        value={newNote}
                                        onChange={e => setNewNote(e.target.value)}
                                        placeholder="Adicione uma nota, feedback de entrevista, observação..."
                                        className="flex-1 bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm text-white resize-none h-20 outline-none focus:border-blue-500"
                                        disabled={savingNote}
                                    />
                                    <button
                                        onClick={handleAddNote}
                                        disabled={!newNote.trim() || savingNote}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 rounded-lg font-medium text-sm transition-colors self-end h-10"
                                    >
                                        {savingNote ? '...' : 'Adicionar'}
                                    </button>
                                </div>

                                {/* Lista de notas */}
                                <div className="space-y-3 max-h-48 overflow-y-auto">
                                    {candidateNotes.length > 0 ? candidateNotes.map((note, idx) => (
                                        <div key={idx} className="bg-gray-900/50 rounded-lg p-3 border-l-4 border-blue-500">
                                            <p className="text-sm text-gray-200 whitespace-pre-wrap">{note.text}</p>
                                            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                                <span>{note.userName || note.userEmail || 'Usuário'}</span>
                                                <span>{formatTimestamp(note.timestamp)}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center text-gray-500 py-4 text-sm">
                                            Nenhuma nota adicionada ainda
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Timeline de Movimentações */}
                            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                                    <History size={18} className="text-green-400" /> Histórico de Movimentações
                                </h4>

                                <div className="relative">
                                    {candidateMovements.length > 0 ? (
                                        <div className="space-y-4">
                                            {candidateMovements.map((movement, idx) => (
                                                <div key={movement.id || idx} className="flex gap-4">
                                                    {/* Linha vertical */}
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-3 h-3 rounded-full ${movement.isClosingStatus
                                                            ? movement.newStatus === 'Contratado' ? 'bg-green-500' : 'bg-red-500'
                                                            : 'bg-blue-500'
                                                            }`} />
                                                        {idx < candidateMovements.length - 1 && (
                                                            <div className="w-0.5 h-full bg-gray-600 mt-1" />
                                                        )}
                                                    </div>

                                                    {/* Conteúdo */}
                                                    <div className="flex-1 pb-4">
                                                        <p className="text-sm text-gray-200 mb-1">
                                                            <span className="font-semibold text-white">{movement.userName || movement.userEmail || 'Usuário'}</span>
                                                            {' moveu de '}
                                                            <span className="font-medium text-blue-400">{movement.previousStatus || 'Inscrito'}</span>
                                                            {' para '}
                                                            <span className={`font-medium ${movement.newStatus === 'Contratado' ? 'text-green-400' :
                                                                movement.newStatus === 'Reprovado' ? 'text-red-400' :
                                                                    'text-cyan-400'
                                                                }`}>
                                                                {movement.newStatus}
                                                            </span>
                                                            {movement.jobTitle && (
                                                                <>
                                                                    {' na vaga '}
                                                                    <span className="font-medium text-purple-400">{movement.jobTitle}</span>
                                                                </>
                                                            )}
                                                        </p>
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            {formatTimestamp(movement.timestamp)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 py-6 text-sm">
                                            <History size={32} className="mx-auto mb-2 opacity-50" />
                                            Nenhuma movimentação registrada
                                            <p className="text-xs mt-1">As movimentações serão registradas a partir de agora</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Informações de Criação/Atualização */}
                            <div className="bg-gray-800/30 rounded-lg p-3 text-xs text-gray-500 grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-gray-400">Criado em:</span>
                                    {formatTimestamp(d.createdAt)} {d.createdBy && `por ${d.createdBy}`}
                                </div>
                                <div>
                                    <span className="block text-gray-400">Última atualização:</span>
                                    {formatTimestamp(d.updatedAt)} {d.updatedBy && `por ${d.updatedBy}`}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeSection === 'adicional' && (
                        <div className="grid grid-cols-2 gap-6">
                            <InputField label="Tipo de Candidatura" field="typeOfApp" value={d.typeOfApp} onChange={handleInputChange} />
                            <div className="mb-3 col-span-2">
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">Campo Livre</label>
                                <textarea className="w-full bg-white dark:bg-gray-900 dark:bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-200 dark:border-gray-700 p-2.5 rounded text-white dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-32" value={d.freeField || ''} onChange={e => setD({ ...d, freeField: e.target.value })} placeholder="Informações adicionais..." />
                            </div>
                            <InputField label="ID Externo" field="external_id" value={d.external_id} onChange={handleInputChange} />
                            <InputField label="Timestamp Original" field="original_timestamp" value={d.original_timestamp} onChange={handleInputChange} />
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 dark:border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                    <button onClick={onClose} className="px-6 py-2 text-slate-400 dark:text-slate-400">Cancelar</button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-brand-orange text-white px-8 py-2 rounded">Salvar</button>
                </div>
            </div>
        </div>
    );
};

export default CandidateModal;
