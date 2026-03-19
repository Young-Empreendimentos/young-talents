/**
 * Mapeamento CSV (Google Forms) → colunas DB e funções de parse.
 * Usado por import-candidates-from-csv.js e import-candidates-append-only.js.
 */

import fs from 'fs';
import { parse } from 'csv-parse';

export const CSV_TO_DB = {
  'Carimbo de data/hora': 'original_timestamp',
  'COD': null,
  'Nome completo:': 'full_name',
  'Nos envie uma foto atual que você goste:': 'photo_url',
  'Data de Nascimento:': 'birth_date',
  'Idade': 'age',
  'E-mail principal:': 'email',
  'Nº telefone celular / Whatsapp:': 'phone',
  'Cidade onde reside:': 'city',
  'Áreas de interesse profissional': 'interest_areas',
  'Formação:': 'education',
  'Experiências anteriores:': 'experience',
  'Cursos e certificações profissionais.': 'courses',
  'Campo Livre, SEJA VOCÊ!': 'free_field',
  'Nível de escolaridade:': 'schooling_level',
  'Estado civil:': 'marital_status',
  'Você possui CNH tipo B?': 'has_license',
  'Instituição de ensino:': 'institution',
  'Onde você nos encontrou?': 'source',
  'Você está se candidatando a uma vaga específica ou apenas quer se inscrever no banco de talentos?': 'type_of_app',
  'Referências profissionais:': 'professional_references',
  'Certificações profissionais:': 'certifications',
  'Anexar currículo:': 'cv_url',
  'Portfólio de trabalho:': 'portfolio_url',
  'Data de formatura:': 'graduation_date',
  'Teria disponibilidade para mudança de cidade?': 'can_relocate',
  'Em caso de curso superior, está cursando neste momento?': 'is_studying',
  'Qual seria sua expectativa salarial?': 'salary_expectation',
  'Endereço de e-mail': 'email_secondary',
  'Se tem filhos, quantos?': 'children_count',
  'Você foi indicado por algum colaborador da Young? Se sim, quem?': 'referral',
  'Cópia de data': null,
  'Não quer ser contatado': null
};

function parseDDMMYYYY(str) {
  const s = String(str).trim();
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function parseDDMMYYYYHHMM(str) {
  const s = String(str).trim();
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\s+(\d{1,2}):(\d{2})/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    const h = parseInt(m[4], 10);
    const min = parseInt(m[5], 10);
    const d = new Date(year, month, day, h, min);
    if (!isNaN(d.getTime())) return d;
  }
  return parseDDMMYYYY(s);
}

export function parseTimestamp(str) {
  if (!str) return null;
  const d = parseDDMMYYYYHHMM(str);
  return d ? d.toISOString() : null;
}

export function parseDate(str) {
  if (!str) return null;
  const d = parseDDMMYYYY(str);
  return d ? d.toISOString().slice(0, 10) : null;
}

export function parseInteger(str) {
  if (str == null || str === '') return null;
  const n = parseInt(String(str).replace(/,/, '.'), 10);
  return isNaN(n) ? null : n;
}

export function toDbRow(record, normalizers) {
  const row = {};
  for (const [csvHeader, dbCol] of Object.entries(CSV_TO_DB)) {
    if (!dbCol) continue;
    let value = record[csvHeader];
    if (value !== undefined && value !== null) value = String(value).trim();
    if (value === '') value = null;

    if (value == null) {
      row[dbCol] = null;
      continue;
    }

    switch (dbCol) {
      case 'city':
        row[dbCol] = normalizers.normalizeCity(value) || value;
        break;
      case 'source':
        row[dbCol] = normalizers.normalizeSource(value) || value;
        break;
      case 'interest_areas':
        row[dbCol] = normalizers.normalizeInterestAreasString(value) || value;
        break;
      case 'children_count': {
        const n = normalizers.normalizeChildrenForStorage(value);
        row[dbCol] = n != null ? String(n) : null;
        break;
      }
      case 'photo_url':
        row[dbCol] = value;
        break;
      case 'original_timestamp':
        row[dbCol] = parseTimestamp(value);
        break;
      case 'birth_date':
      case 'graduation_date':
        row[dbCol] = parseDate(value);
        break;
      case 'age':
        row[dbCol] = parseInteger(value);
        break;
      default:
        row[dbCol] = value;
    }
  }
  row.status = row.status || 'Inscrito';
  row.origin = row.origin || 'csv_import';
  row.created_by = row.created_by || 'Importação CSV';
  if (row.phone == null || row.phone === '') row.phone = '';
  return row;
}

export function readCsvRows(csvPath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const parser = parse({ columns: true, skip_empty_lines: true, relax_column_count: true, trim: true });
    parser.on('readable', function () {
      let r;
      while ((r = parser.read()) !== null) rows.push(r);
    });
    parser.on('error', reject);
    parser.on('end', () => resolve(rows));
    const stream = fs.createReadStream(csvPath);
    stream.on('error', reject);
    stream.pipe(parser);
  });
}
