import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { getCandidateTimestamp } from '../utils/timestampUtils';

const SubmissionsView = ({ candidatesLoading = false, candidates, onEdit }) => {
    const allSubmissions = useMemo(() =>
        (candidates || []).filter(c => !c.deletedAt).sort((a, b) => (getCandidateTimestamp(b) || 0) - (getCandidateTimestamp(a) || 0)),
        [candidates]
    );
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState('');
    const filtered = useMemo(() => {
        if (!search.trim()) return allSubmissions;
        const s = search.toLowerCase();
        return allSubmissions.filter(c =>
            (c.fullName || '').toLowerCase().includes(s) ||
            (c.email || '').toLowerCase().includes(s) ||
            (c.city || '').toLowerCase().includes(s)
        );
    }, [allSubmissions, search]);
    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, currentPage, itemsPerPage]);
    const formatEnvio = (c) => {
        const ts = getCandidateTimestamp(c);
        if (!ts) return 'N/A';
        return new Date(ts * 1000).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    if (candidatesLoading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <span>Carregando formulários...</span>
            </div>
        );
    }
    return (
        <div className="flex flex-col h-full p-6 overflow-hidden bg-background">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-foreground">Formulários recebidos</h2>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">
                        {filtered.length} envios
                    </span>
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, e-mail ou cidade..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="pl-10 pr-3 py-1.5 text-sm border border-border rounded-lg bg-card text-foreground w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <select
                        value={itemsPerPage}
                        onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="px-3 py-1.5 text-sm border border-border rounded-lg bg-card text-foreground"
                    >
                        <option value={10}>10 por página</option>
                        <option value={25}>25 por página</option>
                        <option value={50}>50 por página</option>
                        <option value={100}>100 por página</option>
                        <option value={500}>500 por página</option>
                    </select>
                </div>
            </div>
            <div className="flex-1 overflow-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 sticky top-0 z-10">
                        <tr>
                            <th className="p-3 font-semibold text-muted-foreground whitespace-nowrap">Data do envio</th>
                            <th className="p-3 font-semibold text-muted-foreground">Nome</th>
                            <th className="p-3 font-semibold text-muted-foreground">E-mail</th>
                            <th className="p-3 font-semibold text-muted-foreground">Cidade</th>
                            <th className="p-3 font-semibold text-muted-foreground">Origem</th>
                            <th className="p-3 font-semibold text-muted-foreground">Status</th>
                            <th className="p-3 font-semibold text-muted-foreground w-24">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {paginated.map(c => (
                            <tr
                                key={c.id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                                onClick={() => onEdit(c)}
                            >
                                <td className="p-3 text-muted-foreground whitespace-nowrap">{formatEnvio(c)}</td>
                                <td className="p-3 text-foreground font-medium">{c.fullName || '—'}</td>
                                <td className="p-3 text-muted-foreground">{c.email || '—'}</td>
                                <td className="p-3 text-muted-foreground">{c.city || '—'}</td>
                                <td className="p-3 text-muted-foreground">{c.origin || c.source || '—'}</td>
                                <td className="p-3 text-muted-foreground">{c.status || '—'}</td>
                                <td className="p-3" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => onEdit(c)} className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium">Ver perfil</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filtered.length)} de {filtered.length} envios
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 bg-card border border-border rounded text-sm disabled:opacity-50">Anterior</button>
                        <span className="px-3 py-1.5 text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
                        <button type="button" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-card border border-border rounded text-sm disabled:opacity-50">Próxima</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmissionsView;
