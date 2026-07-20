import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin, Briefcase, User, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const PRIORITY_STYLES = {
  Alta: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  Média: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  Baixa: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
};

const STATUS_STYLES = {
  Ativo: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  Contratado: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  Descartado: 'bg-gray-100 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400',
};

const fmt = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

export default function MappingsPage({
  mappings = [],
  candidates = [],
  positions = [],
  onEdit,
  onUpdateStatus,
  onUpdateCargo,
  onDelete,
  showToast,
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('Ativo');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Enriquecer mapeamentos com dados do candidato
  const enriched = useMemo(() => {
    return mappings.map(m => {
      const candidate = candidates.find(c => c.id === m.candidateId);
      return { ...m, candidate };
    });
  }, [mappings, candidates]);

  // Opções de filtro dinâmicas
  const cityOptions = useMemo(() => [...new Set(mappings.map(m => m.city).filter(Boolean))].sort(), [mappings]);
  const positionOptions = useMemo(() => [...new Set(mappings.map(m => m.positionName).filter(Boolean))].sort(), [mappings]);

  // Filtrar
  const filtered = useMemo(() => {
    let data = enriched;

    if (filterStatus !== 'all') data = data.filter(m => m.status === filterStatus);
    if (filterPosition !== 'all') data = data.filter(m => m.positionName === filterPosition);
    if (filterCity !== 'all') data = data.filter(m => m.city === filterCity);
    if (filterPriority !== 'all') data = data.filter(m => m.priority === filterPriority);

    if (search) {
      const s = search.toLowerCase();
      data = data.filter(m =>
        m.candidate?.fullName?.toLowerCase().includes(s) ||
        m.candidate?.email?.toLowerCase().includes(s) ||
        m.positionName?.toLowerCase().includes(s) ||
        m.city?.toLowerCase().includes(s) ||
        m.notes?.toLowerCase().includes(s)
      );
    }

    return data.sort((a, b) => {
      const pOrder = { Alta: 0, Média: 1, Baixa: 2 };
      if (pOrder[a.priority] !== pOrder[b.priority]) return (pOrder[a.priority] ?? 1) - (pOrder[b.priority] ?? 1);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [enriched, search, filterStatus, filterPosition, filterCity, filterPriority]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeFilters = [filterStatus !== 'Ativo' && filterStatus !== 'all', filterPosition !== 'all', filterCity !== 'all', filterPriority !== 'all', !!search].filter(Boolean).length;

  // Estado vazio
  if (mappings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground p-8">
        <MapPin size={48} className="mb-4 opacity-30" />
        <p className="font-medium text-foreground text-lg mb-1">Nenhum mapeamento registrado</p>
        <p className="text-sm text-center max-w-md">
          Mapeie candidatos com potencial diretamente no perfil deles.
          Os mapeamentos aparecem aqui para consulta rápida quando surgir uma vaga.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* Header */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 space-y-3 border-b border-border bg-card/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <MapPin size={22} className="text-brand-orange" />
              Mapeamentos
            </h2>
            <span className="px-2.5 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-semibold tabular-nums">
              {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <input
              className="w-full bg-background border border-border rounded-lg pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
              placeholder="Buscar por candidato, cargo, cidade..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange">
              <option value="all">Todos os status</option>
              <option value="Ativo">Ativos</option>
              <option value="Contratado">Contratados</option>
              <option value="Descartado">Descartados</option>
            </select>

            {positionOptions.length > 0 && (
              <select value={filterPosition} onChange={e => { setFilterPosition(e.target.value); setCurrentPage(1); }} className="bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange">
                <option value="all">Todos os cargos</option>
                {positionOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}

            {cityOptions.length > 0 && (
              <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setCurrentPage(1); }} className="bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange">
                <option value="all">Todas as cidades</option>
                {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}

            <select value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setCurrentPage(1); }} className="bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange">
              <option value="all">Todas prioridades</option>
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
          </div>
        </div>

        {/* Badges de filtros ativos */}
        {activeFilters > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Filtros:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                "{search}" <button onClick={() => setSearch('')}><X size={12} /></button>
              </span>
            )}
            <button
              onClick={() => { setSearch(''); setFilterStatus('Ativo'); setFilterPosition('all'); setFilterCity('all'); setFilterPriority('all'); }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >Limpar todos</button>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground p-8">
            <Filter size={32} className="mb-3 opacity-30" />
            <p className="font-medium text-foreground">Nenhum mapeamento encontrado</p>
            <p className="text-sm">Tente ajustar os filtros.</p>
          </div>
        ) : (
          <table className="w-full border-collapse min-w-[800px]">
            <thead className="bg-muted/60 sticky top-0 z-[1]">
              <tr>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Candidato</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cargo</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cidade</th>
                <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Prioridade</th>
                <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Observações</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Mapeado em</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Por</th>
                <th className="px-4 py-2.5 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((m, idx) => (
                <tr
                  key={m.id}
                  className={`border-b border-border/50 hover:bg-muted/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-muted/20'} ${m.status === 'Descartado' ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/candidate/${m.candidateId}`)}
                      className="text-left group"
                    >
                      <p className="text-sm font-medium text-foreground group-hover:text-brand-orange transition-colors truncate max-w-[180px]">
                        {m.candidate?.fullName || 'Candidato removido'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">{m.candidate?.email}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Briefcase size={13} className="text-muted-foreground/60 flex-shrink-0" />
                      {onUpdateCargo ? (
                        <select
                          value={m.positionId || ''}
                          onChange={e => {
                            const pos = positions.find(p => p.id === e.target.value);
                            onUpdateCargo(m.id, { positionId: e.target.value || null, positionName: pos?.name || null });
                          }}
                          className={`text-sm bg-transparent border rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-brand-orange max-w-[220px] ${m.positionName ? 'text-foreground border-border' : 'text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700'}`}
                          title="Definir cargo"
                        >
                          <option value="">Definir cargo…</option>
                          {(() => {
                            const groups = new Map();
                            positions.forEach(p => {
                              const k = p.trilha || '';
                              if (!groups.has(k)) groups.set(k, []);
                              groups.get(k).push(p);
                            });
                            return Array.from(groups.entries()).map(([trilha, items]) => (
                              trilha
                                ? <optgroup key={trilha} label={trilha}>{items.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>
                                : items.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                            ));
                          })()}
                        </select>
                      ) : (
                        <span className="text-sm text-foreground">{m.positionName || '-'}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-muted-foreground/60 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{m.city || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${PRIORITY_STYLES[m.priority] || PRIORITY_STYLES['Média']}`}>
                      {m.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {onUpdateStatus ? (
                      <select
                        value={m.status}
                        onChange={e => onUpdateStatus(m.id, e.target.value)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer border-0 outline-none ${STATUS_STYLES[m.status] || ''}`}
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Contratado">Contratado</option>
                        <option value="Descartado">Descartado</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_STYLES[m.status] || ''}`}>
                        {m.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={m.notes}>{m.notes || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmt(m.createdAt)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[100px]">{m.mappedByName || '-'}</td>
                  <td className="px-4 py-3">
                    {onDelete && (
                      <button
                        onClick={() => { if (window.confirm('Remover este mapeamento?')) onDelete(m.id); }}
                        className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="px-4 sm:px-6 py-3 border-t border-border bg-card/50 flex items-center justify-between">
          <p className="text-xs text-muted-foreground tabular-nums">
            {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} de {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded disabled:opacity-30 transition-colors"><ChevronLeft size={14} /></button>
            <span className="text-xs text-muted-foreground px-2">Pág {currentPage}/{totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded disabled:opacity-30 transition-colors"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
