/**
 * Diagnóstico Supabase – testa conectividade e permissões com as credenciais do .env
 * Uso: node scripts/diagnostico-supabase.js
 * Env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (opcional: SUPABASE_SERVICE_ROLE_KEY)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const envLocalPath = path.join(PROJECT_ROOT, '.env.local');
const envPath = path.join(PROJECT_ROOT, '.env');
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });
else if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function maskUrl(url) {
  if (!url || typeof url !== 'string') return '(não definida)';
  try {
    const u = new URL(url);
    const host = u.hostname || '';
    if (host.includes('supabase')) return `${u.protocol}//${host.replace(/(.{8}).*(\.supabase\.co)$/, '$1...$2')}`;
    return `${u.protocol}//***`;
  } catch {
    return '(URL inválida)';
  }
}

async function run() {
  console.log('--- Diagnóstico Supabase (Young Talents) ---\n');

  if (!SUPABASE_URL || !ANON_KEY) {
    console.error('Erro: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env ou .env.local');
    process.exit(1);
  }

  console.log('URL (mascarada):', maskUrl(SUPABASE_URL));
  console.log('Service role configurada:', !!SERVICE_ROLE_KEY);
  console.log('');

  const supabase = createClient(SUPABASE_URL, ANON_KEY, { db: { schema: 'public' } });

  const results = { ok: [], fail: [] };

  // Teste 1: leitura user_roles no schema young_talents (anon – sem login)
  try {
    const { data, error } = await supabase.schema('young_talents').from('user_roles').select('id, user_id, email, role').limit(1);
    if (error) {
      results.fail.push({ teste: 'user_roles (anon, sem login)', erro: error.message, code: error.code });
    } else {
      results.ok.push({ teste: 'user_roles (anon, sem login)', rows: data?.length ?? 0 });
    }
  } catch (e) {
    results.fail.push({ teste: 'user_roles (anon, sem login)', erro: e.message });
  }

  // Teste 2: leitura companies (anon)
  try {
    const { data, error } = await supabase.schema('young_talents').from('companies').select('id, name').limit(1);
    if (error) {
      results.fail.push({ teste: 'companies (anon)', erro: error.message, code: error.code });
    } else {
      results.ok.push({ teste: 'companies (anon)', rows: data?.length ?? 0 });
    }
  } catch (e) {
    results.fail.push({ teste: 'companies (anon)', erro: e.message });
  }

  if (SERVICE_ROLE_KEY) {
    const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: 'public' } });
    try {
      const { data, error } = await serviceClient.schema('young_talents').from('user_roles').select('user_id, email, role').limit(5);
      if (error) {
        results.fail.push({ teste: 'user_roles (service_role)', erro: error.message, code: error.code });
      } else {
        results.ok.push({ teste: 'user_roles (service_role)', rows: data?.length ?? 0 });
      }
    } catch (e) {
      results.fail.push({ teste: 'user_roles (service_role)', erro: e.message });
    }
  }

  console.log('Resultados:');
  results.ok.forEach((r) => console.log('  OK:', r.teste, r.rows !== undefined ? `(${r.rows} linha(s))` : ''));
  results.fail.forEach((r) => {
    console.log('  FALHA:', r.teste);
    console.log('        ', r.code ? `[${r.code}] ` : '', r.erro);
  });

  if (results.fail.length > 0) {
    console.log('\nCopie as mensagens de FALHA acima para análise (ex.: RLS, schema não exposto).');
    process.exitCode = 1;
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
