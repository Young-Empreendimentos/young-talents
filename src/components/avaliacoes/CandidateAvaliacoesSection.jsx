import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GraduationCap, Send, Loader2, Copy, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../../supabase';

const rh = (sb) => sb.schema('rh');
const fmtData = (d) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtNota = (n) => n == null ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

// Deriva o estado de exibição de um convite (inclui expiração 24h: não realizou x não finalizou).
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

export default function CandidateAvaliacoesSection({ candidate, showToast, className = 'bg-card border border-border rounded-xl p-5' }) {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [convites, setConvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [escolhida, setEscolhida] = useState('');
  const [enviando, setEnviando] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !candidate?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const [{ data: avs }, { data: cvs }] = await Promise.all([
        rh(supabase).from('talents_aval_avaliacoes').select('id, nome, categoria, duracao_min').eq('ativo', true).order('nome'),
        rh(supabase).from('talents_aval_convites')
          .select('id, token, status, enviado_em, expira_em, canal_email, canal_whatsapp, avaliacao:talents_aval_avaliacoes(nome), tentativa:talents_aval_tentativas(nota, acertos, total, indice_confianca, tempo_segundos, iniciado_em, concluido_em, assuntos_errados)')
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
    if (!window.confirm(`Enviar a avaliação "${provaNome(escolhida)}" para ${candidate.fullName || 'o candidato'} por e-mail?`)) return;
    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke('talents-avaliacao-enviar', {
        body: { candidate_id: candidate.id, avaliacao_id: escolhida },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const ch = data?.canais || {};
      const algumOk = ch.email === 'enviado' || ch.whatsapp === 'enviado';
      try { await navigator.clipboard.writeText(data.link); } catch { /* ok */ }
      showToast?.(`Convite criado. E-mail: ${ch.email || '—'} · WhatsApp: ${ch.whatsapp || '—'}. Link copiado.`, algumOk ? 'success' : 'info');
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

  const concluidas = useMemo(() => convites.filter(c => situacao(c).key === 'concluido').length, [convites]);

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
          {avaliacoes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        <button onClick={enviar} disabled={enviando || !escolhida}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-orange text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
          {enviando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Enviar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 size={14} className="animate-spin" /> Carregando…</div>
      ) : convites.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nenhuma avaliação enviada ainda.</p>
      ) : (
        <div className="space-y-2">
          {convites.map(conv => {
            const s = situacao(conv);
            const t = s.t;
            const nome = (Array.isArray(conv.avaliacao) ? conv.avaliacao[0]?.nome : conv.avaliacao?.nome) || 'Avaliação';
            const erradosArr = t?.assuntos_errados ? Object.entries(t.assuntos_errados) : [];
            return (
              <div key={conv.id} className="px-3 py-2.5 rounded-lg border border-border bg-background">
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
    </div>
  );
}
