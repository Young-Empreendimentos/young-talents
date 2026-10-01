import { supabase } from '../supabase';

// Cidades: mesma base do Pilares (rh.rh_municipios, IBGE, 5.571 municípios).
// A chave é o código IBGE — 232 nomes se repetem entre estados. nome_busca é o
// nome sem acento/apóstrofo em minúsculas ("santana do livramento").

export const normalizarBusca = (s) => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/['’]/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();

export const rotuloCidade = (m) => (m ? `${m.nome}/${m.uf}` : '');

const tabela = () => supabase.schema('rh').from('rh_municipios');

/** Busca por trecho do nome; RS primeiro (onde a empresa atua). */
export async function buscarCidades(termo, limite = 30) {
  const t = normalizarBusca(termo);
  if (!supabase || t.length < 2) return [];
  const { data, error } = await tabela().select('codigo_ibge, nome, uf').ilike('nome_busca', `%${t}%`).limit(limite);
  if (error) return [];
  return (data || []).sort((a, b) =>
    Number(b.uf === 'RS') - Number(a.uf === 'RS')
    || Number(normalizarBusca(b.nome).startsWith(t)) - Number(normalizarBusca(a.nome).startsWith(t))
    || a.nome.localeCompare(b.nome, 'pt-BR'));
}

/**
 * Texto livre ("Bagé", "Porto Alegre/RS", "Sant'Ana do Livramento/RS") → município.
 * Sem UF, assume RS. Devolve null se não achar exatamente.
 */
export async function resolverCidade(texto) {
  if (!supabase || !texto) return null;
  const [nome, uf] = String(texto).split('/').map((s) => s.trim());
  const t = normalizarBusca(nome);
  if (!t) return null;
  const { data } = await tabela().select('codigo_ibge, nome, uf')
    .eq('nome_busca', t).eq('uf', (uf || 'RS').toUpperCase()).limit(1);
  return data?.[0] || null;
}
