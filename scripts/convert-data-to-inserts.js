#!/usr/bin/env node
/**
 * Converts young_talents COPY statements to INSERT statements for talents_* tables.
 * Splits large tables into batches of 100 rows.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const INPUT = join(process.cwd(), 'backups/young_talents/young_talents_data.sql');
const OUT_DIR = join(process.cwd(), 'backups/young_talents/inserts');

const TABLE_MAP = {
  'activity_areas': 'talents_activity_areas',
  'activity_log': 'talents_activity_log',
  'candidates': 'talents_candidates',
  'jobs': 'talents_jobs',
  'applications': 'talents_applications',
  'cities': 'talents_cities',
  'companies': 'talents_companies',
  'job_levels': 'talents_job_levels',
  'positions': 'talents_positions',
  'sectors': 'talents_sectors',
  'user_roles': 'talents_user_roles',
};

const BATCH_SIZE = 50;

mkdirSync(OUT_DIR, { recursive: true });

const content = readFileSync(INPUT, 'utf8').replace(/\r/g, '');
const lines = content.split('\n');

let inCopy = false;
let currentTable = null;
let currentColumns = null;
let newTableName = null;
let batchRows = [];
let batchIndex = 0;
let allBatches = {}; // tableName -> array of SQL strings

function escapeValue(val) {
  if (val === '\\N') return 'NULL';
  // Escape single quotes
  return "'" + val.replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
}

function parseCopyLine(line, colCount) {
  // Tab-delimited values; \N is NULL, \t is tab, \n is newline
  const vals = [];
  let cur = '';
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '\t') {
      vals.push(cur);
      cur = '';
      i++;
    } else if (ch === '\\' && i + 1 < line.length) {
      const next = line[i + 1];
      if (next === 'N') { cur += '\x00NULL\x00'; i += 2; } // sentinel for NULL
      else if (next === 't') { cur += '\t'; i += 2; }
      else if (next === 'n') { cur += '\n'; i += 2; }
      else if (next === 'r') { cur += '\r'; i += 2; }
      else if (next === '\\') { cur += '\\'; i += 2; }
      else { cur += ch; i++; }
    } else {
      cur += ch;
      i++;
    }
  }
  vals.push(cur);
  return vals;
}

function formatValue(raw) {
  if (raw === '\x00NULL\x00') return 'NULL';
  return "'" + raw.replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
}

function flushBatch(tableName, columns, rows) {
  if (rows.length === 0) return;
  const colList = columns.join(', ');
  const valueLines = rows.map(row => {
    const parsedVals = parseCopyLine(row, columns.length);
    return '(' + parsedVals.map(formatValue).join(', ') + ')';
  });
  const sql = `INSERT INTO "public"."${tableName}" (${colList}) VALUES\n${valueLines.join(',\n')};`;
  if (!allBatches[tableName]) allBatches[tableName] = [];
  allBatches[tableName].push(sql);
}

for (const line of lines) {
  if (!inCopy) {
    const match = line.match(/^COPY "young_talents"\."(\w+)" \(([^)]+)\) FROM stdin;/);
    if (match) {
      currentTable = match[1];
      newTableName = TABLE_MAP[currentTable];
      if (!newTableName) {
        console.warn('Unknown table:', currentTable);
        continue;
      }
      currentColumns = match[2].split(', ').map(c => c.trim().replace(/^"|"$/g, ''));
      batchRows = [];
      batchIndex = 0;
      inCopy = true;
    }
  } else {
    if (line === '\\.') {
      // End of COPY block - flush remaining rows
      flushBatch(newTableName, currentColumns, batchRows);
      inCopy = false;
      currentTable = null;
      currentColumns = null;
      newTableName = null;
      batchRows = [];
    } else {
      batchRows.push(line);
      if (batchRows.length >= BATCH_SIZE) {
        flushBatch(newTableName, currentColumns, batchRows);
        batchRows = [];
        batchIndex++;
      }
    }
  }
}

// Write output files
for (const [tableName, batches] of Object.entries(allBatches)) {
  for (let i = 0; i < batches.length; i++) {
    const fname = `${tableName}_${String(i + 1).padStart(3, '0')}.sql`;
    writeFileSync(join(OUT_DIR, fname), batches[i] + '\n', 'utf8');
  }
  console.log(`${tableName}: ${batches.length} batch(es), ~${allBatches[tableName].join('').length} bytes`);
}

console.log('\nDone. Files written to:', OUT_DIR);
