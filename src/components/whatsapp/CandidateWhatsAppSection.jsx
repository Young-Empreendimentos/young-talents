import React, { useState, useCallback } from 'react';
import { MessageCircle, Loader2, RefreshCw, ChevronDown, Image as ImageIcon, FileText, Mic, Video, Paperclip } from 'lucide-react';
import { supabase } from '../../supabase';

// Histórico de WhatsApp do candidato (caixa "Administrativo" do Chatwoot).
// Lê via RPC SECURITY DEFINER talents_whatsapp_candidato(p_candidate_id) — casa
// pelo telefone do candidato. Carrega SÓ ao expandir (não pesa a abertura da
// ficha nem a tabela compartilhada do Chatwoot). Anexos ficam no Chatwoot: aqui
// só aparece o selo do tipo de mídia. Cobertura: 21/09/2026 em diante.
export default function CandidateWhatsAppSection({ candidate, className = 'bg-card border border-border rounded-xl p-5' }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!supabase || !candidate?.id) return;
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.rpc('talents_whatsapp_candidato', { p_candidate_id: candidate.id });
      if (error) throw error;
      setMsgs(Array.isArray(data) ? data : []);
      setLoaded(true);
    } catch (e) {
      setError(e?.message || 'Não foi possível carregar as conversas.');
    } finally {
      setLoading(false);
    }
  }, [candidate?.id]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !loaded && !loading) load();
  };

  const fmtTime = (iso) => {
    try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };
  const fmtDay = (iso) => {
    try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return ''; }
  };

  const mediaBadge = (m) => {
    if (!m.tipo || m.tipo === 'text') return null;
    const ext = Array.isArray(m.anexos) && m.anexos[0]?.extensao ? ` (${m.anexos[0].extensao})` : '';
    const map = {
      image: [ImageIcon, 'Imagem'],
      file: [FileText, 'Arquivo'],
      audio: [Mic, 'Áudio'],
      video: [Video, 'Vídeo'],
    };
    const [Icon, label] = map[m.tipo] || [Paperclip, m.tipo];
    return (
      <span className="inline-flex items-center gap-1 text-[11px] opacity-80 mt-0.5">
        <Icon size={12} /> {label}{ext} <span className="italic opacity-70">· no WhatsApp</span>
      </span>
    );
  };

  const count = msgs.length;
  let lastDay = null;

  return (
    <div className={className}>
      <button type="button" onClick={handleToggle} className="w-full flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <MessageCircle size={13} className="text-emerald-600" /> Conversa de WhatsApp
          {loaded && <span className="ml-1 normal-case tracking-normal text-muted-foreground">({count})</span>}
        </p>
        <ChevronDown size={16} className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 size={14} className="animate-spin" /> Carregando conversa…
            </div>
          ) : error ? (
            <div className="text-sm text-red-500 py-1">
              {error}
              <button onClick={load} className="ml-2 text-young-orange hover:underline">tentar de novo</button>
            </div>
          ) : count === 0 ? (
            <p className="text-sm text-muted-foreground italic py-1">
              Nenhuma conversa de WhatsApp encontrada para o telefone deste candidato.
              <span className="block text-xs mt-1 not-italic">O histórico disponível começa em 21/09/2026 (caixa Administrativo).</span>
            </p>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1 rounded-lg bg-background/40 p-3 border border-border">
                {msgs.map((m) => {
                  const day = fmtDay(m.msg_em);
                  const showDay = day !== lastDay;
                  lastDay = day;
                  const out = m.direcao === 'out';
                  return (
                    <React.Fragment key={m.id}>
                      {showDay && (
                        <div className="flex justify-center my-2">
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{day}</span>
                        </div>
                      )}
                      <div className={`flex ${out ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[78%] rounded-2xl px-3 py-1.5 text-sm shadow-sm ${
                          out
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-foreground rounded-br-sm'
                            : 'bg-card border border-border text-foreground rounded-bl-sm'
                        }`}>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-[10px] font-semibold ${out ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}>
                              {out ? (m.autor || 'Young') : (m.contato_nome || 'Candidato')}
                            </span>
                          </div>
                          {m.conteudo && <p className="whitespace-pre-wrap break-words leading-snug">{m.conteudo}</p>}
                          <div className="flex items-center justify-between gap-3">
                            {mediaBadge(m)}
                            <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0 mt-0.5">{fmtTime(m.msg_em)}</span>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-muted-foreground">Origem: WhatsApp Administrativo · espelho do Chatwoot</span>
                <button onClick={load} disabled={loading} className="text-xs text-muted-foreground hover:text-young-orange flex items-center gap-1 disabled:opacity-50">
                  <RefreshCw size={12} /> Atualizar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
