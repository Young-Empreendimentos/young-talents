import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, User, Briefcase, Calendar, FileText, Mail, Phone, MapPin,
  Building2, GraduationCap, Award, ExternalLink, Edit3, Save, X,
  History, MessageSquare, Clock, UserPlus, Tag, Database, TrendingUp,
  CheckCircle, XCircle, AlertCircle, Clock as ClockIcon, ExternalLink as ExternalLinkIcon, Heart
} from 'lucide-react';
import { supabase } from '../supabase';
import { mapCandidateFromSupabase } from '../utils/candidateFromSupabase';
import { prepareCandidateForDisplay, formatCandidateDate, formatCandidateTimestamp } from '../utils/candidateDisplay';
import { photoDisplayUrl, parseCandidateUrls } from '../utils/urlUtils';
import { LinkStatusBadge, LinkWithStatus } from './ui/LinkStatusBadge';
import { PIPELINE_STAGES, STATUS_COLORS, CLOSING_STATUSES, ALL_STATUSES } from '../constants';
import { normalizeCity, getMainCitiesOptions } from '../utils/cityNormalizer';
import { normalizeSource, getMainSourcesOptions } from '../utils/sourceNormalizer';
import { normalizeInterestArea, normalizeInterestAreasString, getMainInterestAreasOptions } from '../utils/interestAreaNormalizer';
import { formatChildrenForDisplay, CHILDREN_OPTIONS, normalizeChildrenForStorage } from '../utils/childrenNormalizer';

// Novos componentes de aba
import OverviewTab from './candidate-profile/tabs/OverviewTab';
import ExperienceTab from './candidate-profile/tabs/ExperienceTab';
import EducationTab from './candidate-profile/tabs/EducationTab';
import ProcessTab from './candidate-profile/tabs/ProcessTab';
import PersonalTab from './candidate-profile/tabs/PersonalTab';
import AdminTab from './candidate-profile/tabs/AdminTab';

export default function CandidateProfilePage({
  candidates = [],
  jobs = [],
  companies = [],
  applications = [],
  interviews = [],
  statusMovements = [],
  activityLog = [],
  onUpdateCandidate,
  onCreateApplication,
  onScheduleInterview,
  onStatusChange
}) {
  const { id, tab } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const activeTab = tab || 'overview';
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [changeLog, setChangeLog] = useState([]);
  const [saving, setSaving] = useState(false);
  const [photoLoadError, setPhotoLoadError] = useState(false);

  const initials = (name) => {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0][0] || '?').toUpperCase();
  };

  // Buscar candidato: primeiro na lista, depois por ID no Supabase
  useEffect(() => {
    if (!id) return;
    const foundInList = candidates.find(c => c.id === id);
    if (foundInList) {
      setCandidate(foundInList);
      setEditData(foundInList);
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase.from('talents_candidates').select('*').eq('id', id).maybeSingle();
      if (error) {
        console.warn('Erro ao buscar candidato:', error);
        setCandidate(null);
        setLoading(false);
        return;
      }
      const mapped = data ? prepareCandidateForDisplay(mapCandidateFromSupabase(data)) : null;
      setCandidate(mapped);
      if (mapped) setEditData(mapped);
      setLoading(false);
    })();
  }, [id, candidates]);

  useEffect(() => {
    setPhotoLoadError(false);
  }, [candidate?.id]);

  // Buscar log de alterações - TODO: Migrar para Supabase
  useEffect(() => {
    if (!id) return;
    // TODO: Carregar changeLog do Supabase
    setChangeLog([]);
  }, [id]);

  // Dados do candidato filtrados
  const candidateApplications = useMemo(() => {
    if (!candidate) return [];
    return applications.filter(a => a.candidateId === candidate.id);
  }, [candidate, applications]);

  const candidateInterviews = useMemo(() => {
    if (!candidate) return [];
    return interviews.filter(i => i.candidateId === candidate.id);
  }, [candidate, interviews]);

  const candidateMovements = useMemo(() => {
    if (!candidate) return [];
    return statusMovements.filter(m => m.candidateId === candidate.id);
  }, [candidate, statusMovements]);

  const candidateActivityLog = useMemo(() => {
    if (!id || !activityLog?.length) return [];
    return [...activityLog]
      .filter(a => a.entityType === 'candidate' && a.entityId === id)
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }, [activityLog, id]);

  // Todos os envios deste email (múltiplos cadastros = múltiplas linhas)
  const submissionsByEmail = useMemo(() => {
    if (!candidate?.email) return [];
    const sameEmail = candidates.filter(c => c.email === candidate.email);
    const getTs = (c) => {
      const ot = c.original_timestamp;
      if (ot) return new Date(ot).getTime();
      const ca = c.createdAt;
      if (ca?.seconds) return ca.seconds * 1000;
      if (typeof ca === 'string') return new Date(ca).getTime();
      return 0;
    };
    return sameEmail.sort((a, b) => getTs(b) - getTs(a));
  }, [candidate?.email, candidates]);

  // Dados calculados para scorecards
  const scorecards = useMemo(() => {
    if (!candidate) return [];

    const completedInterviews = candidateInterviews.filter(i =>
      i.status === 'Realizada' || i.status === 'Confirmada'
    ).length;

    const activeApplications = candidateApplications.filter(a =>
      !CLOSING_STATUSES.includes(a.status)
    ).length;

    const getCadastroDate = (c) => {
      if (c.original_timestamp) return new Date(c.original_timestamp);
      if (c.createdAt?.seconds) return new Date(c.createdAt.seconds * 1000);
      if (c.createdAt?.toDate) return c.createdAt.toDate();
      if (c.createdAt) return new Date(c.createdAt);
      return null;
    };
    const created = getCadastroDate(candidate);
    const daysInPipeline = created ? Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return [
      {
        title: 'Status Atual',
        value: candidate.status || 'Inscrito',
        icon: TrendingUp,
        color: STATUS_COLORS[candidate.status] || 'bg-slate-600',
        subtitle: PIPELINE_STAGES.includes(candidate.status) ? 'Em processo' : 'Finalizado'
      },
      {
        title: 'Candidaturas Ativas',
        value: activeApplications,
        icon: Briefcase,
        color: 'bg-blue-600',
        subtitle: `${candidateApplications.length} total`
      },
      {
        title: 'Entrevistas Realizadas',
        value: completedInterviews,
        icon: Calendar,
        color: 'bg-green-600',
        subtitle: `${candidateInterviews.length} agendadas`
      },
      {
        title: 'Dias no Pipeline',
        value: daysInPipeline,
        icon: ClockIcon,
        color: 'bg-purple-600',
        subtitle: 'Tempo desde o cadastro (envio do formulário)'
      }
    ];
  }, [candidate, applications, interviews, statusMovements]);

  // Formatar data (usa utilitário que trata histórico + novos dados)
  const formatDate = (ts) => formatCandidateDate(ts) ?? 'N/A';
  const formatDateTime = (ts) => formatCandidateTimestamp(ts) ?? 'N/A';
  const formatTimestamp = formatDateTime;

  // Registrar alteração no log - TODO: Migrar para Supabase
  const recordChange = async (field, oldValue, newValue, userId, userName) => {
    if (!id) return;
    // TODO: Migrar para Supabase
    console.log('Record change:', { field, oldValue, newValue, userId, userName });
  };

  // Salvar alterações
  const handleSave = async () => {
    if (!candidate || !id) return;

    setSaving(true);
    try {
      // TODO: Migrar para Supabase
      const changes = [];
      Object.keys(editData).forEach(key => {
        if (key === 'id' || key === 'createdAt' || key === 'updatedAt' || key === 'changeLog') return;
        const oldValue = candidate[key];
        const newValue = editData[key];
        if (oldValue !== newValue) {
          changes.push({ field: key, oldValue, newValue });
        }
      });

      console.log('Save candidate:', { id, editData, changes });

      // Registra cada alteração no log
      // TODO: Implementar registro de alterações quando migrar para Supabase
      // if (user && changes.length > 0) {
      //   for (const change of changes) {
      //     await recordChange(
      //       change.field,
      //       change.oldValue,
      //       change.newValue,
      //       user.email,
      //       user.displayName || user.email
      //     );
      //   }
      // }

      // Atualiza estado local
      setCandidate({ ...candidate, ...editData });
      setIsEditing(false);

      if (onUpdateCandidate) {
        onUpdateCandidate({ id, ...editData });
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar alterações: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Handler para mudanças nos campos
  const handleFieldChange = (field, value) => {
    // Normaliza campos específicos
    let normalizedValue = value;
    if (field === 'city' && value) {
      normalizedValue = normalizeCity(value);
    } else if (field === 'source' && value) {
      normalizedValue = normalizeSource(value);
    } else if (field === 'interestAreas' && value) {
      normalizedValue = normalizeInterestAreasString(value);
    }

    setEditData(prev => ({ ...prev, [field]: normalizedValue }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando candidato...</p>
        </div>
      </div>
    );
  }

  if (!candidate && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">Candidato não encontrado</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">O perfil solicitado não existe ou você não tem acesso.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: User },
    { id: 'experience', label: 'Experiência & Habilidades', icon: Briefcase },
    { id: 'education', label: 'Formação', icon: GraduationCap },
    { id: 'process', label: 'Processo Seletivo', icon: FileText },
    { id: 'personal', label: 'Dados Pessoais', icon: Heart }, // Note: I used Heart icon in PersonalTab.jsx
    { id: 'admin', label: 'Administrativo', icon: Database }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(location.state?.from || '/dashboard')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 flex-shrink-0 overflow-hidden flex items-center justify-center text-lg font-bold text-slate-500 dark:text-slate-300 shadow-sm relative group">
                {candidate.photoUrl && !photoLoadError ? (
                  <img
                    src={photoDisplayUrl(candidate.photoUrl)}
                    alt={candidate.fullName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                    onError={() => setPhotoLoadError(true)}
                  />
                ) : (
                  <User size={24} className="text-slate-400 dark:text-slate-500" />
                )}
                {candidate.photoUrl && photoLoadError && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 rounded-full bg-amber-100 dark:bg-amber-900/80 p-0.5"
                    title="Link da foto indisponível ou bloqueado – verifique acesso ao Drive/link"
                  >
                    <AlertCircle size={12} className="text-amber-600 dark:text-amber-500" />
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  {candidate.fullName || 'Candidato sem nome'}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_COLORS[candidate.status] || 'bg-slate-600 text-white'}`}>
                    {candidate.status || 'Inscrito'}
                  </span>
                  <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                    {candidate.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Botões de Ação Rápida */}
              {!isEditing && (
                <div className="hidden md:flex items-center gap-2 mr-4 pr-4 border-r border-gray-200 dark:border-gray-700">
                  {/* CV(s) */}
                  {parseCandidateUrls(candidate.cvUrl).map((url, idx, arr) => (
                    <LinkWithStatus
                      key={idx}
                      url={url}
                      label="CV"
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <FileText size={18} /> {arr.length > 1 ? `CV ${idx + 1}` : 'CV'}
                    </LinkWithStatus>
                  ))}

                  {/* Portfolio(s) */}
                  {parseCandidateUrls(candidate.portfolioUrl).map((url, idx, arr) => (
                    <LinkWithStatus
                      key={idx}
                      url={url}
                      label="Portfólio"
                      className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <ExternalLinkIcon size={18} /> {arr.length > 1 ? `Portfólio ${idx + 1}` : 'Portfólio'}
                    </LinkWithStatus>
                  ))}
                </div>
              )}

              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setEditData(candidate);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                  >
                    <Save size={18} />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <Edit3 size={18} />
                  Editar Perfil
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto scroller-hidden">
            {tabs.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/candidate/${id}/${item.id}`, { state: location.state })}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewTab
            candidate={candidate}
            scorecards={scorecards}
            photoLoadError={photoLoadError}
            setPhotoLoadError={setPhotoLoadError}
          />
        )}

        {activeTab === 'experience' && (
          <ExperienceTab
            candidate={candidate}
            editData={editData}
            isEditing={isEditing}
            handleFieldChange={handleFieldChange}
          />
        )}

        {activeTab === 'education' && (
          <EducationTab
            candidate={candidate}
            editData={editData}
            isEditing={isEditing}
            handleFieldChange={handleFieldChange}
            formatDate={formatDate}
          />
        )}

        {activeTab === 'process' && (
          <ProcessTab
            candidate={candidate}
            jobs={jobs}
            applications={applications}
            interviews={interviews}
            statusMovements={statusMovements}
            formatTimestamp={formatTimestamp}
            isEditing={isEditing}
            editData={editData}
            handleFieldChange={handleFieldChange}
            onStatusChange={onStatusChange}
          />
        )}

        {activeTab === 'personal' && (
          <PersonalTab
            candidate={candidate}
            editData={editData}
            isEditing={isEditing}
            handleFieldChange={handleFieldChange}
            formatDate={formatDate}
            photoLoadError={photoLoadError}
          />
        )}

        {activeTab === 'admin' && (
          <AdminTab
            candidate={candidate}
            submissionsByEmail={submissionsByEmail}
            changeLog={changeLog}
            activityLog={candidateActivityLog}
            formatTimestamp={formatTimestamp}
          />
        )}
      </div>
    </div>
  );
}
