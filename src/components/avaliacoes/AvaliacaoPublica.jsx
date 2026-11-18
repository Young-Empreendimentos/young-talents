import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Clock, ShieldAlert, CheckCircle, AlertCircle, Maximize2, ChevronLeft, ChevronRight, Send } from 'lucide-react';

// Página PÚBLICA da prova (candidato, sem login). Fala só com a edge function
// `talents-avaliacao` pelo token — nunca toca o banco direto. Tela cheia + cronômetro +
// sensores de vigilância (saída de aba, paste, cópia, saída de tela cheia).

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/talents-avaliacao`;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function chamar(payload) {
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(ANON ? { apikey: ANON, Authorization: `Bearer ${ANON}` } : {}) },
    body: JSON.stringify(payload),
  });
  return res.json();
}

const Casca = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 flex items-center justify-center p-4" style={{ fontFamily: 'system-ui, sans-serif' }}>
    <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-8">{children}</div>
  </div>
);

export default function AvaliacaoPublica() {
  const { token } = useParams();
  const [fase, setFase] = useState('carregando'); // carregando|intro|prova|enviando|fim|erro|concluido|indisponivel
  const [erro, setErro] = useState('');
  const [prova, setProva] = useState(null);
  const [questoes, setQuestoes] = useState([]);
  const [respostas, setRespostas] = useState({});
  const [slot, setSlot] = useState(0);
  const [restante, setRestante] = useState(null); // segundos restantes (ou null = sem limite)

  const inicioRef = useRef(0);
  const slotStartRef = useRef(0);
  const slotRef = useRef(0);
  const eventosRef = useRef({ saiu_aba_qtd: 0, saiu_aba_seg: 0, colou_qtd: 0, copiou_qtd: 0, saiu_tela_cheia_qtd: 0, tempo_por_questao: {}, fora_por_questao: {} });
  const hiddenAtRef = useRef(0);
  const finalizadoRef = useRef(false);

  useEffect(() => { slotRef.current = slot; }, [slot]);

  // ---- carregar ----
  useEffect(() => {
    (async () => {
      try {
        const d = await chamar({ action: 'carregar', token });
        if (d.status === 'concluido') { setFase('concluido'); return; }
        if (d.status === 'expirado' || d.status === 'cancelado') { setErro(d.error || 'Convite indisponível.'); setFase('indisponivel'); return; }
        if (d.error || !d.questoes) { setErro(d.error || 'Não foi possível carregar a prova.'); setFase('erro'); return; }
        setProva(d.prova); setQuestoes(d.questoes);
        setRestante(d.prova?.duracao_min ? d.prova.duracao_min * 60 : null);
        setFase('intro');
      } catch {
        setErro('Falha de conexão. Verifique sua internet e recarregue.'); setFase('erro');
      }
    })();
  }, [token]);

  const registrarTempoSlot = useCallback(() => {
    const ev = eventosRef.current;
    const dt = Math.round((Date.now() - slotStartRef.current) / 1000);
    ev.tempo_por_questao[slot] = (ev.tempo_por_questao[slot] || 0) + Math.max(0, dt);
    slotStartRef.current = Date.now();
  }, [slot]);

  const finalizar = useCallback(async () => {
    if (finalizadoRef.current) return;
    finalizadoRef.current = true;
    registrarTempoSlot();
    setFase('enviando');
    const tempo_segundos = Math.round((Date.now() - inicioRef.current) / 1000);
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* ok */ }
    try {
      const d = await chamar({ action: 'salvar', token, respostas, eventos: eventosRef.current, tempo_segundos });
      if (d && (d.status === 'ok' || d.status === 'concluido')) setFase('fim');
      else { setErro(d?.error || 'Não conseguimos registrar o envio. Tente novamente.'); setFase('erro'); finalizadoRef.current = false; }
    } catch {
      setErro('Não conseguimos registrar o envio. Tente novamente.'); setFase('erro'); finalizadoRef.current = false;
    }
  }, [token, respostas, registrarTempoSlot]);

  // ---- vigilância + cronômetro (ativos só durante a prova) ----
  useEffect(() => {
    if (fase !== 'prova') return;
    const ev = eventosRef.current;
    // "Saiu" unifica trocar de aba/minimizar (visibilitychange) E trocar de janela/app (blur).
    // Dedupe: só conta um episódio por vez (o 2º 'sair' é no-op até 'voltar').
    const sair = () => { if (!hiddenAtRef.current) hiddenAtRef.current = Date.now(); };
    const voltar = () => { if (hiddenAtRef.current) { const dur = Math.round((Date.now() - hiddenAtRef.current) / 1000); ev.saiu_aba_qtd++; ev.saiu_aba_seg += dur; ev.fora_por_questao[slotRef.current] = (ev.fora_por_questao[slotRef.current] || 0) + dur; hiddenAtRef.current = 0; } };
    const onVis = () => { if (document.hidden) sair(); else voltar(); };
    const onPaste = () => { ev.colou_qtd++; };
    const onCopy = (e) => { ev.copiou_qtd++; e.preventDefault(); };
    const onCtx = (e) => e.preventDefault();
    const onFs = () => { if (!document.fullscreenElement) ev.saiu_tela_cheia_qtd++; };
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', sair);
    window.addEventListener('focus', voltar);
    document.addEventListener('paste', onPaste);
    document.addEventListener('copy', onCopy);
    document.addEventListener('contextmenu', onCtx);
    document.addEventListener('fullscreenchange', onFs);
    window.addEventListener('beforeunload', onBeforeUnload);
    const tick = setInterval(() => {
      setRestante((r) => {
        if (r == null) return r;
        if (r <= 1) { clearInterval(tick); finalizar(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', sair);
      window.removeEventListener('focus', voltar);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('contextmenu', onCtx);
      document.removeEventListener('fullscreenchange', onFs);
      window.removeEventListener('beforeunload', onBeforeUnload);
      clearInterval(tick);
    };
  }, [fase, finalizar]);

  const comecar = () => {
    // Tela cheia é best-effort: não bloqueia o início se o navegador recusar/travar.
    try { const p = document.documentElement.requestFullscreen?.(); if (p && typeof p.catch === 'function') p.catch(() => {}); } catch { /* ok */ }
    inicioRef.current = Date.now();
    slotStartRef.current = Date.now();
    setFase('prova');
  };

  const irPara = (novo) => { registrarTempoSlot(); setSlot(novo); };
  const escolher = (opIdx) => setRespostas((r) => ({ ...r, [slot]: opIdx }));

  const fmtTempo = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const respondidas = Object.keys(respostas).length;

  // ====== TELAS ======
  if (fase === 'carregando') return <Casca><div className="flex items-center justify-center gap-2 text-gray-500 py-8"><Loader2 className="animate-spin" /> Carregando sua prova…</div></Casca>;

  if (fase === 'concluido') return <Casca><div className="text-center py-6"><CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" /><h1 className="text-xl font-bold text-gray-800">Prova já respondida</h1><p className="text-gray-500 mt-2">Esta avaliação já foi concluída. Obrigado!</p></div></Casca>;

  if (fase === 'indisponivel') return <Casca><div className="text-center py-6"><AlertCircle className="w-14 h-14 text-amber-500 mx-auto mb-3" /><h1 className="text-xl font-bold text-gray-800">Convite indisponível</h1><p className="text-gray-500 mt-2">{erro}</p></div></Casca>;

  if (fase === 'erro') return <Casca><div className="text-center py-6"><AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-3" /><h1 className="text-xl font-bold text-gray-800">Ops…</h1><p className="text-gray-500 mt-2">{erro}</p></div></Casca>;

  if (fase === 'fim') return <Casca><div className="text-center py-6"><CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" /><h1 className="text-2xl font-bold text-gray-800">Prova enviada! 🎉</h1><p className="text-gray-600 mt-2">Suas respostas foram registradas com sucesso. A equipe de seleção vai analisar. Obrigado por participar!</p></div></Casca>;

  if (fase === 'enviando') return <Casca><div className="flex items-center justify-center gap-2 text-gray-500 py-8"><Loader2 className="animate-spin" /> Enviando suas respostas…</div></Casca>;

  if (fase === 'intro') return (
    <Casca>
      <div className="text-center mb-5">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-orange-600 mb-3"><Maximize2 /></div>
        <h1 className="text-2xl font-bold text-gray-800">{prova?.nome}</h1>
        {prova?.descricao && <p className="text-gray-500 mt-1 text-sm">{prova.descricao}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-gray-800">{questoes.length}</p><p className="text-xs text-gray-500">questões</p></div>
        <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-gray-800">{prova?.duracao_min ? `${prova.duracao_min} min` : '—'}</p><p className="text-xs text-gray-500">tempo</p></div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5 text-sm text-amber-800 flex gap-2">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">Antes de começar, importante:</p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-700">
            <li>A prova abre em <b>tela cheia</b> e tem tempo cronometrado.</li>
            <li>Saídas da aba/janela, cópia e colagem são <b>registradas</b>.</li>
            <li>Pode usar calculadora. Resolva por conta própria.</li>
            <li>Só é possível enviar <b>uma vez</b>.</li>
          </ul>
        </div>
      </div>
      <button onClick={comecar} className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors">Começar a prova</button>
    </Casca>
  );

  // ---- prova ----
  const q = questoes[slot];
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="text-sm font-medium text-gray-700 truncate">{prova?.nome}</div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">{respondidas}/{questoes.length} respondidas</span>
          {restante != null && (
            <span className={`inline-flex items-center gap-1 text-sm font-bold tabular-nums ${restante < 60 ? 'text-red-600' : 'text-gray-700'}`}><Clock size={15} /> {fmtTempo(restante)}</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 w-full select-none">
          <div className="h-1.5 bg-gray-200 rounded-full mb-6 overflow-hidden"><div className="h-full bg-orange-500 transition-all" style={{ width: `${((slot + 1) / questoes.length) * 100}%` }} /></div>
          <p className="text-xs font-semibold text-orange-600 mb-2">Questão {slot + 1} de {questoes.length}</p>
          <p className="text-lg text-gray-800 mb-5 leading-relaxed">{q?.enunciado}</p>
          <div className="space-y-2">
            {q?.opcoes.map((op, i) => {
              const sel = respostas[slot] === i;
              return (
                <button key={i} onClick={() => escolher(i)} className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${sel ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold ${sel ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-300 text-gray-500'}`}>{String.fromCharCode(65 + i)}</span>
                  <span className="text-gray-800">{op}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button disabled={slot === 0} onClick={() => irPara(slot - 1)} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 flex items-center gap-1"><ChevronLeft size={18} /> Anterior</button>
          {slot < questoes.length - 1 ? (
            <button onClick={() => irPara(slot + 1)} className="px-5 py-2 rounded-lg bg-gray-800 hover:bg-gray-900 text-white font-medium flex items-center gap-1">Próxima <ChevronRight size={18} /></button>
          ) : (
            <button onClick={finalizar} className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center gap-2"><Send size={16} /> Finalizar e enviar</button>
          )}
        </div>
      </div>
    </div>
  );
}
