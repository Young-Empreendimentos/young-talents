import React, { useEffect, useState } from 'react';
import { X, Loader2, Check, Clock, LogOut, ShieldCheck, UserCircle } from 'lucide-react';
import { supabase } from '../../supabase';

const rh = (sb) => sb.schema('rh');
const fmtDur = (s) => { s = Math.round(s || 0); return s >= 60 ? `${Math.floor(s / 60)}min${String(s % 60).padStart(2, '0')}s` : `${s}s`; };
const LIKERT = { 1: 'Discordo totalmente', 2: 'Discordo', 3: 'Neutro', 4: 'Concordo', 5: 'Concordo totalmente' };
// ordem de leitura amigável dos fatores do Big Five
const ORDEM_FATORES = ['Abertura', 'Conscienciosidade', 'Extroversão', 'Amabilidade', 'Estabilidade emocional'];

// Detalhe da tentativa de UM candidato. Objetiva: respostas, tempo e tempo fora por questão.
// Personalidade (Big Five): perfil por fator + o que o candidato marcou em cada afirmação.
export default function DetalheTentativa({ conviteId, nome, onClose }) {
  const [t, setT] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await rh(supabase).from('talents_aval_tentativas')
          .select('prova, respostas, eventos, nota, acertos, total, indice_confianca, tempo_segundos, perfil')
          .eq('convite_id', conviteId).maybeSingle();
        setT(data || null);
      } catch { setT(null); } finally { setLoading(false); }
    })();
  }, [conviteId]);

  const prova = Array.isArray(t?.prova) ? t.prova : [];
  const respostas = t?.respostas || {};
  const ev = t?.eventos || {};
  const tpq = ev.tempo_por_questao || {};
  const fpq = ev.fora_por_questao || {};
  const perfil = t?.perfil || null;
  const ehPersonalidade = !!perfil;

  const fatoresOrdenados = perfil
    ? [...ORDEM_FATORES.filter(f => perfil[f]), ...Object.keys(perfil).filter(f => !ORDEM_FATORES.includes(f))]
    : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[92vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">{ehPersonalidade && <UserCircle size={18} className="text-brand-orange" />}{ehPersonalidade ? 'Perfil' : 'Respostas'} · {nome}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        {loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center"><Loader2 size={16} className="animate-spin" /> Carregando…</div>
          : !t ? <p className="text-sm text-muted-foreground italic py-4">Sem dados desta tentativa.</p>
          : ehPersonalidade ? (
            <>
              <p className="text-xs text-muted-foreground mb-3">Perfil comportamental (Big Five). Quanto maior a barra, mais forte o traço. Não há certo ou errado.</p>
              <div className="space-y-2.5 mb-5">
                {fatoresOrdenados.map((f) => {
                  const pct = Math.max(0, Math.min(100, perfil[f]?.pct ?? 0));
                  return (
                    <div key={f}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-foreground">{f}</span>
                        <span className="text-muted-foreground">{pct}% <span className="text-[10px]">(média {perfil[f]?.media})</span></span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-brand-orange rounded-full" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-2 pt-2 border-t border-border">Respostas por afirmação</h4>
              <div className="space-y-2">
                {prova.map((q) => {
                  const r = respostas[q.slot] ?? respostas[String(q.slot)];
                  const rn = r == null ? null : Number(r);
                  return (
                    <div key={q.slot} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{q.fator || 'Geral'}{q.reverso ? ' · reversa' : ''}</span>
                        <span className="text-[11px] font-medium text-foreground">{rn ? `${rn}/5 — ${LIKERT[rn]}` : 'Em branco'}</span>
                      </div>
                      <p className="text-sm text-foreground">{q.enunciado}</p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4 flex-wrap text-sm mb-4 pb-3 border-b border-border">
                <span className="font-bold text-foreground">Nota {t.nota != null ? Number(t.nota).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—'} ({t.acertos}/{t.total})</span>
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${t.indice_confianca >= 80 ? 'text-emerald-600' : t.indice_confianca >= 50 ? 'text-amber-600' : 'text-red-600'}`}><ShieldCheck size={13} /> Confiança {t.indice_confianca}%</span>
                {t.tempo_segundos != null && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock size={13} /> Total {fmtDur(t.tempo_segundos)}</span>}
              </div>

              <div className="space-y-3">
                {prova.map((q) => {
                  const resp = respostas[q.slot];
                  const respNum = resp == null ? null : Number(resp);
                  const acertou = respNum === q.correta;
                  const emBranco = respNum == null;
                  const tempo = tpq[q.slot] ?? tpq[String(q.slot)];
                  const fora = fpq[q.slot] ?? fpq[String(q.slot)];
                  return (
                    <div key={q.slot} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${emBranco ? 'bg-gray-100 text-gray-500 dark:bg-gray-800' : acertou ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                          Q{q.slot + 1} · {emBranco ? 'Em branco' : acertou ? 'Acertou' : 'Errou'}
                        </span>
                        <span className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                          {tempo != null && <span className="inline-flex items-center gap-0.5"><Clock size={11} /> {fmtDur(tempo)}</span>}
                          {fora > 0 && <span className="inline-flex items-center gap-0.5 text-amber-600"><LogOut size={11} /> fora {fmtDur(fora)}</span>}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-2">{q.enunciado}</p>
                      <div className="space-y-1">
                        {(q.opcoes || []).map((op, i) => {
                          const isCorreta = i === q.correta;
                          const isResp = i === respNum;
                          return (
                            <div key={i} className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded ${isCorreta ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : isResp ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'text-muted-foreground'}`}>
                              <span className="font-bold w-4">{String.fromCharCode(65 + i)}</span>
                              <span className="flex-1">{op}</span>
                              {isCorreta && <span className="inline-flex items-center gap-0.5 font-medium"><Check size={12} /> correta</span>}
                              {isResp && !isCorreta && <span className="font-medium">resposta do candidato</span>}
                              {isResp && isCorreta && <span className="font-medium">(marcou esta)</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
      </div>
    </div>
  );
}
