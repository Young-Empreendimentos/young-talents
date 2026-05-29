import React, { useState, useMemo } from 'react';
import {
    ArrowRight, Check, AlertCircle, CalendarCheck, ChevronDown, ChevronRight,
    Clock, Users, Briefcase, UserCheck, UserX, Star, TrendingUp, MapPin
} from 'lucide-react';
import { PIPELINE_STAGES } from '../../../constants';
import { getCandidateTimestamp } from '../../../utils/timestampUtils';

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

const PERIOD_OPTIONS = [
    { value: 'today', label: 'Hoje' },
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
    { value: 'all', label: 'Tudo' },
    { value: 'custom', label: 'Período' },
];

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
    const [periodFilter, setPeriodFilter] = useState('today');
    const [showCustomPeriod, setShowCustomPeriod] = useState(false);
    const [customDateStart, setCustomDateStart] = useState('');
    const [customDateEnd, setCustomDateEnd] = useState('');
    const [conversionExpanded, setConversionExpanded] = useState(false);

    // Filtrar candidatos por período
    const filteredCandidatesByPeriod = useMemo(() => {
        if (periodFilter === 'all') return filteredCandidates;
        if (periodFilter === 'custom' && customDateStart && customDateEnd) {
            const startDate = new Date(customDateStart).getTime() / 1000;
            const endDate = new Date(customDateEnd).getTime() / 1000 + 86400;
            return filteredCandidates.filter(c => {
                const ts = getCandidateTimestamp(c);
                return ts && ts >= startDate && ts <= endDate;
            });
        }
        const now = Date.now() / 1000;
        const periods = { 'today': 86400, '7d': 604800, '30d': 2592000, '90d': 7776000 };
        const cutoff = now - (periods[periodFilter] || 0);
        return filteredCandidates.filter(c => {
            const ts = getCandidateTimestamp(c);
            return ts && ts >= cutoff;
        });
    }, [filteredCandidates, periodFilter, customDateStart, customDateEnd]);

    // Filtrar movimentações por período
    const filteredMovements = useMemo(() => {
        if (!periodFilter || periodFilter === 'all') return statusMovements;
        if (periodFilter === 'custom' && customDateStart && customDateEnd) {
            const startDate = new Date(customDateStart).getTime();
            const endDate = new Date(customDateEnd).getTime() + 86400000;
            return statusMovements.filter(m => {
                const ts = (m.timestamp?.seconds || m.timestamp?._seconds || 0) * 1000;
                return ts >= startDate && ts <= endDate;
            });
        }
        const now = Date.now();
        const periods = { 'today': 86400000, '7d': 604800000, '30d': 2592000000, '90d': 7776000000 };
        const cutoff = now - (periods[periodFilter] || 0);
        return statusMovements.filter(m => {
            const ts = (m.timestamp?.seconds || m.timestamp?._seconds || 0) * 1000;
            return ts >= cutoff;
        });
    }, [statusMovements, periodFilter, customDateStart, customDateEnd]);

    // Próximas entrevistas
    const upcomingInterviews = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return interviews
            .filter(i => i.status !== 'Cancelada' && i.status !== 'Realizada' && new Date(i.date) >= today)
            .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
            .slice(0, 5);
    }, [interviews]);

    // Taxas de conversão
    const conversionRates = useMemo(() => {
        const stages = [...PIPELINE_STAGES, 'Contratado'];
        return stages.slice(0, -1).map((fromStage, i) => {
            const toStage = stages[i + 1];
            if (filteredMovements.length > 0) {
                const movedFrom = filteredMovements.filter(m => m.previousStatus === fromStage).length;
                const movedTo = filteredMovements.filter(m => m.previousStatus === fromStage && m.newStatus === toStage).length;
                const currentInStage = filteredCandidatesByPeriod.filter(c => c.status === fromStage).length;
                const total = movedFrom + currentInStage;
                return { from: fromStage, to: toStage, rate: total > 0 ? parseFloat(((movedTo / total) * 100).toFixed(1)) : 0, fromCount: total, toCount: movedTo, hasMovements: true };
            }
            const current = filteredCandidatesByPeriod.filter(c => c.status === fromStage).length;
            const next = filteredCandidatesByPeriod.filter(c => c.status === toStage).length;
            return { from: fromStage, to: toStage, rate: current > 0 ? parseFloat(((next / current) * 100).toFixed(1)) : 0, fromCount: current, toCount: next, hasMovements: false };
        });
    }, [filteredCandidatesByPeriod, filteredMovements]);

    const totalMovements = filteredMovements.length;

    const missingReturnCount = useMemo(() =>
        filteredCandidatesByPeriod.filter(c =>
            (c.status === 'Seleção' || c.status === 'Selecionado') &&
            (!c.returnSent || c.returnSent === 'Pendente' || c.returnSent === 'Não')
        ).length,
        [filteredCandidatesByPeriod]
    );

    const jobStats = {
        open: filteredJobs.filter(j => j.status === 'Aberta').length,
        filled: filteredJobs.filter(j => j.status === 'Preenchida').length,
    };

    const candidateStats = {
        total: filteredCandidatesByPeriod.length,
        hired: filteredCandidatesByPeriod.filter(c => c.status === 'Contratado').length,
        rejected: filteredCandidatesByPeriod.filter(c => c.status === 'Reprovado').length,
        active: filteredCandidatesByPeriod.filter(c => PIPELINE_STAGES.includes(c.status)).length,
        starred: filteredCandidatesByPeriod.filter(c => c.starred === true).length,
    };

    const overallConversionRate = candidateStats.total > 0
        ? ((candidateStats.hired / candidateStats.total) * 100).toFixed(1)
        : 0;

    if (candidatesLoading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <span>Carregando...</span>
            </div>
        );
    }

    return (
        <div className="text-foreground space-y-5 pb-8">

            {/* Filtro de período — chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
                {PERIOD_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => {
                            setPeriodFilter(opt.value);
                            setShowCustomPeriod(opt.value === 'custom');
                            if (opt.value !== 'custom') { setCustomDateStart(''); setCustomDateEnd(''); }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            periodFilter === opt.value
                                ? 'bg-brand-orange text-white'
                                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-brand-orange/50'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
                {showCustomPeriod && (
                    <div className="flex items-center gap-2 ml-1">
                        <input
                            type="date"
                            value={customDateStart}
                            onChange={e => setCustomDateStart(e.target.value)}
                            className="px-2.5 py-1.5 bg-card border border-border rounded-lg text-sm text-foreground outline-none focus:border-brand-orange"
                        />
                        <span className="text-muted-foreground text-sm">até</span>
                        <input
                            type="date"
                            value={customDateEnd}
                            onChange={e => setCustomDateEnd(e.target.value)}
                            className="px-2.5 py-1.5 bg-card border border-border rounded-lg text-sm text-foreground outline-none focus:border-brand-orange"
                        />
                    </div>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                    Total geral: <span className="font-semibold text-foreground">{totalCandidatesCount}</span> candidatos
                </span>
            </div>

            {/* KPIs principais — sempre visíveis no topo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total */}
                <div
                    onClick={() => onNavigateToCandidates?.('/candidates')}
                    className="cursor-pointer group bg-card border border-border rounded-xl p-5 hover:border-blue-400/60 hover:shadow-md transition-all"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Users size={18} className="text-blue-500" />
                        </div>
                        <span className="text-[10px] font-semibold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-wide">Inscritos</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{candidateStats.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">{candidateStats.active} em processo ativo</p>
                </div>

                {/* Vagas abertas */}
                <div
                    onClick={() => onNavigateToJobs?.('/jobs?status=Aberta')}
                    className="cursor-pointer group bg-card border border-border rounded-xl p-5 hover:border-amber-400/60 hover:shadow-md transition-all"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Briefcase size={18} className="text-amber-500" />
                        </div>
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wide">Vagas</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{jobStats.open}</p>
                    <p className="text-xs text-muted-foreground mt-1">{jobStats.filled} preenchida{jobStats.filled !== 1 ? 's' : ''}</p>
                </div>

                {/* Contratados */}
                <div
                    onClick={() => onNavigateToCandidates?.('/candidates?status=Contratado')}
                    className="cursor-pointer group bg-card border border-border rounded-xl p-5 hover:border-green-400/60 hover:shadow-md transition-all"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <UserCheck size={18} className="text-green-500" />
                        </div>
                        <span className="text-[10px] font-semibold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full uppercase tracking-wide">Contratados</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{candidateStats.hired}</p>
                    <p className="text-xs text-muted-foreground mt-1">Taxa: {overallConversionRate}%</p>
                </div>

                {/* Reprovados */}
                <div
                    onClick={() => onNavigateToCandidates?.('/candidates?status=Reprovado')}
                    className="cursor-pointer group bg-card border border-border rounded-xl p-5 hover:border-red-400/60 hover:shadow-md transition-all"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <UserX size={18} className="text-red-500" />
                        </div>
                        <span className="text-[10px] font-semibold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full uppercase tracking-wide">Reprovados</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{candidateStats.rejected}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {candidateStats.total > 0 ? ((candidateStats.rejected / candidateStats.total) * 100).toFixed(1) : 0}% do total
                    </p>
                </div>
            </div>

            {/* Cards de pipeline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Considerados */}
                <div
                    onClick={() => onNavigateToCandidates?.('/candidates')}
                    className="cursor-pointer bg-card border border-border rounded-xl p-5 hover:border-blue-400/50 hover:shadow-md transition-all"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <TrendingUp size={16} className="text-blue-500" />
                        </div>
                        <p className="text-sm font-semibold text-muted-foreground">Considerados</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                        {filteredCandidatesByPeriod.filter(c => c.status === 'Considerado').length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Vinculados a uma vaga</p>
                </div>

                {/* Em testes / entrevistas */}
                <div
                    onClick={() => onNavigateToCandidates?.('/candidates')}
                    className="cursor-pointer bg-card border border-border rounded-xl p-5 hover:border-purple-400/50 hover:shadow-md transition-all"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <CalendarCheck size={16} className="text-purple-500" />
                        </div>
                        <p className="text-sm font-semibold text-muted-foreground">Em testes / entrevistas</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                        {filteredCandidatesByPeriod.filter(c =>
                            ['Entrevista I realizada', 'Testes realizados', 'Entrevista II realizada', 'Teste de trabalho realizado',
                             'Entrevista I', 'Testes', 'Entrevista II'].includes(c.status || '')
                        ).length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Entrevistas + testes ativos</p>
                </div>

                {/* Faltam dar retorno */}
                <div
                    onClick={() => {
                        if (onNavigateToCandidates) onNavigateToCandidates('/candidates?filter=missing-return');
                        else if (onOpenCandidates) {
                            onSetModalTitle?.('Faltam dar retorno');
                            onOpenCandidates(filteredCandidates.filter(c =>
                                (c.status === 'Seleção' || c.status === 'Selecionado') &&
                                (!c.returnSent || c.returnSent === 'Pendente' || c.returnSent === 'Não')
                            ));
                        }
                    }}
                    className={`cursor-pointer bg-card border rounded-xl p-5 hover:shadow-md transition-all ${
                        missingReturnCount > 0
                            ? 'border-orange-400/50 hover:border-orange-400'
                            : 'border-border hover:border-border/80'
                    }`}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${missingReturnCount > 0 ? 'bg-orange-500/10' : 'bg-muted'}`}>
                            <AlertCircle size={16} className={missingReturnCount > 0 ? 'text-orange-500' : 'text-muted-foreground'} />
                        </div>
                        <p className="text-sm font-semibold text-muted-foreground">Faltam dar retorno</p>
                    </div>
                    <p className={`text-2xl font-bold ${missingReturnCount > 0 ? 'text-orange-500' : 'text-foreground'}`}>
                        {missingReturnCount}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Selecionados sem confirmação</p>
                </div>
            </div>

            {/* Vagas abertas com candidaturas */}
            {applications.length > 0 && filteredJobs.filter(j => j.status === 'Aberta').length > 0 && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <Briefcase size={16} className="text-brand-orange" />
                            Vagas Abertas
                        </h3>
                    </div>
                    <div className="p-4 space-y-2">
                        {filteredJobs.filter(j => j.status === 'Aberta').map(job => {
                            const jobApps = applications.filter(a => a.jobId === job.id);
                            const hired = jobApps.filter(a => a.status === 'Contratado').length;
                            const inProcess = jobApps.filter(a => PIPELINE_STAGES.includes(a.status)).length;
                            const rejected = jobApps.filter(a => a.status === 'Reprovado').length;
                            const dl = formatDeadline(job.deadline);

                            return (
                                <div
                                    key={job.id}
                                    onClick={() => onViewJob?.(job)}
                                    className="flex items-center justify-between px-4 py-3 bg-muted/40 rounded-lg border border-border hover:border-brand-orange/40 hover:bg-muted/70 cursor-pointer transition-all"
                                >
                                    <div className="min-w-0">
                                        <h4 className="font-medium text-foreground text-sm truncate">{job.title}</h4>
                                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                                            <span>{job.company}{job.city && ` · ${job.city}`}</span>
                                            {daysOpen(job) !== null && (
                                                <span className="flex items-center gap-1 text-muted-foreground/70">
                                                    <Clock size={10} /> {daysOpen(job)}d aberta
                                                </span>
                                            )}
                                            {dl && (
                                                <span className={`flex items-center gap-1 font-medium ${dl.expired ? 'text-red-500' : 'text-muted-foreground/70'}`}>
                                                    <Clock size={10} /> Prazo: {dl.label}{dl.expired ? ' — vencido' : ''}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-5 ml-4 flex-shrink-0">
                                        <div className="text-center">
                                            <div className="text-base font-bold text-blue-500">{jobApps.length}</div>
                                            <div className="text-[10px] text-muted-foreground">total</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-base font-bold text-amber-500">{inProcess}</div>
                                            <div className="text-[10px] text-muted-foreground">processo</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-base font-bold text-green-500">{hired}</div>
                                            <div className="text-[10px] text-muted-foreground">contratados</div>
                                        </div>
                                        {rejected > 0 && (
                                            <div className="text-center">
                                                <div className="text-base font-bold text-red-500">{rejected}</div>
                                                <div className="text-[10px] text-muted-foreground">reprovados</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Próximas entrevistas */}
            {upcomingInterviews.length > 0 && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <CalendarCheck size={16} className="text-purple-500" />
                            Próximas Entrevistas
                        </h3>
                    </div>
                    <div className="p-4 space-y-2">
                        {upcomingInterviews.map(interview => {
                            const interviewDate = new Date(interview.date);
                            const isToday = interviewDate.toDateString() === new Date().toDateString();
                            const isTomorrow = interviewDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

                            return (
                                <div
                                    key={interview.id}
                                    className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                                        isToday
                                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                                            : 'bg-muted/40 border-border'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${
                                            isToday ? 'bg-purple-500 text-white' : 'bg-muted text-muted-foreground'
                                        }`}>
                                            <span className="text-[9px] font-bold uppercase leading-none">
                                                {interviewDate.toLocaleDateString('pt-BR', { weekday: 'short' })}
                                            </span>
                                            <span className="text-base font-bold leading-tight">{interviewDate.getDate()}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                                {interview.candidateName}
                                                {isToday && <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded font-bold">HOJE</span>}
                                                {isTomorrow && <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold">AMANHÃ</span>}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {interview.type}{interview.jobTitle && ` · ${interview.jobTitle}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-sm font-bold text-foreground">{interview.time}</div>
                                        <div className="text-xs text-muted-foreground">{interview.isOnline ? 'Online' : (interview.location || 'Presencial')}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Taxas de conversão — colapsável (dado secundário) */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                    onClick={() => setConversionExpanded(v => !v)}
                    className="w-full flex justify-between items-center px-5 py-4 hover:bg-muted/40 transition-colors text-left"
                >
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <TrendingUp size={16} className="text-brand-orange" />
                        Taxas de Conversão por Etapa
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            totalMovements > 0
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        }`}>
                            {totalMovements > 0
                                ? <span className="flex items-center gap-1"><Check size={11} /> {totalMovements} movimentações</span>
                                : <span className="flex items-center gap-1"><AlertCircle size={11} /> Estimado</span>
                            }
                        </span>
                        {conversionExpanded
                            ? <ChevronDown size={15} className="text-muted-foreground" />
                            : <ChevronRight size={15} className="text-muted-foreground" />
                        }
                    </div>
                </button>
                {conversionExpanded && (
                    <div className="px-5 pb-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {conversionRates.map((rate, idx) => (
                                <div key={idx} className="bg-muted/50 rounded-lg px-4 py-3">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                                        <span className="font-medium truncate">{rate.from}</span>
                                        <ArrowRight size={11} className="flex-shrink-0" />
                                        <span className="font-medium truncate">{rate.to}</span>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <span className={`text-2xl font-bold ${
                                            rate.rate >= 50 ? 'text-green-500' : rate.rate >= 25 ? 'text-amber-500' : 'text-red-500'
                                        }`}>
                                            {rate.rate}%
                                        </span>
                                        <span className="text-xs text-muted-foreground">{rate.toCount}/{rate.fromCount}</span>
                                    </div>
                                    {/* Barra de progresso */}
                                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${
                                                rate.rate >= 50 ? 'bg-green-500' : rate.rate >= 25 ? 'bg-amber-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${Math.min(rate.rate, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Dashboard;
