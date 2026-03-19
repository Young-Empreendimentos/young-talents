-- ==============================================================================
-- SYNC USER_ROLES ON LOGIN (SEM CRIAR VIEWER AUTOMÁTICO)
-- ------------------------------------------------------------------------------
-- Objetivo: manter user_roles como lista controlada de acessos (admin/editor/viewer).
-- Antes: 017_sync_user_role_on_login criava um registro com role 'viewer' sempre
--        que um usuário logava sem linha pré-existente → qualquer novo login
--        ganhava acesso de visualização ao app interno.
-- Agora: a função APENAS sincroniza user_id/name/photo/last_login quando já
--        existe linha em young_talents.user_roles para aquele email.
--        Se não existir registro, o usuário continua sem acesso (RLS + frontend).
-- ==============================================================================

CREATE OR REPLACE FUNCTION young_talents.sync_user_role_on_login()
RETURNS TRIGGER AS $$
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
    -- Sem registro pré-cadastrado em user_roles:
    -- não criamos viewer automático; acesso continua bloqueado por RLS.
    RAISE NOTICE 'Nenhum user_role encontrado para %, nenhum registro criado (login sem acesso).', user_email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger permanece o mesmo, apenas a função foi atualizada
DROP TRIGGER IF EXISTS sync_user_role_trigger ON auth.users;
CREATE TRIGGER sync_user_role_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email IS NOT NULL)
  EXECUTE FUNCTION young_talents.sync_user_role_on_login();

-- Comentário explicativo atualizado
COMMENT ON FUNCTION young_talents.sync_user_role_on_login() IS 
  'Sincroniza automaticamente dados do usuário (user_id, name, photo, last_login) em user_roles quando já existe registro para o email. Não cria viewer automático para novos logins.';

