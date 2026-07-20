-- ============================================================================
-- Mapeamento do Talents passa a usar os CARGOS DO PILARES (rh_cargos) como
-- fonte, em vez dos talents_positions proprios. "Unir cargos para mapeamento".
--
-- 1) RPC talents_list_cargos(): expoe os cargos do Pilares para o Talents.
--    rh_cargos tem RLS exigindo rh_is_staff(), o que bloqueia recrutadores do
--    Talents; por isso a leitura vai por uma funcao SECURITY DEFINER, gateada
--    para staff do Talents (talents_has_staff_access()). Devolve so id + nome +
--    trilha (SEM remuneracao). O front agrupa por trilha e mostra so o nome.
-- 2) Remove a FK talents_mappings_position_id_fkey: o position_id passa a
--    guardar o id do cargo do Pilares (rh_cargos.id). O position_name (texto)
--    continua sendo o registro duravel usado na tela. Nao altera dados; os
--    mapeamentos existentes continuam intactos. Reversivel.
--
-- Aplicada em producao em 2026-07-20.
-- ============================================================================

-- 1) Catalogo de cargos do Pilares para o Talents ----------------------------
CREATE OR REPLACE FUNCTION public.talents_list_cargos()
RETURNS TABLE (id uuid, nome text, trilha text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.id, c.nome, t.nome AS trilha
  FROM public.rh_cargos c
  LEFT JOIN public.rh_trilhas_cargo t ON t.id = c.trilha_id
  WHERE public.talents_has_staff_access()
  ORDER BY t.nome NULLS LAST, c.nome;
$$;

REVOKE EXECUTE ON FUNCTION public.talents_list_cargos() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.talents_list_cargos() TO authenticated;

-- 2) Solta a FK para talents_positions (position_id agora referencia o Pilares)
ALTER TABLE public.talents_mappings
  DROP CONSTRAINT IF EXISTS talents_mappings_position_id_fkey;
