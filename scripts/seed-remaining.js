/**
 * seed-remaining.js
 * Insere candidates, applications e activity_log via Supabase JS client (HTTPS).
 * Seguro para rodar múltiplas vezes (upsert com ignoreDuplicates).
 *
 * Uso (PowerShell):
 *   $env:SUPABASE_SERVICE_KEY="eyJ..."
 *   node scripts/seed-remaining.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INSERTS_DIR = join(__dirname, '../backups/young_talents/inserts');

const SUPABASE_URL = 'https://vvtympzatclvjaqucebr.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ Defina SUPABASE_SERVICE_KEY antes de rodar.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Ordem importa: candidates antes de applications
const GROUPS = [
  { prefix: 'talents_candidates_',   table: 'talents_candidates',   fixUserIdNull: false },
  { prefix: 'talents_applications_', table: 'talents_applications', fixUserIdNull: false },
  { prefix: 'talents_activity_log_', table: 'talents_activity_log', fixUserIdNull: true  },
];

// ─── Parser robusto (caractere a caractere) ──────────────────────────────────

function parseInsertFile(filePath) {
  const content = readFileSync(filePath, 'utf8').trim();
  if (!content) return [];

  // Extrai colunas: INSERT INTO "schema"."table" (col1, col2) VALUES
  const colMatch = content.match(/INSERT INTO [^(]+\(([^)]+)\)\s*VALUES/s);
  if (!colMatch) throw new Error(`Cabeçalho INSERT não encontrado em ${filePath}`);
  const columns = colMatch[1].split(',').map(c => c.trim());

  // Isola a seção de valores (após VALUES)
  const valuesStart = content.indexOf('VALUES');
  let src = content.slice(valuesStart + 6).trim().replace(/;\s*$/, '');

  const rows = [];
  let i = 0;

  while (i < src.length) {
    // Avança até o próximo '('
    while (i < src.length && src[i] !== '(') i++;
    if (i >= src.length) break;
    i++; // pula '('

    // Lê os valores da tupla
    const values = [];
    let cur = '';
    let inStr = false;
    let depth = 0;

    while (i < src.length) {
      const ch = src[i];

      if (inStr) {
        if (ch === "'" && src[i + 1] === "'") { cur += "''"; i += 2; continue; } // '' escape
        else if (ch === "'") { inStr = false; cur += ch; }
        else { cur += ch; }
      } else {
        if      (ch === "'")              { inStr = true;  cur += ch; }
        else if (ch === '(' )             { depth++;       cur += ch; }
        else if (ch === ')' && depth > 0) { depth--;       cur += ch; }
        else if (ch === ')' && depth === 0) {
          values.push(cur.trim());
          i++;
          break; // fim da tupla
        }
        else if (ch === ',' && depth === 0) { values.push(cur.trim()); cur = ''; }
        else { cur += ch; }
      }
      i++;
    }

    if (values.length !== columns.length) continue; // tupla malformada, pula

    const row = {};
    columns.forEach((col, idx) => {
      const val = values[idx];
      if (val === 'NULL') {
        row[col] = null;
      } else if (val.startsWith("'") && val.endsWith("'")) {
        row[col] = val.slice(1, -1).replace(/''/g, "'");
      } else if (val === 'true')  { row[col] = true;  }
      else if (val === 'false') { row[col] = false; }
      else if (val !== '' && !isNaN(val)) { row[col] = Number(val); }
      else { row[col] = val; }
    });
    rows.push(row);
  }

  return rows;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔗 Conectando via HTTPS ao Supabase...\n');

  for (const { prefix, table, fixUserIdNull } of GROUPS) {
    const files = readdirSync(INSERTS_DIR)
      .filter(f => f.startsWith(prefix) && f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log(`⚠️  Nenhum arquivo para ${table}\n`);
      continue;
    }

    console.log(`📦 ${table} — ${files.length} arquivo(s)`);
    let totalProcessed = 0;

    for (const file of files) {
      const filePath = join(INSERTS_DIR, file);
      let rows;

      try {
        rows = parseInsertFile(filePath);
      } catch (err) {
        console.error(`  ✗ Erro ao parsear ${file}: ${err.message}`);
        continue;
      }

      if (rows.length === 0) {
        console.log(`  - ${file}: vazio, pulando`);
        continue;
      }

      // activity_log: user_id referencia auth.users que não existe neste projeto → NULL
      if (fixUserIdNull) {
        rows = rows.map(r => ({ ...r, user_id: null }));
      }

      const { error } = await supabase
        .from(table)
        .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });

      if (error) {
        console.error(`  ✗ ERRO em ${file}: ${error.message}`);
      } else {
        totalProcessed += rows.length;
        process.stdout.write(`  ✓ ${file} → ${rows.length} linhas\n`);
      }
    }

    console.log(`  → Subtotal: ${totalProcessed} linhas processadas\n`);
  }

  // Contagem final
  const tables = ['talents_candidates','talents_applications','talents_activity_log'];
  console.log('📊 Contagem final:');
  for (const t of tables) {
    const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`   ${t}: ${count} linhas`);
  }

  console.log('\n🎉 Seed concluído!');
}

main().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
