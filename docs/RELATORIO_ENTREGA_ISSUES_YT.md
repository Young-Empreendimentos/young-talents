# Relatório de entrega – Issues YT-01 a YT-12

Resumo do que foi implementado conforme o [plano](futuras-melhorias/ISSUES_CARLA_ATS_2026.md) e as migrations/scripts do repositório.

---

## Fase 0 – Gestores Young (editor)

- **Migrations:** `032_promote_young_gestores_to_editor.sql`, `034_ensure_young_gestores_editor_yt08.sql` — garantem `role = 'editor'` para: carla@, eduardo@, suelen@, antonio@, matheus@youngempreendimentos.com.br.
- **Script:** `scripts/add-roles-to-existing-users.js` — mapeamento editor/admin; executar com `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
- **Validação:** `node scripts/check-user-roles.js` lista roles em `user_roles` (public e young_talents).

---

## Fase 1 – YT-08, YT-10, YT-12 (permissões e UI)

- **YT-08 (cadastrar empreendimentos):** RLS em `023_fix_rls_vulnerabilities.sql` e `024_rls_full_access_developer.sql` — INSERT/UPDATE em `companies` para admin/editor; gestores com editor (032/034).
- **YT-10 (vincular candidato à vaga):** `035_sync_user_roles_user_id_and_application_access_yt10.sql` — função `is_editor_or_admin()` e políticas de INSERT/UPDATE em `applications` por user_id ou email no JWT.
- **YT-12 (atualizar status da vaga):** RLS permite UPDATE em `jobs` para admin/editor; `JobModal.jsx` exibe select de status (`JOB_STATUSES`: Aberta, Preenchida, Cancelada, Fechada) e persiste via `onSave`.

---

## Fase 2 – YT-02 (sincronizar pipeline ↔ candidatura)

- Em `App.jsx`, `handleSaveGeneric`: ao salvar candidato (incl. mudança de etapa), atualiza `applications.status` e `last_activity` para todas as linhas do `candidate_id` em `young_talents.applications`.
- Garante que a aba Candidaturas reflita o mesmo status do pipeline.

---

## Fase 3 – YT-09, YT-11

- **YT-09 (Vaga pausada):** `constants.js` — `PIPELINE_STAGES` inclui "Vaga pausada"; `STAGE_REQUIRED_FIELDS`, `STATUS_COLORS` e `STAGES_REQUIRING_APPLICATION` atualizados; `TransitionModal` e Pipeline tratam a etapa.
- **YT-11 (Desistência sem retorno obrigatório):** `TransitionModal.jsx` — para conclusão "Desistiu da vaga" não exige `returnSent`; motivo/feedback registrado em `rejection_reason`/feedback.

---

## Fase 4 – YT-03, YT-01

- **YT-03 (manter filtro ao voltar do perfil):** `App.jsx` — `prevPathnameRef` e `useEffect` em `location.pathname`: não zera filtros ao abrir `/candidate/:id`; ao voltar do perfil para listagem, filtros são preservados.
- **YT-01 (filtros idade e dados do formulário):** `FilterSidebar.jsx` — filtro por idade (mín/máx) com inputs numéricos; `filteredCandidates` em `App.jsx` usa `getCandidateAge()` e `ageMin`/`ageMax`; filtros por cidade, área de interesse, escolaridade, fonte, estado civil e CNH já disponíveis em "Filtros de Candidato".

---

## Fase 5 – YT-07 (CNH e dados no perfil)

- **OverviewTab:** bloco "Informações de Contato" inclui CNH (tipo B), idade (calculada), e "Dados da inscrição" (áreas, escolaridade, pretensão salarial, disponibilidade mudança).
- **PersonalTab:** CNH editável (Sim/Não), data de nascimento, idade, estado civil, filhos; demais campos do formulário nas abas Experiência, Formação, Processo e Admin.

---

## Fase 6–7 – YT-04, YT-05, YT-06

- **YT-04 (foto e currículo):** `LinkStatusBadge.jsx` e `useLinkStatus.js` — textos indicam "link indisponível ou bloqueado / verifique acesso ao Drive/link", sem menção a "autorização do candidato"; links de foto e CV sempre exibidos para usuários autenticados. Plano jurídico/termos: `docs/futuras-melhorias/YT-04_PLANO_FOTO_CV_RECRUTADOR.md`.
- **YT-05 (quem solicitou abertura da vaga):** `033_add_requested_by_user_id_to_jobs.sql` — coluna `requested_by_user_id` e trigger no INSERT; `JobModal.jsx` exibe "Quem solicitou" quando existir; `fromSupabase.js` mapeia `requestedByUserId`.
- **YT-06 (migração banco antigo):** `docs/MIGRACAO_BANCO_TALENTOS_ANTIGO.md` e `docs/IMPORTAR_CSV_APPEND_FEV_2026.md` — fluxo de export/import; scripts `import-candidates-from-csv.js` e `import-candidates-append-only.js` para carga por CSV (append-only por e-mail).

---

## Segurança (RLS e auth)

- `037_restrict_read_to_staff_roles.sql`: SELECT em candidatos, applications, empresas, cidades, vagas etc. restrito a quem tem papel em `user_roles` (admin/editor/viewer) via `has_staff_access()`.
- `038_sync_user_role_on_login_no_auto_viewer.sql`: trigger de login apenas sincroniza user_id/name/photo quando já existe linha em `user_roles`; não cria viewer automático para novos logins.
- Frontend: fallback de role em `App.jsx` alterado de `'admin'` para `'viewer'` quando não houver linha em `user_roles`.

Para fechar as issues no GitHub, vincule este relatório e os PRs/migrations correspondentes.
