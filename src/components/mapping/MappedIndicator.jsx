import React from 'react';
import { MapPin } from 'lucide-react';
import { NIVEIS, nivelEfetivo, mappingLabel, ORDEM_NIVEL } from '../../utils/mappings';

/**
 * Indicador de "mapeado" nas listas — substitui a antiga estrela. Mostra se o
 * candidato tem mapeamento ativo e, no título, para quê. O clique abre o
 * candidato, onde se mapeia (a estrela marcava sem dizer para qual função).
 */
export default function MappedIndicator({ ativos = [], mapeamento, onClick, size = 15 }) {
  const n = ativos.length;
  const topo = n
    ? [...ativos].sort((a, b) => ORDEM_NIVEL[nivelEfetivo(a)] - ORDEM_NIVEL[nivelEfetivo(b)])[0]
    : null;
  const title = n
    ? ativos.map(m => `${mappingLabel(m, mapeamento) || 'Função não definida'} (${NIVEIS[nivelEfetivo(m)].label})`).join('\n')
    : 'Não mapeado — clique para abrir e mapear';
  const cor = !topo ? 'text-muted-foreground/30 hover:text-brand-orange/60'
    : nivelEfetivo(topo) === 'alternativa' ? 'text-violet-500'
      : nivelEfetivo(topo) === 'forte' ? 'text-brand-orange' : 'text-brand-orange/60';

  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onClick?.(); }}
      className="relative inline-flex items-center p-0.5 rounded hover:bg-muted focus:outline-none"
      title={title}
    >
      <MapPin size={size} className={cor} fill={n ? 'currentColor' : 'none'} fillOpacity={n ? 0.25 : 0} />
      {n > 1 && <span className="absolute -top-1 -right-1 text-[9px] font-bold text-brand-orange">{n}</span>}
    </button>
  );
}
