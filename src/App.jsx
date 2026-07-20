import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Supabase
import { supabase } from "./supabase";

// Routes & Context
import AppRoutes from './routes/AppRoutes';
import { useTheme } from './ThemeContext';

// Constants & Utils
import {
  ALL_STATUSES,
  CLOSING_STATUSES,
  PIPELINE_STAGES,
  STAGE_REQUIRED_FIELDS,
  FILTER_STORAGE_KEY
} from './constants';
import { getCandidateTimestamp } from './utils/timestampUtils';
import { mapCandidatesFromSupabase, candidateToSupabase } from './utils/candidateFromSupabase';
import { prepareCandidateForDisplay, getCandidateAge } from './utils/candidateDisplay';
import { translateSupabaseError } from './utils/errorMessages';
import {
  mapJobsFromSupabase,
  mapCompaniesFromSupabase,
  mapCitiesFromSupabase,
  mapSectorsFromSupabase,
  mapPositionsFromSupabase,
  mapJobLevelsFromSupabase,
  mapActivityAreasFromSupabase,
  mapApplicationsFromSupabase,
  mapMappingsFromSupabase,
  mappingToSupabase,
  jobToSupabase
} from './utils/fromSupabase';

// Cache de dados mestres em sessionStorage (TTL 5 min)
const CACHE_TTL_MS = 5 * 60 * 1000;
const getCached = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch { return null; }
};
const setCached = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch (_e) { /* ignore */ }
};

const DEV_USER = {
  id: 'dev-local',
  email: 'dev@local',
  displayName: 'Desenvolvimento',
  user_metadata: {},
  photoURL: null
};

const PUBLIC_PATHS = ['/', '/apply', '/apply/test', '/apply/thank-you', '/login', '/reset-password'];

/** Google OAuth pode devolver o e-mail com capitalização diferente da linha em user_roles */
const emailsMatch = (a, b) => {
  if (a == null || b == null) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
};

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const isDevEnv = import.meta.env.DEV;

  // Segurança: fallback DEV_USER só em ambiente local de desenvolvimento.
  const effectiveUser = user ?? (isDevEnv && !supabase ? DEV_USER : null);

  // Auth: sessão Supabase
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      setUser(isDevEnv ? DEV_USER : null);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });
    return () => subscription?.unsubscribe();
  }, [isDevEnv]);

  // Sistema de Rotas usando URL
  const location = useLocation();
  const navigate = useNavigate();

  // Mapear pathname para activeTab
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path === '/' || path === '') return 'dashboard';
    const slug = path.replace(/^\//, '').split('/')[0];
    const validTabs = ['dashboard', 'pipeline', 'candidates', 'mappings', 'submissions', 'jobs', 'applications', 'companies', 'positions', 'sectors', 'cities', 'job_levels', 'activity_areas', 'reports', 'help', 'sobre', 'settings', 'diagnostic'];
    return validTabs.includes(slug) ? slug : 'dashboard';
  };

  const [route, setRoute] = useState({
    page: getActiveTabFromPath(),
    modal: new URLSearchParams(location.search).get('modal') || null,
    id: new URLSearchParams(location.search).get('id') || null,
    settingsTab: new URLSearchParams(location.search).get('settingsTab') || null
  });

  const activeTab = route.page;

  // Sincronizar com mudanças de URL
  useEffect(() => {
    const newTab = getActiveTabFromPath();
    const params = new URLSearchParams(location.search);
    setRoute({
      page: newTab,
      modal: params.get('modal') || null,
      id: params.get('id') || null,
      settingsTab: params.get('settingsTab') || null
    });
  }, [location.pathname, location.search]);

  // Sincronizar query /candidates?status=...&filter=...&jobs=... com filtros
  useEffect(() => {
    if (location.pathname !== '/candidates') return;
    const params = new URLSearchParams(location.search);
    const statusParam = params.get('status');
    const filterParam = params.get('filter');
    const jobsParam = params.get('jobs');
    setFilters(prev => {
      const next = { ...prev };
      if (statusParam) {
        next.status = [statusParam];
        next.dashboardFilter = null;
      } else if (filterParam === 'missing-return') {
        next.dashboardFilter = 'missing-return';
      } else if (jobsParam === 'open') {
        next.dashboardFilter = 'jobs-open';
      } else if (!statusParam && !filterParam && !jobsParam) {
        next.dashboardFilter = null;
      }
      return next;
    });
  }, [location.pathname, location.search]);

  const prevPathnameRef = useRef(location.pathname);
  // YT-03: não zerar filtros ao abrir perfil do candidato; ao voltar do perfil, manter estado
  useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = location.pathname;
    if (location.pathname.startsWith('/candidate/')) return;
    const leftProfile = prev.startsWith('/candidate/') && !location.pathname.startsWith('/candidate/');
    if (leftProfile) return;
    if (location.pathname !== '/candidates') {
      setFilters(initialFilters);
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Raiz "/" é tratada pela rota em AppRoutes: usuário logado → /dashboard; não logado → /apply

  // Proteger rotas: sem sessão e rota não pública -> login
  const isPublicPath = PUBLIC_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  useEffect(() => {
    if (authLoading || !supabase) return;
    if (!user && !isPublicPath) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, isPublicPath, location.pathname, navigate]);

  // settingsTab é agora controlado pelo SettingsPage — sem auto-redirect para 'campos'

  const setActiveTab = (tab) => {
    navigate(`/${tab}`, { replace: true });
    setRoute(prev => ({ ...prev, page: tab }));
  };

  // Dados
  const [pipelineStages, setPipelineStages] = useState(PIPELINE_STAGES);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [cities, setCities] = useState([]);
  const [interestAreas, setInterestAreas] = useState([]);
  const [roles, setRoles] = useState([]);
  // Cargos do Pilares (rh_cargos) via RPC — fonte do picker de Mapeamento.
  // Separado de `roles` (talents_positions), que segue alimentando a aba Cargos.
  const [cargos, setCargos] = useState([]);
  const [jobLevels, setJobLevels] = useState([]);
  const [activityAreas, setActivityAreas] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [schooling, setSchooling] = useState([]);
  const [marital, setMarital] = useState([]);
  const [tags, setTags] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [interactionTypes, setInteractionTypes] = useState([]);
  const [userRoles, setUserRoles] = useState([{ email: DEV_USER.email, role: 'admin', ativo: true }]);
  const [userRolesLoaded, setUserRolesLoaded] = useState(false);
  // Padrão Paver: fila de solicitações de acesso (admin) + status do próprio usuário
  const [accessRequests, setAccessRequests] = useState([]);
  const [accessRequestStatus, setAccessRequestStatus] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const activityLogUnavailableRef = React.useRef(false);

  // Movimentações de status derivadas do activity_log (o app nunca populou um
  // estado próprio de statusMovements). Cada mudança de status vira uma
  // "movimentação"; o status anterior é inferido encadeando, em ordem
  // cronológica, as mudanças do mesmo candidato. Alimenta o card de
  // Relatórios, o funil do Dashboard e a Timeline da ficha do candidato.
  // Obs.: o activity_log é carregado com limite de 500 registros recentes.
  const statusMovements = useMemo(() => {
    const parseNewStatus = (desc = '') => {
      if (/promovido para Considerado/i.test(desc)) return 'Considerado';
      const m = desc.match(/(?:Status alterado|Candidatura atualizada)\s+para\s+(.+?)\s*$/i);
      return m ? m[1].trim() : null;
    };
    const changes = (activityLog || [])
      .filter(l => l.entityType === 'candidate' && parseNewStatus(l.description))
      .map(l => ({
        id: l.id,
        candidateId: l.entityId,
        newStatus: parseNewStatus(l.description),
        timestamp: l.timestamp,
        userName: l.userName,
        userEmail: l.userEmail,
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const lastByCandidate = {};
    for (const mv of changes) {
      mv.previousStatus = lastByCandidate[mv.candidateId] || null;
      lastByCandidate[mv.candidateId] = mv.newStatus;
    }
    return changes;
  }, [activityLog]);
  const dataLoadedForUserRef = useRef(false);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  // Permissions & Roles
  const isDeveloper = useMemo(() => {
    if (!effectiveUser?.email) return false;
    const devEmails = ['dev@local', 'dev@adventurelabs.com.br', 'developer@adventurelabs.com.br'];
    return effectiveUser.email === DEV_USER.email || devEmails.includes(effectiveUser.email.toLowerCase());
  }, [effectiveUser]);

  const userRoleDoc = useMemo(() => {
    if (!effectiveUser?.email) return null;
    return userRoles.find(r => emailsMatch(r.email, effectiveUser.email)) || null;
  }, [effectiveUser, userRoles]);

  const currentUserRole = useMemo(() => {
    if (!effectiveUser?.email) return 'viewer';
    if (isDeveloper) return 'admin';
    // Segurança: sem linha em user_roles, tratar como viewer (nunca assumir admin)
    return userRoleDoc?.role || 'viewer';
  }, [effectiveUser, userRoleDoc, isDeveloper]);

  const hasPermission = (action) => {
    if (isDeveloper) return true;
    const permissions = {
      admin: ['all'],
      editor: ['view', 'edit_candidates', 'move_pipeline', 'schedule_interviews', 'add_notes'],
      viewer: ['view']
    };
    const userPerms = permissions[currentUserRole] || [];
    return userPerms.includes('all') || userPerms.includes(action);
  };

  // Modais - sincronizados com URL
  const isJobModalOpen = route.modal === 'job';
  const isCsvModalOpen = route.modal === 'csv';
  const viewingJob = route.modal === 'job-candidates' && route.id ? jobs.find(j => j.id === route.id) : null;
  const [editingCandidate, setEditingCandidate] = useState(null);

  const openCandidateProfile = (candidate) => {
    if (!candidate) return;
    const found = typeof candidate === 'string'
      ? candidates.find(c => c.id === candidate)
      : candidate;
    if (found) setEditingCandidate(found);
  };

  const [editingJob, setEditingJob] = useState(null);
  const [pendingTransition, setPendingTransition] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [dashboardModalCandidates, setDashboardModalCandidates] = useState(null);
  const [dashboardModalTitle, setDashboardModalTitle] = useState('');
  const [highlightedCandidateId, setHighlightedCandidateId] = useState(null);
  const [interviewModalData, setInterviewModalData] = useState(null);
  const [linkToJobCandidate, setLinkToJobCandidate] = useState(null);

  // Modal Helpers
  const openJobModal = (job = null) => {
    if (job?.id) {
      navigate(`/jobs/${job.id}`);
    } else {
      navigate('/jobs/new');
    }
    setRoute(prev => ({ ...prev, page: 'jobs', modal: null, id: null }));
  };

  const closeJobModal = () => {
    setEditingJob(null);
    if (location.pathname === '/jobs/new' || /^\/jobs\/[^/]+$/.test(location.pathname)) {
      navigate('/jobs');
    } else {
      navigate(location.pathname);
    }
    setRoute(prev => ({ ...prev, page: 'jobs', modal: null, id: null }));
  };

  const openCsvModal = () => {
    const params = new URLSearchParams(location.search);
    params.set('modal', 'csv');
    navigate(`${location.pathname}?${params.toString()}`);
    setRoute(prev => ({ ...prev, modal: 'csv' }));
  };

  const closeCsvModal = () => {
    navigate(location.pathname);
    setRoute(prev => ({ ...prev, modal: null }));
  };

  const openJobCandidatesModal = (job) => {
    const params = new URLSearchParams(location.search);
    params.set('modal', 'job-candidates');
    if (job?.id) params.set('id', job.id);
    navigate(`${location.pathname}?${params.toString()}`);
    setRoute(prev => ({ ...prev, modal: 'job-candidates', id: job?.id || '' }));
  };

  const closeJobCandidatesModal = () => {
    navigate(location.pathname);
    setRoute(prev => ({ ...prev, modal: null, id: null }));
  };

  // Filtros
  const initialFilters = {
    jobId: 'all',
    company: 'all',
    city: 'all',
    interestArea: 'all',
    cnh: 'all',
    ageMin: 'all',
    ageMax: 'all',
    marital: 'all',
    origin: 'all',
    schooling: 'all',
    createdAtPreset: 'all',
    tags: 'all',
    status: 'all',
    dashboardFilter: null,
    starredFilter: 'all' // 'all' | 'starred' | 'unstarred'
  };
  const [filters, setFilters] = useState(() => {
    try {
      const stored = localStorage.getItem(FILTER_STORAGE_KEY);
      if (stored) return { ...initialFilters, ...JSON.parse(stored) };
    } catch (e) {
      console.warn('Erro ao carregar filtros salvos', e);
    }
    return initialFilters;
  });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Supabase Data Loaders
  const schema = () => supabase;

  const loadCandidates = React.useCallback(async () => {
    if (!supabase) return;
    setCandidatesLoading(true);
    try {
      const PAGE_SIZE = 1000;
      let allRows = [];
      let offset = 0;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from('talents_candidates')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);
        if (error) throw error;
        const chunk = data ?? [];
        allRows = allRows.concat(chunk);
        hasMore = chunk.length >= PAGE_SIZE;
        offset += PAGE_SIZE;
      }
      setCandidates(mapCandidatesFromSupabase(allRows).map(prepareCandidateForDisplay));
    } catch (e) {
      console.error('Erro ao carregar candidatos:', e);
      setCandidates([]);
      showToast('Falha ao carregar candidatos.', 'error');
    } finally {
      setCandidatesLoading(false);
    }
  }, []);

  const loadJobs = React.useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await schema().from('talents_jobs').select('*').order('created_at', { ascending: false });
    if (!error) setJobs(mapJobsFromSupabase(data ?? []));
  }, []);

  const loadCompanies = React.useCallback(async () => {
    if (!supabase) return;
    const cached = getCached('yt_cache_companies');
    if (cached) setCompanies(cached);
    const { data, error } = await schema().from('talents_companies').select('*').order('name');
    if (!error) {
      const mapped = mapCompaniesFromSupabase(data ?? []);
      setCompanies(mapped);
      setCached('yt_cache_companies', mapped);
    }
  }, []);

  const loadCities = React.useCallback(async () => {
    if (!supabase) return;
    const cached = getCached('yt_cache_cities');
    if (cached) setCities(cached);
    const { data, error } = await schema().from('talents_cities').select('*').order('name');
    if (!error) {
      const mapped = mapCitiesFromSupabase(data ?? []);
      setCities(mapped);
      setCached('yt_cache_cities', mapped);
    }
  }, []);

  const loadSectors = React.useCallback(async () => {
    if (!supabase) return;
    const cached = getCached('yt_cache_sectors');
    if (cached) setSectors(cached);
    const { data, error } = await schema().from('talents_sectors').select('*').order('name');
    if (!error) {
      const mapped = mapSectorsFromSupabase(data ?? []);
      setSectors(mapped);
      setCached('yt_cache_sectors', mapped);
    }
  }, []);

  const loadRoles = React.useCallback(async () => {
    if (!supabase) return;
    const cached = getCached('yt_cache_positions');
    if (cached) setRoles(cached);
    const { data, error } = await schema().from('talents_positions').select('*').order('name');
    if (!error) {
      const mapped = mapPositionsFromSupabase(data ?? []);
      setRoles(mapped);
      setCached('yt_cache_positions', mapped);
    }
  }, []);

  // Cargos do Pilares (rh_cargos) para o picker de Mapeamento, via RPC
  // SECURITY DEFINER (talents_list_cargos), pois o RLS de rh_cargos bloqueia
  // quem nao e staff do RH. Devolve { id, nome, trilha }; mapeia p/ { id, name, trilha }.
  const loadCargos = React.useCallback(async () => {
    if (!supabase) return;
    const cached = getCached('yt_cache_cargos');
    if (cached) setCargos(cached);
    const { data, error } = await supabase.rpc('talents_list_cargos');
    if (!error && Array.isArray(data)) {
      const mapped = data.map(r => ({ id: r.id, name: r.nome, trilha: r.trilha || null }));
      setCargos(mapped);
      setCached('yt_cache_cargos', mapped);
    }
  }, []);

  const loadJobLevels = React.useCallback(async () => {
    if (!supabase) return;
    const cached = getCached('yt_cache_job_levels');
    if (cached) setJobLevels(cached);
    const { data, error } = await schema().from('talents_job_levels').select('*').order('name');
    if (!error) {
      const mapped = mapJobLevelsFromSupabase(data ?? []);
      setJobLevels(mapped);
      setCached('yt_cache_job_levels', mapped);
    }
  }, []);

  const loadActivityAreas = React.useCallback(async () => {
    if (!supabase) return;
    const cached = getCached('yt_cache_activity_areas');
    if (cached) setActivityAreas(cached);
    const { data, error } = await schema().from('talents_activity_areas').select('*').order('name');
    if (!error) {
      const mapped = mapActivityAreasFromSupabase(data ?? []);
      setActivityAreas(mapped);
      setCached('yt_cache_activity_areas', mapped);
    }
  }, []);

  const loadApplications = React.useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await schema().from('talents_applications').select('*').order('created_at', { ascending: false });
    if (!error) setApplications(mapApplicationsFromSupabase(data ?? []));
  }, []);

  const loadMappings = React.useCallback(async () => {
    if (!supabase) return;
    // Traz nome/e-mail do candidato junto (via FK) para o Mapeamento nao depender
    // do carregamento da lista inteira de candidatos (~2.9k) para exibir o nome.
    const { data, error } = await schema().from('talents_mappings')
      .select('*, candidate:talents_candidates(id, full_name, email)')
      .order('created_at', { ascending: false });
    if (!error) setMappings(mapMappingsFromSupabase(data ?? []));
  }, []);

  const loadInteractionTypes = React.useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await schema().from('talents_interaction_types').select('*').eq('is_active', true).order('created_at');
    if (!error) setInteractionTypes(data ?? []);
  }, []);

  const loadInteractions = React.useCallback(async (candidateId) => {
    if (!supabase || !candidateId) return;
    const { data, error } = await schema().from('talents_interactions').select('*').eq('candidate_id', candidateId).order('occurred_at', { ascending: false });
    if (!error) setInteractions(prev => {
      const without = prev.filter(i => i.candidateId !== candidateId);
      const mapped = (data ?? []).map(r => {
        const email = r.created_by_email;
        const savedName = r.created_by_name;
        const roleEntry = email ? userRoles.find(u => u.email?.toLowerCase() === email.toLowerCase()) : null;
        const resolvedName = roleEntry?.name || (savedName && !savedName.includes('@') ? savedName : null) || email?.split('@')[0] || null;
        return {
          id: r.id, candidateId: r.candidate_id, type: r.interaction_type,
          occurredAt: r.occurred_at, notes: r.notes,
          createdByEmail: email, createdByName: resolvedName,
          createdAt: r.created_at
        };
      });
      return [...without, ...mapped];
    });
  }, [userRoles]);

  const addInteraction = React.useCallback(async ({ candidateId, type, occurredAt, notes }) => {
    if (!supabase) return null;
    const payload = {
      candidate_id: candidateId,
      interaction_type: type,
      occurred_at: occurredAt,
      notes: notes || null,
      created_by_email: effectiveUser?.email || null,
      created_by_name: userRoleDoc?.name || effectiveUser?.displayName || effectiveUser?.user_metadata?.full_name || effectiveUser?.user_metadata?.name || effectiveUser?.email?.split('@')[0] || null,
      created_at: new Date().toISOString()
    };
    const { data, error } = await schema().from('talents_interactions').insert(payload).select('*').single();
    if (error) throw error;
    const mapped = {
      id: data.id, candidateId: data.candidate_id, type: data.interaction_type,
      occurredAt: data.occurred_at, notes: data.notes,
      createdByEmail: data.created_by_email, createdByName: data.created_by_name,
      createdAt: data.created_at
    };
    setInteractions(prev => [mapped, ...prev]);
    return mapped;
  }, [effectiveUser, userRoleDoc]);

  const deleteInteraction = React.useCallback(async (id) => {
    if (!supabase) return;
    const { error } = await schema().from('talents_interactions').delete().eq('id', id);
    if (!error) setInteractions(prev => prev.filter(i => i.id !== id));
  }, []);

  const loadActivityLog = React.useCallback(async () => {
    if (activityLogUnavailableRef.current || !supabase) {
      setActivityLog([]);
      return;
    }
    try {
      const { data, error } = await supabase.from('talents_activity_log').select('*').order('created_at', { ascending: false }).limit(500);
      if (error) {
        if (error.code !== 'PGRST116' && error.code !== '42P01') console.warn('[ActivityLog] Erro:', error.message);
        activityLogUnavailableRef.current = true;
        setActivityLog([]);
        return;
      }
      if (data) setActivityLog(data.map(row => ({ id: row.id, type: row.action, description: row.details, userName: row.user_name, userEmail: row.user_email, timestamp: row.created_at, entityType: row.entity_type, entityId: row.entity_id })));
    } catch (_e) {
      activityLogUnavailableRef.current = true;
      setActivityLog([]);
    }
  }, []);

  // Padrão Paver: solicitações de acesso pendentes (para o card de aprovação na home).
  const loadAccessRequests = React.useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('talents_solicitacao_acesso')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });
    if (!error) setAccessRequests(data ?? []);
  }, []);

  const loadAllData = React.useCallback(async () => {
    await Promise.all([loadCandidates(), loadJobs(), loadCompanies(), loadCities(), loadSectors(), loadRoles(), loadCargos(), loadJobLevels(), loadActivityAreas(), loadApplications(), loadInteractionTypes(), loadMappings()]);
  }, [loadCandidates, loadJobs, loadCompanies, loadCities, loadSectors, loadRoles, loadCargos, loadJobLevels, loadActivityAreas, loadApplications, loadInteractionTypes, loadMappings]);

  /** Painel interno: cadastro explícito em user_roles como admin, editor ou viewer (somente leitura). */
  const hasStaffRole = useMemo(() => {
    if (isDeveloper) return true;
    if (!effectiveUser?.email) return false;
    const r = userRoleDoc?.role;
    return r === 'admin' || r === 'editor' || r === 'viewer';
  }, [isDeveloper, effectiveUser, userRoleDoc]);

  /** 2ª validação (padrão Paver): além do papel, exige ativo=true (soft-disable). */
  const hasActiveAccess = useMemo(() => {
    if (isDeveloper) return true;
    return hasStaffRole && userRoleDoc?.ativo !== false;
  }, [isDeveloper, hasStaffRole, userRoleDoc]);

  /** Evita redirect para /login antes do fetch de user_roles (comum após OAuth). */
  const authStaffReady = useMemo(() => {
    if (!effectiveUser?.email) return true;
    if (isDeveloper) return true;
    return userRolesLoaded;
  }, [effectiveUser, isDeveloper, userRolesLoaded]);

  useEffect(() => {
    if (!effectiveUser) {
      dataLoadedForUserRef.current = false;
      return;
    }
    // Só carrega dados do app interno quando usuário tem acesso ATIVO (papel + ativo) ou é dev
    if (!hasActiveAccess) {
      dataLoadedForUserRef.current = false;
      return;
    }
    let channel;
    if (!dataLoadedForUserRef.current) {
      loadAllData().then(() => {
        dataLoadedForUserRef.current = true;
      });
      if (currentUserRole === 'admin') {
        loadActivityLog();
        loadAccessRequests();
      }
    }
    if (supabase) {
      channel = supabase.channel('candidates_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'talents_candidates' }, () => { loadCandidates(); }).subscribe();
    }
    return () => {
      if (supabase && channel) supabase.removeChannel(channel);
    };
  }, [effectiveUser, loadAllData, loadActivityLog, loadAccessRequests, currentUserRole, hasActiveAccess, loadCandidates]);

  // Sync user_roles
  const prevUserEmailRef = useRef(null);
  useEffect(() => {
    if (!supabase) {
      setUserRolesLoaded(false);
      return;
    }
    if (!user) {
      prevUserEmailRef.current = null;
      setUserRolesLoaded(false);
      return;
    }
    if (user.email === DEV_USER.email) {
      prevUserEmailRef.current = user.email;
      setUserRolesLoaded(true);
      return;
    }
    // Só reseta userRolesLoaded se o email mudou (login diferente).
    // Token refresh do Supabase muda a ref de `user` mas mantém o email —
    // não devemos desmontar o app inteiro por causa disso.
    const emailChanged = prevUserEmailRef.current !== user.email;
    prevUserEmailRef.current = user.email;
    if (emailChanged) {
      setUserRolesLoaded(false);
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await schema().from('talents_user_roles').select('*').order('created_at', { ascending: false });
        if (cancelled) return;
        if (!error && data) {
          setUserRoles(data);
          const current = data.find(r => emailsMatch(r.email, user.email));
          if (current) {
            const needsUpdate = current.user_id !== user.id || (user.user_metadata?.full_name || user.user_metadata?.name) !== current.name;
            if (needsUpdate) {
              await schema().from('talents_user_roles').update({ user_id: user.id, name: user.user_metadata?.full_name || user.user_metadata?.name || current.name, last_login: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', current.id);
            }
          }
        }
      } catch (err) {
        console.error('Erro user_roles:', err);
      } finally {
        if (!cancelled) setUserRolesLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Onboarding automático (padrão Paver): logou sem acesso ativo → registra/reabre
  // pedido em talents_solicitacao_acesso e busca o status próprio para a tela.
  useEffect(() => {
    if (!supabase || !user || user.email === DEV_USER.email || !userRolesLoaded) return;
    if (hasActiveAccess) { setAccessRequestStatus(null); return; }
    let cancelled = false;
    (async () => {
      try {
        await supabase.rpc('talents_registrar_solicitacao_acesso');
      } catch (e) { console.warn('registrar_solicitacao_acesso:', e?.message); }
      try {
        const { data } = await supabase
          .from('talents_solicitacao_acesso')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!cancelled) setAccessRequestStatus(data?.status || 'pending');
      } catch (_e) {
        if (!cancelled) setAccessRequestStatus('pending');
      }
    })();
    return () => { cancelled = true; };
  }, [user, userRolesLoaded, hasActiveAccess]);

  // Handlers
  const recordActivity = async (activityType, description, entityType = null, entityId = null, metadata = {}) => {
    if (!effectiveUser || !effectiveUser.email || !supabase) return;
    try {
      const payload = { user_id: effectiveUser.id || null, user_email: effectiveUser.email, user_name: effectiveUser.displayName || effectiveUser.email, action: activityType, entity_type: entityType, entity_id: entityId, details: description || '', meta: metadata && Object.keys(metadata).length > 0 ? metadata : null };
      const { data, error } = await supabase.from('talents_activity_log').insert(payload).select('id, created_at').single();
      if (!error && data) setActivityLog(prev => [...prev, { id: data.id, type: activityType, description, userName: payload.user_name, userEmail: payload.user_email, timestamp: data.created_at, entityType, entityId }]);
    } catch (e) { console.warn('Erro activity log:', e); }
  };

  const handleToggleStar = async (c) => {
    if (!supabase || !c?.id) return;
    const previousCandidates = candidates;
    setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, starred: !x.starred } : x));
    try {
      const { error } = await supabase.from('talents_candidates').update({ starred: !c.starred }).eq('id', c.id);
      if (error) throw error;
      await recordActivity('update', c.starred ? 'Removido de mapeado como interesse' : 'Mapeado como interesse', 'candidate', c.id);
      showToast('Atualizado.', 'success');
    } catch (err) {
      console.error('Erro ao marcar estrela:', err);
      setCandidates(previousCandidates);
      const { text } = translateSupabaseError(err?.message);
      showToast(text, 'error');
    }
  };

  const handleSaveGeneric = async (col, d, closeFn, options = {}) => {
    const { omitApprovedBy = false } = options;
    if (!supabase) return;
    setIsSaving(true);
    try {
      if (col === 'jobs') {
        let payload = jobToSupabase(d);
        if (omitApprovedBy) {
          const { approved_by, ...rest } = payload;
          payload = rest;
        }
        if (d.id) {
          const { id, ...rest } = payload;
          const { error } = await schema().from('talents_jobs').update(rest).eq('id', d.id);
          if (error) throw error;
          showToast('Vaga atualizada.', 'success');
          await recordActivity('update', `Vaga "${d.title}" atualizada`, 'job', d.id, { title: d.title });
        } else {
          const { data: inserted, error } = await schema().from('talents_jobs').insert(payload).select('id').single();
          if (error) throw error;
          if (inserted) await recordActivity('create', `Vaga "${d.title}" criada`, 'job', inserted.id, { title: d.title });
          showToast('Vaga criada.', 'success');
        }
        await loadJobs();
      } else if (col === 'candidates') {
        const payload = candidateToSupabase(d);
        const activityDescription = options.activityDescription;
        if (d.id) {
          const { id, ...rest } = payload;
          const { error } = await supabase.from('talents_candidates').update(rest).eq('id', d.id);
          if (error) throw error;
          await recordActivity('update', activityDescription || 'Candidato atualizado', 'candidate', d.id, { fullName: d.fullName });
          showToast('Candidato atualizado.', 'success');
          if (d.status != null && d.id) {
            const { error: syncErr } = await schema().from('talents_applications').update({ status: d.status, last_activity: new Date().toISOString() }).eq('candidate_id', d.id);
            if (syncErr) console.warn('Sincronizar candidaturas:', syncErr);
            else await loadApplications();
          }
        } else {
          const { data: inserted, error } = await supabase.from('talents_candidates').insert(payload).select('id').single();
          if (error) throw error;
          await recordActivity('create', 'Candidato criado', 'candidate', inserted?.id, { fullName: d.fullName });
          showToast('Candidato criado.', 'success');
        }
        await loadCandidates();
      } else {
        const { id, ...rest } = d;
        const { error } = id ? await schema().from('talents_' + col).update(rest).eq('id', id) : await schema().from('talents_' + col).insert(rest);
        if (error) throw error;
        showToast('Sucesso!', 'success');
        if (col === 'companies') await loadCompanies();
        if (col === 'cities') await loadCities();
        if (col === 'sectors') await loadSectors();
        if (col === 'positions') await loadRoles();
        if (col === 'job_levels') await loadJobLevels();
        if (col === 'activity_areas') await loadActivityAreas();
      }
      closeFn?.();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      const { text, isApprovedByMissing } = translateSupabaseError(err?.message, { entity: col });
      showToast(text, 'error');
      if (col === 'jobs' && isApprovedByMissing && !omitApprovedBy && window.confirm('O campo "Quem autorizou a abertura" fica na tela de edição da vaga, na seção de gestão (abaixo de "Recrutador Responsável"). Deseja salvar a vaga mesmo assim sem preencher esse campo?')) {
        await handleSaveGeneric(col, d, closeFn, { omitApprovedBy: true });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGeneric = async (col, id) => {
    if (!window.confirm('Excluir este item?')) return;
    try {
      const { error } = col === 'jobs' ? await schema().from('talents_jobs').update({ deleted_at: new Date().toISOString() }).eq('id', id) : await schema().from('talents_' + col).delete().eq('id', id);
      if (error) throw error;
      showToast('Excluído com sucesso.', 'success');
      if (col === 'jobs') await loadJobs();
      else if (col === 'companies') await loadCompanies();
      else if (col === 'cities') await loadCities();
      else if (col === 'sectors') await loadSectors();
      else if (col === 'positions') await loadRoles();
      else if (col === 'job_levels') await loadJobLevels();
      else if (col === 'activity_areas') await loadActivityAreas();
      else if (col === 'candidates') await loadCandidates();
    } catch (err) { showToast(translateSupabaseError(err?.message, { entity: col }).text || 'Erro ao excluir.', 'error'); }
  };

  const createApplication = async (candidateId, jobId) => {
    if (!effectiveUser || !supabase) return null;
    const existing = applications.find(a => a.candidateId === candidateId && a.jobId === jobId);
    if (existing) { showToast('Candidato já vinculado a esta vaga', 'info'); return existing; }
    const candidate = candidates.find(c => c.id === candidateId);
    const job = jobs.find(j => j.id === jobId);
    try {
      // Avisa sobre automação se candidato vai ser promovido para Considerado
      if (candidate?.status === 'Inscrito') {
        const confirmar = window.confirm(
          `⚠️ Automação ativa\n\n` +
          `Ao vincular "${candidate.fullName}" a esta vaga, o status será alterado para "Considerado" e o candidato receberá automaticamente:\n\n` +
          `📧 Email: "Você avançou no processo seletivo"\n` +
          `🎥 Vídeo 1: Boas-vindas à Young Empreendimentos\n\n` +
          `O email será enviado para: ${candidate.email}\n\n` +
          `Deseja continuar?`
        );
        if (!confirmar) return null;
      }

      const payload = { candidate_id: candidateId, job_id: jobId, candidate_name: candidate?.fullName || 'Candidato', candidate_email: candidate?.email || '', job_title: job?.title || 'Vaga', job_company: job?.company || '', status: 'Considerado', applied_at: new Date().toISOString(), created_by: effectiveUser.email, created_at: new Date().toISOString() };
      const { data, error } = await schema().from('talents_applications').insert(payload).select('*').single();
      if (error) throw error;
      // Se candidato ainda estava como 'Inscrito', promove para 'Considerado' automaticamente
      if (candidate?.status === 'Inscrito') {
        await schema().from('talents_candidates').update({ status: 'Considerado', updated_at: new Date().toISOString() }).eq('id', candidateId);
        await loadCandidates();
      }
      await recordActivity('update', 'Candidatura criada — promovido para Considerado', 'candidate', candidateId);
      showToast('Vinculado com sucesso!', 'success');
      await loadApplications();
      return data;
    } catch (err) { showToast(translateSupabaseError(err?.message, { entity: 'applications' }).text || 'Erro ao vincular.', 'error'); return null; }
  };

  const updateApplicationStatus = async (id, status) => {
    try {
      const { error } = await schema().from('talents_applications').update({ status, last_activity: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      const app = applications.find(a => a.id === id);
      if (app?.candidateId) await recordActivity('update', `Candidatura atualizada para ${status}`, 'candidate', app.candidateId);
      showToast('Status atualizado.', 'success');
      await loadApplications();
    } catch (err) { showToast(translateSupabaseError(err?.message).text || 'Erro ao atualizar.', 'error'); }
  };

  const removeApplication = async (id) => {
    if (!window.confirm('Remover esta candidatura?')) return;
    const app = applications.find(a => a.id === id);
    const candidateId = app?.candidateId;
    try {
      const { error } = await schema().from('talents_applications').delete().eq('id', id);
      if (error) throw error;
      if (candidateId) await recordActivity('update', 'Candidatura removida', 'candidate', candidateId);
      showToast('Removido.', 'success');
      await loadApplications();
    } catch (err) { showToast(translateSupabaseError(err?.message).text || 'Erro ao remover.', 'error'); }
  };

  const addApplicationNote = async (id, text) => {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    try {
      const newNote = { text, timestamp: new Date().toISOString(), userEmail: effectiveUser.email, userName: effectiveUser.displayName || effectiveUser.email };
      const { error } = await schema().from('talents_applications').update({ notes: [...(app.notes || []), newNote] }).eq('id', id);
      if (error) throw error;
      if (app.candidateId) await recordActivity('update', 'Nota adicionada na candidatura', 'candidate', app.candidateId);
      showToast('Nota adicionada.', 'success');
      await loadApplications();
    } catch (err) { showToast(translateSupabaseError(err?.message).text || 'Erro ao adicionar nota.', 'error'); }
  };

  const scheduleInterview = async (data) => {
    try {
      const payload = { ...data, createdBy: effectiveUser.email, createdAt: new Date().toISOString(), status: 'Agendada' };
      // TODO: Save to interviews table when ready
      if (data?.candidateId) await recordActivity('update', 'Entrevista agendada', 'candidate', data.candidateId);
      showToast('Entrevista agendada!', 'success');
      return { id: 'temp-' + Date.now(), ...payload };
    } catch (err) { showToast(translateSupabaseError(err?.message).text || 'Erro ao agendar.', 'error'); return null; }
  };

  const setUserRole = async (email, role, name) => {
    try {
      const exists = userRoles.find(r => r.email === email.toLowerCase());
      const res = exists
        ? await schema().from('talents_user_roles').update({ role, name, updated_at: new Date().toISOString() }).eq('id', exists.id)
        : await schema().from('talents_user_roles').insert({ email: email.toLowerCase(), role, name, created_at: new Date().toISOString() });
      if (res.error) throw res.error;
      showToast('Permissão atualizada.', 'success');
      const { data } = await schema().from('talents_user_roles').select('*').order('created_at', { ascending: false });
      if (data) setUserRoles(data);
    } catch (err) { showToast(translateSupabaseError(err?.message).text || 'Erro.', 'error'); }
  };

  const removeUserRole = async (id) => {
    if (!window.confirm('Remover acesso?')) return;
    try {
      const { error } = await schema().from('talents_user_roles').delete().eq('id', id);
      if (error) throw error;
      showToast('Acesso removido.', 'success');
      const { data } = await schema().from('talents_user_roles').select('*').order('created_at', { ascending: false });
      if (data) setUserRoles(data);
    } catch (err) { showToast(translateSupabaseError(err?.message).text || 'Erro ao remover.', 'error'); }
  };

  // Padrão Paver: aprovar / recusar solicitação de acesso e liberar por e-mail.
  const reloadUserRoles = async () => {
    const { data } = await schema().from('talents_user_roles').select('*').order('created_at', { ascending: false });
    if (data) setUserRoles(data);
  };

  const approveAccessRequest = async (id, role = 'viewer') => {
    try {
      const { error } = await supabase.rpc('talents_aprovar_solicitacao', { p_id: id, p_role: role });
      if (error) throw error;
      showToast('Acesso aprovado.', 'success');
      await loadAccessRequests();
      await reloadUserRoles();
    } catch (err) { showToast(translateSupabaseError(err?.message).text || 'Erro ao aprovar.', 'error'); }
  };

  const rejectAccessRequest = async (id) => {
    try {
      const { error } = await supabase.rpc('talents_recusar_solicitacao', { p_id: id });
      if (error) throw error;
      showToast('Solicitação recusada.', 'success');
      await loadAccessRequests();
    } catch (err) { showToast(translateSupabaseError(err?.message).text || 'Erro ao recusar.', 'error'); }
  };

  // Libera uma conta que JÁ logou (fecha pedido pendente). Retorna {ok, noAccount}
  // para o chamador decidir o fallback (pré-cadastro por e-mail via setUserRole).
  const authorizeUserByEmail = async (email, role = 'viewer', { silentNoAccount = false } = {}) => {
    try {
      const { error } = await supabase.rpc('talents_authorize_user', { p_email: email, p_role: role });
      if (error) throw error;
      showToast('Usuário liberado.', 'success');
      await reloadUserRoles();
      await loadAccessRequests();
      return { ok: true, noAccount: false };
    } catch (err) {
      const msg = err?.message || '';
      const noAccount = err?.code === 'no_data_found' || /nenhuma conta encontrada/i.test(msg);
      if (!(silentNoAccount && noAccount)) {
        showToast(translateSupabaseError(msg).text || 'Erro ao liberar usuário.', 'error');
      }
      return { ok: false, noAccount };
    }
  };

  const setUserActive = async (id, ativo) => {
    try {
      const { error } = await schema().from('talents_user_roles').update({ ativo, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      showToast(ativo ? 'Usuário reativado.' : 'Usuário desativado.', 'success');
      await reloadUserRoles();
    } catch (err) { showToast(translateSupabaseError(err?.message).text || 'Erro ao atualizar status.', 'error'); }
  };

  const createUserWithPassword = async (email, password, role, name) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-user', { body: { email, password, role, name: name || null } });
      if (error) {
        let msg = error.message || String(error);
        if (error.context?.json) {
          try {
            const body = await error.context.json();
            if (body?.error) msg = body.error;
          } catch { /* ignore */ }
        }
        if (msg.includes('404') || msg.includes('Function not found') || error.message?.includes('fetch')) {
          throw new Error('Edge Function create-user não encontrada. Faça o deploy: supabase functions deploy create-user');
        }
        if (msg.includes('401') || msg.includes('JWT') || msg.includes('Unauthorized') || msg.includes('Authorization')) {
          throw new Error('Sessão inválida. Faça login novamente.');
        }
        if (msg.toLowerCase().includes('already') || msg.includes('409')) {
          throw new Error('Este email já está cadastrado.');
        }
        if (msg.includes('403') || msg.includes('administrador')) {
          throw new Error('Apenas administradores podem criar usuários.');
        }
        throw new Error(msg);
      }
      if (data?.error) {
        const msg = String(data.error);
        if (msg.toLowerCase().includes('already') || msg.includes('409')) {
          throw new Error('Este email já está cadastrado.');
        }
        if (msg.includes('administrador')) {
          throw new Error('Apenas administradores podem criar usuários.');
        }
        throw new Error(msg);
      }
      showToast('Usuário criado.', 'success');
      const { data: updated } = await schema().from('talents_user_roles').select('*').order('created_at', { ascending: false });
      if (updated) setUserRoles(updated);
      return true;
    } catch (err) {
      showToast(translateSupabaseError(err?.message).text || 'Erro ao criar usuário.', 'error');
      return false;
    }
  };

  // Mappings CRUD
  const addMapping = React.useCallback(async (data) => {
    if (!supabase) return null;
    const payload = mappingToSupabase({
      ...data,
      mappedBy: effectiveUser?.email || null,
      mappedByName: userRoleDoc?.name || effectiveUser?.displayName || effectiveUser?.user_metadata?.full_name || effectiveUser?.email?.split('@')[0] || null,
    });
    try {
      const { data: inserted, error } = await schema().from('talents_mappings').insert(payload).select('*').single();
      if (error) throw error;
      await loadMappings();
      await recordActivity('create', 'Mapeamento de interesse criado', 'candidate', data.candidateId);
      showToast('Mapeamento registrado.', 'success');
      return inserted;
    } catch (err) {
      showToast(translateSupabaseError(err?.message).text || 'Erro ao criar mapeamento.', 'error');
      return null;
    }
  }, [effectiveUser, userRoleDoc, loadMappings]);

  const updateMappingStatus = React.useCallback(async (id, status) => {
    if (!supabase) return;
    try {
      const { error } = await schema().from('talents_mappings').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      await loadMappings();
      showToast('Status atualizado.', 'success');
    } catch (err) {
      showToast(translateSupabaseError(err?.message).text || 'Erro ao atualizar.', 'error');
    }
  }, [loadMappings]);

  // Definir/trocar o cargo (do Pilares) de um mapeamento existente, mantendo
  // prioridade/observacoes/historico. Usado pelo picker "Definir cargo".
  const updateMapping = React.useCallback(async (id, { positionId, positionName }) => {
    if (!supabase) return;
    try {
      const { error } = await schema().from('talents_mappings')
        .update({ position_id: positionId || null, position_name: positionName || null, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      await loadMappings();
      showToast('Cargo atualizado.', 'success');
    } catch (err) {
      showToast(translateSupabaseError(err?.message).text || 'Erro ao atualizar cargo.', 'error');
    }
  }, [loadMappings]);

  const deleteMapping = React.useCallback(async (id) => {
    if (!supabase) return;
    try {
      const { error } = await schema().from('talents_mappings').delete().eq('id', id);
      if (error) throw error;
      await loadMappings();
      showToast('Mapeamento removido.', 'success');
    } catch (err) {
      showToast(translateSupabaseError(err?.message).text || 'Erro ao remover.', 'error');
    }
  }, [loadMappings]);

  const computeMissingFields = (c, stage) => (STAGE_REQUIRED_FIELDS[stage] || []).filter(f => !c[f]);

  // Regra: só permite arquivar se o candidato tiver ao menos uma interação do
  // tipo "Contato de retorno". Checa no banco (interações são carregadas por
  // candidato e podem não estar em memória no kanban/Banco de Talentos).
  const hasReturnContact = React.useCallback(async (candidateId) => {
    if (!supabase || !candidateId) return true; // fail-open: não trava por falta de infra
    try {
      const { data, error } = await supabase
        .from('talents_interactions')
        .select('id')
        .eq('candidate_id', candidateId)
        .eq('interaction_type', 'Contato de retorno')
        .limit(1);
      if (error) return true; // fail-open em erro transitório
      return Array.isArray(data) && data.length > 0;
    } catch { return true; }
  }, []);

  const handleDragEnd = async (cId, stage) => {
    const candidate = candidates.find(c => c.id === cId);
    if (!candidate || candidate.status === stage) return;

    // Aviso de automação ao mover para Considerado
    if (stage === 'Considerado' && candidate.status === 'Inscrito') {
      const confirmar = window.confirm(
        `⚠️ Automação ativa\n\n` +
        `Ao mover "${candidate.fullName}" para "Considerado", o candidato receberá automaticamente:\n\n` +
        `📧 Email: "Você avançou no processo seletivo"\n` +
        `🎥 Vídeo 1: Boas-vindas à Young Empreendimentos\n\n` +
        `O email será enviado para: ${candidate.email}\n\n` +
        `Deseja continuar?`
      );
      if (!confirmar) return;
    }

    // 'Inscrito' nunca entra no pipeline — qualquer tentativa de mover exige vincular a vaga
    const requiresJob = stage === 'Inscrito' ? false : PIPELINE_STAGES.indexOf(stage) >= PIPELINE_STAGES.indexOf('Considerado');
    if (requiresJob) {
      if (!applications.some(a => a.candidateId === cId)) {
        setLinkToJobCandidate({ candidate, toStage: stage });
        return;
      }
    }
    const missing = computeMissingFields(candidate, stage);
    if (CLOSING_STATUSES.includes(stage)) {
      const ok = await hasReturnContact(cId);
      if (!ok) {
        showToast("Registre uma interação 'Contato de retorno' antes de arquivar este candidato.", 'error');
        return;
      }
    }
    if (CLOSING_STATUSES.includes(stage) || missing.length > 0) {
      setPendingTransition({ candidate, toStage: stage, missingFields: missing, isConclusion: CLOSING_STATUSES.includes(stage) });
      return;
    }
    await handleSaveGeneric('candidates', { ...candidate, status: stage }, () => { }, { activityDescription: `Status alterado para ${stage}` });
    showToast('Status atualizado.', 'success');
  };

  const handleCloseStatus = (cId, status) => handleDragEnd(cId, status);

  const uniqueCandidatesByEmail = useMemo(() => {
    const byKey = {};
    candidates.filter(c => !c.deletedAt).forEach(c => {
      const key = (c.email && c.email.trim()) ? c.email : `no-email-${c.id}`;
      const ts = getCandidateTimestamp(c) || (c.createdAt ? new Date(c.createdAt).getTime() / 1000 : 0);
      if (!byKey[key] || getCandidateTimestamp(byKey[key]) < ts) byKey[key] = c;
    });
    return Object.values(byKey);
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    let data = [...uniqueCandidatesByEmail];
    const now = Math.floor(Date.now() / 1000);
    const preset = filters.createdAtPreset;
    const presets = { 'today': 86400, 'yesterday': 172800, '7d': 604800, '30d': 2592000, '90d': 7776000 };

    const metaKeys = ['createdAtPreset', 'customDateStart', 'customDateEnd', 'tags', 'dashboardFilter', 'starredFilter', 'starred', 'ageMin', 'ageMax'];
    Object.keys(filters).forEach(k => {
      if (filters[k] === 'all' || filters[k] === null || filters[k] === '' || metaKeys.includes(k)) return;
      const fieldMap = {
        'interestArea': 'interestAreas',
        'schooling': 'schoolingLevel',
        'marital': 'maritalStatus',
        'cnh': 'hasLicense'
      };
      const field = fieldMap[k] || k;
      if (Array.isArray(filters[k])) {
        if (field === 'interestAreas') {
          data = data.filter(c => {
            const v = String(c.interestAreas || '').toLowerCase();
            return filters[k].some(sel => v.includes(String(sel).toLowerCase()));
          });
        } else if (field === 'hasLicense') {
          // has_license é string 'Sim'/'Não' no banco — comparação direta
          data = data.filter(c => c[field] != null && filters[k].includes(c[field]));
        } else {
          data = data.filter(c => c[field] != null && filters[k].includes(c[field]));
        }
      } else {
        data = data.filter(c => c[field] === filters[k]);
      }
    });
    const minA = filters.ageMin !== 'all' && filters.ageMin !== '' && filters.ageMin != null ? Number(filters.ageMin) : null;
    const maxA = filters.ageMax !== 'all' && filters.ageMax !== '' && filters.ageMax != null ? Number(filters.ageMax) : null;
    if ((minA != null && !Number.isNaN(minA)) || (maxA != null && !Number.isNaN(maxA))) {
      data = data.filter(c => {
        const a = getCandidateAge(c);
        if (a == null) return false;
        if (minA != null && !Number.isNaN(minA) && a < minA) return false;
        if (maxA != null && !Number.isNaN(maxA) && a > maxA) return false;
        return true;
      });
    }

    if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
      data = data.filter(c => c.tags && filters.tags.some(t => c.tags.includes(t)));
    }

    if (preset === 'custom' && filters.customDateStart && filters.customDateEnd) {
      const s = new Date(filters.customDateStart).getTime() / 1000;
      const e = new Date(filters.customDateEnd).getTime() / 1000 + 86400;
      data = data.filter(c => { const ts = getCandidateTimestamp(c); return ts >= s && ts <= e; });
    } else if (preset !== 'all' && presets[preset]) {
      data = data.filter(c => { const ts = getCandidateTimestamp(c); return ts >= now - presets[preset]; });
    }

    if (filters.dashboardFilter === 'missing-return') {
      data = data.filter(c => c.status === 'Arquivado' && (!c.returnSent || c.returnSent === 'Pendente' || c.returnSent === 'Não'));
    } else if (filters.dashboardFilter === 'jobs-open') {
      const openIds = jobs.filter(j => j.status === 'Aberta').map(j => j.id);
      data = data.filter(c => applications.some(a => a.candidateId === c.id && openIds.includes(a.jobId)));
    }
    const starFilter = filters.starredFilter ?? (filters.starred === true ? 'starred' : 'all');
    if (starFilter === 'starred') data = data.filter(c => c.starred === true);
    else if (starFilter === 'unstarred') data = data.filter(c => !c.starred);
    return data;
  }, [uniqueCandidatesByEmail, filters, jobs, applications]);

  const onCreatePosition = React.useCallback(async ({ name, level }) => {
    if (!supabase) return false;
    try {
      const { error } = await schema().from('talents_positions').insert({ name: name.trim(), level: (level && level.trim()) || null });
      if (error) throw error;
      await loadRoles();
      showToast('Cargo criado.', 'success');
      return true;
    } catch (err) {
      showToast(translateSupabaseError(err?.message).text || 'Erro ao criar cargo.', 'error');
      return false;
    }
  }, [supabase, loadRoles]);

  const onCreateSector = React.useCallback(async ({ name }) => {
    if (!supabase) return false;
    try {
      const { error } = await schema().from('talents_sectors').insert({ name: name.trim() });
      if (error) throw error;
      await loadSectors();
      showToast('Setor criado.', 'success');
      return true;
    } catch (err) {
      showToast(translateSupabaseError(err?.message).text || 'Erro ao criar setor.', 'error');
      return false;
    }
  }, [supabase, loadSectors]);

  const refreshData = React.useCallback(async () => {
    await loadAllData();
    if (currentUserRole === 'admin') loadActivityLog();
    showToast('Dados atualizados.', 'success');
  }, [loadAllData, loadActivityLog, currentUserRole]);

  const optionsProps = { jobs, companies, cities, roles, sectors, userRoles, user: effectiveUser, onCreatePosition, onCreateSector };

  return (
    <AppRoutes
      user={user} authLoading={authLoading} effectiveUser={effectiveUser} supabase={supabase}
      isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
      isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed}
      activeTab={activeTab} setActiveTab={setActiveTab} route={route} setRoute={setRoute}
      candidates={candidates} jobs={jobs} companies={companies} cities={cities} sectors={sectors} roles={roles} cargos={cargos}
      jobLevels={jobLevels} activityAreas={activityAreas} applications={applications} interviews={interviews}
      statusMovements={statusMovements} activityLog={activityLog} candidatesLoading={candidatesLoading}
      isSaving={isSaving} setIsSaving={setIsSaving}
      filters={filters} setFilters={setFilters} initialFilters={initialFilters}
      isFilterSidebarOpen={isFilterSidebarOpen} setIsFilterSidebarOpen={setIsFilterSidebarOpen}
      filteredCandidates={filteredCandidates} uniqueCandidatesByEmail={uniqueCandidatesByEmail}
      editingCandidate={editingCandidate} setEditingCandidate={setEditingCandidate}
      editingJob={editingJob} setEditingJob={setEditingJob}
      pendingTransition={pendingTransition} setPendingTransition={setPendingTransition}
      linkToJobCandidate={linkToJobCandidate} setLinkToJobCandidate={setLinkToJobCandidate}
      viewingJob={viewingJob} isJobModalOpen={isJobModalOpen} isCsvModalOpen={isCsvModalOpen}
      dashboardModalCandidates={dashboardModalCandidates} setDashboardModalCandidates={setDashboardModalCandidates}
      dashboardModalTitle={dashboardModalTitle} setDashboardModalTitle={setDashboardModalTitle}
      highlightedCandidateId={highlightedCandidateId} setHighlightedCandidateId={setHighlightedCandidateId}
      interviewModalData={interviewModalData} setInterviewModalData={setInterviewModalData}
      toast={toast} optionsProps={optionsProps} schooling={schooling} marital={marital} origins={origins}
      interestAreas={interestAreas} userRoles={userRoles} currentUserRole={currentUserRole} hasStaffRole={hasStaffRole} hasActiveAccess={hasActiveAccess} authStaffReady={authStaffReady}
      accessRequests={accessRequests} accessRequestStatus={accessRequestStatus}
      approveAccessRequest={approveAccessRequest} rejectAccessRequest={rejectAccessRequest}
      authorizeUserByEmail={authorizeUserByEmail} setUserActive={setUserActive}
      handleSaveGeneric={handleSaveGeneric} handleDeleteGeneric={handleDeleteGeneric}
      openCandidateProfile={openCandidateProfile} openJobModal={openJobModal} closeJobModal={closeJobModal}
      openCsvModal={openCsvModal} closeCsvModal={closeCsvModal}
      openJobCandidatesModal={openJobCandidatesModal} closeJobCandidatesModal={closeJobCandidatesModal}
      createApplication={createApplication} updateApplicationStatus={updateApplicationStatus}
      removeApplication={removeApplication} addApplicationNote={addApplicationNote}
      scheduleInterview={scheduleInterview} showToast={showToast} loadCandidates={loadCandidates}
      interactions={interactions} interactionTypes={interactionTypes}
      addInteraction={addInteraction} loadInteractions={loadInteractions} deleteInteraction={deleteInteraction}
      handleToggleStar={handleToggleStar}
      mappings={mappings} addMapping={addMapping} updateMappingStatus={updateMappingStatus} updateMapping={updateMapping} deleteMapping={deleteMapping}
      refreshData={refreshData}
      toggleTheme={toggleTheme} isDark={isDark} setUserRole={setUserRole} removeUserRole={removeUserRole}
      createUserWithPassword={createUserWithPassword} handleDragEnd={handleDragEnd} hasReturnContact={hasReturnContact}
      handleCloseStatus={handleCloseStatus} computeMissingFields={computeMissingFields}
      pipelineStages={pipelineStages} onUpdatePipelineStages={setPipelineStages}
    />
  );
}