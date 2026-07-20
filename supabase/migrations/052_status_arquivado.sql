-- ============================================================================
-- Junta os status terminais em um único 'Arquivado' + campo motivo_arquivamento.
-- Selecionado/Contratado/Reprovado/Descartado/Desistiu da vaga -> 'Arquivado'.
-- O "porquê" vai em motivo_arquivamento (ver ARCHIVE_REASONS no front).
--
-- Mapa: Contratado->Contratado, Selecionado->Selecionado,
--       Desistiu da vaga->Desistiu da vaga,
--       Reprovado/Descartado->Contratamos outro candidato.
--
-- `status` é texto livre (sem constraint), então não há enum a alterar.
-- Aplicada em produção em 2026-07-20. Rollback: ROLLBACK_052_status_arquivado.sql.
-- ============================================================================

ALTER TABLE public.talents_candidates
  ADD COLUMN IF NOT EXISTS motivo_arquivamento text;

UPDATE public.talents_candidates
SET motivo_arquivamento = CASE status
      WHEN 'Contratado'       THEN 'Contratado'
      WHEN 'Selecionado'      THEN 'Selecionado'
      WHEN 'Desistiu da vaga' THEN 'Desistiu da vaga'
      WHEN 'Reprovado'        THEN 'Contratamos outro candidato'
      WHEN 'Descartado'       THEN 'Contratamos outro candidato'
    END,
    status = 'Arquivado',
    updated_at = now()
WHERE status IN ('Contratado','Selecionado','Reprovado','Descartado','Desistiu da vaga');
