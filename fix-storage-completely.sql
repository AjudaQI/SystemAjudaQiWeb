-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatars" ON storage.objects;

-- Desabilitar RLS temporariamente para o bucket user-avatars
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Reabilitar RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Authenticated users can insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user-avatars');

CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE USING (bucket_id = 'user-avatars');

CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE USING (bucket_id = 'user-avatars');
