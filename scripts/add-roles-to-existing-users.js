/**
 * Script para adicionar roles na tabela young_talents.user_roles
 * para usuários que já existem no Supabase Auth
 *
 * Execute: node scripts/add-roles-to-existing-users.js
 *
 * Edite o array `userRoles` abaixo com os e-mails do **seu** ambiente
 * ou adapte para ler de um JSON local (não versionado), como `users-setup.local.json`.
 * Não commite e-mails reais de produção neste repositório.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envLocalPath = join(__dirname, '..', '.env.local');
const envPath = join(__dirname, '..', '.env');

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log('📁 Carregando variáveis de .env.local');
} else if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('📁 Carregando variáveis de .env');
} else {
  dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas.');
  console.error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/** Preencha apenas localmente (ex.: admin@suaempresa.com). Deixe vazio no Git. */
const userRoles = [
  // { email: 'admin@example.com', role: 'admin', name: 'Administrador' },
];

async function addRoleToUser(userEmail, roleData) {
  try {
    console.log(`\n📧 Processando: ${userEmail}...`);

    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Erro ao listar usuários: ${listError.message}`);
    }

    const user = usersData?.users?.find(u => u.email === userEmail);

    if (!user) {
      console.log(`⚠️  Usuário ${userEmail} não encontrado no Supabase Auth`);
      return { success: false, reason: 'Usuário não encontrado' };
    }

    console.log(`   ✅ Usuário encontrado: ${user.id}`);

    const { data: byUserId, error: errUser } = await supabaseAdmin
      .schema('young_talents')
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (errUser && errUser.code !== 'PGRST116') throw errUser;

    const { data: byEmail, error: errEmail } = await supabaseAdmin
      .schema('young_talents')
      .from('user_roles')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();
    if (errEmail && errEmail.code !== 'PGRST116') throw errEmail;

    const existingRole = byUserId || byEmail;

    if (existingRole) {
      const { error: updateError } = await supabaseAdmin
        .schema('young_talents')
        .from('user_roles')
        .update({
          role: roleData.role,
          name: roleData.name,
          user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRole.id);

      if (updateError) throw updateError;
      console.log(`✅ Role atualizada para ${roleData.role}`);
    } else {
      const { error: insertError } = await supabaseAdmin
        .schema('young_talents')
        .from('user_roles')
        .insert([
          {
            user_id: user.id,
            email: userEmail,
            name: roleData.name,
            role: roleData.role,
            created_at: new Date().toISOString()
          }
        ]);

      if (insertError) throw insertError;
      console.log(`✅ Role ${roleData.role} criada`);
    }

    return { success: true };
  } catch (error) {
    console.error(`❌ Erro ao processar ${userEmail}:`, error.message);
    return { success: false, reason: error.message };
  }
}

async function main() {
  if (userRoles.length === 0) {
    console.error('❌ Nenhum usuário em userRoles.');
    console.error('Edite scripts/add-roles-to-existing-users.js localmente ou use scripts/setup-supabase-users.js + users-setup.local.json.');
    process.exit(1);
  }

  for (const u of userRoles) {
    await addRoleToUser(u.email, { role: u.role, name: u.name });
  }
  console.log('\n🎉 Concluído.');
}

main();
