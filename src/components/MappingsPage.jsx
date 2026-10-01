import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin, Briefcase, ChevronLeft, ChevronRight, Filter, List, LayoutGrid } from 'lucide-react';
import MappingsBoard from './mapping/MappingsBoard';
import {
  NIVEIS, ORDEM_NIVEL, MAPPING_STATUSES, nivelEfetivo, niveisDisponiveis, mappingLabel, agruparPorTrilha,
} from '../utils/mappings';
import { AlternativaInfo } from './mapping/MappingSection';

const STATUS_STYLES = {
  Ativo: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  Contratado: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  Descartado: 'bg-gray-100 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400',
};

const selectCls = 'bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange';

const fmt = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

export default function MappingsPage({ mapeamento, candidates = [], candidatesLoading = false }) {
  const navigate = useNavigate();
  const { mappings = [], funcoes = [], adminSucessao, update, updateStatus, remove } = mapeamento || {};
  const [search, setSearch] = useState('');
  const [filterFuncao, setFilterFuncao] = useState('all'); // 'all' | 'sem' | funcaoId
  const [filterCity, setFilterCity] = useState('all');
  const [filterNivel, setFilterNivel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('Ativo');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  // Lista (por candidato) ou quadro (por posição). Lembrado neste navegador.
  const [visao, setVisao] = useState(() => { try { return localStorage.getItem('yt_mapeamentos_visao') || 'lista'; } catch { return 'lista'; } });
  const trocarVisao = (v) => { setVisao(v); try { localStorage.setItem('yt_mapeamentos_visao', v); } catch { /* sem storage */ } };

  const grupos = useMemo(() => agruparPorTrilha(funcoes), [funcoes]);
  const niveis = niveisDisponiveis(adminSucessao);

  // Enriquecer com candidato e rótulo
  const enriched = useMemo(() => mappings.map(m => {
    // Usa o candidato da lista global (dados completos) ou, se ainda nao
    // carregou, cai no nome/e-mail que vieram junto do mapeamento (join).
    const candidate = candidates.find(c => c.id === m.candidateId)
      || (m.candidateName ? { id: m.candidateId, fullName: m.candidateName, email: m.candidateEmail } : undefined);
    return { ...m, candidate, label: mappingLabel(m, mapeamento), nivelVisto: nivelEfetivo(m) };
  }), [mappings, candidates, mapeamento]);

  const cityOptions = useMemo(() => [...new Set(mappings.map(m => m.city).filter(Boolean))].sort(), [mappings]);
  // Só as funções que têm mapeamento, para o filtro não listar as 19.
  const funcaoOptions = useMemo(() => {
    const usadas = new Set(mappings.map(m => m.funcaoId).filter(Boolean));
    return funcoes.filter(f => usadas.has(f.id));
  }, [mappings, funcoes]);
  const temSemFuncao = mappings.some(m => !m.funcaoId);

  const filtered = useMemo(() => {
    let data = enriched;
    if (filterStatus !== 'all') data = data.filter(m => m.status === filterStatus);
    if (filterFuncao === 'sem') data = data.filter(m => !m.funcaoId);
    else if (filterFuncao !== 'all') data = data.filter(m => m.funcaoId === filterFuncao);
    if (filterCity !== 'all') data = data.filter(m => m.city === filterCity);
    if (filterNivel !== 'all') data = data.filter(m => m.nivelVisto === filterNivel);

    if (search) {
      const s = search.toLowerCase();
      data = data.filter(m =>
        m.candidate?.fullName?.toLowerCase().includes(s) ||
        m.candidate?.email?.toLowerCase().includes(s) ||
        m.label?.toLowerCase().includes(s) ||
        m.city?.toLowerCase().includes(s) ||
        m.notes?.toLowerCase().includes(s)
      );
    }

    return [...data].sort((a, b) =>
      (ORDEM_NIVEL[a.nivelVisto] ?? 9) - (ORDEM_NIVEL[b.nivelVisto] ?? 9)
      || new Date(b.createdAt) - new Date(a.createdAt));
  }, [enriched, search, filterStatus, filterFuncao, filterCity, filterNivel]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeFilters = [filterStatus !== 'Ativo' && filterStatus !== 'all', filterFuncao !== 'all', filterCity !== 'all', filterNivel !== 'all', !!search].filter(Boolean).length;

  const mudarNivel = (m, nivel) => {
    if (m.alternativa && nivel !== 'alternativa'
      && !window.confirm('Isso tira a pessoa do plano de sucessão da função (e descarta a aprovação). Continuar?')) return;
    update(m.id, { nivel });
  };

  const vazio = mappings.length === 0;
  const estadoVazio = (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground p-8">
        <MapPin size={48} className="mb-4 opacity-30" />
        <p className="font-medium text-foreground text-lg mb-1">Nenhum mapeamento registrado</p>
        <p className="text-sm text-center max-w-md">
          Mapeie candidatos com potencial diretamente no perfil deles.
          Os mapeamentos aparecem aqui para consulta rápida quando surgir uma vaga.
        </p>
      </div>
  );

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
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5" role="group">
            <button onClick={() => trocarVisao('lista')} className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 ${visao === 'lista' ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}>
              <List size={14} /> Lista
            </button>
            <button onClick={() => trocarVisao('quadro')} className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 ${visao === 'quadro' ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`} title="Por posição (função + equipe + cidade)">
              <LayoutGrid size={14} /> Quadro por posição
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <input
              className="w-full bg-background border border-border rounded-lg pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
              placeholder="Buscar por candidato, função, cidade..."
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
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }} className={selectCls}>
              <option value="all">Todos os status</option>
              <option value="Ativo">Ativos</option>
              <option value="Contratado">Contratados</option>
              <option value="Descartado">Descartados</option>
            </select>

            <select value={filterFuncao} onChange={e => { setFilterFuncao(e.target.value); setCurrentPage(1); }} className={selectCls}>
              <option value="all">Todas as funções</option>
              {temSemFuncao && <option value="sem">Sem função definida</option>}
              {funcaoOptions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>

            <select value={filterNivel} onChange={e => { setFilterNivel(e.target.value); setCurrentPage(1); }} className={selectCls}>
              <option value="all">Todos os níveis</option>
              {niveis.map(n => <option key={n} value={n}>{NIVEIS[n].label}</option>)}
            </select>

            {cityOptions.length > 0 && (
              <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setCurrentPage(1); }} className={selectCls}>
                <option value="all">Todas as cidades</option>
                {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        </div>

        {activeFilters > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Filtros:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                "{search}" <button onClick={() => setSearch('')}><X size={12} /></button>
              </span>
            )}
            <button
              onClick={() => { setSearch(''); setFilterStatus('Ativo'); setFilterFuncao('all'); setFilterCity('all'); setFilterNivel('all'); }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >Limpar todos</button>
          </div>
        )}
      </div>

      {visao === 'quadro' ? (
        <div className="flex-1 overflow-hidden">
          <MappingsBoard mappings={mappings} candidates={candidates} mapeamento={mapeamento} filtroNivel={filterNivel} busca={search} />
        </div>
      ) : vazio ? estadoVazio : (<>
      {/* Tabela */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground p-8">
            <Filter size={32} className="mb-3 opacity-30" />
            <p className="font-medium text-foreground">Nenhum mapeamento encontrado</p>
            <p className="text-sm">Tente ajustar os filtros.</p>
          </div>
        ) : (
          <table className="w-full border-collapse min-w-[900px]">
            <thead className="bg-muted/60 sticky top-0 z-[1]">
              <tr>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Candidato</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Função</th>
                <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nível</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cidade</th>
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
                  className={`border-b border-border/50 hover:bg-muted/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-muted/20'} ${m.status !== 'Ativo' ? 'opacity-60' : ''}`}
                >
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/candidate/${m.candidateId}`)} className="text-left group">
                      <p className="text-sm font-medium text-foreground group-hover:text-brand-orange transition-colors truncate max-w-[180px]">
                        {m.candidate?.fullName || (candidatesLoading ? <span className="text-muted-foreground font-normal italic">Carregando…</span> : 'Candidato removido')}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">{m.candidate?.email}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-1.5">
                      <Briefcase size={13} className="text-muted-foreground/60 flex-shrink-0 mt-1" />
                      <div className="min-w-0">
                        {/* Sem função: permite definir aqui mesmo (o texto livre continua valendo). */}
                        {!m.funcaoId && update ? (
                          <select
                            value=""
                            onChange={e => e.target.value && update(m.id, { funcaoId: e.target.value })}
                            className="text-sm bg-transparent border rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-brand-orange max-w-[220px] text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700"
                            title="Definir função"
                          >
                            <option value="">Definir função…</option>
                            {grupos.map(([trilha, itens]) => (
                              <optgroup key={trilha} label={trilha}>
                                {itens.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                              </optgroup>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm text-foreground">{m.label || '-'}</span>
                        )}
                        {!m.funcaoId && m.label && <p className="text-xs text-muted-foreground truncate max-w-[220px]">{m.label}</p>}
                        {m.alternativa && <div><AlternativaInfo alternativa={m.alternativa} /></div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {update ? (
                      <select
                        value={m.nivelVisto}
                        onChange={e => mudarNivel(m, e.target.value)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border cursor-pointer outline-none ${NIVEIS[m.nivelVisto]?.badge || ''}`}
                      >
                        {niveis.map(n => (
                          <option key={n} value={n} disabled={n === 'alternativa' && !m.funcaoId}>{NIVEIS[n].label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${NIVEIS[m.nivelVisto]?.badge || ''}`}>
                        {NIVEIS[m.nivelVisto]?.label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-muted-foreground/60 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{m.city || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {updateStatus ? (
                      <select
                        value={m.status}
                        onChange={e => updateStatus(m.id, e.target.value)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer border-0 outline-none ${STATUS_STYLES[m.status] || ''}`}
                      >
                        {MAPPING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_STYLES[m.status] || ''}`}>{m.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={m.notes}>{m.notes || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmt(m.createdAt)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[100px]">{m.mappedByName || '-'}</td>
                  <td className="px-4 py-3">
                    {remove && (
                      <button
                        onClick={() => {
                          const aviso = m.alternativa ? '\n\nEle também sai do plano de sucessão da função.' : '';
                          if (window.confirm(`Remover este mapeamento?${aviso}`)) remove(m.id);
                        }}
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

      </>)}

      {visao === 'lista' && !vazio && totalPages > 1 && (
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
