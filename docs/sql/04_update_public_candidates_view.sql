-- IMPORTANTE: Rode este arquivo DEPOIS de 02 e 03.
-- O app usa a VIEW public.candidates (não a tabela direto). A view tinha lista fixa de colunas
-- e não incluía "starred" nem as colunas de processo. Este script atualiza a view e os triggers.

-- 1) Recriar a view incluindo starred e colunas de processo
CREATE OR REPLACE VIEW public.candidates AS
SELECT
  id, full_name, email, email_secondary, phone, birth_date, age,
  marital_status, children_count, has_license, city, photo_url,
  education, schooling_level, institution, graduation_date, is_studying,
  experience, courses, certifications, interest_areas, cv_url, portfolio_url,
  source, referral, salary_expectation, can_relocate, professional_references,
  type_of_app, free_field, status, tags, origin, created_by,
  original_timestamp, created_at, updated_at, deleted_at,
  starred,
  interview1_date, interview1_notes, interview2_date, interview2_notes,
  manager_feedback, test_results, return_sent, return_date, return_notes,
  rejection_reason, closed_at
FROM young_talents.candidates;

-- 2) Trigger de INSERT: incluir novas colunas
CREATE OR REPLACE FUNCTION public.candidates_insert_trigger()
RETURNS TRIGGER AS $$
DECLARE
  rec young_talents.candidates%ROWTYPE;
BEGIN
  INSERT INTO young_talents.candidates (
    full_name, email, email_secondary, phone, birth_date, age,
    marital_status, children_count, has_license, city, photo_url,
    education, schooling_level, institution, graduation_date, is_studying,
    experience, courses, certifications, interest_areas, cv_url, portfolio_url,
    source, referral, salary_expectation, can_relocate, professional_references,
    type_of_app, free_field, status, tags, origin, created_by,
    original_timestamp, created_at,
    starred,
    interview1_date, interview1_notes, interview2_date, interview2_notes,
    manager_feedback, test_results, return_sent, return_date, return_notes,
    rejection_reason, closed_at
  ) VALUES (
    NEW.full_name, NEW.email, NEW.email_secondary, NEW.phone, NEW.birth_date, NEW.age,
    NEW.marital_status, NEW.children_count, NEW.has_license, NEW.city, NEW.photo_url,
    NEW.education, NEW.schooling_level, NEW.institution, NEW.graduation_date, NEW.is_studying,
    NEW.experience, NEW.courses, NEW.certifications, NEW.interest_areas, NEW.cv_url, NEW.portfolio_url,
    NEW.source, NEW.referral, NEW.salary_expectation, NEW.can_relocate, NEW.professional_references,
    NEW.type_of_app, NEW.free_field, COALESCE(NEW.status, 'Inscrito'), COALESCE(NEW.tags, ARRAY['Novo Inscrito', 'Formulário Público']::text[]),
    COALESCE(NEW.origin, 'public_form'), COALESCE(NEW.created_by, 'Formulário Público'),
    COALESCE(NEW.original_timestamp, NOW()), COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.starred, false),
    NEW.interview1_date, NEW.interview1_notes, NEW.interview2_date, NEW.interview2_notes,
    NEW.manager_feedback, NEW.test_results, NEW.return_sent, NEW.return_date, NEW.return_notes,
    NEW.rejection_reason, NEW.closed_at
  )
  RETURNING * INTO rec;
  NEW.id := rec.id;
  NEW.created_at := rec.created_at;
  NEW.updated_at := rec.updated_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Trigger de UPDATE: incluir novas colunas no SET
CREATE OR REPLACE FUNCTION public.candidates_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE young_talents.candidates SET
    full_name = NEW.full_name, email = NEW.email, email_secondary = NEW.email_secondary,
    phone = NEW.phone, birth_date = NEW.birth_date, age = NEW.age,
    marital_status = NEW.marital_status, children_count = NEW.children_count,
    has_license = NEW.has_license, city = NEW.city, photo_url = NEW.photo_url,
    education = NEW.education, schooling_level = NEW.schooling_level,
    institution = NEW.institution, graduation_date = NEW.graduation_date,
    is_studying = NEW.is_studying, experience = NEW.experience, courses = NEW.courses,
    certifications = NEW.certifications, interest_areas = NEW.interest_areas,
    cv_url = NEW.cv_url, portfolio_url = NEW.portfolio_url, source = NEW.source,
    referral = NEW.referral, salary_expectation = NEW.salary_expectation,
    can_relocate = NEW.can_relocate, professional_references = NEW.professional_references,
    type_of_app = NEW.type_of_app, free_field = NEW.free_field, status = NEW.status,
    tags = NEW.tags, origin = NEW.origin, created_by = NEW.created_by,
    original_timestamp = NEW.original_timestamp, updated_at = NOW(),
    starred = NEW.starred,
    interview1_date = NEW.interview1_date, interview1_notes = NEW.interview1_notes,
    interview2_date = NEW.interview2_date, interview2_notes = NEW.interview2_notes,
    manager_feedback = NEW.manager_feedback, test_results = NEW.test_results,
    return_sent = NEW.return_sent, return_date = NEW.return_date, return_notes = NEW.return_notes,
    rejection_reason = NEW.rejection_reason, closed_at = NEW.closed_at
  WHERE id = OLD.id;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
