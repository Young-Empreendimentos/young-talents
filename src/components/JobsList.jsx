import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit3, MapPin, Briefcase, Building2, BarChart3, Clock, Search, Users } from 'lucide-react';
import { JOB_STATUSES } from '../constants';
import { findMatchingCandidates, getMatchBadgeColor } from '../utils/matching';

const daysOpen = (job) => {
    const raw = job.createdAt || job.created_at;
    if (!raw) return null;
    const ms = typeof raw === 'number' ? raw * 1000 : new Date(raw).getTime();
    return Math.floor((Date.now() - ms) / 86400000);
};

const formatDeadline = (deadline) => {
    if (!deadline) return null;
    const d = new Date(deadline);
    const expired = d < new Date();
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return { label, expired };
};

const STATUS_STYLES = {
    'Aberta':     { dot: 'bg-green-500',  badge: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
    'Preenchida': { dot: 'bg-blue-500',   badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    'Cancelada':  { dot: 'bg-red-500',    badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
    'Fechada':    { dot: 'bg-gray-500',   badge: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20' },
};

const JobsList = ({ jobs, candidates, applications = [], onAdd, onEdit, onToggleStatus, onViewCandidates, companies, initialStatusFilter }) => {
    const [statusFilter, setStatusFilter] = useState(
        initialStatusFilter && JOB_STATUSES.includes(initialStatusFilter) ? initialStatusFilter : 'all'
    );
    const [search, setSearch] = useState('');
    const [companyFilter, setCompanyFilter] = useState('all');

    useEffect(() => {
        if (initialStatusFilter && JOB_STATUSES.includes(initialStatusFilter)) setStatusFilter(initialStatusFilter);
    }, [initialStatusFilter]);

    const activeJobs = useMemo(() => jobs.filter(j => !j.deletedAt), [jobs]);

    const filteredJobs = useMemo(() => {
        let data = activeJobs;
        if (statusFilter !== 'all') data = data.filter(j => j.status === statusFilter);
        if (companyFilter !== 'all') data = data.filter(j => (j.company || '') === companyFilter);
        if (search) {
            const s = search.toLowerCase();
            data = data.filter(j =>
                j.title?.toLowerCase().includes(s) ||
                j.company?.toLowerCase().includes(s) ||
                j.city?.toLowerCase().includes(s)
            );
        }
        return data;
    }, [activeJobs, statusFilter, companyFilter, search]);

    const jobsByStatus = useMemo(() => {
        const map = {};
        JOB_STATUSES.forEach(s => { map[s] = filteredJobs.filter(j => j.status === s); });
        return map;
    }, [filteredJobs]);

    const jobMatches = useMemo(() => {
        const m = {};
        activeJobs.filter(j => j.status === 'Aberta').forEach(job => {
            const matches = findMatchingCandidates(job, candidates);
            m[job.id] = { count: matches.length, topMatch: matches[0] || null };
        });
        return m;
    }, [activeJobs, candidates]);

    const uniqueCompanies = useMemo(() =>
        [...new Set(activeJobs.map(j => j.company).filter(Boolean))].sort(),
        [activeJobs]
    );

    // Conta candidaturas por vaga via applications
    const appCountByJob = useMemo(() => {
        const map = {};
        applications.forEach(a => { map[a.jobId] = (map[a.jobId] || 0) + 1; });
        return map;
    }, [applications]);

    const countByStatus = useMemo(() => {
        const map = {};
        JOB_STATUSES.forEach(s => { map[s] = activeJobs.filter(j => j.status === s).length; });
        return map;
    }, [activeJobs]);

    const renderJobCard = (j) => {
        const matchInfo = jobMatches[j.id] || { count: 0, topMatch: null };
        const style = STATUS_STYLES[j.status] || STATUS_STYLES['Fechada'];
        const dl = formatDeadline(j.deadline);
        const appCount = appCountByJob[j.id] || 0;

        return (
            <div key={j.id} className="group bg-card border border-border rounded-xl p-5 hover:border-brand-orange/40 hover:shadow-md transition-all flex flex-col gap-3">
                {/* Topo: status + editar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <select
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium cursor-pointer outline-none transition-colors ${style.badge}`}
                            value={j.status}
                            onChange={e => onToggleStatus('jobs', { id: j.id, status: e.target.value })}
                            onClick={e => e.stopPropagation()}
                        >
                            {JOB_STATUSES.map(s => <option key={s} value={s} className="bg-card text-foreground">{s}</option>)}
                        </select>
                        {j.status === 'Aberta' && matchInfo.count > 0 && (
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${getMatchBadgeColor(matchInfo.topMatch?.matchLevel || 'low')}`}>
                                {matchInfo.count} match{matchInfo.count !== 1 ? 'es' : ''}
                            </span>
                        )}
                    </div>
                    <button onClick={() => onEdit(j)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-brand-orange hover:bg-brand-orange/10 rounded-lg transition-all">
                        <Edit3 size={15} />
                    </button>
                </div>

                {/* Título + empresa */}
                <div>
                    <h3 className="font-bold text-base text-foreground leading-snug">{j.title}</h3>
                    {j.company && <p className="text-sm text-muted-foreground mt-0.5">{j.company}</p>}
                </div>

                {/* Metadados */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {j.city && <span className="flex items-center gap-1"><MapPin size={11} /> {j.city}</span>}
                    {j.sector && <span className="flex items-center gap-1"><BarChart3 size={11} /> {j.sector}</span>}
                    {j.priority && (
                        <span className={`px-1.5 py-0.5 rounded font-medium ${
                            j.priority === 'Alta' ? 'bg-red-500/10 text-red-500'
                            : j.priority === 'Baixa' ? 'bg-green-500/10 text-green-500'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}>{j.priority}</span>
                    )}
                    {j.status === 'Aberta' && dl && (
                        <span className={`flex items-center gap-1 font-medium ${dl.expired ? 'text-red-500' : ''}`}>
                            <Clock size={11} /> Prazo: {dl.label}{dl.expired ? ' — vencido' : ''}
                        </span>
                    )}
                </div>

                {/* Rodapé */}
                <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
                    <button
                        onClick={e => { e.stopPropagation(); onViewCandidates?.(j); }}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand-orange transition-colors"
                    >
                        <Users size={12} />
                        {appCount} candidatura{appCount !== 1 ? 's' : ''}
                    </button>
                    {j.status === 'Aberta' && daysOpen(j) !== null && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock size={11} /> {daysOpen(j)}d aberta
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap flex-1">
                    {/* Busca */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                        <input
                            type="text"
                            placeholder="Buscar vaga, empresa, cidade..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-8 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none focus:border-brand-orange/50 w-56"
                        />
                    </div>
                    {/* Empresa */}
                    {uniqueCompanies.length > 0 && (
                        <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}
                            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-brand-orange/50">
                            <option value="all">Todas as empresas</option>
                            {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}
                </div>
                <button onClick={onAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-brand-orange/90 transition-colors shadow-sm flex-shrink-0">
                    <Plus size={16} /> Abrir Vaga
                </button>
            </div>

            {/* Chips de status */}
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${statusFilter === 'all' ? 'bg-brand-orange text-white border-brand-orange' : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-brand-orange/40'}`}
                >
                    Todas <span className="ml-1 opacity-70">({activeJobs.length})</span>
                </button>
                {JOB_STATUSES.map(s => {
                    const style = STATUS_STYLES[s];
                    const count = countByStatus[s] || 0;
                    return (
                        <button key={s} onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                statusFilter === s
                                    ? 'bg-brand-orange text-white border-brand-orange'
                                    : `bg-card border-border text-muted-foreground hover:text-foreground ${count === 0 ? 'opacity-40' : 'hover:border-brand-orange/40'}`
                            }`}
                        >
                            <span className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full inline-block ${style.dot}`} />
                                {s} <span className="opacity-70">({count})</span>
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Grid de vagas agrupadas por status */}
            {filteredJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Briefcase size={40} className="mb-3 opacity-20" />
                    <p className="font-medium">Nenhuma vaga encontrada</p>
                    <p className="text-sm mt-1 opacity-70">Tente ajustar os filtros ou criar uma nova vaga</p>
                </div>
            ) : statusFilter === 'all' ? (
                <div className="space-y-8">
                    {JOB_STATUSES.map(status => {
                        const group = jobsByStatus[status];
                        if (!group || group.length === 0) return null;
                        const style = STATUS_STYLES[status];
                        return (
                            <div key={status}>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                                    {status}
                                    <span className="text-xs font-normal opacity-60">({group.length})</span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {group.map(renderJobCard)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredJobs.map(renderJobCard)}
                </div>
            )}
        </div>
    );
};

export default JobsList;
