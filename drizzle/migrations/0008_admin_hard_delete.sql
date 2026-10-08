-- Permanent admin deletions (orders, products, client data). All atomic, admin-only.
CREATE OR REPLACE FUNCTION public.admin_delete_order(_order_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Acesso negado'; end if;
  if not exists (select 1 from public.orders where id = _order_id) then raise exception 'Pedido não encontrado'; end if;
  delete from public.order_history where order_id = _order_id;
  delete from public.order_items where order_id = _order_id;
  delete from public.orders where id = _order_id;
  insert into public.audit_log (actor_id, action, entity, entity_id) values (auth.uid(), 'delete', 'order', _order_id::text);
end; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_product(_product_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare p public.products; affected bigint[]; removed_orders int := 0; img_shared boolean := false;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Acesso negado'; end if;
  select * into p from public.products where id = _product_id for update;
  if p.id is null then raise exception 'Produto não encontrado'; end if;

  select coalesce(array_agg(distinct order_id), '{}') into affected from public.order_items where product_id = _product_id;
  delete from public.order_items where product_id = _product_id;
  -- Orders left without items are removed; the others get totals recalculated and a history note.
  with gone as (
    delete from public.orders o where o.id = any(affected)
      and not exists (select 1 from public.order_items i where i.order_id = o.id) returning o.id)
  select count(*) into removed_orders from gone;
  perform set_config('rarity.note', '', true);
  update public.orders o set products_total = s.pt, discount = s.d, total = s.pt - s.d + coalesce(o.shipping, 0)
  from (select order_id, sum(quantity * unit_price) pt, sum(discount) d from public.order_items where order_id = any(affected) group by order_id) s
  where o.id = s.order_id;
  insert into public.order_history (order_id, changed_by, old_status, new_status, change_note)
  select o.id, auth.uid(), o.status, o.status, 'Produto "' || p.name || '" excluído definitivamente do sistema; item removido do pedido.'
  from public.orders o where o.id = any(affected);

  delete from public.kit_items where product_id = _product_id or kit_id = _product_id;
  delete from public.promotion_products where product_id = _product_id;
  delete from public.coupon_products where product_id = _product_id;
  delete from public.favorites where product_id = _product_id;
  delete from public.stock_alerts where product_id = _product_id;
  delete from public.cart_items where product_id = _product_id;
  delete from public.home_section_products where product_id = _product_id;
  delete from public.reviews where product_id = _product_id;
  delete from public.products where id = _product_id;

  if p.image_url is not null then
    img_shared := exists (select 1 from public.products where image_url = p.image_url)
      or exists (select 1 from public.categories where image_url = p.image_url)
      or exists (select 1 from public.banners where image_url = p.image_url);
  end if;
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'delete', 'product', _product_id, jsonb_build_object('name', p.name, 'orders_changed', coalesce(array_length(affected, 1), 0), 'orders_removed', removed_orders));
  return jsonb_build_object('image_url', p.image_url, 'image_shared', img_shared,
    'orders_changed', coalesce(array_length(affected, 1), 0), 'orders_removed', removed_orders);
end; $$;

-- Deletes every app record of a client. The login account is removed afterwards by the server.
CREATE OR REPLACE FUNCTION public.admin_delete_client_data(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare me public.profiles;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Acesso negado'; end if;
  if _user_id = auth.uid() then raise exception 'Você não pode excluir a própria conta.'; end if;
  if public.has_role(_user_id, 'admin') then raise exception 'Contas de administrador não podem ser excluídas por aqui.'; end if;
  select * into me from public.profiles where id = _user_id for update;
  if me.id is null then raise exception 'Cliente não encontrado'; end if;
  delete from public.order_history where order_id in (select id from public.orders where user_id = _user_id);
  delete from public.order_items where order_id in (select id from public.orders where user_id = _user_id);
  delete from public.orders where user_id = _user_id;
  update public.pro_requests set decided_by = null where decided_by = _user_id;
  delete from public.pro_requests where user_id = _user_id;
  delete from public.addresses where user_id = _user_id;
  delete from public.cart_items where user_id = _user_id;
  delete from public.favorites where user_id = _user_id;
  delete from public.stock_alerts where user_id = _user_id;
  delete from public.reviews where user_id = _user_id;
  delete from public.notifications where user_id = _user_id;
  delete from public.user_roles where user_id = _user_id;
  delete from public.profiles where id = _user_id;
  insert into public.audit_log (actor_id, action, entity, entity_id) values (auth.uid(), 'delete', 'client', _user_id::text);
end; $$;

REVOKE ALL ON FUNCTION public.admin_delete_order(bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_product(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_client_data(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_order(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_product(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_client_data(uuid) TO authenticated;