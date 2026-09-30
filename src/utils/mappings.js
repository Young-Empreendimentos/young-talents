// Mapeamento de interesse: níveis e rótulos, num lugar só.
//
// O mapeamento aponta para uma FUNÇÃO do Pilares (rh_funcoes), opcionalmente
// uma EQUIPE (rh_equipes) e um texto livre de especificação:
//   Assistente Administrativo · Suprimentos — compras de obra
//
// Níveis: "interessante" e "forte" moram no mapeamento. "alternativa" (externa)
// é um marcador em rh_sucessao_externos, que só o admin do Pilares lê — para o
// resto do Talents a pessoa aparece como "forte". Por isso o nível exibido é
// calculado por nivelEfetivo().

export const NIVEIS = {
  interessante: {
    label: 'Interessante',
    hint: 'Vale lembrar',
    badge: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
  },
  forte: {
    label: 'Forte',
    hint: 'Chamaríamos se abrisse vaga',
    badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  },
  alternativa: {
    label: 'Alternativa externa',
    hint: 'Pode cobrir a função — aparece no plano de sucessão (só admin)',
    badge: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
  },
};

export const ORDEM_NIVEL = { alternativa: 0, forte: 1, interessante: 2 };

export const MAPPING_STATUSES = ['Ativo', 'Contratado', 'Descartado'];

export const nivelEfetivo = (m) => (m?.alternativa ? 'alternativa' : m?.nivel || 'interessante');

/** Níveis que o usuário pode escolher: "alternativa" só para admin da sucessão. */
export const niveisDisponiveis = (adminSucessao) =>
  adminSucessao ? ['interessante', 'forte', 'alternativa'] : ['interessante', 'forte'];

/** "Função · Equipe — especificação", com fallback para o cargo antigo. */
export function mappingLabel(m, { funcoesById, equipesById } = {}) {
  if (!m) return '';
  const funcao = m.funcaoId ? funcoesById?.get(m.funcaoId)?.name : null;
  const equipe = m.equipeId ? equipesById?.get(m.equipeId)?.name : null;
  const base = [funcao, equipe].filter(Boolean).join(' · ');
  const spec = m.especificacao?.trim();
  if (base && spec) return `${base} — ${spec}`;
  return base || spec || m.positionName || '';
}

/** Mapeamento sem função: não entra no plano de sucessão nem no filtro por função. */
export const semFuncao = (m) => !m?.funcaoId;

/** Agrupa opções por trilha para <optgroup>. */
export function agruparPorTrilha(funcoes = []) {
  const groups = new Map();
  for (const f of funcoes) {
    const k = f.trilha || 'Outras';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(f);
  }
  return [...groups.entries()];
}
