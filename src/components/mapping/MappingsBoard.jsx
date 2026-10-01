import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, HelpCircle } from 'lucide-react';
import { supabase } from '../../supabase';
import { NIVEIS, ORDEM_NIVEL, nivelEfetivo, mappingLabel } from '../../utils/mappings';

/**
 * Quadro por posição (função + equipe + cidade), como no mapa de sucessão do
 * Pilares — mas só o funil EXTERNO: quem está mapeado no Talents para cada
 * posição que existe hoje. Nada da sucessão interna aparece aqui (sucessores,
 * aprovações, cobertura): isso é restrito a admin/coordenador do Pilares.
 *
 * Um mapeamento cai numa posição se a função bate e a equipe/cidade batem ou
 * estão vazias ("qualquer"). Os que não caem em nenhuma posição atual ficam em
 * "Fora do quadro atual".
 */

const FUNIL = {
  forte: { label: 'Tem candidato forte', card: 'border-l-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/25', dot: 'bg-emerald-500' },
  interessante: { label: 'Só interessantes', card: 'border-l-amber-500 bg-amber-50/70 dark:bg-amber-950/25', dot: 'bg-amber-500' },
  vazio: { label: 'Ninguém mapeado', card: 'border-l-red-400 bg-red-50/50 dark:bg-red-950/20', dot: 'bg-red-400' },
};

const cidadeCurta = (c) => (c ? c.replace(/\/RS$/, '') : 'cidade não definida');
const cai = (m, p) => m.funcaoId === p.funcao_id
  && (!m.equipeId || m.equipeId === p.equipe_id)
  && (!m.cidadeIbge || m.cidadeIbge === p.cidade_ibge);

export default function MappingsBoard({ mappings = [], candidates = [], mapeamento, filtroNivel = 'all', busca = '' }) {
  const navigate = useNavigate();
  const [posicoes, setPosicoes] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let vivo = true;
    supabase.rpc('talents_quadro_posicoes').then(({ data, error }) => {
      if (!vivo) return;
      if (error) setErro(error.message); else setPosicoes(data || []);
    });
    return () => { vivo = false; };
  }, []);

  const nomeDe = (m) => candidates.find(c => c.id === m.candidateId)?.fullName || m.candidateName || '(sem nome)';

  // Só mapeamentos ativos; filtros de nível e busca da página valem aqui também.
  const ativos = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return mappings.filter(m => m.status === 'Ativo'
      && (filtroNivel === 'all' || nivelEfetivo(m) === filtroNivel)
      && (!q || nomeDe(m).toLowerCase().includes(q)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappings, filtroNivel, busca, candidates]);

  const { porEquipe, fora } = useMemo(() => {
    const lista = posicoes || [];
    const usados = new Set();
    const grupos = new Map();
    for (const p of lista) {
      const ms = ativos.filter(m => cai(m, p))
        .sort((a, b) => ORDEM_NIVEL[nivelEfetivo(a)] - ORDEM_NIVEL[nivelEfetivo(b)]);
      ms.forEach(m => usados.add(m.id));
      const funil = ms.some(m => nivelEfetivo(m) !== 'interessante') ? 'forte' : ms.length ? 'interessante' : 'vazio';
      if (!grupos.has(p.equipe)) grupos.set(p.equipe, []);
      grupos.get(p.equipe).push({ ...p, ms, funil });
    }
    return {
      porEquipe: [...grupos.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR')),
      fora: ativos.filter(m => !usados.has(m.id)),
    };
  }, [posicoes, ativos]);

  if (erro) return <p className="p-6 text-sm text-red-600">Não foi possível carregar as posições: {erro}</p>;
  if (!posicoes) return <p className="p-6 text-sm text-muted-foreground flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Carregando posições…</p>;

  const Pessoa = ({ m }) => (
    <button
      onClick={(e) => { e.stopPropagation(); navigate(`/candidate/${m.candidateId}`); }}
      className="flex items-center justify-between gap-2 w-full text-left text-xs hover:underline"
      title={mappingLabel(m, mapeamento) || ''}
    >
      <span className="truncate">{nomeDe(m)}</span>
      <span className={`shrink-0 px-1 rounded border text-[9px] font-bold uppercase ${NIVEIS[nivelEfetivo(m)].badge}`}>
        {NIVEIS[nivelEfetivo(m)].label}
      </span>
    </button>
  );

  return (
    <div className="p-4 sm:p-6 space-y-4 overflow-auto h-full">
      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
        {Object.values(FUNIL).map(f => (
          <span key={f.label} className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${f.dot}`} />{f.label}</span>
        ))}
        <span className="inline-flex items-center gap-1" title="Posição = função + equipe + cidade de atuação, do quadro atual da empresa (Pilares). Um mapeamento entra na posição se a função bate e a equipe e a cidade batem ou estão vazias (qualquer).">
          <HelpCircle size={13} /> o que é posição?
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {porEquipe.map(([equipe, lista]) => (
          <div key={equipe} className="rounded-lg border border-border bg-card">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold">{equipe}</span>
              <span className="text-xs text-muted-foreground">{lista.filter(p => p.funil !== 'vazio').length}/{lista.length} com mapeamento</span>
            </div>
            <div className="p-2 space-y-2">
              {lista.map(p => (
                <div key={`${p.funcao_id}|${p.cidade_ibge ?? ''}`} className={`rounded-md border border-border border-l-4 p-2.5 ${FUNIL[p.funil].card}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{p.funcao}</p>
                      <p className="text-xs text-muted-foreground">
                        {cidadeCurta(p.cidade)} · {p.vaga ? 'vaga em aberto' : `${p.pessoas} no quadro`}
                      </p>
                    </div>
                    {p.vaga && <span className="text-[10px] px-1.5 py-0.5 rounded border border-border">vaga</span>}
                  </div>
                  {p.ms.length > 0 ? (
                    <div className="mt-1.5 space-y-0.5">
                      {p.ms.slice(0, 5).map(m => <Pessoa key={m.id} m={m} />)}
                      {p.ms.length > 5 && <p className="text-[11px] text-muted-foreground">+{p.ms.length - 5} mapeado(s)</p>}
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-red-700 dark:text-red-300">ninguém mapeado</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {fora.length > 0 && (
          <div className="rounded-lg border border-dashed border-border bg-card">
            <div className="px-3 py-2 border-b border-border">
              <span className="text-sm font-semibold">Fora do quadro atual</span>
              <p className="text-[11px] text-muted-foreground">Sem função definida, ou função/cidade que a empresa não tem hoje.</p>
            </div>
            <div className="p-2 space-y-1.5">
              {fora.map(m => (
                <div key={m.id} className="rounded-md border border-border p-2">
                  <Pessoa m={m} />
                  <p className="text-[11px] text-muted-foreground truncate">
                    {mappingLabel(m, mapeamento) || 'função não definida'}{m.city ? ` · ${m.city}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
