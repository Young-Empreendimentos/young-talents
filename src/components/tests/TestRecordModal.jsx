import React, { useMemo, useState } from 'react';
import { X, Save, Loader2, Search } from 'lucide-react';
import { TEST_STATUSES, TEST_RESULTS, rh, candidateTestToRow, currentUserInfo } from '../../utils/tests';

// Modal para registrar/editar um teste de um candidato.
// - fixedCandidate: { id, fullName } quando vem da ficha do candidato
// - fixedTypeId: quando vem da página de um tipo de teste
// - initial: teste existente (modo edição)
export default function TestRecordModal({
  supabase,
  testTypes = [],
  candidates = [],
  fixedCandidate = null,
  fixedTypeId = null,
  initial = null,
  onSaved,
  onClose,
}) {
  const [candidateId, setCandidateId] = useState(initial?.candidateId || fixedCandidate?.id || '');
  const [candSearch, setCandSearch] = useState('');
  const [testTypeId, setTestTypeId] = useState(initial?.testTypeId || fixedTypeId || '');
  const [testDate, setTestDate] = useState(initial?.testDate || '');
  const [status, setStatus] = useState(initial?.status || 'Pendente');
  const [result, setResult] = useState(initial?.result || '');
  const [score, setScore] = useState(initial?.score ?? '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const activeTypes = useMemo(
    () => testTypes.filter(t => t.active || t.id === testTypeId).sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [testTypes, testTypeId]
  );

  const candOptions = useMemo(() => {
    const list = candidates.filter(c => !c.deletedAt);
    if (!candSearch.trim()) return list.slice(0, 50);
    const s = candSearch.toLowerCase();
    return list.filter(c => (c.fullName || '').toLowerCase().includes(s) || (c.email || '').toLowerCase().includes(s)).slice(0, 50);
  }, [candidates, candSearch]);

  const handleSave = async () => {
    setError('');
    if (!candidateId) { setError('Selecione o candidato.'); return; }
    if (!testTypeId) { setError('Selecione o tipo de teste.'); return; }
    if (score !== '' && (isNaN(Number(score)) || Number(score) < 0 || Number(score) > 10)) {
      setError('A nota deve ser um número entre 0 e 10.'); return;
    }
    setSaving(true);
    try {
      const row = candidateTestToRow({ candidateId, testTypeId, testDate, status, result, score, notes });
      let saved;
      if (initial?.id) {
        const { data, error } = await rh(supabase).from('talents_candidate_tests')
          .update({ ...row, updated_at: new Date().toISOString() }).eq('id', initial.id).select('*').single();
        if (error) throw error;
        saved = data;
      } else {
        const me = await currentUserInfo(supabase);
        const { data, error } = await rh(supabase).from('talents_candidate_tests')
          .insert({ ...row, created_by: me.email, created_by_name: me.name }).select('*').single();
        if (error) throw error;
        saved = data;
      }
      onSaved?.(saved);
    } catch (e) {
      setError(e?.message || 'Erro ao salvar o teste.');
      setSaving(false);
    }
  };

  const inputCls = 'w-full text-sm border border-input rounded px-2.5 py-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-brand-orange';
  const candName = fixedCandidate?.fullName || candidates.find(c => c.id === candidateId)?.fullName;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md border border-border max-h-[92vh] flex flex-col">
        <div className="px-5 py-4 border-b border-border flex justify-between items-center">
          <h3 className="font-bold text-foreground">{initial?.id ? 'Editar teste' : 'Registrar teste'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded"><X size={18} className="text-muted-foreground" /></button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto">
          {/* Candidato */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Candidato *</label>
            {fixedCandidate || initial?.id ? (
              <div className="text-sm text-foreground font-medium px-2.5 py-2 bg-muted rounded">{candName || 'Candidato'}</div>
            ) : (
              <>
                <div className="relative mb-1">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  <input className={inputCls + ' pl-8'} placeholder="Buscar candidato..." value={candSearch} onChange={e => setCandSearch(e.target.value)} />
                </div>
                <select className={inputCls} value={candidateId} onChange={e => setCandidateId(e.target.value)}>
                  <option value="">Selecione...</option>
                  {candOptions.map(c => <option key={c.id} value={c.id}>{c.fullName}{c.email ? ` — ${c.email}` : ''}</option>)}
                </select>
              </>
            )}
          </div>

          {/* Tipo de teste */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo de teste *</label>
            <select className={inputCls} value={testTypeId} onChange={e => setTestTypeId(e.target.value)} disabled={!!fixedTypeId}>
              <option value="">Selecione...</option>
              {activeTypes.map(t => <option key={t.id} value={t.id}>{t.name}{t.category ? ` (${t.category})` : ''}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select className={inputCls} value={status} onChange={e => setStatus(e.target.value)}>
                {TEST_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Data</label>
              <input type="date" className={inputCls} value={testDate} onChange={e => setTestDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Resultado</label>
              <select className={inputCls} value={result} onChange={e => setResult(e.target.value)}>
                <option value="">—</option>
                {TEST_RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Nota (0–10)</label>
              <input type="number" min="0" max="10" step="0.1" className={inputCls} value={score} onChange={e => setScore(e.target.value)} placeholder="opcional" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Observações</label>
            <textarea className={inputCls + ' h-20'} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações sobre o teste (opcional)..." />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-brand-orange rounded hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
