import React from 'react';
import { FileText, Briefcase, Calendar, History, TrendingUp, CheckCircle, XCircle, Clock as ClockIcon } from 'lucide-react';
import { STATUS_COLORS, PIPELINE_STAGES, ALL_STATUSES } from '../../../constants';

export default function ProcessTab({
    candidate,
    jobs,
    applications,
    interviews,
    statusMovements,
    formatTimestamp,
    isEditing,
    editData,
    handleFieldChange,
    onStatusChange
}) {
    const candidateApplications = applications.filter(a => a.candidateId === candidate.id);
    const candidateInterviews = interviews.filter(i => i.candidateId === candidate.id);
    const candidateMovements = statusMovements.filter(m => m.candidateId === candidate.id);

    return (
        <div className="space-y-6">
            {/* Gestão de Etapa */}
            <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                    <TrendingUp size={20} />
                    Gestão de Etapa no Funil
                </h2>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Status Atual do Candidato
                    </label>
                    {isEditing ? (
                        <select
                            value={editData.status || candidate.status || 'Inscrito'}
                            onChange={(e) => {
                                const newStatus = e.target.value;
                                handleFieldChange('status', newStatus);
                            }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors cursor-pointer ${STATUS_COLORS[editData.status || candidate.status] || 'bg-slate-600 text-white border-slate-600'
                                } hover:opacity-80 outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                            {ALL_STATUSES.map(status => (
                                <option key={status} value={status} className="bg-card text-foreground">
                                    {status}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="flex items-center gap-4">
                            <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${STATUS_COLORS[candidate.status] || 'bg-slate-600 text-white'}`}>
                                {candidate.status || 'Inscrito'}
                            </span>
                            {onStatusChange && (
                                <select
                                    value={candidate.status || 'Inscrito'}
                                    onChange={async (e) => {
                                        const newStatus = e.target.value;
                                        if (newStatus === candidate.status) return;
                                        if (!window.confirm(`Tem certeza que deseja alterar a etapa para "${newStatus}"?`)) return;
                                        await onStatusChange(candidate.id, newStatus);
                                    }}
                                    className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-none rounded px-2 py-1 outline-none cursor-pointer hover:bg-slate-200"
                                >
                                    <option disabled value="">Mudar para...</option>
                                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Candidaturas e Entrevistas */}
                <div className="space-y-6">
                    {/* Candidaturas */}
                    <div className="bg-card rounded-lg border border-border p-6">
                        <h3 className="text-md font-bold text-foreground mb-4 flex items-center gap-2">
                            <Briefcase size={18} />
                            Vínculos com Vagas ({candidateApplications.length})
                        </h3>
                        {candidateApplications.length > 0 ? (
                            <div className="space-y-3">
                                {candidateApplications.map((app) => {
                                    const job = jobs.find(j => j.id === app.jobId);
                                    return (
                                        <div key={app.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-900/30">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-foreground text-sm">{job?.title || 'Vaga não encontrada'}</p>
                                                    <p className="text-xs text-muted-foreground">{job?.company || 'Empresa não informada'}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_COLORS[app.status] || 'bg-slate-600 text-white'}`}>
                                                    {app.status || 'Inscrito'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm italic py-4 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-lg">
                                Nenhuma candidatura vinculada
                            </p>
                        )}
                    </div>

                    {/* Entrevistas */}
                    <div className="bg-card rounded-lg border border-border p-6">
                        <h3 className="text-md font-bold text-foreground mb-4 flex items-center gap-2">
                            <Calendar size={18} />
                            Entrevistas ({candidateInterviews.length})
                        </h3>
                        {candidateInterviews.length > 0 ? (
                            <div className="space-y-3">
                                {candidateInterviews.map((interview) => {
                                    const job = jobs.find(j => j.id === interview.jobId);
                                    return (
                                        <div key={interview.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-900/30">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-foreground text-sm">
                                                        {interview.date} às {interview.time}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{job?.title || 'Vaga não encontrada'}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${interview.status === 'Realizada' ? 'bg-green-600 text-white' :
                                                    interview.status === 'Cancelada' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                                                    }`}>
                                                    {interview.status || 'Agendada'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm italic py-4 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-lg">
                                Nenhuma entrevista agendada
                            </p>
                        )}
                    </div>
                </div>

                {/* Timeline de Movimentações */}
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-md font-bold text-foreground mb-6 flex items-center gap-2">
                        <History size={18} />
                        Timeline do Candidato
                    </h3>
                    {candidateMovements.length > 0 ? (
                        <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                            <div className="space-y-6">
                                {candidateMovements
                                    .sort((a, b) => {
                                        const tsA = a.timestamp?.seconds || (a.timestamp ? new Date(a.timestamp).getTime() / 1000 : 0);
                                        const tsB = b.timestamp?.seconds || (b.timestamp ? new Date(b.timestamp).getTime() / 1000 : 0);
                                        return tsB - tsA;
                                    })
                                    .map((movement, idx) => {
                                        const isPositive = ['Contratado', 'Selecionado'].includes(movement.newStatus) || PIPELINE_STAGES.indexOf(movement.newStatus) > (movement.previousStatus ? PIPELINE_STAGES.indexOf(movement.previousStatus) : -1);
                                        return (
                                            <div key={movement.id || idx} className="relative pl-10">
                                                <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center z-10 ${isPositive ? 'bg-green-500' : 'bg-slate-400'}`}>
                                                    {movement.newStatus === 'Contratado' ? <CheckCircle size={16} className="text-white" /> : <ClockIcon size={14} className="text-white" />}
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase">{movement.previousStatus || 'Inscrito'}</span>
                                                        <span className="text-slate-400">→</span>
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${STATUS_COLORS[movement.newStatus] || 'bg-slate-600'}`}>
                                                            {movement.newStatus}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {formatTimestamp(movement.timestamp)} {movement.userName ? `· por ${movement.userName}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm italic py-8 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-lg">
                            Sem histórico disponível
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
