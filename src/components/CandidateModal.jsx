import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X, Phone, Video, Users, Plus, Trash2, ChevronDown, ChevronUp,
    Calendar, Clock, FileText, Briefcase, TrendingUp, MessageSquare,
    MapPin, User, GraduationCap, Star, ExternalLink, Loader2
} from 'lucide-react';
import { STATUS_COLORS, PIPELINE_STAGES, CLOSING_STATUSES } from '../constants';
import { getPhotoPublicUrl } from '../utils/urlUtils';
import { formatChildrenForDisplay } from '../utils/childrenNormalizer';

const INTERACTION_ICONS = { users: Users, phone: Phone, video: Video };

// Dias desde uma data
const daysSince = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

// Linha de dado do currículo
const InfoRow = ({ label, value }) => {
    if (!value) return null;
    return (
        <div>
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-sm text-foreground">{value}</p>
        </div>
    );
};

// Grupo de dados com título
const DataGroup = ({ icon: Icon, title, children }) => (
    <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border">
            {Icon && <Icon size={13} />} {title}
        </h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </div>
);

export default function CandidateModal({
    candidate,
    onClose,
    onSave,
    options = {},
    isSaving,
    statusMovements = [],
    applications = [],
    onCreateApplication,
    jobs = [],
    interactions = [],
    interactionTypes = [],
    addInteraction,
    loadInteractions,
    deleteInteraction,
    showToast,
    onAdvanceStage,
}) {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('visao-geral');

    // Interações deste candidato
    const candidateInteractions = useMemo(() =>
        interactions
            .filter(i => i.candidateId === candidate.id)
            .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt)),
        [interactions, candidate.id]
    );

    // Candidaturas deste candidato
    const candidateApplications = useMemo(() =>
        applications.filter(a => a.candidateId === candidate.id),
        [applications, candidate.id]
    );

    // Dias no pipeline
    const daysInPipeline = useMemo(() => {
        const ts = candidate.createdAt || candidate.original_timestamp;
        return daysSince(ts);
    }, [candidate]);

    // Próximas etapas
    const nextStages = useMemo(() => {
        const idx = PIPELINE_STAGES.indexOf(candidate.status || 'Inscrito');
        if (idx === -1 || idx >= PIPELINE_STAGES.length - 1) return CLOSING_STATUSES;
        return [PIPELINE_STAGES[idx + 1], ...CLOSING_STATUSES];
    }, [candidate.status]);

    // Formulário de nova interação
    const [showInteractionForm, setShowInteractionForm] = useState(false);
    const [newInteraction, setNewInteraction] = useState({
        type: interactionTypes[0]?.name || '',
        occurredAt: new Date().toISOString().slice(0, 16),
        notes: ''
    });
    const [savingInteraction, setSavingInteraction] = useState(false);

    // Vincular a vaga
    const [showLinkJob, setShowLinkJob] = useState(false);
    const [linkJobId, setLinkJobId] = useState('');

    // Carregar interações ao abrir
    useEffect(() => {
        if (candidate.id && loadInteractions) {
            loadInteractions(candidate.id);
        }
    }, [candidate.id, loadInteractions]);

    const handleAddInteraction = async () => {
        if (!newInteraction.type || !newInteraction.occurredAt) return;
        setSavingInteraction(true);
        try {
            await addInteraction({
                candidateId: candidate.id,
                type: newInteraction.type,
                occurredAt: new Date(newInteraction.occurredAt).toISOString(),
                notes: newInteraction.notes
            });
            setShowInteractionForm(false);
            setNewInteraction({ type: interactionTypes[0]?.name || '', occurredAt: new Date().toISOString().slice(0, 16), notes: '' });
            if (showToast) showToast('Interação registrada.', 'success');
        } catch (e) {
            console.error(e);
            if (showToast) showToast('Erro ao registrar interação.', 'error');
        } finally {
            setSavingInteraction(false);
        }
    };

    const handleDeleteInteraction = async (id) => {
        if (!window.confirm('Remover esta interação?')) return;
        try {
            await deleteInteraction(id);
        } catch (e) {
            if (showToast) showToast('Erro ao remover.', 'error');
        }
    };

    const handleLinkJob = async () => {
        if (!linkJobId || !onCreateApplication) return;
        await onCreateApplication(candidate.id, linkJobId);
        setLinkJobId('');
        setShowLinkJob(false);
    };

    const photoUrl = getPhotoPublicUrl(candidate.photoUrl);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="bg-card rounded-xl w-full max-w-3xl h-[88vh] flex flex-col border border-border shadow-xl">

                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {photoUrl ? (
                            <img src={photoUrl} alt={candidate.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                            <User size={20} className="text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{candidate.fullName || 'Candidato'}</h3>
                        <p className="text-xs text-muted-foreground truncate">{candidate.email}</p>
                    </div>
                    <button
                        onClick={() => { onClose(); navigate(`/candidate/${candidate.id}`); }}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-muted"
                        title="Ver perfil completo"
                    >
                        <ExternalLink size={13} />
                    </button>
                    <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border px-5">
                    {[
                        { id: 'visao-geral', label: 'Visão Geral' },
                        { id: 'curriculo', label: 'Currículo' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSection(tab.id)}
                            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                                activeSection === tab.id
                                    ? 'border-young-orange text-young-orange'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">

                    {/* ============ VISÃO GERAL ============ */}
                    {activeSection === 'visao-geral' && (
                        <>
                            {/* Status + Dias no pipeline */}
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground mb-1.5">Status atual</p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${STATUS_COLORS[candidate.status] || 'bg-slate-600 text-white'}`}>
                                            {candidate.status || 'Inscrito'}
                                        </span>
                                        {onAdvanceStage && (
                                            <select
                                                className="text-xs border border-input rounded px-2 py-1 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange"
                                                value=""
                                                onChange={e => { if (e.target.value) onAdvanceStage(candidate, e.target.value); }}
                                            >
                                                <option value="">Mover para...</option>
                                                {nextStages.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        )}
                                    </div>
                                </div>
                                {daysInPipeline !== null && (
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground mb-0.5">No pipeline</p>
                                        <p className="text-2xl font-bold text-foreground">{daysInPipeline}</p>
                                        <p className="text-xs text-muted-foreground">dias</p>
                                    </div>
                                )}
                            </div>

                            {/* Candidaturas */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <Briefcase size={13} /> Candidaturas
                                    </p>
                                    {onCreateApplication && (
                                        <button
                                            onClick={() => setShowLinkJob(!showLinkJob)}
                                            className="text-xs text-young-orange hover:underline flex items-center gap-1"
                                        >
                                            <Plus size={12} /> Vincular vaga
                                        </button>
                                    )}
                                </div>

                                {showLinkJob && (
                                    <div className="mb-2 p-3 bg-muted rounded-lg flex gap-2">
                                        <select
                                            value={linkJobId}
                                            onChange={e => setLinkJobId(e.target.value)}
                                            className="flex-1 text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange"
                                        >
                                            <option value="">Selecione uma vaga...</option>
                                            {(options.jobs || jobs).filter(j => j.status === 'Aberta' && !candidateApplications.find(a => a.jobId === j.id)).map(j => (
                                                <option key={j.id} value={j.id}>{j.title}</option>
                                            ))}
                                        </select>
                                        <button onClick={handleLinkJob} disabled={!linkJobId} className="text-xs px-3 py-1.5 bg-young-orange text-white rounded disabled:opacity-50">Vincular</button>
                                        <button onClick={() => setShowLinkJob(false)} className="text-xs px-2 py-1.5 text-muted-foreground hover:text-foreground">✕</button>
                                    </div>
                                )}

                                {candidateApplications.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {candidateApplications.map(app => {
                                            const job = (options.jobs || jobs).find(j => j.id === app.jobId);
                                            const isActive = !['Contratado', 'Reprovado', 'Desistiu da vaga', 'Desistiu'].includes(app.status);
                                            return (
                                                <div key={app.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${isActive ? 'border-border bg-background' : 'border-border/50 bg-muted/40 opacity-60'}`}>
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">{job?.title || app.jobTitle || 'Vaga não encontrada'}</p>
                                                        {!isActive && <p className="text-xs text-muted-foreground">Inativa</p>}
                                                    </div>
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${STATUS_COLORS[app.status] || 'bg-slate-600 text-white'}`}>
                                                        {app.status}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">Nenhuma candidatura vinculada.</p>
                                )}
                            </div>

                            {/* Interações */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <MessageSquare size={13} /> Interações ({candidateInteractions.length})
                                    </p>
                                    <button
                                        onClick={() => setShowInteractionForm(!showInteractionForm)}
                                        className="text-xs text-young-orange hover:underline flex items-center gap-1"
                                    >
                                        <Plus size={12} /> Nova interação
                                    </button>
                                </div>

                                {/* Form nova interação */}
                                {showInteractionForm && (
                                    <div className="mb-3 p-4 bg-muted rounded-lg space-y-3 border border-border">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Tipo</label>
                                                <select
                                                    value={newInteraction.type}
                                                    onChange={e => setNewInteraction(p => ({ ...p, type: e.target.value }))}
                                                    className="w-full text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange"
                                                >
                                                    <option value="">Selecione...</option>
                                                    {interactionTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Data e hora</label>
                                                <input
                                                    type="datetime-local"
                                                    value={newInteraction.occurredAt}
                                                    onChange={e => setNewInteraction(p => ({ ...p, occurredAt: e.target.value }))}
                                                    className="w-full text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-muted-foreground mb-1">Relato / Observações</label>
                                            <textarea
                                                value={newInteraction.notes}
                                                onChange={e => setNewInteraction(p => ({ ...p, notes: e.target.value }))}
                                                placeholder="Descreva o que foi discutido, impressões, próximos passos..."
                                                rows={3}
                                                className="w-full text-sm border border-input rounded px-2 py-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange resize-none"
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setShowInteractionForm(false)} className="text-sm px-3 py-1.5 text-muted-foreground hover:text-foreground">Cancelar</button>
                                            <button
                                                onClick={handleAddInteraction}
                                                disabled={savingInteraction || !newInteraction.type || !newInteraction.occurredAt}
                                                className="text-sm px-4 py-1.5 bg-young-orange text-white rounded disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                {savingInteraction ? <Loader2 size={13} className="animate-spin" /> : null}
                                                Registrar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Lista de interações */}
                                {candidateInteractions.length > 0 ? (
                                    <div className="space-y-2">
                                        {candidateInteractions.map(interaction => {
                                            const iconDef = interactionTypes.find(t => t.name === interaction.type);
                                            const Icon = INTERACTION_ICONS[iconDef?.icon] || MessageSquare;
                                            return (
                                                <div key={interaction.id} className="flex gap-3 px-3 py-2.5 rounded-lg border border-border bg-background group">
                                                    <div className="w-7 h-7 rounded-full bg-young-orange/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <Icon size={14} className="text-young-orange" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-sm font-medium text-foreground">{interaction.type}</p>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="text-xs text-muted-foreground">{formatDate(interaction.occurredAt)}</span>
                                                                {deleteInteraction && (
                                                                    <button
                                                                        onClick={() => handleDeleteInteraction(interaction.id)}
                                                                        className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-red-500 transition-opacity"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {interaction.notes && (
                                                            <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{interaction.notes}</p>
                                                        )}
                                                        {interaction.createdByName && (
                                                            <p className="text-[10px] text-muted-foreground/60 mt-1">por {interaction.createdByName}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">Nenhuma interação registrada.</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* ============ CURRÍCULO ============ */}
                    {activeSection === 'curriculo' && (
                        <div className="space-y-6">
                            <DataGroup icon={User} title="Dados Pessoais">
                                <InfoRow label="Nome" value={candidate.fullName} />
                                <InfoRow label="Data de nascimento" value={formatDate(candidate.birthDate)} />
                                <InfoRow label="Idade" value={candidate.age ? `${candidate.age} anos` : null} />
                                <InfoRow label="Estado civil" value={candidate.maritalStatus} />
                                <InfoRow label="Filhos" value={formatChildrenForDisplay(candidate.childrenCount)} />
                                <InfoRow label="CNH Tipo B" value={candidate.hasLicense} />
                                <InfoRow label="Cidade" value={candidate.city} />
                                <InfoRow label="Disponível para mudança" value={candidate.canRelocate} />
                                {candidate.photoUrl && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-muted-foreground mb-1.5">Foto</p>
                                        <img
                                            src={getPhotoPublicUrl(candidate.photoUrl)}
                                            alt={candidate.fullName}
                                            className="w-16 h-16 rounded-lg object-cover border border-border"
                                        />
                                    </div>
                                )}
                            </DataGroup>

                            <DataGroup icon={Phone} title="Informações de Contato">
                                <InfoRow label="E-mail principal" value={candidate.email} />
                                <InfoRow label="E-mail secundário" value={candidate.email_secondary} />
                                <InfoRow label="Telefone" value={candidate.phone} />
                            </DataGroup>

                            <DataGroup icon={GraduationCap} title="Formação">
                                <InfoRow label="Formação" value={candidate.education} />
                                <InfoRow label="Escolaridade" value={candidate.schoolingLevel} />
                                <InfoRow label="Instituição" value={candidate.institution} />
                                <InfoRow label="Data de formatura" value={formatDate(candidate.graduationDate)} />
                                <InfoRow label="Cursando atualmente" value={candidate.isStudying} />
                                <InfoRow label="Áreas de interesse" value={candidate.interestAreas} />
                            </DataGroup>

                            <DataGroup icon={Briefcase} title="Experiência e Habilidades">
                                {candidate.experience && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-muted-foreground mb-0.5">Experiências anteriores</p>
                                        <p className="text-sm text-foreground whitespace-pre-wrap">{candidate.experience}</p>
                                    </div>
                                )}
                                {candidate.courses && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-muted-foreground mb-0.5">Cursos e certificações</p>
                                        <p className="text-sm text-foreground whitespace-pre-wrap">{candidate.courses}</p>
                                    </div>
                                )}
                                {candidate.certifications && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-muted-foreground mb-0.5">Certificações profissionais</p>
                                        <p className="text-sm text-foreground">{candidate.certifications}</p>
                                    </div>
                                )}
                                <InfoRow label="Expectativa salarial" value={candidate.salaryExpectation} />
                                <InfoRow label="Referências profissionais" value={candidate.references || candidate.professional_references} />
                            </DataGroup>

                            {/* Links */}
                            {(candidate.cvUrl || candidate.portfolioUrl) && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documentos</p>
                                    {candidate.cvUrl && (
                                        <a href={candidate.cvUrl} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                                            <FileText size={14} /> Currículo <ExternalLink size={12} />
                                        </a>
                                    )}
                                    {candidate.portfolioUrl && (
                                        <a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                                            <ExternalLink size={14} /> Portfólio <ExternalLink size={12} />
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Campo livre */}
                            {candidate.freeField && (
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Seja Você!</p>
                                    <p className="text-sm text-foreground whitespace-pre-wrap bg-muted rounded-lg p-3">{candidate.freeField}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-border flex justify-end">
                    <button onClick={onClose} className="text-sm px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
