/**
 * Importa candidatos do CSV (assets/candidates/candidates.csv) para o Supabase.
 * Aplica normalização (cidade, fonte, áreas de interesse, filhos, foto Drive) antes de inserir.
 *
 * Uso: node scripts/import-candidates-from-csv.js
 * Env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (ou SUPABASE_URL, SUPABASE_ANON_KEY)
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { normalizeCity } from '../src/utils/cityNormalizer.js';
import { normalizeSource } from '../src/utils/sourceNormalizer.js';
import { normalizeInterestAreasString } from '../src/utils/interestAreaNormalizer.js';
import { normalizeChildrenForStorage } from '../src/utils/childrenNormalizer.js';
import { toDbRow, readCsvRows } from './lib/import-candidates-shared.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CSV_PATH = path.join(PROJECT_ROOT, 'assets', 'candidates', 'candidates.csv');

const envLocalPath = path.join(PROJECT_ROOT, '.env.local');
const envPath = path.join(PROJECT_ROOT, '.env');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const normalizers = { normalizeCity, normalizeSource, normalizeInterestAreasString, normalizeChildrenForStorage };

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function projectRefFromUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/\.supabase\.co$/, '') || url;
  } catch {
    return '(URL inválida)';
  }
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou SUPABASE_URL e SUPABASE_ANON_KEY).');
    process.exit(1);
  }
  if (!fs.existsSync(CSV_PATH)) {
    console.error('Arquivo não encontrado:', CSV_PATH);
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const projectRef = projectRefFromUrl(SUPABASE_URL);
  console.log('Conectado ao Supabase. Projeto:', projectRef);
  console.log('(Confira no dashboard se é o mesmo projeto: app.supabase.com → projeto → Settings → API)');
  console.log('');

  console.log('Lendo CSV...');
  const records = await readCsvRows(CSV_PATH);
  console.log('Linhas lidas:', records.length);

  const BATCH = 100;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i += BATCH) {
    const chunk = records.slice(i, i + BATCH);
    const rows = chunk
      .map(r => toDbRow(r, normalizers))
      .filter(r => r.email);
    if (rows.length === 0) continue;
    const { error } = await supabase.from('candidates').insert(rows);
    if (error) {
      if (error.code === '23505') {
        for (const row of rows) {
          const { error: oneErr } = await supabase.from('candidates').insert([row]);
          if (oneErr && oneErr.code === '23505') {
            console.warn('Skip (email duplicado):', row.email);
            skipped++;
          } else if (oneErr) {
            console.warn('Skip:', row.email, oneErr.message);
            skipped++;
          } else inserted++;
        }
      } else {
        console.error('Erro no lote:', error.message);
        skipped += rows.length;
      }
    } else {
      inserted += rows.length;
    }
    if ((i + BATCH) % 500 === 0 || i + BATCH >= records.length) {
      console.log('Processados', Math.min(i + BATCH, records.length), '/', records.length);
    }
  }

  console.log('Concluído. Inseridos/atualizados:', inserted, 'Ignorados/erro:', skipped);

  if (inserted > 0) {
    const { count, error: countErr } = await supabase.from('candidates').select('*', { count: 'exact', head: true });
    if (!countErr) {
      console.log('');
      console.log('Verificação no banco: total de candidatos =', count);
      const { data: lastRows } = await supabase.from('candidates').select('email, created_at').order('created_at', { ascending: false }).limit(3);
      if (lastRows?.length) {
        console.log('Últimos registros (confira no Table Editor do Supabase):');
        lastRows.forEach((r, i) => console.log('  ', i + 1, r.email, '|', r.created_at));
      }
      console.log('');
      console.log('Se esses dados NÃO aparecem no dashboard, você está olhando outro projeto.');
      console.log('No Supabase: Table Editor → schema "public" → tabela "candidates" (ou schema "young_talents" → "candidates").');
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
