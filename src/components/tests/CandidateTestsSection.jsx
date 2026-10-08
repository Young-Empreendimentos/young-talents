import React, { useEffect, useState, useCallback } from 'react';
import { ClipboardCheck, Plus, Edit3, Trash2, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../../supabase';
import { rh, mapTestType, mapCandidateTest, TEST_STATUS_STYLES, TEST_RESULT_STYLES, fmtDate } from '../../utils/tests';
import TestRecordModal from './TestRecordModal';

// Seção "Testes" na ficha do candidato: lista os testes que ele fez + resultados,
// registrar/editar/remover. Carrega os próprios dados (schema rh).
export default function CandidateTestsSection({ candidate, onAdvanceStage, showToast }) {
  const [tests, setTests] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { initial }

  const load = useCallback(async () => {
    if (!supabase || !candidate?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const [{ data: t }, { data: ty }] = await Promise.all([
        rh(supabase).from('talents_candidate_tests').select('*').eq('candidate_id', candidate.id).order('created_at', { ascending: false }),
        rh(supabase).from('talents_test_types').select('*').order('name'),
      ]);
      setTests((t || []).map(mapCandidateTest));
      setTypes((ty || []).map(mapTestType));
    } catch {
      setTests([]); setTypes([]);
    } finally {
      setLoading(false);
    }
  }, [candidate?.id]);

  useEffect(() => { load(); }, [load]);

  const typeName = (id) => types.find(t => t.id === id)?.name || 'Tipo removido';

  const remove = async (id) => {
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

  const hasRealizado = tests.some(t => t.status === 'Realizado');
  const canMoveToTests = onAdvanceStage && hasRealizado && candidate?.status !== 'Testes realizados';

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <ClipboardCheck size={13} /> Testes ({tests.length})
        </p>
        <button onClick={() => setModal({ initial: null })} className="text-xs text-young-orange hover:underline flex items-center gap-1">
          <Plus size={12} /> Registrar teste
        </button>
      </div>

      {canMoveToTests && (
        <button
          onClick={() => onAdvanceStage(candidate, 'Testes realizados')}
          className="mb-3 w-full text-xs flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-brand-orange/40 text-brand-orange hover:bg-brand-orange/10 transition-colors"
        >
          Mover candidato para a etapa "Testes realizados" <ArrowRight size={12} />
        </button>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 size={14} className="animate-spin" /> Carregando…</div>
      ) : tests.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nenhum teste registrado.</p>
      ) : (
        <div className="space-y-2">
          {tests.map(t => (
            <div key={t.id} className="px-3 py-2.5 rounded-lg border border-border bg-background group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{typeName(t.testTypeId)}</span>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${TEST_STATUS_STYLES[t.status] || ''}`}>{t.status}</span>
                    {t.result && <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${TEST_RESULT_STYLES[t.result] || 'bg-slate-600 text-white'}`}>{t.result}</span>}
                    {t.score != null && <span className="text-[11px] font-bold text-foreground">Nota {t.score}</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t.testDate ? `Data: ${fmtDate(t.testDate)}` : 'Sem data'}{t.createdByName ? ` · por ${t.createdByName}` : ''}
                  </p>
                  {t.notes && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{t.notes}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal({ initial: t })} className="p-1 text-muted-foreground hover:text-brand-orange" title="Editar"><Edit3 size={13} /></button>
                  <button onClick={() => remove(t.id)} className="p-1 text-muted-foreground hover:text-red-500" title="Remover"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <TestRecordModal
          supabase={supabase}
          testTypes={types}
          fixedCandidate={{ id: candidate.id, fullName: candidate.fullName }}
          initial={modal.initial}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); showToast?.('Teste salvo.', 'success'); load(); }}
        />
      )}
    </div>
  );
}
