/**
 * Mapeadores Supabase (snake_case) → formato do app (camelCase)
 * Para jobs, companies, cities, sectors, positions, applications.
 */

export function mapJobFromSupabase(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    code: row.code,
    company: row.company,
    city: row.city,
    interestArea: row.interest_area,
    sector: row.sector,
    position: row.position,
    function: row.function,
    status: row.status ?? 'Aberta',
    contractType: row.contract_type,
    workModel: row.work_model,
    vacancies: row.vacancies ?? 1,
    priority: row.priority,
    description: row.description,
    requirements: row.requirements,
    benefits: row.benefits,
    salaryRange: row.salary_range,
    workload: row.workload,
    deadline: row.deadline,
    recruiter: row.recruiter,
    hiringManager: row.hiring_manager,
    approvedBy: row.approved_by ?? null,
    requestedByUserId: row.requested_by_user_id ?? null,
    postingChannels: row.posting_channels ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null
  };
}

export function mapCompanyFromSupabase(row) {
  if (!row) return null;
  return { id: row.id, name: row.name, city: row.city };
}

export function mapCityFromSupabase(row) {
  if (!row) return null;
  return { id: row.id, name: row.name };
}

export function mapSectorFromSupabase(row) {
  if (!row) return null;
  return { id: row.id, name: row.name };
}

export function mapPositionFromSupabase(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    levelId: row.level_id ?? null,
    activityAreaId: row.activity_area_id ?? null
  };
}

export function mapJobLevelFromSupabase(row) {
  if (!row) return null;
  return { id: row.id, name: row.name };
}

export function mapActivityAreaFromSupabase(row) {
  if (!row) return null;
  return { id: row.id, name: row.name };
}

export function mapApplicationFromSupabase(row) {
  if (!row) return null;
  return {
    id: row.id,
    candidateId: row.candidate_id,
    jobId: row.job_id,
    candidateName: row.candidate_name,
    candidateEmail: row.candidate_email,
    jobTitle: row.job_title,
    jobCompany: row.job_company,
    status: row.status ?? 'Inscrito',
    appliedAt: row.applied_at,
    lastActivity: row.last_activity,
    rating: row.rating ?? 0,
    closedAt: row.closed_at,
    closedReason: row.closed_reason,
    createdBy: row.created_by,
    createdAt: row.created_at,
    notes: Array.isArray(row.notes) ? row.notes : (row.notes ? [row.notes] : [])
  };
}

export function mapJobsFromSupabase(rows) {
  return (rows ?? []).map(mapJobFromSupabase).filter(Boolean);
}
export function mapCompaniesFromSupabase(rows) {
  return (rows ?? []).map(mapCompanyFromSupabase).filter(Boolean);
}
export function mapCitiesFromSupabase(rows) {
  return (rows ?? []).map(mapCityFromSupabase).filter(Boolean);
}
export function mapSectorsFromSupabase(rows) {
  return (rows ?? []).map(mapSectorFromSupabase).filter(Boolean);
}
export function mapPositionsFromSupabase(rows) {
  return (rows ?? []).map(mapPositionFromSupabase).filter(Boolean);
}
export function mapJobLevelsFromSupabase(rows) {
  return (rows ?? []).map(mapJobLevelFromSupabase).filter(Boolean);
}
export function mapActivityAreasFromSupabase(rows) {
  return (rows ?? []).map(mapActivityAreaFromSupabase).filter(Boolean);
}
export function mapApplicationsFromSupabase(rows) {
  return (rows ?? []).map(mapApplicationFromSupabase).filter(Boolean);
}

// --- Payloads app (camelCase) → Supabase (snake_case) para INSERT/UPDATE ---

export function jobToSupabase(d) {
  if (!d) return null;
  const row = {
    title: d.title,
    code: d.code ?? null,
    company: d.company,
    city: d.city ?? null,
    interest_area: d.interestArea ?? null,
    sector: d.sector ?? null,
    position: d.position ?? null,
    function: d.function ?? null,
    status: d.status ?? 'Aberta',
    contract_type: d.contractType ?? null,
    work_model: d.workModel ?? null,
    vacancies: d.vacancies ?? 1,
    priority: d.priority ?? null,
    description: d.description ?? null,
    requirements: d.requirements ?? null,
    benefits: d.benefits ?? null,
    salary_range: d.salaryRange ?? null,
    workload: d.workload ?? null,
    deadline: d.deadline ?? null,
    recruiter: d.recruiter ?? null,
    hiring_manager: d.hiringManager ?? null,
    approved_by: d.approvedBy ?? null,
    posting_channels: d.postingChannels ?? null
  };
  if (d.id) row.id = d.id;
  // requested_by_user_id é preenchido pelo trigger no INSERT; não enviar no payload
  return row;
}
