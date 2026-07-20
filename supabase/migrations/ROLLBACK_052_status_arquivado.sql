-- ============================================================================
-- ROLLBACK da 052. Restaura os status terminais originais dos 38 candidatos
-- migrados em 2026-07-20. Reprovado e Descartado colapsaram no mesmo motivo
-- ("Contratamos outro candidato"), então a distinção é restaurada por ID.
-- Só cobre os registros migrados naquela data; arquivamentos feitos depois
-- não são revertidos por este script.
-- ============================================================================

UPDATE public.talents_candidates SET status='Contratado',       motivo_arquivamento=NULL
 WHERE status='Arquivado' AND motivo_arquivamento='Contratado';
UPDATE public.talents_candidates SET status='Selecionado',      motivo_arquivamento=NULL
 WHERE status='Arquivado' AND motivo_arquivamento='Selecionado';
UPDATE public.talents_candidates SET status='Desistiu da vaga', motivo_arquivamento=NULL
 WHERE status='Arquivado' AND motivo_arquivamento='Desistiu da vaga';

-- Reprovado (16 ids)
UPDATE public.talents_candidates SET status='Reprovado', motivo_arquivamento=NULL
 WHERE id IN (
   '09279577-084d-45d7-b75d-037b3eba62ba','0ee49a7e-d2df-4e73-b5c7-8b528647a194',
   '149a0984-3c1b-4c7b-953a-5bf47182ce13','2b7c9f6d-cad1-44d1-9246-aa7c3c02cbcc',
   '4a7f91b8-a292-45c5-8ff5-ba368c332461','51903d9b-3063-4732-91fc-bdd6c59d7f3d',
   '61e7a4d6-9703-40b4-9e3d-453e0b3be77a','636fc714-e765-49dd-941d-5d4f486b5bf1',
   '80e31bd9-919b-4898-8d3f-1ec4fc8a097b','92985fe4-609e-47d0-8c41-5f9f1cfdf890',
   '98c6abac-bc7f-439a-a1e7-ea77a0c0a3e5','b34a3e54-f705-4a3c-9b03-503dadc11da6',
   'b4fb8ab2-bfd4-493b-aacb-589a7a68be96','c47712c1-a18f-4721-a526-e8b2c347b52f',
   'f0722047-37d2-4343-9724-252ea41bf319','fd9a6bb8-2d9d-49bd-96ef-a831bac8d1d6'
 );

-- Descartado (9 ids)
UPDATE public.talents_candidates SET status='Descartado', motivo_arquivamento=NULL
 WHERE id IN (
   '06f337ea-c083-4b69-be6a-2ccb946b7575','188412cf-21be-443a-8b82-3452136f2c65',
   '49ff0616-5825-48b0-a8f1-556993ada4fa','51935ace-e2d8-430f-a57e-6f63a8a156fd',
   '6320ce7e-484e-44cd-9e5a-080f64d7acba','8f683412-a40f-40e5-aca6-d36aae9001d8',
   'b4a9f211-6938-4d1f-a1d9-2436acb891cb','c8a1b9b5-d168-4b90-9d1c-e0473ec14a5a',
   'fe26ad09-197f-44d5-a887-c34edf4d4847'
 );
