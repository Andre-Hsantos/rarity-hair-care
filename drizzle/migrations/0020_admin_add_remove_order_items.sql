CREATE OR REPLACE FUNCTION public.admin_add_order_item(_order_id bigint, _product_id text, _quantity integer, _unit_price numeric, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare o public.orders; p public.products; n text := nullif(trim(coalesce(_note, '')), ''); pt numeric; d numeric;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Acesso negado'; end if;
  if n is null then raise exception 'Informe o motivo da alteração.'; end if;
  if _quantity is null or _quantity < 1 or _unit_price is null or _unit_price < 0 then raise exception 'Valores inválidos'; end if;
  select * into o from public.orders where id = _order_id for update;
  if o.id is null then raise exception 'Pedido não encontrado'; end if;
  select * into p from public.products where id = _product_id;
  if p.id is null then raise exception 'Produto não encontrado'; end if;
  insert into public.order_items (order_id, product_id, product_name, quantity, original_price, discount, unit_price, item_total)
  values (o.id, p.id, p.name || coalesce(' — ' || p.size_label, ''), _quantity, p.price, 0, _unit_price, _quantity * _unit_price);
  select sum(quantity * unit_price), sum(discount) into pt, d from public.order_items where order_id = o.id;
  update public.orders set products_total = pt, discount = d, total = pt - d + coalesce(shipping, 0) where id = o.id;
  insert into public.order_history (order_id, changed_by, old_status, new_status, change_note)
  values (o.id, auth.uid(), o.status, o.status, 'Item adicionado: "' || p.name || '" — ' || _quantity || ' × R$ '
    || replace(to_char(_unit_price, 'FM999999990.00'), '.', ',') || '. Motivo: ' || n);
end; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_order_item(_item_id bigint, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare i public.order_items; o public.orders; n text := nullif(trim(coalesce(_note, '')), ''); pt numeric; d numeric;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Acesso negado'; end if;
  if n is null then raise exception 'Informe o motivo da alteração.'; end if;
  select * into i from public.order_items where id = _item_id;
  if i.id is null then raise exception 'Item não encontrado'; end if;
  select * into o from public.orders where id = i.order_id for update;
  if (select count(*) from public.order_items where order_id = o.id) <= 1 then
    raise exception 'O pedido precisa ter ao menos um item. Para desistir do pedido, cancele-o.';
  end if;
  delete from public.order_items where id = _item_id;
  select coalesce(sum(quantity * unit_price), 0), coalesce(sum(discount), 0) into pt, d from public.order_items where order_id = o.id;
  update public.orders set products_total = pt, discount = d, total = pt - d + coalesce(shipping, 0) where id = o.id;
  insert into public.order_history (order_id, changed_by, old_status, new_status, change_note)
  values (o.id, auth.uid(), o.status, o.status, 'Item removido: "' || i.product_name || '" — ' || i.quantity || ' × R$ '
    || replace(to_char(i.unit_price, 'FM999999990.00'), '.', ',') || '. Motivo: ' || n);
end; $$;

REVOKE EXECUTE ON FUNCTION public.admin_add_order_item(bigint, text, integer, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_order_item(bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_add_order_item(bigint, text, integer, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_order_item(bigint, text) TO authenticated;