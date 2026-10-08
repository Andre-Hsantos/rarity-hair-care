-- Clients may only flip read_at on their own notifications (not title/body).
REVOKE UPDATE ON public.notifications FROM authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;

CREATE POLICY "Admin notifications read" ON public.notifications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin -> client one-way notifications.
CREATE OR REPLACE FUNCTION public.admin_send_notification(_user_ids uuid[], _title text, _body text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare n int; t text := nullif(trim(coalesce(_title, '')), ''); b text := nullif(trim(coalesce(_body, '')), '');
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Acesso negado'; end if;
  if t is null then raise exception 'Informe o título.'; end if;
  if b is null then raise exception 'Informe a mensagem.'; end if;
  if coalesce(array_length(_user_ids, 1), 0) = 0 then raise exception 'Escolha ao menos um cliente.'; end if;
  insert into public.notifications (user_id, title, body)
  select p.id, left(t, 150), left(b, 2000) from public.profiles p
  where p.id = any(_user_ids) and p.account_status = 'ativa';
  get diagnostics n = row_count;
  if n = 0 then raise exception 'Nenhum cliente ativo selecionado.'; end if;
  insert into public.audit_log (actor_id, action, entity, details)
  values (auth.uid(), 'send', 'notification', jsonb_build_object('title', t, 'recipients', n));
  return n;
end; $$;

-- Self-service account deletion: removes personal data, keeps orders intact (profile anonymized, status 'excluida').
CREATE OR REPLACE FUNCTION public.delete_own_account_data()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Não autenticado'; end if;
  if public.has_role(uid, 'admin') then raise exception 'Contas de administrador não podem ser excluídas por aqui.'; end if;
  if not exists (select 1 from public.profiles where id = uid and account_status = 'ativa') then raise exception 'Conta indisponível.'; end if;
  delete from public.favorites where user_id = uid;
  delete from public.cart_items where user_id = uid;
  delete from public.stock_alerts where user_id = uid;
  delete from public.reviews where user_id = uid;
  delete from public.notifications where user_id = uid;
  delete from public.pro_requests where user_id = uid;
  -- Orders keep their delivery_address snapshot; only the link to the saved address is cleared.
  update public.orders set address_id = null where user_id = uid and address_id is not null;
  delete from public.addresses where user_id = uid;
  delete from public.user_roles where user_id = uid;
  update public.profiles set name = 'Cliente excluído', email = 'excluido+' || uid::text || '@conta-removida.invalid',
    cpf = null, phone = null, birth_date = null, individual_discount_percent = 0,
    pro_status = 'nao_solicitado', account_status = 'excluida'
  where id = uid;
  insert into public.audit_log (actor_id, action, entity, entity_id) values (uid, 'self_delete', 'client', uid::text);
end; $$;

REVOKE ALL ON FUNCTION public.admin_send_notification(uuid[], text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_own_account_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_send_notification(uuid[], text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_own_account_data() TO authenticated;