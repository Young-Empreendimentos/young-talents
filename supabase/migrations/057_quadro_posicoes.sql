-- 057: posições do quadro para a visão "Quadro" da página de Mapeamentos
--
-- O Pilares tem o mapa de sucessão por posição (função + equipe + cidade). O
-- Talents ganha uma visão parecida, mas SÓ do funil externo: quais posições
-- existem hoje e quem está mapeado para cada uma. Por isso esta função devolve
-- apenas a estrutura — função, equipe, cidade, quantas pessoas, se é vaga —
-- e nada da sucessão interna (sucessores indicados, aprovações, cobertura,
-- nomes de ocupantes), que é restrita a admin/coordenador do Pilares.
--
-- Posições individuais do Pilares voltam a ser agregadas na posição base (o
-- "titular" revelaria quem tem mapeamento próprio). Só entram as que exigem
-- mapeamento (configuração do admin no Pilares).
--
-- Depende do Pilares: rh.rh_mapa_cobertura_calc (migration 20261001160000).

create or replace function public.talents_quadro_posicoes()
returns table (
  funcao_id uuid, funcao text, trilha text, equipe_id uuid, equipe text,
  cidade_ibge integer, cidade text, pessoas int, vaga boolean
)
language sql
stable
security definer
set search_path = rh, public
as $$
  select c.funcao_id, c.funcao, c.trilha, c.equipe_id, c.equipe, c.cidade_ibge, c.cidade,
         sum(jsonb_array_length(c.ocupantes))::int as pessoas,
         bool_and(c.vaga) as vaga
    from rh.rh_mapa_cobertura_calc() c
   where c.exige and public.talents_has_staff_access()
   group by 1, 2, 3, 4, 5, 6, 7
   order by 5, 2, 7;
$$;

revoke execute on function public.talents_quadro_posicoes() from public, anon;
grant  execute on function public.talents_quadro_posicoes() to authenticated;
