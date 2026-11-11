-- ============================================================================
-- Histórico de WhatsApp dentro do candidato (Talents).
-- Fonte: caixa "Administrativo" (Adm) do Chatwoot, inbox 10, espelhada em
-- chatwoot.mensagens_adm (é por onde a Carla/RH fala com os candidatos).
-- Confirmado em 2026-11-11: 123/178 pares candidato×contato têm o 1º nome do
-- candidato no nome do contato do WhatsApp; cobertura de 21/09/2026 em diante.
--
-- Acesso: a tabela chatwoot.* tem RLS e o recrutador do Talents NÃO é staff do
-- Chatwoot/CRM, então a leitura é por RPC SECURITY DEFINER (igual ao padrão do
-- Destrava), com trava talents_has_staff_access(). A RPC recebe o ID DO
-- CANDIDATO (não um número livre) -> o recrutador só vê o WhatsApp de candidatos
-- reais, nunca "pesca" conversas administrativas de terceiros pelo número.
-- Casamento de telefone ciente de DDD e tolerante ao 9 do celular / 55 do país.
-- Aplicada em produção em 2026-11-11.
-- ============================================================================

-- Chave de telefone: tira o 55 do país (se houver) e devolve DDD(2) + 8 últimos
-- dígitos. Assim "+55 51 99940-5733", "5551999405733" e "51999405733" batem; e
-- o 9 do celular não atrapalha (fica fora dos 8 finais). Sem DDD utilizável = null.
create or replace function public._talents_fone_key(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when length(nd) >= 10 then left(nd, 2) || right(nd, 8) else null end
  from (
    select case when length(x) >= 12 and left(x, 2) = '55' then substr(x, 3) else x end as nd
    from (select regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g') as x) a
  ) b;
$$;

revoke all on function public._talents_fone_key(text) from public;
grant execute on function public._talents_fone_key(text) to authenticated, service_role;

-- Devolve as mensagens de WhatsApp (caixa Adm) do candidato, em ordem cronológica.
-- Exclui nota interna (direcao='nota'). anexos vem como jsonb (link p/ Chatwoot).
create or replace function public.talents_whatsapp_candidato(
  p_candidate_id uuid,
  p_limite int default 1000
)
returns table (
  id              bigint,
  direcao         text,
  origem          text,
  autor           text,
  contato_nome    text,
  conteudo        text,
  tipo            text,
  anexos          jsonb,
  status_conversa text,
  msg_em          timestamptz,
  conversation_id bigint
)
language plpgsql
security definer
set search_path = chatwoot, rh, public
as $$
declare
  v_fone text;
  v_key  text;
begin
  if not public.talents_has_staff_access() then
    raise exception 'Sem acesso' using errcode = '42501';
  end if;

  select c.phone into v_fone
  from rh.talents_candidates c
  where c.id = p_candidate_id and c.deleted_at is null;

  if v_fone is null then return; end if;

  v_key := public._talents_fone_key(v_fone);
  if v_key is null then return; end if;

  return query
    select m.id, m.direcao, m.origem, m.autor, m.contato_nome,
           m.conteudo, m.tipo, m.anexos, m.status_conversa, m.msg_em, m.conversation_id
    from chatwoot.mensagens_adm m
    where m.direcao <> 'nota'
      and public._talents_fone_key(m.telefone) = v_key
    order by m.msg_em asc
    limit greatest(1, least(coalesce(p_limite, 1000), 2000));
end;
$$;

revoke all on function public.talents_whatsapp_candidato(uuid, int) from public;
grant execute on function public.talents_whatsapp_candidato(uuid, int) to authenticated, service_role;
