


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "young_talents";


ALTER SCHEMA "young_talents" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "young_talents"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'young_talents'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM young_talents.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "young_talents"."is_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "young_talents"."is_admin"() IS 'Verifica se o usuário atual tem role admin em user_roles. Usado nas políticas RLS para evitar recursão.';



CREATE OR REPLACE FUNCTION "young_talents"."is_developer"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid;
END;
$$;


ALTER FUNCTION "young_talents"."is_developer"() OWNER TO "postgres";


COMMENT ON FUNCTION "young_talents"."is_developer"() IS 'Verifica se o usuário é o desenvolvedor (por user_id). Não acessa auth.users para evitar permission denied.';



CREATE OR REPLACE FUNCTION "young_talents"."sync_user_role_on_login"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  user_photo TEXT;
  existing_role RECORD;
BEGIN
  -- Obter dados do usuário autenticado
  user_email := NEW.email;
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    NULL
  );
  user_photo := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  -- Buscar registro existente em user_roles por email
  SELECT * INTO existing_role
  FROM young_talents.user_roles
  WHERE email = user_email
  LIMIT 1;

  IF existing_role IS NOT NULL THEN
    -- Atualizar registro existente
    UPDATE young_talents.user_roles
    SET
      user_id = NEW.id,
      name = COALESCE(user_name, existing_role.name),
      photo = COALESCE(user_photo, existing_role.photo),
      last_login = NOW(),
      updated_at = NOW()
    WHERE id = existing_role.id;
    
    RAISE NOTICE 'Sincronizado user_role para % (ID: %)', user_email, NEW.id;
  ELSE
    -- Criar novo registro com role padrão 'viewer'
    -- Apenas se o usuário não tiver role pré-cadastrado
    INSERT INTO young_talents.user_roles (user_id, email, name, photo, role, created_at, last_login)
    VALUES (
      NEW.id,
      user_email,
      user_name,
      user_photo,
      'viewer', -- Role padrão para novos usuários
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO UPDATE
    SET
      user_id = NEW.id,
      name = COALESCE(user_name, user_roles.name),
      photo = COALESCE(user_photo, user_roles.photo),
      last_login = NOW(),
      updated_at = NOW();
    
    RAISE NOTICE 'Criado novo user_role para % (ID: %)', user_email, NEW.id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "young_talents"."sync_user_role_on_login"() OWNER TO "postgres";


COMMENT ON FUNCTION "young_talents"."sync_user_role_on_login"() IS 'Sincroniza automaticamente dados do usuário (user_id, name, photo, last_login) em user_roles quando usuário faz login ou atualiza perfil. Se não existir registro, cria com role padrão viewer.';



CREATE OR REPLACE FUNCTION "young_talents"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "young_talents"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "young_talents"."activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "user_email" "text",
    "user_name" "text",
    "action" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "text",
    "details" "text",
    "meta" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "young_talents"."activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "young_talents"."candidates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text",
    "email" "text" NOT NULL,
    "email_secondary" "text",
    "phone" "text" NOT NULL,
    "birth_date" "date",
    "age" integer,
    "marital_status" "text",
    "children_count" "text",
    "has_license" "text",
    "city" "text",
    "photo_url" "text",
    "education" "text",
    "schooling_level" "text",
    "institution" "text",
    "graduation_date" "date",
    "is_studying" "text",
    "experience" "text",
    "courses" "text",
    "certifications" "text",
    "interest_areas" "text",
    "cv_url" "text",
    "portfolio_url" "text",
    "source" "text",
    "referral" "text",
    "salary_expectation" "text",
    "can_relocate" "text",
    "professional_references" "text",
    "type_of_app" "text",
    "free_field" "text",
    "status" "text" DEFAULT 'Inscrito'::"text",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "origin" "text" DEFAULT 'public_form'::"text",
    "created_by" "text" DEFAULT 'Formulário Público'::"text",
    "original_timestamp" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "starred" boolean DEFAULT false,
    "interview1_date" timestamp with time zone,
    "interview1_notes" "text",
    "interview2_date" timestamp with time zone,
    "interview2_notes" "text",
    "manager_feedback" "text",
    "test_results" "text",
    "return_sent" "text",
    "return_date" "date",
    "return_notes" "text",
    "rejection_reason" "text",
    "closed_at" timestamp with time zone
);


ALTER TABLE "young_talents"."candidates" OWNER TO "postgres";


COMMENT ON COLUMN "young_talents"."candidates"."starred" IS 'Marcação "em consideração" para filtro na pipeline e banco de talentos';



CREATE TABLE IF NOT EXISTS "young_talents"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "name" "text",
    "photo" "text",
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_login" timestamp with time zone,
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'editor'::"text", 'viewer'::"text"])))
);


ALTER TABLE "young_talents"."user_roles" OWNER TO "postgres";


COMMENT ON COLUMN "young_talents"."user_roles"."user_id" IS 'ID do usuário no auth.users. Pode ser NULL temporariamente quando usuário é pré-cadastrado antes do primeiro login.';



CREATE TABLE IF NOT EXISTS "young_talents"."activity_areas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "young_talents"."activity_areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "young_talents"."applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "candidate_id" "uuid" NOT NULL,
    "job_id" "uuid" NOT NULL,
    "candidate_name" "text",
    "candidate_email" "text",
    "job_title" "text",
    "job_company" "text",
    "status" "text" DEFAULT 'Inscrito'::"text" NOT NULL,
    "applied_at" timestamp with time zone DEFAULT "now"(),
    "last_activity" timestamp with time zone DEFAULT "now"(),
    "rating" integer DEFAULT 0,
    "closed_at" timestamp with time zone,
    "closed_reason" "text",
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "notes" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "young_talents"."applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "young_talents"."cities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "young_talents"."cities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "young_talents"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "city" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "young_talents"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "young_talents"."job_levels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "young_talents"."job_levels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "young_talents"."jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "code" "text",
    "company" "text" NOT NULL,
    "city" "text",
    "interest_area" "text",
    "sector" "text",
    "position" "text",
    "function" "text",
    "status" "text" DEFAULT 'Aberta'::"text" NOT NULL,
    "contract_type" "text",
    "work_model" "text",
    "vacancies" integer DEFAULT 1,
    "priority" "text",
    "description" "text",
    "requirements" "text",
    "benefits" "text",
    "salary_range" "text",
    "workload" "text",
    "deadline" "date",
    "recruiter" "text",
    "hiring_manager" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "approved_by" "text",
    "posting_channels" "jsonb",
    CONSTRAINT "jobs_status_check" CHECK (("status" = ANY (ARRAY['Aberta'::"text", 'Preenchida'::"text", 'Cancelada'::"text", 'Fechada'::"text"])))
);


ALTER TABLE "young_talents"."jobs" OWNER TO "postgres";


COMMENT ON COLUMN "young_talents"."jobs"."approved_by" IS 'Responsável pela solicitação e autorização da abertura da vaga (não quem abre no sistema).';



COMMENT ON COLUMN "young_talents"."jobs"."posting_channels" IS 'Canais onde a vaga é/será divulgada. Ex: { "selected": ["linkedin", "infojobs"], "faculdade": "USP", "agencia": "", "outro": "" }';



CREATE TABLE IF NOT EXISTS "young_talents"."positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "level" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "level_id" "uuid",
    "activity_area_id" "uuid"
);


ALTER TABLE "young_talents"."positions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "young_talents"."sectors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "young_talents"."sectors" OWNER TO "postgres";


ALTER TABLE ONLY "young_talents"."activity_areas"
    ADD CONSTRAINT "activity_areas_name_key" UNIQUE ("name");



ALTER TABLE ONLY "young_talents"."activity_areas"
    ADD CONSTRAINT "activity_areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "young_talents"."activity_log"
    ADD CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "young_talents"."applications"
    ADD CONSTRAINT "applications_candidate_id_job_id_key" UNIQUE ("candidate_id", "job_id");



ALTER TABLE ONLY "young_talents"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "young_talents"."candidates"
    ADD CONSTRAINT "candidates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "young_talents"."cities"
    ADD CONSTRAINT "cities_name_key" UNIQUE ("name");



ALTER TABLE ONLY "young_talents"."cities"
    ADD CONSTRAINT "cities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "young_talents"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "young_talents"."job_levels"
    ADD CONSTRAINT "job_levels_name_key" UNIQUE ("name");



ALTER TABLE ONLY "young_talents"."job_levels"
    ADD CONSTRAINT "job_levels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "young_talents"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "young_talents"."positions"
    ADD CONSTRAINT "positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "young_talents"."sectors"
    ADD CONSTRAINT "sectors_name_key" UNIQUE ("name");



ALTER TABLE ONLY "young_talents"."sectors"
    ADD CONSTRAINT "sectors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "young_talents"."user_roles"
    ADD CONSTRAINT "user_roles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "young_talents"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activity_areas_name" ON "young_talents"."activity_areas" USING "btree" ("name");



CREATE INDEX "idx_activity_log_created_at" ON "young_talents"."activity_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_activity_log_entity" ON "young_talents"."activity_log" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_activity_log_user" ON "young_talents"."activity_log" USING "btree" ("user_email");



CREATE INDEX "idx_applications_candidate_id" ON "young_talents"."applications" USING "btree" ("candidate_id");



CREATE INDEX "idx_applications_job_id" ON "young_talents"."applications" USING "btree" ("job_id");



CREATE INDEX "idx_applications_status" ON "young_talents"."applications" USING "btree" ("status");



CREATE INDEX "idx_candidates_city" ON "young_talents"."candidates" USING "btree" ("city");



CREATE INDEX "idx_candidates_created_at" ON "young_talents"."candidates" USING "btree" ("created_at");



CREATE INDEX "idx_candidates_deleted_at" ON "young_talents"."candidates" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_candidates_email" ON "young_talents"."candidates" USING "btree" ("email");



CREATE INDEX "idx_candidates_email_created_at" ON "young_talents"."candidates" USING "btree" ("email", "created_at" DESC);



CREATE INDEX "idx_candidates_status" ON "young_talents"."candidates" USING "btree" ("status");



CREATE INDEX "idx_cities_name" ON "young_talents"."cities" USING "btree" ("name");



CREATE INDEX "idx_companies_name" ON "young_talents"."companies" USING "btree" ("name");



CREATE INDEX "idx_job_levels_name" ON "young_talents"."job_levels" USING "btree" ("name");



CREATE INDEX "idx_jobs_company" ON "young_talents"."jobs" USING "btree" ("company");



CREATE INDEX "idx_jobs_created_at" ON "young_talents"."jobs" USING "btree" ("created_at");



CREATE INDEX "idx_jobs_status" ON "young_talents"."jobs" USING "btree" ("status");



CREATE INDEX "idx_positions_activity_area_id" ON "young_talents"."positions" USING "btree" ("activity_area_id");



CREATE INDEX "idx_positions_level_id" ON "young_talents"."positions" USING "btree" ("level_id");



CREATE INDEX "idx_positions_name" ON "young_talents"."positions" USING "btree" ("name");



CREATE INDEX "idx_sectors_name" ON "young_talents"."sectors" USING "btree" ("name");



CREATE INDEX "idx_user_roles_email" ON "young_talents"."user_roles" USING "btree" ("email");



CREATE INDEX "idx_user_roles_role" ON "young_talents"."user_roles" USING "btree" ("role");



CREATE INDEX "idx_user_roles_user_id" ON "young_talents"."user_roles" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_activity_areas_updated_at" BEFORE UPDATE ON "young_talents"."activity_areas" FOR EACH ROW EXECUTE FUNCTION "young_talents"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_candidates_updated_at" BEFORE UPDATE ON "young_talents"."candidates" FOR EACH ROW EXECUTE FUNCTION "young_talents"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_cities_updated_at" BEFORE UPDATE ON "young_talents"."cities" FOR EACH ROW EXECUTE FUNCTION "young_talents"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_companies_updated_at" BEFORE UPDATE ON "young_talents"."companies" FOR EACH ROW EXECUTE FUNCTION "young_talents"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_job_levels_updated_at" BEFORE UPDATE ON "young_talents"."job_levels" FOR EACH ROW EXECUTE FUNCTION "young_talents"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_jobs_updated_at" BEFORE UPDATE ON "young_talents"."jobs" FOR EACH ROW EXECUTE FUNCTION "young_talents"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_positions_updated_at" BEFORE UPDATE ON "young_talents"."positions" FOR EACH ROW EXECUTE FUNCTION "young_talents"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sectors_updated_at" BEFORE UPDATE ON "young_talents"."sectors" FOR EACH ROW EXECUTE FUNCTION "young_talents"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_roles_updated_at" BEFORE UPDATE ON "young_talents"."user_roles" FOR EACH ROW EXECUTE FUNCTION "young_talents"."update_updated_at_column"();



ALTER TABLE ONLY "young_talents"."activity_log"
    ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "young_talents"."applications"
    ADD CONSTRAINT "applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "young_talents"."candidates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "young_talents"."applications"
    ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "young_talents"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "young_talents"."positions"
    ADD CONSTRAINT "positions_activity_area_id_fkey" FOREIGN KEY ("activity_area_id") REFERENCES "young_talents"."activity_areas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "young_talents"."positions"
    ADD CONSTRAINT "positions_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "young_talents"."job_levels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "young_talents"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin e editor podem atualizar activity_areas" ON "young_talents"."activity_areas" FOR UPDATE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin e editor podem atualizar candidatos" ON "young_talents"."candidates" FOR UPDATE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin e editor podem atualizar cities" ON "young_talents"."cities" FOR UPDATE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin e editor podem atualizar companies" ON "young_talents"."companies" FOR UPDATE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin e editor podem atualizar job_levels" ON "young_talents"."job_levels" FOR UPDATE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin e editor podem atualizar jobs" ON "young_talents"."jobs" FOR UPDATE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin e editor podem atualizar positions" ON "young_talents"."positions" FOR UPDATE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin e editor podem atualizar sectors" ON "young_talents"."sectors" FOR UPDATE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin e editor podem gerenciar aplicações (Insert)" ON "young_talents"."applications" FOR INSERT TO "authenticated" WITH CHECK (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin e editor podem gerenciar aplicações (Update)" ON "young_talents"."applications" FOR UPDATE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin e editor podem inserir activity_areas" ON "young_talents"."activity_areas" FOR INSERT TO "authenticated" WITH CHECK (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin e editor podem inserir candidatos" ON "young_talents"."candidates" FOR INSERT TO "authenticated" WITH CHECK (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin e editor podem inserir cities" ON "young_talents"."cities" FOR INSERT TO "authenticated" WITH CHECK (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin e editor podem inserir companies" ON "young_talents"."companies" FOR INSERT TO "authenticated" WITH CHECK (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin e editor podem inserir job_levels" ON "young_talents"."job_levels" FOR INSERT TO "authenticated" WITH CHECK (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin e editor podem inserir jobs" ON "young_talents"."jobs" FOR INSERT TO "authenticated" WITH CHECK (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin e editor podem inserir positions" ON "young_talents"."positions" FOR INSERT TO "authenticated" WITH CHECK (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin e editor podem inserir sectors" ON "young_talents"."sectors" FOR INSERT TO "authenticated" WITH CHECK (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])))))));



CREATE POLICY "Admin pode ler activity_log" ON "young_talents"."activity_log" FOR SELECT TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text"))))));



CREATE POLICY "Admin pode ler todos os roles" ON "young_talents"."user_roles" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "young_talents"."is_admin"() OR "young_talents"."is_developer"()));



CREATE POLICY "Apenas admin pode atualizar roles" ON "young_talents"."user_roles" FOR UPDATE TO "authenticated" USING (("young_talents"."is_admin"() OR "young_talents"."is_developer"()));



CREATE POLICY "Apenas admin pode deletar activity_areas" ON "young_talents"."activity_areas" FOR DELETE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"text"))))));



CREATE POLICY "Apenas admin pode deletar aplicações" ON "young_talents"."applications" FOR DELETE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"text"))))));



CREATE POLICY "Apenas admin pode deletar candidatos" ON "young_talents"."candidates" FOR DELETE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"text"))))));



CREATE POLICY "Apenas admin pode deletar cities" ON "young_talents"."cities" FOR DELETE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"text"))))));



CREATE POLICY "Apenas admin pode deletar companies" ON "young_talents"."companies" FOR DELETE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"text"))))));



CREATE POLICY "Apenas admin pode deletar job_levels" ON "young_talents"."job_levels" FOR DELETE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"text"))))));



CREATE POLICY "Apenas admin pode deletar jobs" ON "young_talents"."jobs" FOR DELETE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"text"))))));



CREATE POLICY "Apenas admin pode deletar positions" ON "young_talents"."positions" FOR DELETE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"text"))))));



CREATE POLICY "Apenas admin pode deletar roles" ON "young_talents"."user_roles" FOR DELETE TO "authenticated" USING (("young_talents"."is_admin"() OR "young_talents"."is_developer"()));



CREATE POLICY "Apenas admin pode deletar sectors" ON "young_talents"."sectors" FOR DELETE TO "authenticated" USING (("young_talents"."is_developer"() OR (EXISTS ( SELECT 1
   FROM "young_talents"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"text"))))));



CREATE POLICY "Apenas admin pode inserir roles" ON "young_talents"."user_roles" FOR INSERT TO "authenticated" WITH CHECK (("young_talents"."is_admin"() OR "young_talents"."is_developer"()));



CREATE POLICY "Autenticado pode inserir activity_log" ON "young_talents"."activity_log" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated read activity_areas" ON "young_talents"."activity_areas" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated read applications" ON "young_talents"."applications" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated read cities" ON "young_talents"."cities" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated read companies" ON "young_talents"."companies" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated read job_levels" ON "young_talents"."job_levels" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated read jobs" ON "young_talents"."jobs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated read positions" ON "young_talents"."positions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated read sectors" ON "young_talents"."sectors" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Dev 6d3c9cde DELETE activity_areas" ON "young_talents"."activity_areas" FOR DELETE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde DELETE applications" ON "young_talents"."applications" FOR DELETE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde DELETE candidates" ON "young_talents"."candidates" FOR DELETE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde DELETE cities" ON "young_talents"."cities" FOR DELETE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde DELETE companies" ON "young_talents"."companies" FOR DELETE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde DELETE job_levels" ON "young_talents"."job_levels" FOR DELETE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde DELETE jobs" ON "young_talents"."jobs" FOR DELETE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde DELETE positions" ON "young_talents"."positions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde DELETE sectors" ON "young_talents"."sectors" FOR DELETE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde DELETE user_roles" ON "young_talents"."user_roles" FOR DELETE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde INSERT activity_areas" ON "young_talents"."activity_areas" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde INSERT applications" ON "young_talents"."applications" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde INSERT candidates" ON "young_talents"."candidates" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde INSERT cities" ON "young_talents"."cities" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde INSERT companies" ON "young_talents"."companies" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde INSERT job_levels" ON "young_talents"."job_levels" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde INSERT jobs" ON "young_talents"."jobs" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde INSERT positions" ON "young_talents"."positions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde INSERT sectors" ON "young_talents"."sectors" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde INSERT user_roles" ON "young_talents"."user_roles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde SELECT activity_log" ON "young_talents"."activity_log" FOR SELECT TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde SELECT user_roles" ON "young_talents"."user_roles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde UPDATE activity_areas" ON "young_talents"."activity_areas" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde UPDATE applications" ON "young_talents"."applications" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde UPDATE candidates" ON "young_talents"."candidates" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde UPDATE cities" ON "young_talents"."cities" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde UPDATE companies" ON "young_talents"."companies" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde UPDATE job_levels" ON "young_talents"."job_levels" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde UPDATE jobs" ON "young_talents"."jobs" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde UPDATE positions" ON "young_talents"."positions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde UPDATE sectors" ON "young_talents"."sectors" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Dev 6d3c9cde UPDATE user_roles" ON "young_talents"."user_roles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::"uuid"));



CREATE POLICY "Formulário público pode inserir candidatos" ON "young_talents"."candidates" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Usuários autenticados podem ler candidatos" ON "young_talents"."candidates" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Usuários podem ler seu próprio role" ON "young_talents"."user_roles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "young_talents"."activity_areas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "young_talents"."activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "young_talents"."applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "young_talents"."candidates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "young_talents"."cities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "young_talents"."companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "young_talents"."job_levels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "young_talents"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "young_talents"."positions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "young_talents"."sectors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "young_talents"."user_roles" ENABLE ROW LEVEL SECURITY;


GRANT ALL ON SCHEMA "young_talents" TO "authenticated";
GRANT USAGE ON SCHEMA "young_talents" TO "anon";
GRANT USAGE ON SCHEMA "young_talents" TO "service_role";



GRANT ALL ON FUNCTION "young_talents"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "young_talents"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "young_talents"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "young_talents"."is_developer"() TO "anon";
GRANT ALL ON FUNCTION "young_talents"."is_developer"() TO "authenticated";
GRANT ALL ON FUNCTION "young_talents"."is_developer"() TO "service_role";



GRANT ALL ON FUNCTION "young_talents"."sync_user_role_on_login"() TO "anon";
GRANT ALL ON FUNCTION "young_talents"."sync_user_role_on_login"() TO "authenticated";
GRANT ALL ON FUNCTION "young_talents"."sync_user_role_on_login"() TO "service_role";



GRANT ALL ON FUNCTION "young_talents"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "young_talents"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "young_talents"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "young_talents"."activity_log" TO "anon";
GRANT ALL ON TABLE "young_talents"."activity_log" TO "authenticated";
GRANT ALL ON TABLE "young_talents"."activity_log" TO "service_role";



GRANT ALL ON TABLE "young_talents"."candidates" TO "anon";
GRANT ALL ON TABLE "young_talents"."candidates" TO "authenticated";
GRANT ALL ON TABLE "young_talents"."candidates" TO "service_role";



GRANT ALL ON TABLE "young_talents"."user_roles" TO "anon";
GRANT ALL ON TABLE "young_talents"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "young_talents"."user_roles" TO "service_role";



GRANT ALL ON TABLE "young_talents"."activity_areas" TO "anon";
GRANT ALL ON TABLE "young_talents"."activity_areas" TO "authenticated";
GRANT ALL ON TABLE "young_talents"."activity_areas" TO "service_role";



GRANT ALL ON TABLE "young_talents"."applications" TO "anon";
GRANT ALL ON TABLE "young_talents"."applications" TO "authenticated";
GRANT ALL ON TABLE "young_talents"."applications" TO "service_role";



GRANT ALL ON TABLE "young_talents"."cities" TO "anon";
GRANT ALL ON TABLE "young_talents"."cities" TO "authenticated";
GRANT ALL ON TABLE "young_talents"."cities" TO "service_role";



GRANT ALL ON TABLE "young_talents"."companies" TO "anon";
GRANT ALL ON TABLE "young_talents"."companies" TO "authenticated";
GRANT ALL ON TABLE "young_talents"."companies" TO "service_role";



GRANT ALL ON TABLE "young_talents"."job_levels" TO "anon";
GRANT ALL ON TABLE "young_talents"."job_levels" TO "authenticated";
GRANT ALL ON TABLE "young_talents"."job_levels" TO "service_role";



GRANT ALL ON TABLE "young_talents"."jobs" TO "anon";
GRANT ALL ON TABLE "young_talents"."jobs" TO "authenticated";
GRANT ALL ON TABLE "young_talents"."jobs" TO "service_role";



GRANT ALL ON TABLE "young_talents"."positions" TO "anon";
GRANT ALL ON TABLE "young_talents"."positions" TO "authenticated";
GRANT ALL ON TABLE "young_talents"."positions" TO "service_role";



GRANT ALL ON TABLE "young_talents"."sectors" TO "anon";
GRANT ALL ON TABLE "young_talents"."sectors" TO "authenticated";
GRANT ALL ON TABLE "young_talents"."sectors" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "young_talents" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "young_talents" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "young_talents" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "young_talents" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "young_talents" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "young_talents" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "young_talents" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "young_talents" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "young_talents" GRANT ALL ON TABLES TO "service_role";




