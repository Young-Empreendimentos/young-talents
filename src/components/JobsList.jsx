import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit3, MapPin, Briefcase, Building2, BarChart3, Clock } from 'lucide-react';
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

const JobsList = ({ jobs, candidates, onAdd, onEdit, onToggleStatus, onViewCandidates, companies, initialStatusFilter }) => {
    const [activeTab, setActiveTab] = useState('status');
    const [statusFilter, setStatusFilter] = useState(initialStatusFilter && ['Aberta', 'Preenchida', 'Cancelada', 'Fechada'].includes(initialStatusFilter) ? initialStatusFilter : 'all');
    const [cityFilter, setCityFilter] = useState('all');
    const [companyFilter, setCompanyFilter] = useState('all');
    const [periodFilter, setPeriodFilter] = useState('all');

    useEffect(() => {
        if (initialStatusFilter && ['Aberta', 'Preenchida', 'Cancelada', 'Fechada'].includes(initialStatusFilter)) {
            setStatusFilter(initialStatusFilter);
        }
    }, [initialStatusFilter]);

    // Agrupar vagas por status
    const jobsByStatus = useMemo(() => {
        const grouped = {};
        JOB_STATUSES.forEach(status => {
            grouped[status] = jobs.filter(j => j.status === status);
        });
        return grouped;
    }, [jobs]);

    // Agrupar vagas por cidade
    const jobsByCity = useMemo(() => {
        const grouped = {};
        jobs.forEach(job => {
            const city = job.city || 'Sem cidade';
            if (!grouped[city]) grouped[city] = [];
            grouped[city].push(job);
        });
        return grouped;
    }, [jobs]);

    // Agrupar vagas por empresa
    const jobsByCompany = useMemo(() => {
        const grouped = {};
        jobs.forEach(job => {
            const company = job.company || 'Sem empresa';
            if (!grouped[company]) grouped[company] = [];
            grouped[company].push(job);
        });
        return grouped;
    }, [jobs]);

    // Agrupar vagas por período
    const jobsByPeriod = useMemo(() => {
        const now = Date.now() / 1000;
        const periods = {
            'Hoje': [],
            'Esta Semana': [],
            'Este Mês': [],
            'Últimos 3 Meses': [],
            'Anteriores': []
        };

        jobs.forEach(job => {
            const ts = job.createdAt?.seconds || job.createdAt?._seconds || 0;
            const daysAgo = (now - ts) / (24 * 60 * 60);

            if (daysAgo < 1) periods['Hoje'].push(job);
            else if (daysAgo < 7) periods['Esta Semana'].push(job);
            else if (daysAgo < 30) periods['Este Mês'].push(job);
            else if (daysAgo < 90) periods['Últimos 3 Meses'].push(job);
            else periods['Anteriores'].push(job);
        });

        return periods;
    }, [jobs]);

    // Filtrar vagas baseado na aba ativa
    const filteredJobs = useMemo(() => {
        // Filtrar registros deletados (soft delete)
        const activeJobs = jobs.filter(j => !j.deletedAt);

        if (activeTab === 'status') {
            if (statusFilter === 'all') return activeJobs;
            return activeJobs.filter(j => j.status === statusFilter);
        } else if (activeTab === 'city') {
            if (cityFilter === 'all') return activeJobs;
            return activeJobs.filter(j => (j.city || 'Sem cidade') === cityFilter);
        } else if (activeTab === 'company') {
            if (companyFilter === 'all') return activeJobs;
            return activeJobs.filter(j => (j.company || 'Sem empresa') === companyFilter);
        } else if (activeTab === 'period') {
            if (periodFilter === 'all') return activeJobs;
            // Recalcular jobsByPeriod apenas com jobs ativos
            const activeJobsByPeriod = {};
            activeJobs.forEach(j => {
                const ts = j.createdAt?.seconds || j.createdAt?._seconds;
                if (ts) {
                    const date = new Date(ts * 1000);
                    const monthYear = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                    if (!activeJobsByPeriod[monthYear]) activeJobsByPeriod[monthYear] = [];
                    activeJobsByPeriod[monthYear].push(j);
                }
            });
            return activeJobsByPeriod[periodFilter] || [];
        }
        return activeJobs;
    }, [activeTab, statusFilter, cityFilter, companyFilter, periodFilter, jobs, jobsByPeriod]);

    // Calcular matches para todas as vagas abertas
    const jobMatches = useMemo(() => {
        const matches = {};
        const openJobs = jobs.filter(j => j.status === 'Aberta' && !j.deletedAt);
        openJobs.forEach(job => {
            const matchingCandidates = findMatchingCandidates(job, candidates);
            matches[job.id] = {
                count: matchingCandidates.length,
                topMatch: matchingCandidates[0] || null,
                allMatches: matchingCandidates
            };
        });
        return matches;
    }, [jobs, candidates]);

    const renderJobCard = (j) => {
        const matchInfo = jobMatches[j.id] || { count: 0, topMatch: null, allMatches: [] };
        return (
            <div key={j.id} className="bg-brand-card p-6 rounded-lg border border-border shadow-sm group hover:border-brand-cyan/50 transition-colors">
                <div className="flex justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <select
                            className="text-xs px-2 py-1 rounded border bg-transparent outline-none cursor-pointer text-muted-foreground border-brand-cyan/30 hover:bg-brand-cyan/10 transition-colors"
                            value={j.status}
                            onChange={(e) => onToggleStatus('jobs', { id: j.id, status: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {JOB_STATUSES.map(s => <option key={s} value={s} className="bg-brand-card">{s}</option>)}
                        </select>
                        {j.status === 'Aberta' && matchInfo.count > 0 && (
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getMatchBadgeColor(matchInfo.topMatch?.matchLevel || 'low')}`}>
                                {matchInfo.count} match{matchInfo.count !== 1 ? 'es' : ''}
                            </span>
                        )}
                    </div>
                    <button onClick={() => onEdit(j)} className="text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit3 size={16} />
                    </button>
                </div>
                <h3 className="font-bold text-lg text-white mb-1 break-words">{j.title}</h3>
                <p className="text-sm text-slate-400 mb-2 break-words">{j.company}</p>
                <div className="space-y-1 mb-4">
                    {j.city && <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12} /> {j.city}</p>}
                    {j.sector && <p className="text-xs text-slate-500 flex items-center gap-1"><BarChart3 size={12} /> {j.sector}</p>}
                    {j.interestArea && <p className="text-xs text-muted-foreground flex items-center gap-1"><Briefcase size={12} /> {j.interestArea}</p>}
                    {j.priority && (
                        <p className="text-xs flex items-center gap-1">
                            <span className={`px-1.5 py-0.5 rounded font-medium ${j.priority === 'Alta' ? 'bg-red-500/20 text-red-400' : j.priority === 'Baixa' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {j.priority}
                            </span>
                        </p>
                    )}
                    {j.status === 'Aberta' && (() => {
                        const dl = formatDeadline(j.deadline);
                        if (!dl) return null;
                        return (
                            <p className={`text-xs flex items-center gap-1 font-medium ${dl.expired ? 'text-red-500' : 'text-slate-400'}`}>
                                <Clock size={11} /> Prazo: {dl.label}{dl.expired ? ' — vencido' : ''}
                            </p>
                        );
                    })()}
                </div>
                <div className="border-t border-border pt-4 flex justify-between items-center">
                    <p
                        className="text-xs text-slate-500 cursor-pointer hover:text-muted-foreground transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onViewCandidates) onViewCandidates(j);
                        }}
                    >
                        {candidates.filter(c => c.jobId === j.id).length} candidatos
                    </p>
                    {j.status === 'Aberta' && daysOpen(j) !== null && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock size={11} /> aberta há {daysOpen(j)}d
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header com botão centralizado */}
            <div className="flex flex-col items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Vagas</h2>
                <button
                    onClick={onAdd}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors font-medium shadow-sm hover:shadow-xl"
                >
                    <Plus size={20} /> Abrir Vaga
                </button>
            </div>

            {/* Dropdown de visualização */}
            <div className="flex gap-3 items-center">
                <label className="text-sm font-medium text-gray-300">Visualizar por:</label>
                <select
                    className="bg-brand-card border border-border rounded px-4 py-2 text-sm text-white outline-none focus:border-brand-cyan min-w-[180px]"
                    value={activeTab}
                    onChange={e => {
                        setActiveTab(e.target.value);
                        // Resetar filtros ao mudar de aba
                        setStatusFilter('all');
                        setCityFilter('all');
                        setCompanyFilter('all');
                        setPeriodFilter('all');
                    }}
                >
                    <option value="status">Por Status</option>
                    <option value="city">Por Cidade</option>
                    <option value="company">Por Empresa</option>
                    <option value="period">Por Período</option>
                </select>
            </div>

            {/* Filtros por aba */}
            <div className="flex gap-3 items-center flex-wrap">
                {activeTab === 'status' && (
                    <select
                        className="bg-brand-card border border-border rounded px-3 py-1.5 text-sm text-white outline-none focus:border-brand-cyan"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Todas as vagas</option>
                        {JOB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                )}
                {activeTab === 'city' && (
                    <select
                        className="bg-brand-card border border-border rounded px-3 py-1.5 text-sm text-white outline-none focus:border-brand-cyan"
                        value={cityFilter}
                        onChange={e => setCityFilter(e.target.value)}
                    >
                        <option value="all">Todas as cidades</option>
                        {Array.from(new Set(jobs.map(j => j.city).filter(Boolean))).sort().map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                )}
                {activeTab === 'company' && (
                    <select
                        className="bg-brand-card border border-border rounded px-3 py-1.5 text-sm text-white outline-none focus:border-brand-cyan"
                        value={companyFilter}
                        onChange={e => setCompanyFilter(e.target.value)}
                    >
                        <option value="all">Todas as empresas</option>
                        {Array.from(new Set(jobs.map(j => j.company).filter(Boolean))).sort().map(company => (
                            <option key={company} value={company}>{company}</option>
                        ))}
                    </select>
                )}
                {activeTab === 'period' && (
                    <select
                        className="bg-brand-card border border-border rounded px-3 py-1.5 text-sm text-white outline-none focus:border-brand-cyan"
                        value={periodFilter}
                        onChange={e => setPeriodFilter(e.target.value)}
                    >
                        <option value="all">Todos os períodos</option>
                        {Object.keys(jobsByPeriod).map(period => (
                            <option key={period} value={period}>{period} ({jobsByPeriod[period].length})</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Conteúdo agrupado ou filtrado */}
            {activeTab === 'status' && statusFilter === 'all' ? (
                <div className="space-y-8">
                    {JOB_STATUSES.map(status => (
                        jobsByStatus[status] && jobsByStatus[status].length > 0 && (
                            <div key={status}>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    {status} <span className="text-sm text-slate-400 font-normal">({jobsByStatus[status].length})</span>
                                </h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {jobsByStatus[status].map(renderJobCard)}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            ) : activeTab === 'city' && cityFilter === 'all' ? (
                <div className="space-y-8">
                    {Object.keys(jobsByCity).sort().map(city => (
                        jobsByCity[city].length > 0 && (
                            <div key={city}>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <MapPin size={18} /> {city} <span className="text-sm text-slate-400 font-normal">({jobsByCity[city].length})</span>
                                </h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {jobsByCity[city].map(renderJobCard)}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            ) : activeTab === 'company' && companyFilter === 'all' ? (
                <div className="space-y-8">
                    {Object.keys(jobsByCompany).sort().map(company => (
                        jobsByCompany[company].length > 0 && (
                            <div key={company}>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Building2 size={18} /> {company} <span className="text-sm text-slate-400 font-normal">({jobsByCompany[company].length})</span>
                                </h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {jobsByCompany[company].map(renderJobCard)}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            ) : activeTab === 'period' && periodFilter === 'all' ? (
                <div className="space-y-8">
                    {Object.keys(jobsByPeriod).map(period => (
                        jobsByPeriod[period].length > 0 && (
                            <div key={period}>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    {period} <span className="text-sm text-slate-400 font-normal">({jobsByPeriod[period].length})</span>
                                </h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {jobsByPeriod[period].map(renderJobCard)}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.length > 0 ? filteredJobs.map(renderJobCard) : (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            Nenhuma vaga encontrada
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default JobsList;
