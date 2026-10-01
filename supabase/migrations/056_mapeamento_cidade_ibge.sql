-- 056: cidade do mapeamento de interesse estruturada (lista única do IBGE)
--
-- A cidade do mapeamento era texto livre ("Porto Alegre", "Porto Alegre/RS",
-- "Porto Alegre "). O mapa de sucessão do Pilares agora casa externos com
-- posições por função + equipe + CIDADE, e texto livre não casa. Passa a usar a
-- mesma lista do Pilares: rh.rh_municipios (código IBGE), migration
-- 20261001140000 do Pilares.
--
-- Mapeamento sem cidade vale para qualquer cidade da função (decisão de
-- 01/10/2026). A coluna city (texto) fica, preenchida com "Nome/UF", para quem
-- ainda a lê.

alter table rh.talents_mappings
  add column if not exists cidade_ibge integer references rh.rh_municipios(codigo_ibge);

comment on column rh.talents_mappings.cidade_ibge is
  'Cidade do mapeamento (IBGE). Vazia = qualquer cidade.';

-- Texto "Nome" ou "Nome/UF" → código. Sem UF, assume RS (onde a empresa atua).
with parsed as (
  select m.id,
         btrim(split_part(btrim(m.city), '/', 1)) as nome,
         upper(coalesce(nullif(btrim(split_part(btrim(m.city), '/', 2)), ''), 'RS')) as uf
    from rh.talents_mappings m
   where m.cidade_ibge is null and nullif(btrim(m.city), '') is not null
)
update rh.talents_mappings m
   set cidade_ibge = mu.codigo_ibge,
       city = mu.nome || '/' || mu.uf
  from parsed p
  join rh.rh_municipios mu
    on mu.uf = p.uf
   and mu.nome_busca = btrim(regexp_replace(replace(regexp_replace(lower(extensions.unaccent(p.nome)), '[''’]', '', 'g'), '-', ' '), '\s+', ' ', 'g'))
 where m.id = p.id;
