import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, X, User, Mail, Phone, MapPin, Building2, Briefcase, 
  Calendar, ChevronDown, ChevronUp, Eye, Trash2, MessageSquare, Plus,
  TrendingUp, Users, Clock, CheckCircle, XCircle, AlertCircle, FileText,
  ArrowRight, MoreVertical
} from 'lucide-react';
import { STATUS_COLORS, PIPELINE_STAGES, CLOSING_STATUSES, ALL_STATUSES } from '../constants';

export default function ApplicationsPage({
  applications = [],
  candidates = [],
  jobs = [],
  companies = [],
  onUpdateApplicationStatus,
  onRemoveApplication,
  onAddApplicationNote,
  onEditCandidate,
  onViewJob,
  onCreateApplication
}) {
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados de UI
  const [expandedApp, setExpandedApp] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [sortField, setSortField] = useState('appliedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showNewApplicationModal, setShowNewApplicationModal] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [searchCandidateForNew, setSearchCandidateForNew] = useState('');
  const [searchJobForNew, setSearchJobForNew] = useState('');
  
  // Métricas/Resumo
  const stats = useMemo(() => {
    const total = applications.length;
    const byStatus = {};
    const byJob = {};
    const byCompany = {};
    
    PIPELINE_STAGES.forEach(s => byStatus[s] = 0);
    CLOSING_STATUSES.forEach(s => byStatus[s] = 0);
    
    applications.forEach(app => {
      const status = app.status || 'Inscrito';
      byStatus[status] = (byStatus[status] || 0) + 1;
      
      const jobTitle = app.jobTitle || 'Sem vaga';
      byJob[jobTitle] = (byJob[jobTitle] || 0) + 1;
      
      const company = app.jobCompany || 'Sem empresa';
      byCompany[company] = (byCompany[company] || 0) + 1;
    });
    
    // Taxas de conversão
    const inProcess = applications.filter(a => PIPELINE_STAGES.includes(a.status)).length;
    const hired = byStatus['Contratado'] || 0;
    const rejected = byStatus['Reprovado'] || 0;
    const withdrawn = byStatus['Desistiu da vaga'] || 0;
    const closed = hired + rejected + withdrawn;
    const conversionRate = total > 0 ? ((hired / total) * 100).toFixed(1) : 0;
    
    return { 
      total, 
      byStatus, 
      byJob, 
      byCompany, 
      inProcess, 
      hired, 
      rejected, 
      withdrawn,
      closed,
      conversionRate 
    };
  }, [applications]);
  
  // Filtrar candidaturas
  const filteredApplications = useMemo(() => {
    let filtered = [...applications];
    
    // Busca por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.candidateName?.toLowerCase().includes(term) ||
        app.candidateEmail?.toLowerCase().includes(term) ||
        app.jobTitle?.toLowerCase().includes(term) ||
        app.jobCompany?.toLowerCase().includes(term)
      );
    }
    
    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    // Filtro por vaga
    if (jobFilter !== 'all') {
      filtered = filtered.filter(app => app.jobId === jobFilter);
    }
    
    // Filtro por empresa
    if (companyFilter !== 'all') {
      filtered = filtered.filter(app => app.jobCompany === companyFilter);
    }
    
    // Filtro por período
    if (periodFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(app => {
        let appDate;
        if (app.appliedAt?.seconds) {
          appDate = new Date(app.appliedAt.seconds * 1000);
        } else if (app.appliedAt?.toDate) {
          appDate = app.appliedAt.toDate();
        } else if (app.appliedAt) {
          appDate = new Date(app.appliedAt);
        } else {
          return false;
        }
        
        const diffDays = Math.floor((today - appDate) / (1000 * 60 * 60 * 24));
        
        switch (periodFilter) {
          case 'today': return diffDays === 0;
          case 'week': return diffDays <= 7;
          case 'month': return diffDays <= 30;
          case 'quarter': return diffDays <= 90;
          default: return true;
        }
      });
    }
    
    // Ordenação
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      if (sortField === 'appliedAt') {
        aVal = a.appliedAt?.seconds || 0;
        bVal = b.appliedAt?.seconds || 0;
      } else if (sortField === 'candidateName') {
        aVal = a.candidateName?.toLowerCase() || '';
        bVal = b.candidateName?.toLowerCase() || '';
      } else if (sortField === 'jobTitle') {
        aVal = a.jobTitle?.toLowerCase() || '';
        bVal = b.jobTitle?.toLowerCase() || '';
      } else if (sortField === 'status') {
        aVal = a.status || '';
        bVal = b.status || '';
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  }, [applications, searchTerm, statusFilter, jobFilter, companyFilter, periodFilter, sortField, sortDirection]);
  
  // Formatar data
  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    let date;
    if (ts.seconds || ts._seconds) {
      date = new Date((ts.seconds || ts._seconds) * 1000);
    } else if (ts.toDate) {
      date = ts.toDate();
    } else {
      date = new Date(ts);
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  const formatDateTime = (ts) => {
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
  
  // Handler de status
  const handleStatusChange = async (applicationId, newStatus) => {
    if (onUpdateApplicationStatus) {
      await onUpdateApplicationStatus(applicationId, newStatus);
    }
  };
  
  // Handler de nota
  const handleAddNote = async (applicationId) => {
    if (onAddApplicationNote && newNote.trim()) {
      await onAddApplicationNote(applicationId, newNote);
      setNewNote('');
    }
  };
  
  // Toggle ordenação
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Jobs únicos para filtro
  const uniqueJobs = useMemo(() => {
    const jobMap = {};
    applications.forEach(app => {
      if (app.jobId && app.jobTitle) {
        jobMap[app.jobId] = app.jobTitle;
      }
    });
    return Object.entries(jobMap).map(([id, title]) => ({ id, title }));
  }, [applications]);
  
  // Empresas únicas para filtro
  const uniqueCompanies = useMemo(() => {
    const companySet = new Set();
    applications.forEach(app => {
      if (app.jobCompany) companySet.add(app.jobCompany);
    });
    return Array.from(companySet).sort();
  }, [applications]);
  
  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setJobFilter('all');
    setCompanyFilter('all');
    setPeriodFilter('all');
  };
  
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || jobFilter !== 'all' || companyFilter !== 'all' || periodFilter !== 'all';

  return (
    <div className="h-full flex flex-col">
      {/* Header compacto com stats inline */}
      <div className="bg-card border-b border-border px-4 sm:px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-4 overflow-x-auto custom-scrollbar pb-1 flex-1">
            {[
              { label: 'Total',       value: stats.total,          color: 'text-blue-500'  },
              { label: 'Em processo', value: stats.inProcess,      color: 'text-amber-500' },
              { label: 'Contratados', value: stats.hired,          color: 'text-green-500' },
              { label: 'Reprovados',  value: stats.rejected,       color: 'text-red-500'   },
              { label: 'Desistências',value: stats.withdrawn,      color: 'text-gray-500'  },
              { label: 'Conversão',   value: `${stats.conversionRate}%`, color: 'text-purple-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-2 flex-shrink-0 pr-4 border-r border-border last:border-0">
                <span className={`text-xl font-bold ${color}`}>{value}</span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowNewApplicationModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
          >
            <Plus size={16}/> Nova Candidatura
          </button>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"/>
            <input
              type="text"
              placeholder="Buscar candidato, vaga..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-brand-orange/50 w-48 sm:w-56"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-brand-orange/50">
            <option value="all">Todos os Status</option>
            <optgroup label="Em Processo">
              {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s} ({stats.byStatus[s] || 0})</option>)}
            </optgroup>
            <optgroup label="Fechamento">
              {CLOSING_STATUSES.map(s => <option key={s} value={s}>{s} ({stats.byStatus[s] || 0})</option>)}
            </optgroup>
          </select>
          <select value={jobFilter} onChange={e => setJobFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-brand-orange/50">
            <option value="all">Todas as Vagas</option>
            {uniqueJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-brand-orange/50">
            <option value="all">Todas as Empresas</option>
            {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-brand-orange/50">
            <option value="all">Todo Período</option>
            <option value="today">Hoje</option>
            <option value="week">7 dias</option>
            <option value="month">30 dias</option>
            <option value="quarter">90 dias</option>
          </select>
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              <X size={14}/> Limpar
            </button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {filteredApplications.length}{hasActiveFilters ? ` / ${applications.length}` : ''} candidatura{filteredApplications.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <FileText size={40} className="mb-3 opacity-20"/>
            <p className="font-medium">Nenhuma candidatura encontrada</p>
            <p className="text-sm mt-1 opacity-70">
              {hasActiveFilters ? 'Tente ajustar os filtros' : 'As candidaturas aparecerão aqui quando candidatos forem vinculados às vagas'}
            </p>
          </div>
        ) : (
          <div className="min-w-[640px]">
            {/* Header da Tabela */}
            <table className="w-full text-sm text-foreground">
              <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-[30%]">
                    <button onClick={() => toggleSort('candidateName')} className="flex items-center gap-1 hover:text-foreground">
                      Candidato {sortField === 'candidateName' && (sortDirection === 'asc' ? <ChevronUp size={13}/> : <ChevronDown size={13}/>)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-[28%]">
                    <button onClick={() => toggleSort('jobTitle')} className="flex items-center gap-1 hover:text-foreground">
                      Vaga / Empresa {sortField === 'jobTitle' && (sortDirection === 'asc' ? <ChevronUp size={13}/> : <ChevronDown size={13}/>)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-[22%]">
                    <button onClick={() => toggleSort('status')} className="flex items-center gap-1 hover:text-foreground">
                      Status {sortField === 'status' && (sortDirection === 'asc' ? <ChevronUp size={13}/> : <ChevronDown size={13}/>)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-[12%]">
                    <button onClick={() => toggleSort('appliedAt')} className="flex items-center gap-1 hover:text-foreground">
                      Data {sortField === 'appliedAt' && (sortDirection === 'asc' ? <ChevronUp size={13}/> : <ChevronDown size={13}/>)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground w-[8%]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
            {filteredApplications.map(app => {
                const candidate = candidates.find(c => c.id === app.candidateId);
                const job = jobs.find(j => j.id === app.jobId);
                const isExpanded = expandedApp === app.id;

                return (
                  <React.Fragment key={app.id}>
                    <tr className="hover:bg-muted/30 transition-colors">
                      {/* Candidato */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {candidate?.photoUrl
                              ? <img src={candidate.photoUrl} alt="" className="w-full h-full object-cover"/>
                              : <User size={16} className="text-muted-foreground"/>}
                          </div>
                          <div className="min-w-0">
                            <button onClick={() => onEditCandidate && candidate && onEditCandidate(candidate)}
                              className="font-medium text-foreground hover:text-brand-orange transition-colors truncate block text-left text-sm">
                              {app.candidateName || 'Sem nome'}
                            </button>
                            <div className="text-xs text-muted-foreground truncate">{app.candidateEmail}</div>
                          </div>
                        </div>
                      </td>

                      {/* Vaga / Empresa */}
                      <td className="px-4 py-3">
                        <button onClick={() => onViewJob && job && onViewJob(job)}
                          className="font-medium text-foreground hover:text-brand-orange transition-colors truncate block text-left text-sm">
                          {app.jobTitle || '—'}
                        </button>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 size={11}/> {app.jobCompany || '—'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <select
                          value={app.status || 'Considerado'}
                          onChange={e => handleStatusChange(app.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium outline-none cursor-pointer border-0 ${STATUS_COLORS[app.status] || 'bg-muted text-muted-foreground'}`}
                        >
                          <optgroup label="Funil">
                            {PIPELINE_STAGES.map(s => <option key={s} value={s} className="bg-card text-foreground">{s}</option>)}
                          </optgroup>
                          <optgroup label="Fechamento">
                            {CLOSING_STATUSES.map(s => <option key={s} value={s} className="bg-card text-foreground">{s}</option>)}
                          </optgroup>
                        </select>
                      </td>

                      {/* Data */}
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(app.appliedAt)}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            title={isExpanded ? 'Recolher' : 'Expandir'}>
                            {isExpanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                          </button>
                          <button onClick={() => onEditCandidate && candidate && onEditCandidate(candidate)}
                            className="p-1.5 text-muted-foreground hover:text-brand-orange hover:bg-brand-orange/10 rounded-lg transition-colors"
                            title="Ver candidato">
                            <Eye size={15}/>
                          </button>
                          <button onClick={() => onRemoveApplication && onRemoveApplication(app.id)}
                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remover candidatura">
                            <Trash2 size={15}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Seção Expandida */}
                    {isExpanded && (
                      <tr className="bg-muted/20">
                      <td colSpan={5} className="px-4 pb-4 border-b border-border">
                        <div className="pt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Info do Candidato */}
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                              Informações do Candidato
                            </h4>
                            <div className="bg-card rounded-lg p-4 space-y-2 text-sm">
                              {candidate?.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone size={14}/> {candidate.phone}
                                </div>
                              )}
                              {candidate?.city && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin size={14}/> {candidate.city}
                                </div>
                              )}
                              {candidate?.interestAreas && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Briefcase size={14}/> {candidate.interestAreas}
                                </div>
                              )}
                              {candidate?.schoolingLevel && (
                                <div className="text-muted-foreground">
                                  <span className="text-gray-500">Escolaridade:</span> {candidate.schoolingLevel}
                                </div>
                              )}
                              {candidate?.experience && (
                                <div className="text-muted-foreground">
                                  <span className="text-gray-500">Experiência:</span>
                                  <div className="mt-1 whitespace-pre-wrap break-words">
                                    {candidate.experience}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Notas */}
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                              <MessageSquare size={14}/> Notas da Candidatura
                            </h4>
                            <div className="bg-card rounded-lg p-4">
                              {/* Adicionar Nota */}
                              <div className="flex gap-2 mb-3">
                                <input
                                  type="text"
                                  placeholder="Adicionar nota..."
                                  value={expandedApp === app.id ? newNote : ''}
                                  onChange={e => setNewNote(e.target.value)}
                                  onKeyPress={e => e.key === 'Enter' && handleAddNote(app.id)}
                                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
                                />
                                <button
                                  onClick={() => handleAddNote(app.id)}
                                  disabled={!newNote.trim()}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Plus size={16}/>
                                </button>
                              </div>
                              
                              {/* Lista de Notas */}
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {(app.notes || []).length > 0 ? (
                                  app.notes.map((note, idx) => (
                                    <div key={idx} className="bg-gray-100 dark:bg-gray-900 rounded-lg p-2 text-sm">
                                      <p className="text-muted-foreground">{note.text}</p>
                                      <p className="text-xs text-gray-500 mt-1">{note.userName} • {formatDate(note.timestamp)}</p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-gray-500 text-center py-2">Nenhuma nota</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Info da Vaga */}
                        {job && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                              Dados da Vaga
                            </h4>
                            <div className="flex flex-wrap gap-4 text-sm">
                              {job.city && (
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                                  <MapPin size={12} className="inline mr-1"/> {job.city}
                                </span>
                              )}
                              {job.sector && (
                                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full">
                                  Setor: {job.sector}
                                </span>
                              )}
                              {job.position && (
                                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
                                  Cargo: {job.position}
                                </span>
                              )}
                              {job.function && (
                                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full">
                                  Função: {job.function}
                                </span>
                              )}
                              {job.contractType && (
                                <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full">
                                  {job.contractType}
                                </span>
                              )}
                              {job.workModel && (
                                <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full">
                                  {job.workModel}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer: chips de status rápido */}
      <div className="bg-card border-t border-border px-4 py-2.5 flex-shrink-0">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(stats.byStatus)
            .filter(([, count]) => count > 0)
            .map(([status, count]) => (
              <button key={status}
                onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === status ? 'ring-2 ring-brand-orange ring-offset-1 dark:ring-offset-card' : ''
                } ${STATUS_COLORS[status] || 'bg-muted text-muted-foreground'}`}>
                {status}: {count}
              </button>
            ))}
        </div>
      </div>
      
      {/* Modal Nova Candidatura */}
      {showNewApplicationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-card rounded-lg shadow-2xl w-full max-w-2xl border border-border">
            {/* Header */}
            <div className="p-6 border-b border-border flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <h3 className="font-bold text-xl text-foreground">Nova Candidatura</h3>
              <button 
                onClick={() => {
                  setShowNewApplicationModal(false);
                  setSelectedCandidateId('');
                  setSelectedJobId('');
                  setSearchCandidateForNew('');
                  setSearchJobForNew('');
                }}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-muted-foreground"/>
              </button>
            </div>
            
            {/* Conteúdo */}
            <div className="p-6 space-y-6">
              {/* Seleção de Candidato */}
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">
                  Candidato <span className="text-red-500">*</span>
                </label>
                <div className="relative mb-2">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input
                    type="text"
                    placeholder="Buscar candidato por nome ou email..."
                    value={searchCandidateForNew}
                    onChange={e => setSearchCandidateForNew(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
                  />
                </div>
                <select
                  value={selectedCandidateId}
                  onChange={e => setSelectedCandidateId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-card border border-input rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
                  required
                >
                  <option value="">Selecione um candidato...</option>
                  {candidates
                    .filter(c => {
                      if (!searchCandidateForNew) return true;
                      const term = searchCandidateForNew.toLowerCase();
                      return c.fullName?.toLowerCase().includes(term) || 
                             c.email?.toLowerCase().includes(term);
                    })
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} - {c.email}
                      </option>
                    ))}
                </select>
              </div>
              
              {/* Seleção de Vaga */}
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">
                  Vaga <span className="text-red-500">*</span>
                </label>
                <div className="relative mb-2">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input
                    type="text"
                    placeholder="Buscar vaga por título ou empresa..."
                    value={searchJobForNew}
                    onChange={e => setSearchJobForNew(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
                  />
                </div>
                <select
                  value={selectedJobId}
                  onChange={e => setSelectedJobId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-card border border-input rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
                  required
                >
                  <option value="">Selecione uma vaga...</option>
                  {jobs
                    .filter(j => {
                      if (!searchJobForNew) return true;
                      const term = searchJobForNew.toLowerCase();
                      return j.title?.toLowerCase().includes(term) || 
                             j.company?.toLowerCase().includes(term);
                    })
                    .map(j => (
                      <option key={j.id} value={j.id}>
                        {j.title} - {j.company} {j.city ? `(${j.city})` : ''}
                      </option>
                    ))}
                </select>
              </div>
              
              {/* Verificação de duplicata */}
              {selectedCandidateId && selectedJobId && (
                (() => {
                  const existing = applications.find(
                    a => a.candidateId === selectedCandidateId && a.jobId === selectedJobId
                  );
                  return existing ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-300">
                      ⚠️ Este candidato já está vinculado a esta vaga
                    </div>
                  ) : null;
                })()
              )}
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-border bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewApplicationModal(false);
                  setSelectedCandidateId('');
                  setSelectedJobId('');
                  setSearchCandidateForNew('');
                  setSearchJobForNew('');
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!selectedCandidateId || !selectedJobId) return;
                  
                  // Verificar duplicata
                  const existing = applications.find(
                    a => a.candidateId === selectedCandidateId && a.jobId === selectedJobId
                  );
                  if (existing) {
                    alert('Este candidato já está vinculado a esta vaga');
                    return;
                  }
                  
                  if (onCreateApplication) {
                    await onCreateApplication(selectedCandidateId, selectedJobId);
                    setShowNewApplicationModal(false);
                    setSelectedCandidateId('');
                    setSelectedJobId('');
                    setSearchCandidateForNew('');
                    setSearchJobForNew('');
                  }
                }}
                disabled={!selectedCandidateId || !selectedJobId}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-sm active:scale-95"
              >
                Criar Candidatura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

