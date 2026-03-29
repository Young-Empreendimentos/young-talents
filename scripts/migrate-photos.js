/**
 * migrate-photos.js
 * Baixa fotos do Google Drive e migra para o Supabase Storage.
 *
 * Pré-requisitos:
 *   1. Instale o Google Cloud SDK: https://cloud.google.com/sdk/docs/install
 *   2. Execute: gcloud auth login
 *   3. Execute: gcloud auth print-access-token  → copie o token
 *
 * Uso:
 *   $env:GOOGLE_ACCESS_TOKEN="seu-token-aqui"
 *   $env:SUPABASE_SERVICE_KEY="sua-service-role-key"
 *   node scripts/migrate-photos.js
 *
 * O script:
 *   - Lê todos os candidatos com photo_url do Drive
 *   - Baixa cada foto usando o token do Google
 *   - Faz upload para Supabase Storage (bucket: candidate-photos)
 *   - Atualiza o campo photo_url no banco com a nova URL pública
 *   - Pula arquivos já migrados (idempotente)
 *   - Gera relatório no final
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const SUPABASE_URL = 'https://vvtympzatclvjaqucebr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_TOKEN = process.env.GOOGLE_ACCESS_TOKEN;
const BUCKET = 'candidate-photos';
const PROGRESS_FILE = 'scripts/migrate-photos-progress.json';
const CONCURRENCY = 5;

if (!SUPABASE_KEY) { console.error('❌ SUPABASE_SERVICE_KEY não definida'); process.exit(1); }
if (!GOOGLE_TOKEN) { console.error('❌ GOOGLE_ACCESS_TOKEN não definida'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Extrai o file ID de qualquer formato de URL do Google Drive
function extractDriveFileId(url) {
  if (!url) return null;
  // /uc?export=view&id=FILE_ID ou /uc?id=FILE_ID
  let m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  // /file/d/FILE_ID/
  m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  // /open?id=FILE_ID
  m = url.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  return null; // folder links e outros formatos não suportados
}

async function downloadFromDrive(fileId) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${GOOGLE_TOKEN}` }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${await res.text()}`);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

async function uploadToStorage(candidateId, fileId, buffer, contentType) {
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const path = `${candidateId}/${fileId}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: true
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function processBatch(batch, progress) {
  const results = await Promise.allSettled(batch.map(async (candidate) => {
    const fileId = extractDriveFileId(candidate.photo_url);
    if (!fileId) {
      progress.skipped.push({ id: candidate.id, reason: 'URL inválida ou pasta', url: candidate.photo_url });
      return;
    }
    try {
      const { buffer, contentType } = await downloadFromDrive(fileId);
      const publicUrl = await uploadToStorage(candidate.id, fileId, buffer, contentType);
      await supabase.from('talents_candidates').update({ photo_url: publicUrl }).eq('id', candidate.id);
      progress.success++;
      process.stdout.write('✓');
    } catch (err) {
      progress.failed.push({ id: candidate.id, fileId, error: err.message });
      process.stdout.write('✗');
    }
  }));
  return results;
}

async function main() {
  console.log('📸 Iniciando migração de fotos...\n');

  // Carrega progresso anterior se existir
  let progress = { success: 0, skipped: [], failed: [], migratedIds: [] };
  if (existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
    console.log(`▶ Retomando: ${progress.success} já migradas anteriormente\n`);
  }

  // Busca candidatos com foto do Drive (ainda não migrados — os migrados já têm URL do Supabase)
  const { data: candidates, error } = await supabase
    .from('talents_candidates')
    .select('id, photo_url')
    .like('photo_url', '%drive.google.com%')
    .order('created_at');

  if (error) { console.error('Erro ao buscar candidatos:', error); process.exit(1); }
  console.log(`📋 ${candidates.length} fotos para migrar\n`);

  // Processa em lotes
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const batch = candidates.slice(i, i + CONCURRENCY);
    await processBatch(batch, progress);
    progress.migratedIds.push(...batch.map(c => c.id));
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  }

  // Relatório final
  console.log(`\n\n📊 Relatório:`);
  console.log(`   ✅ Migradas com sucesso: ${progress.success}`);
  console.log(`   ⏭  Puladas (URL inválida): ${progress.skipped.length}`);
  console.log(`   ❌ Com erro: ${progress.failed.length}`);

  if (progress.failed.length > 0) {
    console.log('\nErros:');
    progress.failed.slice(0, 10).forEach(f => console.log(`   ${f.id}: ${f.error}`));
    if (progress.failed.length > 10) console.log(`   ... e mais ${progress.failed.length - 10}`);
  }

  console.log('\n✅ Migração concluída!');
}

main().catch(console.error);
