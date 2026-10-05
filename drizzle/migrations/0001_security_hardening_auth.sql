-- Trigger-only functions: nobody needs to call them directly
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.log_order_status() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
-- has_role: needed by RLS for signed-in users only
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
-- update_own_profile: signed-in only (already), make explicit
revoke execute on function public.update_own_profile(text, text, date, text) from public, anon;
grant execute on function public.update_own_profile(text, text, date, text) to authenticated;

-- Signup trigger: also store phone/cpf from signup metadata (role is always 'user')
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, phone, cpf)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email,
          nullif(new.raw_user_meta_data->>'phone', ''), nullif(new.raw_user_meta_data->>'cpf', ''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Pro request: mark profile as "em análise"; block duplicates
create or replace function public.on_pro_request_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare cur public.pro_status;
begin
  select pro_status into cur from public.profiles where id = new.user_id;
  if cur in ('em_analise', 'aprovado') then
    raise exception 'Já existe uma solicitação em análise ou aprovada';
  end if;
  update public.profiles set pro_status = 'em_analise' where id = new.user_id;
  return new;
end; $$;
revoke execute on function public.on_pro_request_created() from public, anon, authenticated;
create trigger pro_request_created after insert on public.pro_requests
  for each row execute function public.on_pro_request_created();

-- Pro request insert must point to a document in the user's own folder
drop policy "Own pro requests insert" on public.pro_requests;
create policy "Own pro requests insert" on public.pro_requests for insert to authenticated
  with check (user_id = auth.uid() and status = 'em_analise' and decided_at is null and decided_by is null
              and split_part(document_path, '/', 1) = auth.uid()::text);

-- Pro documents: only PDF, JPG/JPEG, PNG in the user's own folder
drop policy "Pro docs upload own folder" on storage.objects;
create policy "Pro docs upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'pro-documents'
              and (storage.foldername(name))[1] = auth.uid()::text
              and lower(storage.extension(name)) in ('pdf', 'jpg', 'jpeg', 'png'));