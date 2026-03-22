import React, { useState, useMemo } from 'react';
import { ArrowRight, Check, AlertCircle, CalendarCheck, ChevronDown, ChevronRight, Clock } from 'lucide-react';

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

import { PIPELINE_STAGES } from '../../../constants';
import { getCandidateTimestamp } from '../../../utils/timestampUtils';

// Dashboard com Gráficos
const Dashboard = ({
    candidatesLoading = false,
    filteredJobs,
    filteredCandidates,
    totalCandidatesCount = 0,
    totalSubmissionsCount = 0,
    onOpenCandidates,
    onSetModalTitle,
    onNavigateToCandidates,
    onNavigateToJobs,
    statusMovements = [],
    applications: applicationsProp = [],
    onViewJob,
    interviews = [],
    onScheduleInterview
}) => {
    const applications = applicationsProp || [];
    const [periodFilter, setPeriodFilter] = useState('today'); // Filtro de período para gráficos (padrão: Hoje)
    const [showCustomPeriod, setShowCustomPeriod] = useState(false);
    const [customDateStart, setCustomDateStart] = useState('');
    const [customDateEnd, setCustomDateEnd] = useState('');
    const [conversionExpanded, setConversionExpanded] = useState(false);
    const [jobsExpanded, setJobsExpanded] = useState(true);
    const [scorecardsExpanded, setScorecardsExpanded] = useState(true);
    const [kpisExpanded, setKpisExpanded] = useState(true);

    // Filtrar candidatos por período para scorecards (usa getCandidateTimestamp: original_timestamp prioridade, depois createdAt)
    const filteredCandidatesByPeriod = useMemo(() => {
        if (periodFilter === 'all') return filteredCandidates;
        if (periodFilter === 'custom' && customDateStart && customDateEnd) {
            const startDate = new Date(customDateStart).getTime() / 1000;
            const endDate = new Date(customDateEnd).getTime() / 1000 + 86400;
            return filteredCandidates.filter(c => {
                const ts = getCandidateTimestamp(c);
                if (!ts) return false;
                return ts >= startDate && ts <= endDate;
            });
        }

        const now = Date.now() / 1000;
        const periods = {
            'today': 1 * 24 * 60 * 60,
            '7d': 7 * 24 * 60 * 60,
            '30d': 30 * 24 * 60 * 60,
            '90d': 90 * 24 * 60 * 60
        };

        const cutoff = now - (periods[periodFilter] || 0);

        return filteredCandidates.filter(c => {
            const ts = getCandidateTimestamp(c);
            if (!ts) return false;
            return ts >= cutoff;
        });
    }, [filteredCandidates, periodFilter, customDateStart, customDateEnd]);

    // Filtrar statusMovements por período
    const filteredMovements = useMemo(() => {
        if (!periodFilter || periodFilter === 'all') return statusMovements;
        if (periodFilter === 'custom' && customDateStart && customDateEnd) {
            const startDate = new Date(customDateStart).getTime();
            const endDate = new Date(customDateEnd).getTime() + 86400000;
            return statusMovements.filter(m => {
                const ts = m.timestamp?.seconds || m.timestamp?._seconds || 0;
                const timestampMs = ts * 1000;
                return timestampMs >= startDate && timestampMs <= endDate;
            });
        }

        const now = Date.now();
        const periods = {
            'today': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000
        };

        const cutoff = now - (periods[periodFilter] || 0);

        return statusMovements.filter(m => {
            const ts = m.timestamp?.seconds || m.timestamp?._seconds || 0;
            return ts * 1000 >= cutoff;
        });
    }, [statusMovements, periodFilter, customDateStart, customDateEnd]);

    // Próximas entrevistas (apenas futuras e não canceladas)
    const upcomingInterviews = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return interviews
            .filter(i => {
                if (i.status === 'Cancelada' || i.status === 'Realizada') return false;
                const interviewDate = new Date(i.date);
                return interviewDate >= today;
            })
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA - dateB;
            })
            .slice(0, 5); // Mostrar apenas as 5 próximas
    }, [interviews]);

    // Calcular taxas de conversão BASEADAS NAS MOVIMENTAÇÕES REAIS
    // Conta quantos candidatos fizeram a transição de uma etapa para outra
    const conversionRates = useMemo(() => {
        const stages = [...PIPELINE_STAGES, 'Contratado'];
        const rates = [];

        // Se temos movimentações registradas, usa elas para calcular (com filtro de período)
        if (filteredMovements.length > 0) {
            for (let i = 0; i < stages.length - 1; i++) {
                const fromStage = stages[i];
                const toStage = stages[i + 1];

                // Conta movimentações que SAÍRAM desta etapa (filtradas por período)
                const movedFrom = filteredMovements.filter(m => m.previousStatus === fromStage).length;
                // Conta movimentações que foram PARA a próxima etapa (filtradas por período)
                const movedTo = filteredMovements.filter(m => m.previousStatus === fromStage && m.newStatus === toStage).length;

                // Também considera os que estão atualmente nesta etapa (usando candidatos filtrados por período)
                const currentInStage = filteredCandidatesByPeriod.filter(c => (c.status || 'Inscrito') === fromStage).length;
                const totalPassed = movedFrom + currentInStage;

                const rate = totalPassed > 0 ? ((movedTo / totalPassed) * 100).toFixed(1) : 0;

                rates.push({
                    from: fromStage,
                    to: toStage,
                    rate: parseFloat(rate),
                    fromCount: totalPassed,
                    toCount: movedTo,
                    hasMovements: true
                });
            }
        } else {
            // Fallback: cálculo simplificado baseado no status atual (menos preciso)
            for (let i = 0; i < stages.length - 1; i++) {
                const current = filteredCandidatesByPeriod.filter(c => c.status === stages[i]).length;
                const next = filteredCandidatesByPeriod.filter(c => c.status === stages[i + 1]).length;
                const rate = current > 0 ? ((next / current) * 100).toFixed(1) : 0;
                rates.push({
                    from: stages[i],
                    to: stages[i + 1],
                    rate: parseFloat(rate),
                    fromCount: current,
                    toCount: next,
                    hasMovements: false
                });
            }
        }
        return rates;
    }, [filteredCandidatesByPeriod, filteredMovements]);

    // Total de movimentações registradas (para mostrar indicador)
    const totalMovements = filteredMovements.length;

    const missingReturnCount = useMemo(() => {
        return filteredCandidatesByPeriod.filter(c => {
            const isSelectionStage = c.status === 'Seleção' || c.status === 'Selecionado';
            const needsReturn = !c.returnSent || c.returnSent === 'Pendente' || c.returnSent === 'Não';
            return isSelectionStage && needsReturn;
        }).length;
    }, [filteredCandidatesByPeriod]);

    const jobStats = {
        open: filteredJobs.filter(j => j.status === 'Aberta').length,
        filled: filteredJobs.filter(j => j.status === 'Preenchida').length,
        closed: filteredJobs.filter(j => j.status === 'Fechada').length,
    };

    const candidateStats = {
        total: filteredCandidatesByPeriod.length,
        hired: filteredCandidatesByPeriod.filter(c => c.status === 'Contratado').length,
        rejected: filteredCandidatesByPeriod.filter(c => c.status === 'Reprovado').length,
        active: filteredCandidatesByPeriod.filter(c => PIPELINE_STAGES.includes(c.status || 'Inscrito')).length,
    };

    // Taxa de conversão geral (Inscrito -> Contratado)
    const overallConversionRate = candidateStats.total > 0
        ? ((candidateStats.hired / candidateStats.total) * 100).toFixed(1)
        : 0;

    if (candidatesLoading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <span>Carregando candidatos...</span>
            </div>
        );
    }

    return (
        <div className="text-foreground space-y-6 overflow-y-auto h-full pb-6">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">Dashboard</h2>
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">
                        Total geral: {totalCandidatesCount} pessoas {totalSubmissionsCount > totalCandidatesCount && <span className="text-slate-500">({totalSubmissionsCount} envios)</span>}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Período:</label>
                    <select
                        value={periodFilter}
                        onChange={e => {
                            const value = e.target.value;
                            setPeriodFilter(value);
                            setShowCustomPeriod(value === 'custom');
                            if (value !== 'custom') {
                                setCustomDateStart('');
                                setCustomDateEnd('');
                            }
                        }}
                        className="px-3 py-2 bg-card border border-input rounded-lg text-sm text-foreground outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="today">Hoje</option>
                        <option value="all">Todo o período</option>
                        <option value="7d">Últimos 7 dias</option>
                        <option value="30d">Últimos 30 dias</option>
                        <option value="90d">Últimos 90 dias</option>
                        <option value="custom">Período personalizado</option>
                    </select>
                    {showCustomPeriod && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={customDateStart}
                                onChange={e => setCustomDateStart(e.target.value)}
                                className="px-3 py-2 bg-card border border-input rounded-lg text-sm text-foreground outline-none focus:border-blue-500"
                                placeholder="Data inicial"
                            />
                            <span className="text-muted-foreground">até</span>
                            <input
                                type="date"
                                value={customDateEnd}
                                onChange={e => setCustomDateEnd(e.target.value)}
                                className="px-3 py-2 bg-card border border-input rounded-lg text-sm text-foreground outline-none focus:border-blue-500"
                                placeholder="Data final"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Vagas com Candidaturas */}
            {applications.length > 0 && filteredJobs.filter(j => j.status === 'Aberta').length > 0 && (
                <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                    <button
                        onClick={() => setJobsExpanded(v => !v)}
                        className="w-full flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                    >
                        <h3 className="font-bold text-base text-foreground">Vagas Abertas - Candidaturas</h3>
                        {jobsExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                    </button>
                    {jobsExpanded && <div className="px-4 pb-4 space-y-3">
                        {filteredJobs.filter(j => j.status === 'Aberta').map(job => {
                            const jobApps = applications.filter(a => a.jobId === job.id);
                            const hired = jobApps.filter(a => a.status === 'Contratado').length;
                            const inProcess = jobApps.filter(a => PIPELINE_STAGES.includes(a.status)).length;
                            const rejected = jobApps.filter(a => a.status === 'Reprovado').length;

                            return (
                                <div
                                    key={job.id}
                                    onClick={() => onViewJob && onViewJob(job)}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-border hover:border-blue-500 cursor-pointer transition-colors"
                                >
                                    <div>
                                        <h4 className="font-medium text-foreground">{job.title}</h4>
                                        <p className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2">
                                            <span>{job.company} {job.city && `• ${job.city}`}</span>
                                            {daysOpen(job) !== null && (
                                                <span className="inline-flex items-center gap-1 text-slate-400">
                                                    <Clock size={10} /> aberta há {daysOpen(job)}d
                                                </span>
                                            )}
                                            {(() => {
                                                const dl = formatDeadline(job.deadline);
                                                if (!dl) return null;
                                                return (
                                                    <span className={`inline-flex items-center gap-1 font-medium ${dl.expired ? 'text-red-500' : 'text-slate-400'}`}>
                                                        <Clock size={10} /> Prazo: {dl.label}{dl.expired ? ' — vencido' : ''}
                                                    </span>
                                                );
                                            })()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-blue-600">{jobApps.length}</div>
                                            <div className="text-xs text-gray-500">total</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-yellow-600">{inProcess}</div>
                                            <div className="text-xs text-gray-500">em processo</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-green-600">{hired}</div>
                                            <div className="text-xs text-gray-500">contratados</div>
                                        </div>
                                        {rejected > 0 && (
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-red-500">{rejected}</div>
                                                <div className="text-xs text-gray-500">reprovados</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>}
                </div>
            )}

            {/* 4 scorecards: Em consideração, Considerados, Em testes/entrevistas, Faltam dar retorno */}
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <button
                    onClick={() => setScorecardsExpanded(v => !v)}
                    className="w-full flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                    <h3 className="font-bold text-base text-foreground">Situação do Pipeline</h3>
                    {scorecardsExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                </button>
            {scorecardsExpanded && <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div onClick={() => onNavigateToCandidates && onNavigateToCandidates('/candidates?starred=1')} className="cursor-pointer bg-gradient-to-br from-amber-500/20 to-amber-500/10 p-4 rounded-lg border border-amber-500/30 hover:scale-[1.01] transition-transform shadow-sm">
                    <div className="text-muted-foreground text-sm font-medium">Em consideração</div>
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{filteredCandidatesByPeriod.filter(c => c.starred === true).length}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">Marcados com estrela</div>
                </div>
                <div onClick={() => onNavigateToCandidates && onNavigateToCandidates('/candidates')} className="cursor-pointer bg-gradient-to-br from-[#4285F4]/20 to-[#4285F4]/10 p-4 rounded-lg border border-[#4285F4]/30 hover:scale-[1.01] transition-transform shadow-sm">
                    <div className="text-muted-foreground text-sm font-medium">Considerados</div>
                    <div className="text-2xl font-bold text-[#4285F4] mt-2">{filteredCandidatesByPeriod.filter(c => c.status === 'Considerado').length}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">Etapa Considerado</div>
                </div>
                <div onClick={() => onNavigateToCandidates && onNavigateToCandidates('/candidates')} className="cursor-pointer bg-gradient-to-br from-[#34A853]/20 to-[#34A853]/10 p-4 rounded-lg border border-[#34A853]/30 hover:scale-[1.01] transition-transform shadow-sm">
                    <div className="text-muted-foreground text-sm font-medium">Em testes/entrevistas</div>
                    <div className="text-2xl font-bold text-[#34A853] mt-2">{filteredCandidatesByPeriod.filter(c => ['Entrevista I', 'Testes', 'Entrevista II'].includes(c.status || '')).length}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">Entrevista I, Testes, Entrevista II</div>
                </div>
                <div onClick={() => {
                    if (onNavigateToCandidates) onNavigateToCandidates('/candidates?filter=missing-return');
                    else if (onOpenCandidates) {
                        if (onSetModalTitle) onSetModalTitle('Faltam dar retorno');
                        onOpenCandidates(filteredCandidates.filter(c => {
                            const isSelectionStage = c.status === 'Seleção' || c.status === 'Selecionado';
                            const needsReturn = !c.returnSent || c.returnSent === 'Pendente' || c.returnSent === 'Não';
                            return isSelectionStage && needsReturn;
                        }));
                    }
                }} className="cursor-pointer bg-gradient-to-br from-[#9C27B0]/20 to-[#9C27B0]/10 p-4 rounded-lg border border-[#9C27B0]/30 hover:scale-[1.01] transition-transform shadow-sm">
                    <div className="text-muted-foreground text-sm font-medium">Faltam dar retorno</div>
                    <div className="text-2xl font-bold text-[#9C27B0] mt-2">{missingReturnCount}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">Seleção sem confirmação</div>
                </div>
            </div>}
            </div>

            {/* Próximas Entrevistas */}
            {upcomingInterviews.length > 0 && (
                <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                    <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                        <CalendarCheck className="text-purple-500" size={20} /> Próximas Entrevistas
                    </h3>
                    <div className="space-y-3">
                        {upcomingInterviews.map(interview => {
                            const interviewDate = new Date(interview.date);
                            const isToday = interviewDate.toDateString() === new Date().toDateString();
                            const isTomorrow = interviewDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

                            return (
                                <div
                                    key={interview.id}
                                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${isToday
                                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                                            : 'bg-gray-50 dark:bg-gray-900/50 border-border'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${isToday ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-muted-foreground'
                                            }`}>
                                            <span className="text-xs font-medium">
                                                {interviewDate.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()}
                                            </span>
                                            <span className="text-lg font-bold">{interviewDate.getDate()}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-foreground">
                                                {interview.candidateName}
                                                {isToday && <span className="ml-2 text-xs bg-purple-500 text-white px-2 py-0.5 rounded">HOJE</span>}
                                                {isTomorrow && <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded">AMANHÃ</span>}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                                {interview.type} {interview.jobTitle && `• ${interview.jobTitle}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-foreground">{interview.time}</div>
                                        <div className="text-xs text-gray-500">
                                            {interview.isOnline ? 'Online' : `${interview.location || 'Presencial'}`}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Taxas de Conversão entre Etapas - colapsável */}
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <button
                    onClick={() => setConversionExpanded(v => !v)}
                    className="w-full flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                    <h3 className="font-bold text-base text-foreground">Taxas de Conversão por Etapa</h3>
                    <div className="flex items-center gap-2">
                        <div className={`text-xs px-2 py-1 rounded ${totalMovements > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                            {totalMovements > 0 ? (
                                <span className="flex items-center gap-1">
                                    <Check size={12} /> {totalMovements} movimentações
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <AlertCircle size={12} /> Dados estimados
                                </span>
                            )}
                        </div>
                        {conversionExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                    </div>
                </button>
                {conversionExpanded && (
                    <div className="px-4 pb-4">
                        <div className="flex flex-wrap gap-3">
                            {conversionRates.map((rate, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                                    <span className="text-xs text-gray-600 dark:text-gray-300">{rate.from}</span>
                                    <ArrowRight size={12} className="text-gray-400" />
                                    <span className="text-xs text-gray-600 dark:text-gray-300">{rate.to}</span>
                                    <span className={`text-sm font-bold ${rate.rate >= 50 ? 'text-green-500' : rate.rate >= 25 ? 'text-yellow-500' : 'text-red-500'}`}>
                                        {rate.rate}%
                                    </span>
                                    <span className="text-xs text-gray-500">({rate.toCount}/{rate.fromCount})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* KPIs Principais - ao final da página */}
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <button
                    onClick={() => setKpisExpanded(v => !v)}
                    className="w-full flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                    <h3 className="font-bold text-base text-foreground">Resumo Geral</h3>
                    {kpisExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                </button>
                {kpisExpanded && <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div onClick={() => onNavigateToCandidates ? onNavigateToCandidates('/candidates') : (onOpenCandidates && onOpenCandidates(filteredCandidates))} className="cursor-pointer bg-gradient-to-br from-[#4285F4]/20 to-[#4285F4]/10 p-6 rounded-lg border border-[#4285F4]/30 hover:scale-[1.01] transition-transform shadow-sm hover:shadow-[#4285F4]/20">
                    <h3 className="text-muted-foreground text-sm font-semibold">Total de Candidatos</h3>
                    <p className="text-3xl font-bold text-[#4285F4] mt-2">{candidateStats.total}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{candidateStats.active} em processo</p>
                </div>
                <div onClick={() => onNavigateToJobs ? onNavigateToJobs('/jobs?status=Aberta') : (onNavigateToCandidates ? onNavigateToCandidates('/candidates?jobs=open') : (onOpenCandidates && onOpenCandidates(filteredJobs.filter(j => j.status === 'Aberta').flatMap(j => filteredCandidates.filter(c => c.jobId === j.id)))))} className="cursor-pointer bg-gradient-to-br from-[#FBBC04]/20 to-[#FBBC04]/10 p-6 rounded-lg border border-[#FBBC04]/30 hover:scale-[1.01] transition-transform shadow-sm hover:shadow-[#FBBC04]/20">
                    <h3 className="text-muted-foreground text-sm font-semibold">Vagas Abertas</h3>
                    <p className="text-3xl font-bold text-[#FBBC04] mt-2">{jobStats.open}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{jobStats.filled} preenchidas</p>
                </div>
                <div onClick={() => onNavigateToCandidates ? onNavigateToCandidates('/candidates?status=Contratado') : (onOpenCandidates && onOpenCandidates(filteredCandidates.filter(c => c.status === 'Contratado')))} className="cursor-pointer bg-gradient-to-br from-[#34A853]/20 to-[#34A853]/10 p-6 rounded-lg border border-[#34A853]/30 hover:scale-[1.01] transition-transform shadow-sm hover:shadow-[#34A853]/20">
                    <h3 className="text-muted-foreground text-sm font-semibold">Contratados</h3>
                    <p className="text-3xl font-bold text-[#34A853] mt-2">{candidateStats.hired}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Taxa geral: {overallConversionRate}%</p>
                </div>
                <div onClick={() => onNavigateToCandidates ? onNavigateToCandidates('/candidates?status=Reprovado') : (onOpenCandidates && onOpenCandidates(filteredCandidates.filter(c => c.status === 'Reprovado')))} className="cursor-pointer bg-gradient-to-br from-[#EA4335]/20 to-[#EA4335]/10 p-6 rounded-lg border border-[#EA4335]/30 hover:scale-[1.01] transition-transform shadow-sm hover:shadow-[#EA4335]/20">
                    <h3 className="text-muted-foreground text-sm font-semibold">Reprovados</h3>
                    <p className="text-3xl font-bold text-[#EA4335] mt-2">{candidateStats.rejected}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Taxa: {candidateStats.total > 0 ? ((candidateStats.rejected / candidateStats.total) * 100).toFixed(1) : 0}%</p>
                </div>
                </div>}
            </div>
        </div>
    );
};

export default Dashboard;
