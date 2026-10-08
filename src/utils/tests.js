// Helpers do módulo de Testes (tipos de teste + testes feitos por candidato).
// Tabelas em rh: talents_test_types, talents_candidate_tests.

export const TEST_STATUSES = ['Pendente', 'Realizado', 'Cancelado'];
export const TEST_RESULTS = ['Aprovado', 'Aprovado com ressalvas', 'Reprovado'];

export const TEST_STATUS_STYLES = {
  'Pendente': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  'Realizado': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  'Cancelado': 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
};

export const TEST_RESULT_STYLES = {
  'Aprovado': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  'Aprovado com ressalvas': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  'Reprovado': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

// Acesso às tabelas (schema rh)
export const rh = (sb) => sb.schema('rh');

export function mapTestType(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category || '',
    description: row.description || '',
    active: row.active !== false,
    createdAt: row.created_at,
  };
}

export function mapCandidateTest(row) {
  if (!row) return null;
  return {
    id: row.id,
    candidateId: row.candidate_id,
    testTypeId: row.test_type_id,
    testDate: row.test_date || null,
    status: row.status || 'Pendente',
    result: row.result || null,
    score: row.score === null || row.score === undefined ? null : Number(row.score),
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdByName: row.created_by_name || '',
  };
}

// camelCase -> snake_case para gravar um teste de candidato
export function candidateTestToRow(d) {
  return {
    candidate_id: d.candidateId,
    test_type_id: d.testTypeId,
    test_date: d.testDate || null,
    status: d.status || 'Pendente',
    result: d.result || null,
    score: d.score === '' || d.score === null || d.score === undefined ? null : Number(d.score),
    notes: d.notes || null,
  };
}

// usuário atual (best-effort, só para o created_by/created_by_name)
export async function currentUserInfo(sb) {
  try {
    const { data } = await sb.auth.getUser();
    const u = data?.user;
    if (!u) return { email: null, name: null };
    const name = u.user_metadata?.full_name || u.user_metadata?.name || (u.email ? u.email.split('@')[0] : null);
    return { email: u.email || null, name: name || null };
  } catch {
    return { email: null, name: null };
  }
}

export const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d.length === 10 ? d + 'T00:00:00' : d);
  return isNaN(dt) ? '—' : dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

// ordena testes: maior nota primeiro (nulos no fim), depois mais recente
export function sortByScoreDesc(a, b) {
  const sa = a.score, sb_ = b.score;
  if (sa == null && sb_ == null) return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  if (sa == null) return 1;
  if (sb_ == null) return -1;
  if (sb_ !== sa) return sb_ - sa;
  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
}
