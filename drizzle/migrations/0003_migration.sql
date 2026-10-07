create policy "Product images admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin')
              and lower(storage.extension(name)) in ('jpg','jpeg','png','webp'));
create policy "Product images admin update" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));
create policy "Product images admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));
create policy "Product images admin select" on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));