import { describe, expect, it } from 'vitest';
import { translateSupabaseError } from '../utils/errorMessages';

describe('translateSupabaseError', () => {
  it('mostra mensagem PT específica para permissão negada em applications', () => {
    const errMsg = 'permission denied for table applications due to row-level security policy';
    const res = translateSupabaseError(errMsg, { entity: 'applications' });
    expect(res.text).toBe('Você não tem permissão para vincular candidato à vaga. Entre em contato com o administrador.');
  });

  it('mostra mensagem PT específica para empresas/empreendimentos', () => {
    const errMsg = 'permission denied for table companies due to row-level security policy';
    const res = translateSupabaseError(errMsg, { entity: 'companies' });
    expect(res.text).toBe('Você não tem permissão para cadastrar ou editar empresas/empreendimentos. Entre em contato com o administrador para solicitar acesso.');
  });
});

