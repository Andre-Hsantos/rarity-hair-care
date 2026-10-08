-- Pro requests: CNPJ/MEI by number (additive; document_path keeps a "<uid>/sem-arquivo" marker when no file)
ALTER TABLE public.pro_requests ADD COLUMN IF NOT EXISTS proof_number text;
ALTER TABLE public.pro_requests ADD CONSTRAINT pro_requests_proof_number_chk CHECK (proof_number IS NULL OR proof_number ~ '^[0-9]{14}$');
COMMENT ON COLUMN public.pro_requests.proof_number IS 'CNPJ/MEI digits (14). When set, document_path is the marker <user_id>/sem-arquivo (no file).';

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare bd date; pt text := new.raw_user_meta_data->>'proof_type'; pn text := regexp_replace(coalesce(new.raw_user_meta_data->>'proof_number',''), '\D', '', 'g');
begin
  begin bd := nullif(new.raw_user_meta_data->>'birth_date','')::date; exception when others then bd := null; end;
  insert into public.profiles (id, name, email, phone, cpf, birth_date)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email,
          nullif(new.raw_user_meta_data->>'phone', ''), nullif(new.raw_user_meta_data->>'cpf', ''), bd)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  if new.raw_user_meta_data->>'account_intent' = 'profissional' and pt in ('cnpj','mei') and pn ~ '^[0-9]{14}$' then
    insert into public.pro_requests (user_id, proof_type, proof_number, document_path)
    values (new.id, pt::public.proof_type, pn, new.id::text || '/sem-arquivo');
  end if;
  return new;
end; $$;

CREATE OR REPLACE FUNCTION public.admin_send_notification_audience(_audience public.target_audience, _title text, _body text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare n int; t text := nullif(trim(coalesce(_title, '')), ''); b text := nullif(trim(coalesce(_body, '')), '');
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Acesso negado'; end if;
  if t is null then raise exception 'Informe o título.'; end if;
  if b is null then raise exception 'Informe a mensagem.'; end if;
  insert into public.notifications (user_id, title, body)
  select p.id, left(t, 150), left(b, 2000) from public.profiles p
  where p.account_status = 'ativa' and not public.has_role(p.id, 'admin')
    and (_audience = 'todos'
      or (_audience = 'profissionais' and p.pro_status = 'aprovado' and p.account_type = 'profissional')
      or (_audience = 'comuns' and not (p.pro_status = 'aprovado' and p.account_type = 'profissional')));
  get diagnostics n = row_count;
  if n = 0 then raise exception 'Nenhum cliente neste público.'; end if;
  insert into public.audit_log (actor_id, action, entity, details)
  values (auth.uid(), 'send', 'notification', jsonb_build_object('title', t, 'recipients', n, 'audience', _audience));
  return n;
end; $$;
REVOKE ALL ON FUNCTION public.admin_send_notification_audience(public.target_audience, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_send_notification_audience(public.target_audience, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_category(_id text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare np int; nc int;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Acesso negado'; end if;
  if not exists (select 1 from public.categories where id = _id) then raise exception 'Categoria não encontrada.'; end if;
  select count(*) into np from public.products where category_id = _id;
  select count(*) into nc from public.coupon_categories where category_id = _id;
  if np > 0 or nc > 0 then
    raise exception 'Não é possível excluir: %. Mova/edite esses itens antes ou desative a categoria.', concat_ws(' e ',
      case when np > 0 then np || ' produto(s) usam esta categoria' end,
      case when nc > 0 then nc || ' cupom(ns) estão restritos a ela' end);
  end if;
  delete from public.categories where id = _id;
  insert into public.audit_log (actor_id, action, entity, entity_id) values (auth.uid(), 'delete', 'category', _id);
end; $$;
REVOKE ALL ON FUNCTION public.admin_delete_category(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_category(text) TO authenticated;

GRANT SELECT ON public.banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;