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
    const validTabs = ['dashboard', 'pipeline', 'candidates', 'submissions', 'jobs', 'applications', 'companies', 'positions', 'sectors', 'cities', 'job_levels', 'activity_areas', 'reports', 'help', 'sobre', 'settings', 'diagnostic'];
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
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [cities, setCities] = useState([]);
  const [interestAreas, setInterestAreas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [jobLevels, setJobLevels] = useState([]);
  const [activityAreas, setActivityAreas] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [schooling, setSchooling] = useState([]);
  const [marital, setMarital] = useState([]);
  const [tags, setTags] = useState([]);
  const [statusMovements, setStatusMovements] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [userRoles, setUserRoles] = useState([{ email: DEV_USER.email, role: 'admin' }]);
  const [userRolesLoaded, setUserRolesLoaded] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const activityLogUnavailableRef = React.useRef(false);
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
    const id = candidate?.id ?? (typeof candidate === 'string' ? candidate : null);
    if (id) {
      navigate(`/candidate/${id}`, { state: { from: location.pathname } });
    }
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

  const loadAllData = React.useCallback(async () => {
    await Promise.all([loadCandidates(), loadJobs(), loadCompanies(), loadCities(), loadSectors(), loadRoles(), loadJobLevels(), loadActivityAreas(), loadApplications()]);
  }, [loadCandidates, loadJobs, loadCompanies, loadCities, loadSectors, loadRoles, loadJobLevels, loadActivityAreas, loadApplications]);

  /** Painel interno: cadastro explícito em user_roles como admin, editor ou viewer (somente leitura). */
  const hasStaffRole = useMemo(() => {
    if (isDeveloper) return true;
    if (!effectiveUser?.email) return false;
    const r = userRoleDoc?.role;
    return r === 'admin' || r === 'editor' || r === 'viewer';
  }, [isDeveloper, effectiveUser, userRoleDoc]);

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
    // Só carrega dados do app interno quando usuário tem role em user_roles (ou é dev)
    if (!hasStaffRole) {
      dataLoadedForUserRef.current = false;
      return;
    }
    let channel;
    if (!dataLoadedForUserRef.current) {
      loadAllData().then(() => {
        dataLoadedForUserRef.current = true;
      });
      if (currentUserRole === 'admin') loadActivityLog();
    }
    if (supabase) {
      channel = supabase.channel('candidates_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'talents_candidates' }, () => { loadCandidates(); }).subscribe();
    }
    return () => {
      if (supabase && channel) supabase.removeChannel(channel);
    };
  }, [effectiveUser, loadAllData, loadActivityLog, currentUserRole, hasStaffRole, loadCandidates]);

  // Sync user_roles
  useEffect(() => {
    if (!supabase) {
      setUserRolesLoaded(false);
      return;
    }
    if (!user) {
      setUserRolesLoaded(false);
      return;
    }
    if (user.email === DEV_USER.email) {
      setUserRolesLoaded(true);
      return;
    }
    let cancelled = false;
    setUserRolesLoaded(false);
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
      await recordActivity('update', c.starred ? 'Removido de em consideração' : 'Marcado em consideração', 'candidate', c.id);
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
      const payload = { candidate_id: candidateId, job_id: jobId, candidate_name: candidate?.fullName || 'Candidato', candidate_email: candidate?.email || '', job_title: job?.title || 'Vaga', job_company: job?.company || '', status: 'Inscrito', applied_at: new Date().toISOString(), created_by: effectiveUser.email, created_at: new Date().toISOString() };
      const { data, error } = await schema().from('talents_applications').insert(payload).select('*').single();
      if (error) throw error;
      await recordActivity('update', 'Candidatura criada', 'candidate', candidateId);
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

  const computeMissingFields = (c, stage) => (STAGE_REQUIRED_FIELDS[stage] || []).filter(f => !c[f]);

  const handleDragEnd = async (cId, stage) => {
    const candidate = candidates.find(c => c.id === cId);
    if (!candidate || candidate.status === stage) return;
    if (PIPELINE_STAGES.indexOf(stage) >= PIPELINE_STAGES.indexOf('Considerado')) {
      if (!applications.some(a => a.candidateId === cId)) {
        setLinkToJobCandidate({ candidate, toStage: stage });
        return;
      }
    }
    const missing = computeMissingFields(candidate, stage);
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
      const field = k === 'interestArea' ? 'interestAreas' : k;
      if (Array.isArray(filters[k])) {
        if (field === 'interestAreas') {
          data = data.filter(c => {
            const v = String(c.interestAreas || '').toLowerCase();
            return filters[k].some(sel => v.includes(String(sel).toLowerCase()));
          });
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
      data = data.filter(c => (c.status === 'Seleção' || c.status === 'Selecionado') && (!c.returnSent || c.returnSent === 'Pendente'));
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
      candidates={candidates} jobs={jobs} companies={companies} cities={cities} sectors={sectors} roles={roles}
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
      interestAreas={interestAreas} userRoles={userRoles} currentUserRole={currentUserRole} hasStaffRole={hasStaffRole} authStaffReady={authStaffReady}
      handleSaveGeneric={handleSaveGeneric} handleDeleteGeneric={handleDeleteGeneric}
      openCandidateProfile={openCandidateProfile} openJobModal={openJobModal} closeJobModal={closeJobModal}
      openCsvModal={openCsvModal} closeCsvModal={closeCsvModal}
      openJobCandidatesModal={openJobCandidatesModal} closeJobCandidatesModal={closeJobCandidatesModal}
      createApplication={createApplication} updateApplicationStatus={updateApplicationStatus}
      removeApplication={removeApplication} addApplicationNote={addApplicationNote}
      scheduleInterview={scheduleInterview} showToast={showToast} loadCandidates={loadCandidates}
      handleToggleStar={handleToggleStar}
      refreshData={refreshData}
      toggleTheme={toggleTheme} isDark={isDark} setUserRole={setUserRole} removeUserRole={removeUserRole}
      createUserWithPassword={createUserWithPassword} handleDragEnd={handleDragEnd}
      handleCloseStatus={handleCloseStatus} computeMissingFields={computeMissingFields}
    />
  );
}