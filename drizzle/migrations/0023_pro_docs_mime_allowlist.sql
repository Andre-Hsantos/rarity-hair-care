drop policy if exists "Pro docs upload own folder" on storage.objects;
create policy "Pro docs upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'pro-documents'
              and (storage.foldername(name))[1] = auth.uid()::text
              and lower(storage.extension(name)) in ('pdf', 'jpg', 'jpeg', 'png')
              and coalesce(metadata->>'mimetype', 'application/pdf') in ('application/pdf', 'image/jpeg', 'image/png'));