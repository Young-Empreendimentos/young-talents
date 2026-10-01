import { describe, it, expect } from 'vitest';
import { mappingLabel, nivelEfetivo, niveisDisponiveis, agruparPorTrilha } from '../utils/mappings';
import { mappingToSupabase } from '../utils/fromSupabase';

const funcoesById = new Map([['f1', { id: 'f1', name: 'Assistente Administrativo', trilha: 'Administrativo' }]]);
const equipesById = new Map([['e1', { id: 'e1', name: 'Suprimentos' }]]);
const opts = { funcoesById, equipesById };

describe('mappingLabel', () => {
  it('monta função · equipe — especificação', () => {
    expect(mappingLabel({ funcaoId: 'f1', equipeId: 'e1', especificacao: 'compras' }, opts))
      .toBe('Assistente Administrativo · Suprimentos — compras');
  });
  it('aceita só texto livre', () => {
    expect(mappingLabel({ especificacao: 'Assistente de compras' }, opts)).toBe('Assistente de compras');
  });
  it('cai no cargo antigo quando não há função nem texto', () => {
    expect(mappingLabel({ positionName: 'Coordenador Administrativo' }, opts)).toBe('Coordenador Administrativo');
  });
});

describe('níveis', () => {
  it('alternativa vem do marcador, não da coluna nivel', () => {
    expect(nivelEfetivo({ nivel: 'forte', alternativa: { id: 'x' } })).toBe('alternativa');
    expect(nivelEfetivo({ nivel: 'forte', alternativa: null })).toBe('forte');
    expect(nivelEfetivo({})).toBe('interessante');
  });
  it('só o admin da sucessão pode escolher alternativa', () => {
    expect(niveisDisponiveis(false)).not.toContain('alternativa');
    expect(niveisDisponiveis(true)).toContain('alternativa');
  });
  it('alternativa é gravada como forte no mapeamento', () => {
    // talents_mappings.nivel só aceita interessante|forte (check no banco)
    expect(mappingToSupabase({ candidateId: 'c', nivel: 'alternativa' }).nivel).toBe('forte');
    expect(mappingToSupabase({ candidateId: 'c', nivel: 'interessante' }).nivel).toBe('interessante');
  });
  it('cidade estruturada: sem código vale qualquer cidade e não grava texto solto', () => {
    expect(mappingToSupabase({ candidateId: 'c', cidadeIbge: 4317608, city: 'Santo Antônio da Patrulha/RS' }))
      .toMatchObject({ cidade_ibge: 4317608, city: 'Santo Antônio da Patrulha/RS' });
    expect(mappingToSupabase({ candidateId: 'c', cidadeIbge: null, city: 'Porto Alegre ' }))
      .toMatchObject({ cidade_ibge: null, city: null });
  });
  it('não grava mais o cargo antigo (position_id)', () => {
    expect(mappingToSupabase({ candidateId: 'c', funcaoId: 'f1' })).not.toHaveProperty('position_id');
  });
});

describe('agruparPorTrilha', () => {
  it('agrupa e põe sem trilha em "Outras"', () => {
    const g = agruparPorTrilha([{ id: 'a', trilha: 'X' }, { id: 'b' }, { id: 'c', trilha: 'X' }]);
    expect(g).toEqual([['X', [{ id: 'a', trilha: 'X' }, { id: 'c', trilha: 'X' }]], ['Outras', [{ id: 'b' }]]]);
  });
});
