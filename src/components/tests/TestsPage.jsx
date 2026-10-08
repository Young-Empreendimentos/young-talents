import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ClipboardCheck, Plus, ChevronLeft, Edit3, Trash2, UserPlus, Loader2, Briefcase } from 'lucide-react';
import { supabase } from '../../supabase';
import {
  rh, mapTestType, mapCandidateTest, sortByScoreDesc, fmtDate,
  TEST_STATUS_STYLES, TEST_RESULT_STYLES,
} from '../../utils/tests';
import TestTypeModal from './TestTypeModal';
import TestRecordModal from './TestRecordModal';

const initials = (nome) => {
  const p = String(nome || '?').trim().split(' ').filter(Boolean);
  return ((p[0] || '?').charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : '')).toUpperCase();
};

export default function TestsPage({ candidates = [], onEditCandidate, showToast }) {
  const [types, setTypes] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [resultFilter, setResultFilter] = useState('all');
  const [typeModal, setTypeModal] = useState(null);     // { initial } | null
  const [recordModal, setRecordModal] = useState(null); // { fixedTypeId, initial } | null

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      const [{ data: ty }, { data: t }] = await Promise.all([
        rh(supabase).from('talents_test_types').select('*').order('name'),
        rh(supabase).from('talents_candidate_tests').select('*').order('created_at', { ascending: false }),
      ]);
      setTypes((ty || []).map(mapTestType));
      setTests((t || []).map(mapCandidateTest));
    } catch {
      setTypes([]); setTests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const candById = useMemo(() => {
    const m = {};
    candidates.forEach(c => { m[c.id] = c; });
    return m;
  }, [candidates]);

  const countsByType = useMemo(() => {
    const m = {};
    tests.forEach(t => {
      const c = m[t.testTypeId] || (m[t.testTypeId] = { total: 0, realizados: 0, aprovados: 0 });
      c.total++;
      if (t.status === 'Realizado') c.realizados++;
      if (t.result === 'Aprovado') c.aprovados++;
    });
    return m;
  }, [tests]);

  const selectedType = types.find(t => t.id === selectedTypeId) || null;

  const typeTests = useMemo(() => {
    let data = tests.filter(t => t.testTypeId === selectedTypeId);
    if (resultFilter !== 'all') {
      if (resultFilter === 'sem') data = data.filter(t => !t.result);
      else data = data.filter(t => t.result === resultFilter);
    }
    return data.slice().sort(sortByScoreDesc);
  }, [tests, selectedTypeId, resultFilter]);

  const removeType = async (type) => {
    if ((countsByType[type.id]?.total || 0) > 0) {
      showToast?.('Há testes de candidatos vinculados a esse tipo. Desative-o em vez de excluir.', 'error');
      return;
    }
    if (!window.confirm(`Excluir o tipo de teste "${type.name}"?`)) return;
    try {
      const { error } = await rh(supabase).from('talents_test_types').delete().eq('id', type.id);
      if (error) throw error;
      showToast?.('Tipo de teste excluído.', 'success');
      if (selectedTypeId === type.id) setSelectedTypeId(null);
      load();
    } catch (e) {
      showToast?.(e?.message || 'Erro ao excluir.', 'error');
    }
  };

  const removeTest = async (id) => {
    if (!window.confirm('Remover este teste do candidato?')) return;
    try {
      const { error } = await rh(supabase).from('talents_candidate_tests').delete().eq('id', id);
      if (error) throw error;
      showToast?.('Teste removido.', 'success');
      load();
    } catch (e) {
      showToast?.(e?.message || 'Erro ao remover.', 'error');
    }
  };

  // ---------- Detalhe de um tipo ----------
  if (selectedType) {
    const counts = countsByType[selectedType.id] || { total: 0, realizados: 0, aprovados: 0 };
    return (
      <div className="flex flex-col h-full overflow-hidden bg-background">
        <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-border bg-card/50 space-y-3">
          <button onClick={() => setSelectedTypeId(null)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><ChevronLeft size={16} /> Todos os testes</button>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2"><ClipboardCheck size={22} className="text-brand-orange" /> {selectedType.name}</h2>
              {selectedType.category && <span className="text-xs text-muted-foreground">{selectedType.category}</span>}
              {selectedType.description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{selectedType.description}</p>}
              <p className="text-xs text-muted-foreground mt-1">{counts.total} candidato(s) · {counts.realizados} realizado(s) · {counts.aprovados} aprovado(s)</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setRecordModal({ fixedTypeId: selectedType.id, initial: null })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-orange text-white text-sm font-medium hover:bg-orange-600"><UserPlus size={15} /> Adicionar candidato</button>
              <button onClick={() => setTypeModal({ initial: selectedType })} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground" title="Editar tipo"><Edit3 size={15} /></button>
              <button onClick={() => removeType(selectedType)} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-red-500" title="Excluir tipo"><Trash2 size={15} /></button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Resultado:</span>
            {['all', 'Aprovado', 'Aprovado com ressalvas', 'Reprovado', 'sem'].map(f => (
              <button key={f} onClick={() => setResultFilter(f)} className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${resultFilter === f ? 'bg-brand-orange text-white border-brand-orange' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>
                {f === 'all' ? 'Todos' : f === 'sem' ? 'Sem resultado' : f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {typeTests.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-10">Nenhum candidato fez esse teste ainda.</p>
          ) : (
            <div className="space-y-2 max-w-3xl">
              {typeTests.map((t, idx) => {
                const c = candById[t.candidateId];
                return (
                  <div key={t.id} className="flex items-center gap-3 px-3 py-3 rounded-lg border border-border bg-card group">
                    <div className="w-7 text-center text-sm font-bold text-muted-foreground tabular-nums">{t.score != null ? `${idx + 1}º` : '—'}</div>
                    <div className="w-9 h-9 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center text-xs font-bold flex-shrink-0">{initials(c?.fullName)}</div>
                    <div className="flex-1 min-w-0">
                      <button onClick={() => c && onEditCandidate?.(c)} className="text-sm font-medium text-foreground hover:text-brand-orange truncate block text-left">{c?.fullName || 'Candidato removido'}</button>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${TEST_STATUS_STYLES[t.status] || ''}`}>{t.status}</span>
                        {t.result && <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${TEST_RESULT_STYLES[t.result] || 'bg-slate-600 text-white'}`}>{t.result}</span>}
                        <span className="text-[11px] text-muted-foreground">{t.testDate ? fmtDate(t.testDate) : ''}</span>
                        {t.notes && <span className="text-[11px] text-muted-foreground truncate max-w-[200px]" title={t.notes}>· {t.notes}</span>}
                      </div>
                    </div>
                    {t.score != null && <div className="text-lg font-bold text-foreground tabular-nums flex-shrink-0">{t.score}</div>}
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setRecordModal({ fixedTypeId: selectedType.id, initial: t })} className="p-1 text-muted-foreground hover:text-brand-orange" title="Editar resultado"><Edit3 size={13} /></button>
                      <button onClick={() => removeTest(t.id)} className="p-1 text-muted-foreground hover:text-red-500" title="Remover"><Trash2 size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {typeModal && <TestTypeModal supabase={supabase} initial={typeModal.initial} onClose={() => setTypeModal(null)} onSaved={() => { setTypeModal(null); load(); }} />}
        {recordModal && (
          <TestRecordModal supabase={supabase} testTypes={types} candidates={candidates} fixedTypeId={recordModal.fixedTypeId} initial={recordModal.initial}
            onClose={() => setRecordModal(null)} onSaved={() => { setRecordModal(null); showToast?.('Teste salvo.', 'success'); load(); }} />
        )}
      </div>
    );
  }

  // ---------- Lista de tipos ----------
  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-border bg-card/50 flex items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2"><ClipboardCheck size={22} className="text-brand-orange" /> Testes</h2>
        <button onClick={() => setTypeModal({ initial: null })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-orange text-white text-sm font-medium hover:bg-orange-600"><Plus size={15} /> Novo tipo de teste</button>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center"><Loader2 size={16} className="animate-spin" /> Carregando…</div>
        ) : types.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
            <ClipboardCheck size={48} className="mb-4 opacity-30" />
            <p className="font-medium text-foreground text-lg mb-1">Nenhum tipo de teste cadastrado</p>
            <p className="text-sm text-center max-w-md">Cadastre os tipos de teste (Lógica, Excel, DISC…). Depois, registre quem fez cada teste e os resultados — aqui e na ficha de cada candidato.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {types.map(ty => {
              const c = countsByType[ty.id] || { total: 0, realizados: 0, aprovados: 0 };
              return (
                <button key={ty.id} onClick={() => { setResultFilter('all'); setSelectedTypeId(ty.id); }} className={`text-left bg-card border rounded-xl p-5 hover:border-brand-orange/50 hover:shadow-md transition-all ${ty.active ? 'border-border' : 'border-border/50 opacity-60'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-brand-orange/10 rounded-lg"><Briefcase size={18} className="text-brand-orange" /></div>
                    {!ty.active && <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">Inativo</span>}
                  </div>
                  <p className="text-sm font-bold text-foreground">{ty.name}</p>
                  {ty.category && <p className="text-xs text-muted-foreground">{ty.category}</p>}
                  <p className="text-xs text-muted-foreground mt-3">{c.total} candidato(s) · {c.aprovados} aprovado(s)</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {typeModal && <TestTypeModal supabase={supabase} initial={typeModal.initial} onClose={() => setTypeModal(null)} onSaved={() => { setTypeModal(null); load(); }} />}
    </div>
  );
}
