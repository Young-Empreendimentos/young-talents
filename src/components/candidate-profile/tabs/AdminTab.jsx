import React from 'react';
import { Database, Tag, Clock, UserPlus, History } from 'lucide-react';

export default function AdminTab({
    candidate,
    submissionsByEmail,
    changeLog,
    activityLog = [],
    formatTimestamp
}) {
    return (
        <div className="space-y-6">
            {/* Metadados do Sistema */}
            <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                    <Database size={20} />
                    Informações Administrativas
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                            <Clock size={16} className="text-gray-400" />
                            Cadastro Original (Timestamp)
                        </label>
                        <p className="text-foreground text-sm font-medium">
                            {formatTimestamp(candidate.original_timestamp || candidate.createdAt)}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                            <Database size={16} className="text-gray-400" />
                            Data de Importação
                        </label>
                        <p className="text-foreground text-sm">
                            {formatTimestamp(candidate.createdAt)}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                            <UserPlus size={16} className="text-gray-400" />
                            Criado Por
                        </label>
                        <p className="text-foreground text-sm">
                            {candidate.createdBy || 'Sistema / Automático'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                            <Tag size={16} className="text-gray-400" />
                            Tags do Sistema
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {candidate.tags && candidate.tags.length > 0 ? (
                                candidate.tags.map((tag, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold uppercase">
                                        {tag}
                                    </span>
                                ))
                            ) : (
                                <p className="text-gray-400 text-xs italic">Nenhuma tag atribuída</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Histórico de Envios */}
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-foreground mb-4">
                        Outros envios deste e-mail ({submissionsByEmail.length})
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                        <ul className="space-y-2">
                            {submissionsByEmail.map((sub, idx) => (
                                <li key={sub.id} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                    <span className="font-medium">{formatTimestamp(sub.original_timestamp || sub.createdAt)}</span>
                                    {idx === 0 && <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded font-bold uppercase ml-2">Atual</span>}
                                    {sub.origin && <span className="text-[10px] text-slate-400 ml-auto">{sub.origin}</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Log de movimentações (activity_log) */}
            <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                    <History size={20} />
                    Log de movimentações
                </h2>
                {activityLog && activityLog.length > 0 ? (
                    <div className="space-y-3">
                        {activityLog.map((log) => (
                            <div key={log.id} className="border-l-2 border-blue-200 dark:border-blue-800 pl-4 py-2">
                                <p className="text-sm text-foreground font-medium">{log.description || log.type}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatTimestamp(log.timestamp)} · {log.userName || log.userEmail || 'Sistema'}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm">Nenhuma movimentação registrada.</p>
                )}
            </div>

            {/* Log Técnico de Alterações */}
            <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                    <History size={20} />
                    Histórico Técnico de Alterações
                </h2>
                {changeLog && changeLog.length > 0 ? (
                    <div className="space-y-4">
                        {changeLog.map((log, idx) => (
                            <div key={log.id || idx} className="border-l-2 border-slate-200 dark:border-slate-700 pl-4 py-1">
                                <p className="text-xs text-foreground">
                                    Campo <span className="font-bold text-blue-500">{log.field}</span>:
                                    <span className="text-gray-400 italic mx-2">{log.oldValue || '(nada)'}</span> →
                                    <span className="text-foreground font-medium ml-2">{log.newValue || '(nada)'}</span>
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    {formatTimestamp(log.timestamp)} · {log.userName || log.userId}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground text-sm">Nenhuma alteração manual registrada.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
