/**
 * Importa apenas candidatos do CSV que AINDA NÃO ESTÃO no Supabase (validação por e-mail).
 * Ideal para subir um CSV parcial (ex.: fevereiro em diante) sem duplicar quem já foi importado.
 *
 * Uso:
 *   node scripts/import-candidates-append-only.js
 *   node scripts/import-candidates-append-only.js assets/candidates/candidates-202603.csv
 *
 * Env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (ou SUPABASE_URL, SUPABASE_ANON_KEY)
 * Opcional: CSV_PATH_APPEND=caminho/para/arquivo.csv
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

const DEFAULT_CSV = path.join(PROJECT_ROOT, 'assets', 'candidates', 'candidates-202603.csv');

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

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/** Busca todos os e-mails já presentes no Supabase (paginação). */
async function fetchExistingEmails(supabase) {
  const set = new Set();
  const PAGE = 1000;
  let from = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase
      .from('candidates')
      .select('email')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Erro ao listar e-mails: ${error.message}`);
    if (!data || data.length === 0) break;
    data.forEach(r => {
      if (r.email) set.add(normalizeEmail(r.email));
    });
    from += data.length;
    hasMore = data.length === PAGE;
  }
  return set;
}

async function main() {
  const csvPath = process.env.CSV_PATH_APPEND || process.argv[2] || DEFAULT_CSV;
  const resolvedPath = path.isAbsolute(csvPath) ? csvPath : path.resolve(PROJECT_ROOT, csvPath);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou SUPABASE_URL e SUPABASE_ANON_KEY).');
    process.exit(1);
  }
  if (!fs.existsSync(resolvedPath)) {
    console.error('Arquivo não encontrado:', resolvedPath);
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const projectRef = projectRefFromUrl(SUPABASE_URL);
  console.log('Conectado ao Supabase. Projeto:', projectRef);
  console.log('CSV:', resolvedPath);
  console.log('');

  console.log('Buscando e-mails já cadastrados no Supabase...');
  const existingEmails = await fetchExistingEmails(supabase);
  console.log('E-mails já no banco:', existingEmails.size);
  console.log('');

  console.log('Lendo CSV...');
  const records = await readCsvRows(resolvedPath);
  const physicalLines = fs.readFileSync(resolvedPath, 'utf8').split(/\r?\n/).length;
  console.log('Registros no CSV (linhas lógicas):', records.length, physicalLines > records.length ? `(${physicalLines} linhas físicas no arquivo — colunas com quebra de linha contam como 1 registro)` : '');

  const rowsWithEmail = records
    .map(r => toDbRow(r, normalizers))
    .filter(r => r.email);
  const toInsert = rowsWithEmail.filter(r => !existingEmails.has(normalizeEmail(r.email)));
  const alreadyInDb = rowsWithEmail.length - toInsert.length;

  console.log('Com e-mail válido:', rowsWithEmail.length);
  console.log('Já cadastrados (serão ignorados):', alreadyInDb);
  console.log('Novos a inserir:', toInsert.length);
  console.log('');

  if (toInsert.length === 0) {
    console.log('Nenhum registro novo para inserir.');
    return;
  }

  const BATCH = 100;
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < toInsert.length; i += BATCH) {
    const chunk = toInsert.slice(i, i + BATCH);
    const { error } = await supabase.from('candidates').insert(chunk);
    if (error) {
      console.error('Erro no lote:', error.message);
      for (const row of chunk) {
        const { error: oneErr } = await supabase.from('candidates').insert([row]);
        if (oneErr) {
          console.warn('Falha:', row.email, oneErr.message);
          failed++;
        } else inserted++;
      }
    } else {
      inserted += chunk.length;
    }
    if ((i + BATCH) % 500 === 0 || i + BATCH >= toInsert.length) {
      console.log('Inseridos', Math.min(i + BATCH, toInsert.length), '/', toInsert.length);
    }
  }

  console.log('');
  console.log('Concluído. Inseridos:', inserted, 'Falhas:', failed);

  if (inserted > 0) {
    const { count, error: countErr } = await supabase.from('candidates').select('*', { count: 'exact', head: true });
    if (!countErr) console.log('Total de candidatos no banco após importação:', count);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
