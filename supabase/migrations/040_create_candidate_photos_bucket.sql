-- Migration 040: Criar bucket de fotos de candidatos no Supabase Storage
-- Permite upload anônimo (formulário público) e leitura pública

-- 1. Criar o bucket (público = URLs acessíveis sem auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-photos',
  'candidate-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Policy: Anon pode fazer upload (formulário público /apply)
CREATE POLICY "anon_upload_candidate_photos"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'candidate-photos');

-- 3. Policy: Anon pode fazer upsert (sobrescrever foto ao reenviar)
CREATE POLICY "anon_update_candidate_photos"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'candidate-photos')
WITH CHECK (bucket_id = 'candidate-photos');

-- 4. Policy: Usuários autenticados (staff) podem ler todas as fotos
CREATE POLICY "authenticated_read_candidate_photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'candidate-photos');

-- 5. Policy: Usuários autenticados (staff) podem atualizar fotos
CREATE POLICY "authenticated_update_candidate_photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'candidate-photos')
WITH CHECK (bucket_id = 'candidate-photos');

-- 6. Policy: Usuários autenticados (staff) podem deletar fotos
CREATE POLICY "authenticated_delete_candidate_photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'candidate-photos');

-- 7. Policy: Anon pode ler fotos (necessário para o formulário público exibir preview)
CREATE POLICY "anon_read_candidate_photos"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'candidate-photos');
