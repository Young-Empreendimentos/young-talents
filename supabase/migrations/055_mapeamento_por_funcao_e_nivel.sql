-- 055: Mapeamento de interesse por FUNÇÃO, com equipe, texto livre e nível
--
-- Até aqui o mapeamento apontava para rh_cargos (position_id), que é função +
-- nível + pacote salarial: o seletor mostrava "Coordenador Administrativo" 7
-- vezes e "Consultor Comercial" 15. Para mapear um candidato externo o nível não
-- importa — o que importa é o papel.
--
-- Agora:
--   funcao_id     o papel (rh_funcoes), ex.: Assistente Administrativo
--   equipe_id     onde ele atuaria (rh_equipes), ex.: Suprimentos
--                 → "Assistente Administrativo · Suprimentos" = assistente de compras
--   especificacao texto livre, para o que a estrutura não cobre
--   nivel         interessante | forte
--
-- O nível máximo, "Alternativa externa", NÃO mora aqui: fica em
-- rh.rh_sucessao_externos (migration do Pilares 20260930120000), que só admin do
-- Pilares lê. Esta tabela é lida por todo o staff do Talents — inclusive
-- coordenadores que são titulares de planos de sucessão —, então marcar alguém
-- como alternativa aqui revelaria quem está cotado para substituí-los. Para eles,
-- a alternativa aparece como "forte".
--
-- A estrela ("mapeado como interesse", talents_candidates.starred) vira
-- mapeamento: era o mesmo conceito em dois lugares.
--
-- position_id / position_name / priority ficam por ora (expand/contract): o front
-- antigo, aberto em alguma aba durante o deploy, ainda grava position_id, e o
-- trigger abaixo deriva a função dele.

-- ---------------------------------------------------------------------------
-- 1. Colunas
-- ---------------------------------------------------------------------------
alter table rh.talents_mappings
  add column if not exists funcao_id uuid references rh.rh_funcoes(id) on delete set null,
  add column if not exists equipe_id uuid references rh.rh_equipes(id) on delete set null,
  add column if not exists especificacao text,
  add column if not exists nivel text not null default 'interessante';

alter table rh.talents_mappings drop constraint if exists talents_mappings_nivel_check;
alter table rh.talents_mappings add constraint talents_mappings_nivel_check
  check (nivel in ('interessante', 'forte'));

create index if not exists idx_talents_mappings_funcao on rh.talents_mappings(funcao_id);

comment on column rh.talents_mappings.funcao_id is 'Função (rh_funcoes) para a qual o candidato foi mapeado. Substitui position_id (rh_cargos = função + nível + pacote).';
comment on column rh.talents_mappings.equipe_id is 'Equipe onde atuaria (rh_equipes). Função + equipe especifica o papel: Assistente Administrativo · Suprimentos.';
comment on column rh.talents_mappings.especificacao is 'Texto livre para especificar o papel além de função/equipe.';
comment on column rh.talents_mappings.nivel is 'interessante | forte. O nível "alternativa externa" fica em rh.rh_sucessao_externos (só admin do Pilares).';

-- ---------------------------------------------------------------------------
-- 2. Dados existentes
-- ---------------------------------------------------------------------------
-- Função a partir do cargo já escolhido.
update rh.talents_mappings m
   set funcao_id = c.funcao_id
  from rh.rh_cargos c
 where c.id = m.position_id and m.funcao_id is null;

-- A prioridade "Alta" era, na prática, o "forte" de hoje.
update rh.talents_mappings set nivel = 'forte' where priority = 'Alta';

-- Estrela → mapeamento "interessante", sem função (fica "definir função").
-- Quem já tinha mapeamento não ganha outro.
insert into rh.talents_mappings (candidate_id, city, notes, nivel, status, priority, mapped_by_name)
select c.id,
       nullif(btrim(c.city), ''),
       'Convertido da estrela "mapeado como interesse" — defina a função.',
       'interessante', 'Ativo', 'Média', 'Conversão automática'
  from rh.talents_candidates c
 where c.starred
   and c.deleted_at is null
   and not exists (select 1 from rh.talents_mappings m where m.candidate_id = c.id);

-- ---------------------------------------------------------------------------
-- 3. Janela de deploy: front antigo grava position_id → deriva a função
-- ---------------------------------------------------------------------------
-- security definer: quem grava é staff do Talents, que não lê rh_cargos.
create or replace function rh.talents_mappings_funcao_do_cargo()
returns trigger
language plpgsql
security definer
set search_path = rh, public
as $$
begin
  if new.position_id is not null
     and ((tg_op = 'INSERT' and new.funcao_id is null)
          or (tg_op = 'UPDATE' and new.position_id is distinct from old.position_id)) then
    select c.funcao_id into new.funcao_id from rh.rh_cargos c where c.id = new.position_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_talents_mappings_funcao_do_cargo on rh.talents_mappings;
create trigger trg_talents_mappings_funcao_do_cargo
  before insert or update of position_id on rh.talents_mappings
  for each row execute function rh.talents_mappings_funcao_do_cargo();

-- ---------------------------------------------------------------------------
-- 4. Funções do Pilares para o seletor
-- ---------------------------------------------------------------------------
-- Mesmo motivo de talents_list_cargos: o RLS de rh_funcoes só libera o staff do
-- RH. Uma linha por função (19), não por cargo.
create or replace function public.talents_list_funcoes()
returns table(id uuid, nome text, trilha text)
language sql
stable
security definer
set search_path = rh, public
as $$
  select f.id, f.nome, t.nome as trilha
    from rh.rh_funcoes f
    left join rh.rh_trilhas_cargo t on t.id = f.trilha_id
   where public.talents_has_staff_access()
   order by t.nome nulls last, f.nome;
$$;

revoke execute on function public.talents_list_funcoes() from public, anon;
grant  execute on function public.talents_list_funcoes() to authenticated;

-- O Talents mostra o nível "Alternativa externa" só a quem administra a
-- sucessão (admin do Pilares) — não ao admin do Talents.
create or replace function public.talents_eh_admin_sucessao()
returns boolean
language sql
stable
security definer
set search_path = rh, public
as $$
  select public.rh_has_role(auth.uid(), 'admin'::rh_app_role);
$$;

revoke execute on function public.talents_eh_admin_sucessao() from public, anon;
grant  execute on function public.talents_eh_admin_sucessao() to authenticated;
