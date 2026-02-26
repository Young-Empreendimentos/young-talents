/**
 * Mapeia um candidato retornado pelo Supabase (snake_case) para o formato
 * usado pelo app (camelCase e campos esperados pelos componentes).
 */
export function mapCandidateFromSupabase(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    emailSecondary: row.email_secondary,
    phone: row.phone,
    birthDate: row.birth_date,
    age: row.age,
    maritalStatus: row.marital_status,
    childrenCount: row.children_count,
    hasLicense: row.has_license,
    city: row.city,
    photoUrl: row.photo_url,
    education: row.education,
    schoolingLevel: row.schooling_level,
    institution: row.institution,
    graduationDate: row.graduation_date,
    isStudying: row.is_studying,
    experience: row.experience,
    courses: row.courses,
    certifications: row.certifications,
    interestAreas: row.interest_areas,
    cvUrl: row.cv_url,
    portfolioUrl: row.portfolio_url,
    source: row.source,
    referral: row.referral,
    salaryExpectation: row.salary_expectation,
    canRelocate: row.can_relocate,
    professionalReferences: row.professional_references,
    typeOfApp: row.type_of_app,
    freeField: row.free_field,
    status: row.status ?? 'Inscrito',
    starred: row.starred === true,
    interview1Date: row.interview1_date ?? null,
    interview1Notes: row.interview1_notes ?? null,
    interview2Date: row.interview2_date ?? null,
    interview2Notes: row.interview2_notes ?? null,
    managerFeedback: row.manager_feedback ?? null,
    testResults: row.test_results ?? null,
    returnSent: row.return_sent ?? null,
    returnDate: row.return_date ?? null,
    returnNotes: row.return_notes ?? null,
    rejectionReason: row.rejection_reason ?? null,
    closedAt: row.closed_at ?? null,
    tags: row.tags ?? [],
    origin: row.origin,
    createdBy: row.created_by,
    original_timestamp: row.original_timestamp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null
  };
}

/**
 * Mapeia uma lista de candidatos do Supabase para o formato do app.
 */
export function mapCandidatesFromSupabase(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapCandidateFromSupabase).filter(Boolean);
}

/**
 * Mapeia candidato do app (camelCase) para payload Supabase (snake_case) para INSERT/UPDATE.
 */
export function candidateToSupabase(d) {
  if (!d) return null;
  const row = {
    full_name: d.fullName,
    email: d.email,
    email_secondary: d.emailSecondary ?? null,
    phone: d.phone,
    birth_date: d.birthDate ?? null,
    age: d.age ?? null,
    marital_status: d.maritalStatus ?? null,
    children_count: d.childrenCount ?? null,
    has_license: d.hasLicense ?? null,
    city: d.city ?? null,
    photo_url: d.photoUrl ?? null,
    education: d.education ?? null,
    schooling_level: d.schoolingLevel ?? null,
    institution: d.institution ?? null,
    graduation_date: d.graduationDate ?? null,
    is_studying: d.isStudying ?? null,
    experience: d.experience ?? null,
    courses: d.courses ?? null,
    certifications: d.certifications ?? null,
    interest_areas: d.interestAreas ?? null,
    cv_url: d.cvUrl ?? null,
    portfolio_url: d.portfolioUrl ?? null,
    source: d.source ?? null,
    referral: d.referral ?? null,
    salary_expectation: d.salaryExpectation ?? null,
    can_relocate: d.canRelocate ?? null,
    professional_references: d.professionalReferences ?? null,
    type_of_app: d.typeOfApp ?? null,
    free_field: d.freeField ?? null,
    status: d.status ?? 'Inscrito',
    starred: d.starred === true,
    interview1_date: d.interview1Date ?? null,
    interview1_notes: d.interview1Notes ?? null,
    interview2_date: d.interview2Date ?? null,
    interview2_notes: d.interview2Notes ?? null,
    manager_feedback: d.managerFeedback ?? null,
    test_results: d.testResults ?? null,
    return_sent: d.returnSent ?? null,
    return_date: d.returnDate ?? null,
    return_notes: d.returnNotes ?? null,
    rejection_reason: d.rejectionReason ?? null,
    closed_at: d.closedAt ?? null,
    tags: d.tags ?? [],
    origin: d.origin ?? null,
    created_by: d.createdBy ?? null
  };
  if (d.id) row.id = d.id;
  return row;
}
