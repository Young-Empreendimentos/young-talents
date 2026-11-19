import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GraduationCap, Send, Loader2, Copy, ShieldCheck, Clock, AlertTriangle, LogOut, Download, Upload, FileText, Paperclip } from 'lucide-react';
import { supabase } from '../../supabase';
import { currentUserInfo } from '../../utils/tests';
import DetalheTentativa from './DetalheTentativa';

const rh = (sb) => sb.schema('rh');
const BUCKET = 'candidate-documents';
const fmtData = (d) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtNota = (n) => n == null ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const fmtDur = (s) => { s = Math.round(s || 0); return s >= 60 ? `${Math.floor(s / 60)}min${String(s % 60).padStart(2, '0')}s` : `${s}s`; };
// "Saiu da aba 2× · 1min10s (Q6: 1min05s, Q3: 5s)"
const foraPorQuestao = (ev) => Object.entries(ev?.fora_por_questao || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([q, v]) => `Q${Number(q) + 1}: ${fmtDur(v)}`).join(', ');
const avalDe = (conv) => (Array.isArray(conv.avaliacao) ? conv.avaliacao[0] : conv.avaliacao) || {};

async function baixarArquivo(path, showToast) {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 120);
    if (error) throw error;
    window.open(data.signedUrl, '_blank', 'noopener');
  } catch (e) { showToast?.(e?.message || 'Erro ao abrir o arquivo.', 'error'); }
}

// Estado de um convite OBJETIVO (inclui expiração 24h: não realizou x não finalizou).
function situacao(conv) {
  const t = Array.isArray(conv.tentativa) ? conv.tentativa[0] : conv.tentativa;
  const expirou = conv.expira_em && new Date(conv.expira_em).getTime() < Date.now();
  if (t?.concluido_em || conv.status === 'concluido') return { key: 'concluido', label: 'Concluída', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', t };
  if (conv.status === 'cancelado') return { key: 'cancelado', label: 'Cancelada', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800', t };
  if (conv.status === 'expirado' || expirou) {
    return t?.iniciado_em
      ? { key: 'nao_finalizou', label: 'Não finalizou (expirou)', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', t }
      : { key: 'nao_realizou', label: 'Não realizou (expirou)', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', t };
  }
  if (t?.iniciado_em || conv.status === 'iniciado') return { key: 'andamento', label: 'Em andamento', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', t };
  return { key: 'enviado', label: 'Enviada — aguardando', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', t };
}

// Estado de um convite de PROVA PRÁTICA (devolução manual).
function situacaoPratica(conv) {
  if (conv.retorno_path) return { key: 'devolvido', label: 'Devolvida', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' };
  const expirou = conv.expira_em && new Date(conv.expira_em).getTime() < Date.now();
  if (conv.status === 'cancelado') return { key: 'cancelado', label: 'Cancelada', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800' };
  if (expirou) return { key: 'nao_devolveu', label: 'Não devolveu (prazo)', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };
  return { key: 'enviado', label: 'Enviada — aguardando', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' };
}

export default function CandidateAvaliacoesSection({ candidate, showToast, className = 'bg-card border border-border rounded-xl p-5' }) {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [convites, setConvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [escolhida, setEscolhida] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [uploadConv, setUploadConv] = useState(null); // convite_id em upload de devolução
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    if (!supabase || !candidate?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const [{ data: avs }, { data: cvs }] = await Promise.all([
        rh(supabase).from('talents_aval_avaliacoes').select('id, nome, categoria, duracao_min, tipo').eq('ativo', true).order('nome'),
        rh(supabase).from('talents_aval_convites')
          .select('id, token, status, enviado_em, expira_em, canal_email, canal_whatsapp, retorno_path, retorno_nome, retorno_em, avaliacao:talents_aval_avaliacoes(nome, tipo, arquivo_teste_path, arquivo_teste_nome), tentativa:talents_aval_tentativas(nota, acertos, total, indice_confianca, tempo_segundos, iniciado_em, concluido_em, assuntos_errados, eventos, perfil)')
          .eq('candidate_id', candidate.id).order('enviado_em', { ascending: false }),
      ]);
      setAvaliacoes(avs || []);
      setConvites(cvs || []);
    } catch { setAvaliacoes([]); setConvites([]); }
    finally { setLoading(false); }
  }, [candidate?.id]);

  useEffect(() => { load(); }, [load]);

  const provaNome = (id) => avaliacoes.find(a => a.id === id)?.nome || '';

  const enviar = async () => {
    if (!escolhida) { showToast?.('Escolha uma avaliação.', 'error'); return; }
    if (!window.confirm(`Enviar a avaliação "${provaNome(escolhida)}" para ${candidate.fullName || 'o candidato'} por e-mail e WhatsApp?`)) return;
    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke('talents-avaliacao-enviar', {
        body: { candidate_id: candidate.id, avaliacao_id: escolhida },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const ch = data?.canais || {};
      const algumOk = ch.email === 'enviado' || ch.whatsapp === 'enviado';
      if (data?.link) { try { await navigator.clipboard.writeText(data.link); } catch { /* ok */ } }
      showToast?.(`Enviado. E-mail: ${ch.email || '—'} · WhatsApp: ${ch.whatsapp || '—'}.${data?.link ? ' Link copiado.' : ''}`, algumOk ? 'success' : 'info');
      setEscolhida('');
      load();
    } catch (e) {
      showToast?.(e?.message || 'Erro ao enviar avaliação.', 'error');
    } finally { setEnviando(false); }
  };

  const copiarLink = async (token) => {
    const link = `${window.location.origin}/avaliacao/${token}`;
    try { await navigator.clipboard.writeText(link); showToast?.('Link copiado.', 'success'); } catch { showToast?.(link, 'info'); }
  };

  // Devolução manual: RH anexa o arquivo que o candidato devolveu.
  const pedirUpload = (convId) => { setUploadConv(convId); setTimeout(() => fileRef.current?.click(), 0); };
  const handleUpload = async (file) => {
    const convId = uploadConv;
    if (!file || !convId) { setUploadConv(null); return; }
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `praticas-retorno/${candidate.id}/${convId}/${Date.now()}_${safe}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const me = await currentUserInfo(supabase);
      const { error: updErr } = await rh(supabase).from('talents_aval_convites')
        .update({ retorno_path: path, retorno_nome: file.name, retorno_em: new Date().toISOString(), retorno_por: me?.email || null, status: 'devolvido' })
        .eq('id', convId);
      if (updErr) throw updErr;
      showToast?.('Devolução anexada.', 'success');
      load();
    } catch (e) {
      showToast?.(e?.message || 'Erro ao anexar a devolução.', 'error');
    } finally {
      setUploadConv(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const concluidas = useMemo(() => convites.filter(c => {
    const av = avalDe(c);
    return av.tipo === 'pratica' ? !!c.retorno_path : situacao(c).key === 'concluido';
  }).length, [convites]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <GraduationCap size={13} /> Avaliações ({convites.length}{concluidas ? ` · ${concluidas} concluída(s)` : ''})
        </p>
      </div>

      {/* Enviar nova */}
      <div className="flex items-center gap-2 mb-3">
        <select value={escolhida} onChange={(e) => setEscolhida(e.target.value)} disabled={enviando}
          className="flex-1 text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground">
          <option value="">Escolha uma avaliação…</option>
          {avaliacoes.map(a => <option key={a.id} value={a.id}>{a.nome}{a.tipo === 'pratica' ? ' (prática)' : ''}</option>)}
        </select>
        <button onClick={enviar} disabled={enviando || !escolhida}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-orange text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
          {enviando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Enviar
        </button>
      </div>

      <input ref={fileRef} type="file" className="hidden" onChange={e => handleUpload(e.target.files?.[0])} />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 size={14} className="animate-spin" /> Carregando…</div>
      ) : convites.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nenhuma avaliação enviada ainda.</p>
      ) : (
        <div className="space-y-2">
          {convites.map(conv => {
            const av = avalDe(conv);
            const nome = av.nome || 'Avaliação';
            const ehPratica = av.tipo === 'pratica';
            const ehPers = av.tipo === 'personalidade';

            // ---------- QUESTIONÁRIO DE PERFIL (Big Five) ----------
            if (ehPers) {
              const s = situacao(conv);
              const t = s.t;
              const perfil = t?.perfil || null;
              const concluido = s.key === 'concluido';
              const topo = perfil ? Object.entries(perfil).map(([f, v]) => ({ f, pct: v?.pct ?? 0 })).sort((a, b) => b.pct - a.pct).slice(0, 2) : [];
              return (
                <div key={conv.id} onClick={concluido ? () => setDetalhe({ conviteId: conv.id, nome: candidate.fullName || 'Candidato' }) : undefined} className={`px-3 py-2.5 rounded-lg border border-border bg-background ${concluido ? 'cursor-pointer hover:border-brand-orange/50' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{nome}</span>
                        <span className="text-[10px] uppercase font-bold text-brand-orange bg-brand-orange/10 px-1.5 py-0.5 rounded">Perfil</span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${s.cls}`}>{s.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Enviada {fmtData(conv.enviado_em)}{conv.expira_em ? ` · expira ${fmtData(conv.expira_em)}` : ''}</p>
                      {concluido && (perfil
                        ? <p className="text-[11px] text-muted-foreground mt-1">{topo.length ? `Mais forte: ${topo.map(x => `${x.f} ${x.pct}%`).join(' · ')} — ` : ''}clique para ver o perfil</p>
                        : <p className="text-[11px] text-muted-foreground mt-1">Respondido — clique para ver</p>)}
                    </div>
                    {(s.key === 'enviado' || s.key === 'andamento') && (
                      <button onClick={(e) => { e.stopPropagation(); copiarLink(conv.token); }} className="p-1 text-muted-foreground hover:text-brand-orange flex-shrink-0" title="Copiar link"><Copy size={14} /></button>
                    )}
                  </div>
                </div>
              );
            }

            // ---------- PROVA PRÁTICA ----------
            if (ehPratica) {
              const s = situacaoPratica(conv);
              const subindo = uploadConv === conv.id;
              return (
                <div key={conv.id} className="px-3 py-2.5 rounded-lg border border-border bg-background">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{nome}</span>
                        <span className="text-[10px] uppercase font-bold text-brand-orange bg-brand-orange/10 px-1.5 py-0.5 rounded">Prática</span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${s.cls}`}>{s.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Enviada {fmtData(conv.enviado_em)}{conv.retorno_em ? ` · devolveu ${fmtData(conv.retorno_em)}` : ''}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {av.arquivo_teste_path && <button onClick={() => baixarArquivo(av.arquivo_teste_path, showToast)} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-brand-orange"><FileText size={12} /> Teste enviado</button>}
                        {conv.retorno_path && <button onClick={() => baixarArquivo(conv.retorno_path, showToast)} className="inline-flex items-center gap-1 text-[11px] text-brand-orange hover:underline"><Download size={12} /> {conv.retorno_nome || 'devolução'}</button>}
                      </div>
                    </div>
                    <button onClick={() => pedirUpload(conv.id)} disabled={subindo} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-[11px] text-muted-foreground hover:text-brand-orange flex-shrink-0 disabled:opacity-50" title={conv.retorno_path ? 'Trocar devolução' : 'Anexar devolução'}>
                      {subindo ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} {conv.retorno_path ? 'Trocar' : 'Anexar devolução'}
                    </button>
                  </div>
                </div>
              );
            }

            // ---------- OBJETIVA ----------
            const s = situacao(conv);
            const t = s.t;
            const erradosArr = t?.assuntos_errados ? Object.entries(t.assuntos_errados) : [];
            const ev = t?.eventos || {};
            const foraDet = foraPorQuestao(ev);
            return (
              <div key={conv.id} onClick={s.key === 'concluido' ? () => setDetalhe({ conviteId: conv.id, nome: candidate.fullName || 'Candidato' }) : undefined} className={`px-3 py-2.5 rounded-lg border border-border bg-background ${s.key === 'concluido' ? 'cursor-pointer hover:border-brand-orange/50' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{nome}</span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${s.cls}`}>{s.label}</span>
                      {s.key === 'concluido' && t && <span className="text-[11px] font-bold text-foreground">Nota {fmtNota(t.nota)} ({t.acertos}/{t.total})</span>}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Enviada {fmtData(conv.enviado_em)}{conv.expira_em ? ` · expira ${fmtData(conv.expira_em)}` : ''}</p>
                    {s.key === 'concluido' && t && (
                      <div className="flex items-center gap-3 mt-1 flex-wrap text-[11px]">
                        <span className={`inline-flex items-center gap-1 font-medium ${t.indice_confianca >= 80 ? 'text-emerald-600' : t.indice_confianca >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          <ShieldCheck size={12} /> Confiança {t.indice_confianca}%
                        </span>
                        {t.tempo_segundos != null && <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock size={12} /> {Math.floor(t.tempo_segundos / 60)}min {t.tempo_segundos % 60}s</span>}
                        {ev.saiu_aba_qtd > 0 && <span className="inline-flex items-center gap-1 text-amber-600" title={foraDet ? `Tempo fora por questão: ${foraDet}` : ''}><LogOut size={12} /> Saiu da aba {ev.saiu_aba_qtd}× · {fmtDur(ev.saiu_aba_seg)}{foraDet ? ` (${foraDet})` : ''}</span>}
                        {erradosArr.length > 0 && <span className="inline-flex items-center gap-1 text-muted-foreground"><AlertTriangle size={12} /> Errou: {erradosArr.map(([a, n]) => `${a} (${n})`).join(', ')}</span>}
                      </div>
                    )}
                  </div>
                  {(s.key === 'enviado' || s.key === 'andamento') && (
                    <button onClick={() => copiarLink(conv.token)} className="p-1 text-muted-foreground hover:text-brand-orange flex-shrink-0" title="Copiar link"><Copy size={14} /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {detalhe && <DetalheTentativa conviteId={detalhe.conviteId} nome={detalhe.nome} onClose={() => setDetalhe(null)} />}
    </div>
  );
}
