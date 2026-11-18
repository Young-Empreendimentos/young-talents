import React, { useCallback, useEffect, useState } from 'react';
import { GraduationCap, Plus, ChevronLeft, Edit3, Trash2, Loader2, Settings, X, ShieldCheck, BarChart3, Check } from 'lucide-react';
import { supabase } from '../../supabase';
import DetalheTentativa from './DetalheTentativa';

const rh = (sb) => sb.schema('rh');
const CATEGORIAS = ['Raciocínio Lógico', 'Matemática Básica', 'Matemática Financeira Avançada', 'Outra'];
const fmtData = (d) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDur = (s) => { s = Math.round(s || 0); return s >= 60 ? `${Math.floor(s / 60)}min${String(s % 60).padStart(2, '0')}s` : `${s}s`; };
const foraPorQuestao = (ev) => Object.entries(ev?.fora_por_questao || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([q, v]) => `Q${Number(q) + 1}: ${fmtDur(v)}`).join(', ');

// ---------------- Modal: criar/editar avaliação ----------------
function AvaliacaoModal({ initial, onClose, onSaved, showToast }) {
  const [f, setF] = useState(() => ({
    nome: initial?.nome || '', categoria: initial?.categoria || 'Raciocínio Lógico',
    descricao: initial?.descricao || '', duracao_min: initial?.duracao_min ?? 20,
    num_questoes: initial?.num_questoes ?? 12, ativo: initial?.ativo ?? true,
  }));
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const salvar = async () => {
    if (!f.nome.trim()) { showToast?.('Dê um nome à avaliação.', 'error'); return; }
    setSaving(true);
    const row = { nome: f.nome.trim(), categoria: f.categoria, descricao: f.descricao || null, duracao_min: f.duracao_min ? Number(f.duracao_min) : null, num_questoes: Number(f.num_questoes) || 12, ativo: f.ativo, updated_at: new Date().toISOString() };
    try {
      const q = initial?.id ? rh(supabase).from('talents_aval_avaliacoes').update(row).eq('id', initial.id) : rh(supabase).from('talents_aval_avaliacoes').insert(row);
      const { error } = await q; if (error) throw error;
      showToast?.('Avaliação salva.', 'success'); onSaved();
    } catch (e) { showToast?.(e?.message || 'Erro ao salvar.', 'error'); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-foreground">{initial?.id ? 'Editar avaliação' : 'Nova avaliação'}</h3><button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button></div>
        <div className="space-y-3">
          <div><label className="text-xs font-medium text-muted-foreground">Nome</label><input value={f.nome} onChange={e => set('nome', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" placeholder="Ex: Raciocínio Lógico" /></div>
          <div><label className="text-xs font-medium text-muted-foreground">Categoria</label><select value={f.categoria} onChange={e => set('categoria', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label className="text-xs font-medium text-muted-foreground">Descrição (aparece pro candidato)</label><textarea value={f.descricao} onChange={e => set('descricao', e.target.value)} rows={2} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">Tempo (min, vazio = sem limite)</label><input type="number" value={f.duracao_min ?? ''} onChange={e => set('duracao_min', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Nº de questões na prova</label><input type="number" value={f.num_questoes} onChange={e => set('num_questoes', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={f.ativo} onChange={e => set('ativo', e.target.checked)} /> Ativa (aparece para enviar)</label>
        </div>
        <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted text-sm">Cancelar</button><button onClick={salvar} disabled={saving} className="px-4 py-2 rounded-lg bg-brand-orange text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 inline-flex items-center gap-1.5">{saving && <Loader2 size={14} className="animate-spin" />} Salvar</button></div>
      </div>
    </div>
  );
}

// ---------------- Modal: criar/editar questão (fixa) ----------------
function QuestaoModal({ avaliacaoId, initial, onClose, onSaved, showToast }) {
  const [enunciado, setEnunciado] = useState(initial?.enunciado || '');
  const [assunto, setAssunto] = useState(initial?.assunto || '');
  const [dificuldade, setDificuldade] = useState(initial?.dificuldade || 1);
  const [opcoes, setOpcoes] = useState(() => [...(initial?.spec?.opcoes || []), '', '', '', '', ''].slice(0, 5));
  const [correta, setCorreta] = useState(initial?.spec?.correta ?? 0);
  const [saving, setSaving] = useState(false);

  const salvar = async () => {
    const ops = opcoes.map(o => o.trim()).filter(Boolean);
    if (!enunciado.trim()) { showToast?.('Escreva o enunciado.', 'error'); return; }
    if (ops.length < 2) { showToast?.('Precisa de ao menos 2 alternativas.', 'error'); return; }
    if (correta >= ops.length) { showToast?.('Marque qual alternativa é a correta.', 'error'); return; }
    const row = { avaliacao_id: avaliacaoId, tipo: 'fixa', assunto: assunto.trim() || 'Geral', dificuldade: Number(dificuldade), enunciado: enunciado.trim(), spec: { opcoes: ops, correta: Number(correta) }, ativo: true };
    setSaving(true);
    try {
      const q = initial?.id ? rh(supabase).from('talents_aval_questoes').update(row).eq('id', initial.id) : rh(supabase).from('talents_aval_questoes').insert(row);
      const { error } = await q; if (error) throw error;
      showToast?.('Questão salva.', 'success'); onSaved();
    } catch (e) { showToast?.(e?.message || 'Erro ao salvar questão.', 'error'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-foreground">{initial?.id ? 'Editar questão' : 'Nova questão'}</h3><button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button></div>
        <div className="space-y-3">
          <div><label className="text-xs font-medium text-muted-foreground">Enunciado</label><textarea value={enunciado} onChange={e => setEnunciado(e.target.value)} rows={3} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none" placeholder="Ex: Quanto é 15% de 2.000?" /></div>
          <p className="text-xs text-muted-foreground">Alternativas — marque a <b>correta</b> (deixe em branco as que não usar):</p>
          {opcoes.map((op, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correta" checked={correta === i} onChange={() => setCorreta(i)} title="Correta" />
              <span className="text-xs font-bold text-muted-foreground w-4">{String.fromCharCode(65 + i)}</span>
              <input value={op} onChange={e => setOpcoes(o => o.map((x, j) => j === i ? e.target.value : x))} className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">Assunto (p/ relatório)</label><input value={assunto} onChange={e => setAssunto(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" placeholder="Ex: Porcentagem" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Dificuldade</label><select value={dificuldade} onChange={e => setDificuldade(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"><option value={1}>Fácil</option><option value={2}>Média</option><option value={3}>Difícil</option></select></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted text-sm">Cancelar</button><button onClick={salvar} disabled={saving} className="px-4 py-2 rounded-lg bg-brand-orange text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 inline-flex items-center gap-1.5">{saving && <Loader2 size={14} className="animate-spin" />} Salvar</button></div>
      </div>
    </div>
  );
}

// ---------------- Modal: resultados (mais recentes em cima; clique abre o detalhe) ----------------
function ResultadosModal({ nome, resultados, loading, onClose }) {
  const [detalhe, setDetalhe] = useState(null); // { conviteId, nome }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl max-w-xl w-full p-6 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-foreground">Resultados · {nome}</h3><button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button></div>
        {loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center"><Loader2 size={16} className="animate-spin" /> Carregando…</div>
          : resultados.length === 0 ? <p className="text-sm text-muted-foreground italic py-4">Ninguém recebeu esta avaliação ainda.</p>
          : <div className="space-y-1.5">{resultados.map(c => {
              const t = Array.isArray(c.tentativa) ? c.tentativa[0] : c.tentativa;
              const nm = (Array.isArray(c.candidate) ? c.candidate[0]?.full_name : c.candidate?.full_name) || 'Candidato';
              const concluido = t?.concluido_em; const ev = t?.eventos || {}; const foraDet = foraPorQuestao(ev);
              return (
                <div key={c.id} onClick={concluido ? () => setDetalhe({ conviteId: c.id, nome: nm }) : undefined}
                  className={`px-3 py-2 rounded-lg border border-border bg-background flex items-center justify-between gap-2 ${concluido ? 'cursor-pointer hover:border-brand-orange/50' : ''}`}
                  title={concluido ? 'Ver respostas e tempos' : ''}>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{nm}</p>
                    <p className="text-[11px] text-muted-foreground">Enviada {fmtData(c.enviado_em)}{concluido ? ' · clique para ver as respostas' : ''}</p>
                    {concluido && ev.saiu_aba_qtd > 0 && <p className="text-[11px] text-amber-600 truncate" title={foraDet ? `Tempo fora por questão: ${foraDet}` : ''}>Saiu da aba {ev.saiu_aba_qtd}× · {fmtDur(ev.saiu_aba_seg)}{foraDet ? ` (${foraDet})` : ''}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {concluido ? <>
                      <p className="text-sm font-bold text-foreground">Nota {t.nota != null ? Number(t.nota).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—'} {t.total ? <span className="text-[11px] font-normal text-muted-foreground">({t.acertos}/{t.total})</span> : null}</p>
                      <p className={`text-[10px] inline-flex items-center gap-0.5 ${t.indice_confianca >= 80 ? 'text-emerald-600' : t.indice_confianca >= 50 ? 'text-amber-600' : 'text-red-600'}`}><ShieldCheck size={10} /> Confiança {t.indice_confianca}%</p>
                    </> : <span className="text-[11px] text-muted-foreground">{t?.iniciado_em ? 'Em andamento' : 'Aguardando'}</span>}
                  </div>
                </div>);
            })}</div>}
      </div>
      {detalhe && <DetalheTentativa conviteId={detalhe.conviteId} nome={detalhe.nome} onClose={() => setDetalhe(null)} />}
    </div>
  );
}

// ---------------- Config remetente ----------------
function ConfigModal({ onClose, showToast }) {
  const [remetente, setRemetente] = useState(''); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  useEffect(() => { (async () => { try { const { data } = await rh(supabase).from('talents_aval_config').select('email_remetente').eq('id', 1).maybeSingle(); setRemetente(data?.email_remetente || ''); } catch { /* ok */ } finally { setLoading(false); } })(); }, []);
  const salvar = async () => { setSaving(true); try { const { error } = await rh(supabase).from('talents_aval_config').update({ email_remetente: remetente.trim(), updated_at: new Date().toISOString() }).eq('id', 1); if (error) throw error; showToast?.('Configuração salva.', 'success'); onClose(); } catch (e) { showToast?.(e?.message || 'Erro ao salvar.', 'error'); } finally { setSaving(false); } };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-foreground">Configurações</h3><button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button></div>
        {loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 size={14} className="animate-spin" /> Carregando…</div> : (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Remetente dos e-mails de convite</label>
            <input value={remetente} onChange={e => setRemetente(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" placeholder='Nome <email@youngempreendimentos.com.br>' />
            <p className="text-[11px] text-muted-foreground">Formato: <code>Nome &lt;email&gt;</code>. O e-mail precisa ser do domínio youngempreendimentos.com.br.</p>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted text-sm">Cancelar</button><button onClick={salvar} disabled={saving || loading} className="px-4 py-2 rounded-lg bg-brand-orange text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 inline-flex items-center gap-1.5">{saving && <Loader2 size={14} className="animate-spin" />} Salvar</button></div>
      </div>
    </div>
  );
}

// ---------------- Página ----------------
export default function AvaliacoesPage({ showToast }) {
  const [resumo, setResumo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);
  const [questoes, setQuestoes] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [modalAval, setModalAval] = useState(null);
  const [modalQuestao, setModalQuestao] = useState(null);
  const [modalConfig, setModalConfig] = useState(false);
  const [verResultados, setVerResultados] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try { const { data } = await supabase.rpc('talents_aval_resumo'); setResumo(data || []); }
    catch { setResumo([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const carregarDetalhe = useCallback(async (id) => {
    setLoadingDetalhe(true);
    try {
      const [{ data: qs }, { data: res }] = await Promise.all([
        rh(supabase).from('talents_aval_questoes').select('*').eq('avaliacao_id', id).order('assunto'),
        rh(supabase).from('talents_aval_convites').select('id, status, enviado_em, expira_em, candidate:talents_candidates(full_name), tentativa:talents_aval_tentativas(nota, acertos, total, indice_confianca, concluido_em, iniciado_em, tempo_segundos, eventos)').eq('avaliacao_id', id).order('enviado_em', { ascending: false }).limit(300),
      ]);
      setQuestoes(qs || []); setResultados(res || []);
    } catch { setQuestoes([]); setResultados([]); } finally { setLoadingDetalhe(false); }
  }, []);
  useEffect(() => { if (sel?.id) carregarDetalhe(sel.id); }, [sel?.id, carregarDetalhe]);

  const removerQuestao = async (id) => {
    if (!window.confirm('Remover esta questão?')) return;
    try { const { error } = await rh(supabase).from('talents_aval_questoes').delete().eq('id', id); if (error) throw error; showToast?.('Questão removida.', 'success'); carregarDetalhe(sel.id); }
    catch (e) { showToast?.(e?.message || 'Erro ao remover.', 'error'); }
  };

  // ----- Detalhe: questões em destaque + botão de resultados -----
  if (sel) {
    const av = resumo.find(r => r.id === sel.id) || sel;
    return (
      <div className="flex flex-col h-full overflow-hidden bg-background">
        <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-border bg-card/50 space-y-2">
          <button onClick={() => setSel(null)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><ChevronLeft size={16} /> Todas as avaliações</button>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2"><GraduationCap size={22} className="text-brand-orange" /> {av.nome} {!av.ativo && <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">Inativa</span>}</h2>
              <p className="text-xs text-muted-foreground mt-1">{av.categoria} · {av.num_questoes} questões na prova · {av.duracao_min ? `${av.duracao_min} min` : 'sem limite'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setVerResultados(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground"><BarChart3 size={14} /> Resultados ({resultados.length})</button>
              <button onClick={() => setModalAval({ initial: av })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground"><Edit3 size={14} /> Editar prova</button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Questões ({questoes.length})</h3>
              <button onClick={() => setModalQuestao({ initial: null })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-orange text-white text-xs font-medium hover:bg-orange-600"><Plus size={13} /> Nova questão</button>
            </div>
            {loadingDetalhe ? <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 size={14} className="animate-spin" /> Carregando…</div>
              : questoes.length === 0 ? <p className="text-sm text-muted-foreground italic">Nenhuma questão. Clique em "Nova questão" para adicionar.</p>
              : <div className="space-y-2">{questoes.map((q, idx) => {
                  const ops = q.spec?.opcoes || []; const corr = q.spec?.correta;
                  return (
                    <div key={q.id} className="px-4 py-3 rounded-lg border border-border bg-card group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground"><span className="text-muted-foreground font-medium">{idx + 1}.</span> {q.enunciado}</p>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                            {ops.map((op, i) => (
                              <div key={i} className={`text-xs flex items-center gap-1.5 ${i === corr ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                                <span className="font-bold w-4">{String.fromCharCode(65 + i)}</span>{op}{i === corr && <Check size={12} className="flex-shrink-0" />}
                              </div>
                            ))}
                          </div>
                          {q.assunto && <p className="text-[11px] text-muted-foreground mt-2">{q.assunto} · {['', 'fácil', 'média', 'difícil'][q.dificuldade] || ''}</p>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setModalQuestao({ initial: q })} className="p-1 text-muted-foreground hover:text-brand-orange" title="Editar"><Edit3 size={13} /></button>
                          <button onClick={() => removerQuestao(q.id)} className="p-1 text-muted-foreground hover:text-red-500" title="Remover"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    </div>);
                })}</div>}
          </div>
        </div>

        {verResultados && <ResultadosModal nome={av.nome} resultados={resultados} loading={loadingDetalhe} onClose={() => setVerResultados(false)} />}
        {modalAval && <AvaliacaoModal initial={modalAval.initial} onClose={() => setModalAval(null)} onSaved={() => { setModalAval(null); load(); }} showToast={showToast} />}
        {modalQuestao && <QuestaoModal avaliacaoId={sel.id} initial={modalQuestao.initial} onClose={() => setModalQuestao(null)} onSaved={() => { setModalQuestao(null); carregarDetalhe(sel.id); }} showToast={showToast} />}
      </div>
    );
  }

  // ----- Lista -----
  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-border bg-card/50 flex items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2"><GraduationCap size={22} className="text-brand-orange" /> Avaliações</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setModalConfig(true)} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground" title="Configurações"><Settings size={16} /></button>
          <button onClick={() => setModalAval({ initial: null })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-orange text-white text-sm font-medium hover:bg-orange-600"><Plus size={15} /> Nova avaliação</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center"><Loader2 size={16} className="animate-spin" /> Carregando…</div>
          : resumo.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
              <GraduationCap size={48} className="mb-4 opacity-30" />
              <p className="font-medium text-foreground text-lg mb-1">Nenhuma avaliação cadastrada</p>
              <p className="text-sm text-center max-w-md">Crie uma avaliação, monte o banco de questões e envie para os candidatos pela ficha de cada um.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {resumo.map(a => (
                <button key={a.id} onClick={() => { setVerResultados(false); setSel({ id: a.id, nome: a.nome, categoria: a.categoria, num_questoes: a.num_questoes, duracao_min: a.duracao_min, ativo: a.ativo }); }}
                  className={`text-left bg-card border rounded-xl p-5 hover:border-brand-orange/50 hover:shadow-md transition-all ${a.ativo ? 'border-border' : 'border-border/50 opacity-60'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-brand-orange/10 rounded-lg"><GraduationCap size={18} className="text-brand-orange" /></div>
                    {!a.ativo && <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">Inativa</span>}
                  </div>
                  <p className="text-sm font-bold text-foreground">{a.nome}</p>
                  <p className="text-xs text-muted-foreground">{a.categoria}</p>
                  <p className="text-xs text-muted-foreground mt-3">{a.qtd_questoes} questões · {a.enviadas} enviada(s) · {a.concluidas} concluída(s)</p>
                  {a.media_nota != null && <p className="text-xs text-foreground mt-1 font-medium">Média: {Number(a.media_nota).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</p>}
                </button>
              ))}
            </div>
          )}
      </div>
      {modalAval && <AvaliacaoModal initial={modalAval.initial} onClose={() => setModalAval(null)} onSaved={() => { setModalAval(null); load(); }} showToast={showToast} />}
      {modalConfig && <ConfigModal onClose={() => setModalConfig(false)} showToast={showToast} />}
    </div>
  );
}
