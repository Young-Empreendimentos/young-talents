import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GraduationCap, Plus, ChevronLeft, Edit3, Trash2, Loader2, Settings, X, ShieldCheck } from 'lucide-react';
import { supabase } from '../../supabase';
import { GERADORES_INFO } from '../../avaliacoes/gerador';

const rh = (sb) => sb.schema('rh');
const CATEGORIAS = ['Raciocínio Lógico', 'Matemática Básica', 'Matemática Financeira Avançada', 'Outra'];
const fmtData = (d) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

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
      const q = initial?.id
        ? rh(supabase).from('talents_aval_avaliacoes').update(row).eq('id', initial.id)
        : rh(supabase).from('talents_aval_avaliacoes').insert(row);
      const { error } = await q;
      if (error) throw error;
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

// ---------------- Modal: criar/editar questão ----------------
function QuestaoModal({ avaliacaoId, categoria, initial, onClose, onSaved, showToast }) {
  const [tipo, setTipo] = useState(initial?.tipo || 'parametrizada');
  const [gerador, setGerador] = useState(initial?.spec?.gerador || '');
  const [dificuldade, setDificuldade] = useState(initial?.dificuldade || 1);
  const [enunciado, setEnunciado] = useState(initial?.enunciado || '');
  const [opcoes, setOpcoes] = useState(() => {
    const o = initial?.spec?.opcoes || ['', '', '', '', ''];
    return [...o, '', '', '', '', ''].slice(0, 5);
  });
  const [correta, setCorreta] = useState(initial?.spec?.correta ?? 0);
  const [saving, setSaving] = useState(false);

  const gerSugeridos = useMemo(() => GERADORES_INFO.filter(g => !categoria || g.categoria === categoria), [categoria]);
  const gerList = gerSugeridos.length ? gerSugeridos : GERADORES_INFO;

  const salvar = async () => {
    let row;
    if (tipo === 'parametrizada') {
      if (!gerador) { showToast?.('Escolha o tipo de questão (gerador).', 'error'); return; }
      const info = GERADORES_INFO.find(g => g.key === gerador);
      row = { avaliacao_id: avaliacaoId, tipo: 'parametrizada', assunto: info?.assunto || null, dificuldade: Number(dificuldade), enunciado: info?.label || 'Questão gerada', spec: { gerador }, ativo: true };
    } else {
      const ops = opcoes.map(o => o.trim()).filter(Boolean);
      if (!enunciado.trim()) { showToast?.('Escreva o enunciado.', 'error'); return; }
      if (ops.length < 2) { showToast?.('Precisa de ao menos 2 alternativas.', 'error'); return; }
      if (correta >= ops.length) { showToast?.('Marque qual alternativa é a correta.', 'error'); return; }
      row = { avaliacao_id: avaliacaoId, tipo: 'fixa', assunto: initial?.assunto || 'Geral', dificuldade: Number(dificuldade), enunciado: enunciado.trim(), spec: { opcoes: ops, correta: Number(correta) }, ativo: true };
    }
    setSaving(true);
    try {
      const q = initial?.id
        ? rh(supabase).from('talents_aval_questoes').update(row).eq('id', initial.id)
        : rh(supabase).from('talents_aval_questoes').insert(row);
      const { error } = await q;
      if (error) throw error;
      showToast?.('Questão salva.', 'success'); onSaved();
    } catch (e) { showToast?.(e?.message || 'Erro ao salvar questão.', 'error'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-foreground">{initial?.id ? 'Editar questão' : 'Nova questão'}</h3><button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button></div>
        <div className="flex gap-2 mb-4">
          {[['parametrizada', 'Gerada (números sorteados)'], ['fixa', 'Fixa (eu escrevo)']].map(([v, l]) => (
            <button key={v} onClick={() => setTipo(v)} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border ${tipo === v ? 'bg-brand-orange text-white border-brand-orange' : 'bg-card border-border text-muted-foreground'}`}>{l}</button>
          ))}
        </div>

        {tipo === 'parametrizada' ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">A questão é montada com números diferentes por candidato (não googlável). Escolha o tipo:</p>
            <select value={gerador} onChange={e => setGerador(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
              <option value="">Escolha o tipo de questão…</option>
              {gerList.map(g => <option key={g.key} value={g.key}>{g.label} · {g.assunto}</option>)}
            </select>
          </div>
        ) : (
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-muted-foreground">Enunciado</label><textarea value={enunciado} onChange={e => setEnunciado(e.target.value)} rows={2} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none" /></div>
            <p className="text-xs text-muted-foreground">Alternativas (marque a correta; deixe em branco as que não usar):</p>
            {opcoes.map((op, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="correta" checked={correta === i} onChange={() => setCorreta(i)} />
                <span className="text-xs font-bold text-muted-foreground w-4">{String.fromCharCode(65 + i)}</span>
                <input value={op} onChange={e => setOpcoes(o => o.map((x, j) => j === i ? e.target.value : x))} className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm" />
              </div>
            ))}
          </div>
        )}

        <div className="mt-3"><label className="text-xs font-medium text-muted-foreground">Dificuldade</label>
          <select value={dificuldade} onChange={e => setDificuldade(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
            <option value={1}>Fácil</option><option value={2}>Média</option><option value={3}>Difícil</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted text-sm">Cancelar</button><button onClick={salvar} disabled={saving} className="px-4 py-2 rounded-lg bg-brand-orange text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 inline-flex items-center gap-1.5">{saving && <Loader2 size={14} className="animate-spin" />} Salvar</button></div>
      </div>
    </div>
  );
}

// ---------------- Modal: configuração (remetente) ----------------
function ConfigModal({ onClose, showToast }) {
  const [remetente, setRemetente] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => { (async () => {
    try { const { data } = await rh(supabase).from('talents_aval_config').select('email_remetente').eq('id', 1).maybeSingle(); setRemetente(data?.email_remetente || ''); } catch { /* ok */ } finally { setLoading(false); }
  })(); }, []);
  const salvar = async () => {
    setSaving(true);
    try { const { error } = await rh(supabase).from('talents_aval_config').update({ email_remetente: remetente.trim(), updated_at: new Date().toISOString() }).eq('id', 1); if (error) throw error; showToast?.('Configuração salva.', 'success'); onClose(); }
    catch (e) { showToast?.(e?.message || 'Erro ao salvar.', 'error'); } finally { setSaving(false); }
  };
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
  const [sel, setSel] = useState(null); // avaliacao selecionada (id)
  const [questoes, setQuestoes] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [modalAval, setModalAval] = useState(null); // { initial } | null
  const [modalQuestao, setModalQuestao] = useState(null);
  const [modalConfig, setModalConfig] = useState(false);

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
        rh(supabase).from('talents_aval_convites').select('id, status, enviado_em, expira_em, candidate:talents_candidates(full_name), tentativa:talents_aval_tentativas(nota, acertos, total, indice_confianca, concluido_em, iniciado_em)').eq('avaliacao_id', id).order('enviado_em', { ascending: false }).limit(300),
      ]);
      setQuestoes(qs || []); setResultados(res || []);
    } catch { setQuestoes([]); setResultados([]); } finally { setLoadingDetalhe(false); }
  }, []);

  useEffect(() => { if (sel?.id) carregarDetalhe(sel.id); }, [sel?.id, carregarDetalhe]);

  const removerQuestao = async (id) => {
    if (!window.confirm('Remover esta questão do banco?')) return;
    try { const { error } = await rh(supabase).from('talents_aval_questoes').delete().eq('id', id); if (error) throw error; showToast?.('Questão removida.', 'success'); carregarDetalhe(sel.id); }
    catch (e) { showToast?.(e?.message || 'Erro ao remover.', 'error'); }
  };
  const removerAval = async (av) => {
    if (!window.confirm(`Excluir a avaliação "${av.nome}" e seu banco de questões? (convites já enviados são mantidos)`)) return;
    try { const { error } = await rh(supabase).from('talents_aval_avaliacoes').delete().eq('id', av.id); if (error) throw error; showToast?.('Avaliação excluída.', 'success'); setSel(null); load(); }
    catch (e) { showToast?.('Não deu pra excluir (há convites vinculados?). Desative-a em vez disso.', 'error'); }
  };

  // ----- Detalhe -----
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
            <button onClick={() => setModalAval({ initial: av })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground"><Edit3 size={14} /> Editar prova</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Banco de questões */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Banco de questões ({questoes.length})</h3>
              <button onClick={() => setModalQuestao({ initial: null })} className="text-xs text-brand-orange hover:underline flex items-center gap-1"><Plus size={12} /> Nova questão</button>
            </div>
            {loadingDetalhe ? <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 size={14} className="animate-spin" /> Carregando…</div>
              : questoes.length === 0 ? <p className="text-sm text-muted-foreground italic">Nenhuma questão. Adicione pelo botão acima.</p>
              : <div className="space-y-1.5">{questoes.map(q => (
                  <div key={q.id} className="px-3 py-2 rounded-lg border border-border bg-card group flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{q.enunciado}</p>
                      <p className="text-[11px] text-muted-foreground">{q.assunto} · {q.tipo === 'parametrizada' ? 'gerada' : 'fixa'} · {['', 'fácil', 'média', 'difícil'][q.dificuldade] || ''}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModalQuestao({ initial: q })} className="p-1 text-muted-foreground hover:text-brand-orange"><Edit3 size={12} /></button>
                      <button onClick={() => removerQuestao(q.id)} className="p-1 text-muted-foreground hover:text-red-500"><Trash2 size={12} /></button>
                    </div>
                  </div>))}</div>}
          </div>

          {/* Resultados */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Resultados ({resultados.length})</h3>
            {loadingDetalhe ? null : resultados.length === 0 ? <p className="text-sm text-muted-foreground italic">Ninguém recebeu esta avaliação ainda.</p>
              : <div className="space-y-1.5">{resultados.map(c => {
                  const t = Array.isArray(c.tentativa) ? c.tentativa[0] : c.tentativa;
                  const nome = (Array.isArray(c.candidate) ? c.candidate[0]?.full_name : c.candidate?.full_name) || 'Candidato';
                  const concluido = t?.concluido_em;
                  return (
                    <div key={c.id} className="px-3 py-2 rounded-lg border border-border bg-card flex items-center justify-between gap-2">
                      <div className="min-w-0"><p className="text-sm text-foreground truncate">{nome}</p><p className="text-[11px] text-muted-foreground">Enviada {fmtData(c.enviado_em)}</p></div>
                      <div className="text-right flex-shrink-0">
                        {concluido ? <>
                          <p className="text-sm font-bold text-foreground">Nota {t.nota != null ? Number(t.nota).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—'}</p>
                          <p className={`text-[10px] inline-flex items-center gap-0.5 ${t.indice_confianca >= 80 ? 'text-emerald-600' : t.indice_confianca >= 50 ? 'text-amber-600' : 'text-red-600'}`}><ShieldCheck size={10} /> {t.indice_confianca}%</p>
                        </> : <span className="text-[11px] text-muted-foreground">{t?.iniciado_em ? 'Em andamento' : 'Aguardando'}</span>}
                      </div>
                    </div>);
                })}</div>}
          </div>
        </div>
        {modalAval && <AvaliacaoModal initial={modalAval.initial} onClose={() => setModalAval(null)} onSaved={() => { setModalAval(null); load(); }} showToast={showToast} />}
        {modalQuestao && <QuestaoModal avaliacaoId={sel.id} categoria={av.categoria} initial={modalQuestao.initial} onClose={() => setModalQuestao(null)} onSaved={() => { setModalQuestao(null); carregarDetalhe(sel.id); }} showToast={showToast} />}
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
              <p className="text-sm text-center max-w-md">Crie uma avaliação (ex.: Raciocínio Lógico), monte o banco de questões e envie para os candidatos pela ficha de cada um.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {resumo.map(a => (
                <button key={a.id} onClick={() => setSel({ id: a.id, nome: a.nome, categoria: a.categoria, num_questoes: a.num_questoes, duracao_min: a.duracao_min, ativo: a.ativo })}
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
