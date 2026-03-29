import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, User, Briefcase, FileText, Phone, GraduationCap,
  ExternalLink, Edit3, Save, X, MessageSquare, Plus, Trash2,
  AlertCircle, Loader2, Car, Heart, Users, Camera
} from 'lucide-react';
import { supabase } from '../supabase';
import { mapCandidateFromSupabase } from '../utils/candidateFromSupabase';
import { prepareCandidateForDisplay, formatCandidateDate } from '../utils/candidateDisplay';
import { getPhotoPublicUrl } from '../utils/urlUtils';
import { PIPELINE_STAGES, STATUS_COLORS, CLOSING_STATUSES } from '../constants';
import { formatChildrenForDisplay, CHILDREN_OPTIONS, normalizeChildrenForStorage } from '../utils/childrenNormalizer';
import { normalizeCity } from '../utils/cityNormalizer';
import { normalizeSource } from '../utils/sourceNormalizer';
import { normalizeInterestAreasString } from '../utils/interestAreaNormalizer';
import PhotoUpload from './ui/PhotoUpload';

const INTERACTION_ICONS = { users: Users, phone: Phone, video: FileText };

const daysSince = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
};

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fmtDt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const InfoRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
};

const DataGroup = ({ icon: Icon, title, children }) => (
  <div className="space-y-3">
    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border">
      {Icon && <Icon size={13} />} {title}
    </h4>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">{children}</div>
  </div>
);

export default function CandidateProfilePage({
  candidates = [],
  jobs = [],
  applications = [],
  interactions = [],
  interactionTypes = [],
  loadInteractions,
  addInteraction,
  deleteInteraction,
  showToast,
  onCreateApplication,
  onAdvanceStage,
}) {
  const { id, tab } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(tab || 'visao-geral');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  // Interações
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [newInteraction, setNewInteraction] = useState({ type: '', occurredAt: new Date().toISOString().slice(0, 16), notes: '' });
  const [savingInteraction, setSavingInteraction] = useState(false);

  // Candidaturas
  const [showLinkJob, setShowLinkJob] = useState(false);
  const [linkJobId, setLinkJobId] = useState('');

  // Buscar candidato
  useEffect(() => {
    if (!id) return;
    const found = candidates.find(c => c.id === id);
    if (found) { setCandidate(found); setEditData(found); setLoading(false); return; }
    (async () => {
      const { data, error } = await supabase.from('talents_candidates').select('*').eq('id', id).maybeSingle();
      if (error) { console.warn(error); setLoading(false); return; }
      const mapped = data ? prepareCandidateForDisplay(mapCandidateFromSupabase(data)) : null;
      setCandidate(mapped);
      if (mapped) setEditData(mapped);
      setLoading(false);
    })();
  }, [id, candidates]);

  // Carregar interações ao montar
  useEffect(() => {
    if (id && loadInteractions) loadInteractions(id);
  }, [id, loadInteractions]);

  // Sync interactionTypes default
  useEffect(() => {
    if (interactionTypes.length > 0 && !newInteraction.type) {
      setNewInteraction(p => ({ ...p, type: interactionTypes[0].name }));
    }
  }, [interactionTypes]);

  const candidateInteractions = useMemo(() =>
    interactions.filter(i => i.candidateId === id).sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt)),
    [interactions, id]
  );

  const candidateApplications = useMemo(() =>
    applications.filter(a => a.candidateId === id),
    [applications, id]
  );

  const daysInPipeline = useMemo(() => {
    if (!candidate) return null;
    return daysSince(candidate.createdAt || candidate.original_timestamp);
  }, [candidate]);

  const nextStages = useMemo(() => {
    if (!candidate) return CLOSING_STATUSES;
    const idx = PIPELINE_STAGES.indexOf(candidate.status || 'Inscrito');
    if (idx === -1 || idx >= PIPELINE_STAGES.length - 1) return CLOSING_STATUSES;
    return [PIPELINE_STAGES[idx + 1], ...CLOSING_STATUSES];
  }, [candidate?.status]);

  const handleFieldChange = (field, value) => {
    let v = value;
    if (field === 'city' && value) v = normalizeCity(value);
    else if (field === 'source' && value) v = normalizeSource(value);
    else if (field === 'interestAreas' && value) v = normalizeInterestAreasString(value);
    setEditData(prev => ({ ...prev, [field]: v }));
  };

  const handleSave = async () => {
    if (!candidate || !id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('talents_candidates').update({
        full_name: editData.fullName,
        birth_date: editData.birthDate || null,
        age: editData.age || null,
        marital_status: editData.maritalStatus || null,
        children_count: editData.childrenCount || null,
        has_license: editData.hasLicense || null,
        city: editData.city || null,
        phone: editData.phone || null,
        email: editData.email || null,
        education: editData.education || null,
        schooling_level: editData.schoolingLevel || null,
        institution: editData.institution || null,
        interest_areas: editData.interestAreas || null,
        experience: editData.experience || null,
        courses: editData.courses || null,
        certifications: editData.certifications || null,
        salary_expectation: editData.salaryExpectation || null,
        free_field: editData.freeField || null,
        photo_url: editData.photoUrl || null,
        cv_url: editData.cvUrl || null,
        portfolio_url: editData.portfolioUrl || null,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
      setCandidate({ ...candidate, ...editData });
      setIsEditing(false);
      if (showToast) showToast('Perfil salvo.', 'success');
    } catch (e) {
      console.error(e);
      if (showToast) showToast('Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddInteraction = async () => {
    if (!newInteraction.type || !newInteraction.occurredAt) return;
    setSavingInteraction(true);
    try {
      await addInteraction({ candidateId: id, type: newInteraction.type, occurredAt: new Date(newInteraction.occurredAt).toISOString(), notes: newInteraction.notes });
      setShowInteractionForm(false);
      setNewInteraction({ type: interactionTypes[0]?.name || '', occurredAt: new Date().toISOString().slice(0, 16), notes: '' });
      if (showToast) showToast('Interação registrada.', 'success');
    } catch (e) {
      if (showToast) showToast('Erro ao registrar interação.', 'error');
    } finally {
      setSavingInteraction(false);
    }
  };

  const handleDeleteInteraction = async (interactionId) => {
    if (!window.confirm('Remover esta interação?')) return;
    try { await deleteInteraction(interactionId); }
    catch (e) { if (showToast) showToast('Erro ao remover.', 'error'); }
  };

  const handleLinkJob = async () => {
    if (!linkJobId || !onCreateApplication) return;
    await onCreateApplication(id, linkJobId);
    setLinkJobId(''); setShowLinkJob(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Loader2 className="animate-spin text-muted-foreground" size={28} />
    </div>
  );

  if (!candidate) return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium mb-4">Candidato não encontrado</p>
        <button onClick={() => navigate('/dashboard')} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm">Voltar</button>
      </div>
    </div>
  );

  const photoUrl = getPhotoPublicUrl(candidate.photoUrl);

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(location.state?.from || -1)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
                <ArrowLeft size={18} />
              </button>
              <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt={candidate.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={e => e.target.style.display = 'none'} />
                ) : (
                  <User size={18} className="text-muted-foreground" />
                )}
              </div>
              <div>
                <h1 className="font-semibold text-foreground leading-tight">{candidate.fullName || 'Candidato'}</h1>
                <p className="text-xs text-muted-foreground">{candidate.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button onClick={() => { setEditData(candidate); setIsEditing(false); }} className="text-sm px-3 py-1.5 text-muted-foreground hover:text-foreground">Cancelar</button>
                  <button onClick={handleSave} disabled={saving} className="text-sm px-4 py-1.5 bg-young-orange text-white rounded-lg disabled:opacity-50 flex items-center gap-1.5">
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Salvar
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="text-sm px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg flex items-center gap-1.5">
                  <Edit3 size={14} /> Editar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex">
          {[{ id: 'visao-geral', label: 'Visão Geral' }, { id: 'curriculo', label: 'Currículo' }].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveSection(t.id)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeSection === t.id ? 'border-young-orange text-young-orange' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ===== VISÃO GERAL ===== */}
        {activeSection === 'visao-geral' && (
          <>
            {/* Status + pipeline */}
            <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-6">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-2">Status atual</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${STATUS_COLORS[candidate.status] || 'bg-slate-600 text-white'}`}>
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
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground mb-0.5">No pipeline</p>
                  <p className="text-3xl font-bold text-foreground">{daysInPipeline}</p>
                  <p className="text-xs text-muted-foreground">dias</p>
                </div>
              )}
            </div>

            {/* Candidaturas */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase size={13} /> Candidaturas
                </p>
                {onCreateApplication && (
                  <button onClick={() => setShowLinkJob(!showLinkJob)} className="text-xs text-young-orange hover:underline flex items-center gap-1">
                    <Plus size={12} /> Vincular vaga
                  </button>
                )}
              </div>

              {showLinkJob && (
                <div className="mb-3 p-3 bg-muted rounded-lg flex gap-2">
                  <select
                    value={linkJobId}
                    onChange={e => setLinkJobId(e.target.value)}
                    className="flex-1 text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange"
                  >
                    <option value="">Selecione uma vaga...</option>
                    {jobs.filter(j => j.status === 'Aberta' && !candidateApplications.find(a => a.jobId === j.id)).map(j => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                  <button onClick={handleLinkJob} disabled={!linkJobId} className="text-xs px-3 py-1.5 bg-young-orange text-white rounded disabled:opacity-50">Vincular</button>
                  <button onClick={() => setShowLinkJob(false)} className="text-xs px-2 text-muted-foreground hover:text-foreground">✕</button>
                </div>
              )}

              {candidateApplications.length > 0 ? (
                <div className="space-y-2">
                  {candidateApplications.map(app => {
                    const job = jobs.find(j => j.id === app.jobId);
                    const isActive = !['Contratado', 'Reprovado', 'Desistiu da vaga', 'Desistiu'].includes(app.status);
                    return (
                      <div key={app.id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${isActive ? 'border-border bg-background' : 'border-border/50 bg-muted/40 opacity-60'}`}>
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
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare size={13} /> Interações ({candidateInteractions.length})
                </p>
                {addInteraction && (
                  <button onClick={() => setShowInteractionForm(!showInteractionForm)} className="text-xs text-young-orange hover:underline flex items-center gap-1">
                    <Plus size={12} /> Nova interação
                  </button>
                )}
              </div>

              {showInteractionForm && (
                <div className="mb-4 p-4 bg-muted rounded-lg space-y-3 border border-border">
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

              {candidateInteractions.length > 0 ? (
                <div className="space-y-2">
                  {candidateInteractions.map(interaction => {
                    const iconDef = interactionTypes.find(t => t.name === interaction.type);
                    const Icon = INTERACTION_ICONS[iconDef?.icon] || MessageSquare;
                    return (
                      <div key={interaction.id} className="flex gap-3 px-3 py-3 rounded-lg border border-border bg-background group">
                        <div className="w-7 h-7 rounded-full bg-young-orange/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon size={14} className="text-young-orange" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{interaction.type}</p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground">{fmtDt(interaction.occurredAt)}</span>
                              {deleteInteraction && (
                                <button onClick={() => handleDeleteInteraction(interaction.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-red-500 transition-opacity">
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                          {interaction.notes && <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{interaction.notes}</p>}
                          {interaction.createdByName && <p className="text-[10px] text-muted-foreground/60 mt-1">por {interaction.createdByName}</p>}
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

        {/* ===== CURRÍCULO ===== */}
        {activeSection === 'curriculo' && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-8">

            {/* Dados Pessoais */}
            <DataGroup icon={User} title="Dados Pessoais">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Nome completo</label>
                    <input value={editData.fullName || ''} onChange={e => handleFieldChange('fullName', e.target.value)} className="w-full text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Data de nascimento</label>
                    <input type="date" value={editData.birthDate || ''} onChange={e => handleFieldChange('birthDate', e.target.value)} className="w-full text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Idade</label>
                    <input type="number" value={editData.age || ''} onChange={e => handleFieldChange('age', e.target.value ? parseInt(e.target.value) : null)} className="w-full text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange" min="0" max="120" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Estado civil</label>
                    <select value={editData.maritalStatus || ''} onChange={e => handleFieldChange('maritalStatus', e.target.value)} className="w-full text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange">
                      <option value="">Selecione</option>
                      {['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável', 'Namorando'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Filhos</label>
                    <select value={editData.childrenCount != null && editData.childrenCount !== '' ? normalizeChildrenForStorage(editData.childrenCount) : ''} onChange={e => handleFieldChange('childrenCount', e.target.value === '' ? '' : normalizeChildrenForStorage(e.target.value))} className="w-full text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange">
                      <option value="">Selecione</option>
                      {CHILDREN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">CNH Tipo B</label>
                    <select value={editData.hasLicense || ''} onChange={e => handleFieldChange('hasLicense', e.target.value)} className="w-full text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange">
                      <option value="">Selecione</option>
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Cidade</label>
                    <input value={editData.city || ''} onChange={e => handleFieldChange('city', e.target.value)} className="w-full text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange" />
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <label className="block text-xs text-muted-foreground mb-1">Foto</label>
                    <PhotoUpload value={editData.photoUrl || ''} onChange={path => handleFieldChange('photoUrl', path)} candidateId={candidate.id} />
                  </div>
                </>
              ) : (
                <>
                  <InfoRow label="Nome" value={candidate.fullName} />
                  <InfoRow label="Data de nascimento" value={fmt(candidate.birthDate)} />
                  <InfoRow label="Idade" value={candidate.age ? `${candidate.age} anos` : null} />
                  <InfoRow label="Estado civil" value={candidate.maritalStatus} />
                  <InfoRow label="Filhos" value={formatChildrenForDisplay(candidate.childrenCount)} />
                  <InfoRow label="CNH Tipo B" value={candidate.hasLicense} />
                  <InfoRow label="Cidade" value={candidate.city} />
                  {candidate.photoUrl && (
                    <div className="col-span-2 md:col-span-3">
                      <p className="text-xs text-muted-foreground mb-1.5">Foto</p>
                      <img src={getPhotoPublicUrl(candidate.photoUrl)} alt={candidate.fullName} className="w-20 h-20 rounded-lg object-cover border border-border" referrerPolicy="no-referrer" onError={e => e.target.style.display = 'none'} />
                    </div>
                  )}
                </>
              )}
            </DataGroup>

            {/* Contato */}
            <DataGroup icon={Phone} title="Informações de Contato">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">E-mail</label>
                    <input value={editData.email || ''} onChange={e => handleFieldChange('email', e.target.value)} className="w-full text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Telefone</label>
                    <input value={editData.phone || ''} onChange={e => handleFieldChange('phone', e.target.value)} className="w-full text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange" />
                  </div>
                </>
              ) : (
                <>
                  <InfoRow label="E-mail" value={candidate.email} />
                  <InfoRow label="E-mail secundário" value={candidate.email_secondary} />
                  <InfoRow label="Telefone" value={candidate.phone} />
                </>
              )}
            </DataGroup>

            {/* Formação */}
            <DataGroup icon={GraduationCap} title="Formação">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Escolaridade</label>
                    <input value={editData.schoolingLevel || ''} onChange={e => handleFieldChange('schoolingLevel', e.target.value)} className="w-full text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Formação</label>
                    <input value={editData.education || ''} onChange={e => handleFieldChange('education', e.target.value)} className="w-full text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Instituição</label>
                    <input value={editData.institution || ''} onChange={e => handleFieldChange('institution', e.target.value)} className="w-full text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Áreas de interesse</label>
                    <input value={editData.interestAreas || ''} onChange={e => handleFieldChange('interestAreas', e.target.value)} className="w-full text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange" />
                  </div>
                </>
              ) : (
                <>
                  <InfoRow label="Escolaridade" value={candidate.schoolingLevel} />
                  <InfoRow label="Formação" value={candidate.education} />
                  <InfoRow label="Instituição" value={candidate.institution} />
                  <InfoRow label="Data de formatura" value={fmt(candidate.graduationDate)} />
                  <InfoRow label="Áreas de interesse" value={candidate.interestAreas} />
                </>
              )}
            </DataGroup>

            {/* Experiência */}
            <DataGroup icon={Briefcase} title="Experiência e Habilidades">
              {isEditing ? (
                <>
                  <div className="col-span-2 md:col-span-3">
                    <label className="block text-xs text-muted-foreground mb-1">Experiências anteriores</label>
                    <textarea value={editData.experience || ''} onChange={e => handleFieldChange('experience', e.target.value)} rows={4} className="w-full text-sm border border-input rounded px-2 py-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange resize-none" />
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <label className="block text-xs text-muted-foreground mb-1">Cursos e certificações</label>
                    <textarea value={editData.courses || ''} onChange={e => handleFieldChange('courses', e.target.value)} rows={3} className="w-full text-sm border border-input rounded px-2 py-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Expectativa salarial</label>
                    <input value={editData.salaryExpectation || ''} onChange={e => handleFieldChange('salaryExpectation', e.target.value)} className="w-full text-sm border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange" />
                  </div>
                </>
              ) : (
                <>
                  {candidate.experience && (
                    <div className="col-span-2 md:col-span-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Experiências anteriores</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{candidate.experience}</p>
                    </div>
                  )}
                  {candidate.courses && (
                    <div className="col-span-2 md:col-span-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Cursos e certificações</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{candidate.courses}</p>
                    </div>
                  )}
                  {candidate.certifications && (
                    <div className="col-span-2 md:col-span-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Certificações profissionais</p>
                      <p className="text-sm text-foreground">{candidate.certifications}</p>
                    </div>
                  )}
                  <InfoRow label="Expectativa salarial" value={candidate.salaryExpectation} />
                  <InfoRow label="Referências" value={candidate.references || candidate.professional_references} />
                </>
              )}
            </DataGroup>

            {/* Documentos */}
            {!isEditing && (candidate.cvUrl || candidate.portfolioUrl) && (
              <DataGroup icon={FileText} title="Documentos">
                {candidate.cvUrl && (
                  <div>
                    <a href={candidate.cvUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-500 hover:underline">
                      <FileText size={14} /> Currículo <ExternalLink size={11} />
                    </a>
                  </div>
                )}
                {candidate.portfolioUrl && (
                  <div>
                    <a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-500 hover:underline">
                      <ExternalLink size={14} /> Portfólio <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </DataGroup>
            )}

            {/* Campo livre */}
            {isEditing ? (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Seja Você!</label>
                <textarea value={editData.freeField || ''} onChange={e => handleFieldChange('freeField', e.target.value)} rows={4} className="w-full text-sm border border-input rounded px-2 py-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-young-orange resize-none" placeholder="Bio, observações, informações adicionais..." />
              </div>
            ) : candidate.freeField ? (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Seja Você!</p>
                <p className="text-sm text-foreground whitespace-pre-wrap bg-muted rounded-lg p-3">{candidate.freeField}</p>
              </div>
            ) : null}

          </div>
        )}
      </div>
    </div>
  );
}
