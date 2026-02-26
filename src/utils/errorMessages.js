/**
 * Traduz mensagens de erro do Supabase/PostgREST para português
 * e identifica tipos de erro para tratamento específico no app.
 */

/**
 * @param {string} [message] - Mensagem de erro original
 * @returns {{ text: string, isApprovedByMissing?: boolean, isCandidateColumnMissing?: boolean }}
 */
export function translateSupabaseError(message) {
  const msg = String(message || '');

  if (/Could not find the 'approved_by' column.*jobs|'approved_by'.*'jobs'/i.test(msg)) {
    return {
      text: 'A coluna "Quem autorizou a abertura" não existe na tabela de vagas. O campo no formulário fica na seção de gestão da vaga (abaixo de "Recrutador Responsável"). Atualize o banco com o SQL de migração ou salve sem este campo.',
      isApprovedByMissing: true
    };
  }

  if (/Could not find the 'closed_at' column.*candidates|'closed_at'.*'candidates'/i.test(msg)) {
    return {
      text: 'A coluna de processo (closed_at) não existe na tabela de candidatos. Execute o SQL de atualização no Supabase (migrations 021 e 022) para adicionar as colunas.',
      isCandidateColumnMissing: true
    };
  }

  if (/Could not find the 'starred' column.*candidates|'starred'.*'candidates'/i.test(msg)) {
    return {
      text: 'A coluna "Em consideração" (starred) não existe na tabela de candidatos. Execute o SQL de migração 021 no Supabase.',
      isCandidateColumnMissing: true
    };
  }

  if (/Could not find the '(interview1_date|interview1_notes|interview2_date|manager_feedback|test_results)' column.*candidates/i.test(msg)) {
    return {
      text: 'Algumas colunas de processo do candidato não existem no banco. Execute o SQL de migração 022 no Supabase para adicionar as colunas de entrevista e processo.',
      isCandidateColumnMissing: true
    };
  }

  if (/Could not find the .* column of .* in the schema cache/i.test(msg)) {
    const match = msg.match(/Could not find the '([^']+)' column of '([^']+)'/i);
    const column = match ? match[1] : 'coluna';
    const table = match ? match[2] : 'tabela';
    return {
      text: `A coluna "${column}" não existe na tabela "${table}". Atualize o banco executando as migrations no Supabase (SQL Editor ou CLI).`
    };
  }

  if (/relation .* does not exist/i.test(msg)) {
    return { text: 'Tabela ou vista não encontrada no banco de dados. Verifique se as migrations foram aplicadas no Supabase.' };
  }

  if (/permission denied|row-level security|policy/i.test(msg)) {
    return { text: 'Permissão negada. Verifique as políticas de segurança (RLS) e se o usuário tem permissão para esta ação.' };
  }

  if (/duplicate key|already exists|unique constraint/i.test(msg)) {
    return { text: 'Já existe um registro com estes dados (valor duplicado).' };
  }

  if (/foreign key|violates foreign key/i.test(msg)) {
    return { text: 'Referência inválida: o registro está vinculado a outro que não existe ou não pode ser alterado.' };
  }

  if (/null value in column .* violates not-null/i.test(msg)) {
    return { text: 'Campo obrigatório não preenchido. Preencha todos os campos obrigatórios e tente novamente.' };
  }

  return { text: msg || 'Erro ao salvar. Tente novamente.' };
}
