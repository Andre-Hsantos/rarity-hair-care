CREATE OR REPLACE FUNCTION public.admin_delete_product(_product_id text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare p public.products; img_shared boolean := false; n int;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Acesso negado'; end if;
  select * into p from public.products where id = _product_id for update;
  if p.id is null then raise exception 'Produto não encontrado'; end if;
  select count(distinct order_id) into n from public.order_items where product_id = _product_id;
  if n > 0 then
    raise exception 'Este produto aparece em % pedido(s) e não pode ser excluído para preservar o histórico. Marque-o como Inativo para tirá-lo da loja.', n;
  end if;
  delete from public.kit_items where product_id = _product_id or kit_id = _product_id;
  delete from public.promotion_products where product_id = _product_id;
  delete from public.coupon_products where product_id = _product_id;
  delete from public.quantity_discounts where product_id = _product_id;
  delete from public.favorites where product_id = _product_id;
  delete from public.stock_alerts where product_id = _product_id;
  delete from public.cart_items where product_id = _product_id;
  delete from public.home_section_products where product_id = _product_id;
  delete from public.product_categories where product_id = _product_id;
  delete from public.reviews where product_id = _product_id;
  delete from public.products where id = _product_id;
  if p.image_url is not null then
    img_shared := exists (select 1 from public.products where image_url = p.image_url)
      or exists (select 1 from public.categories where image_url = p.image_url)
      or exists (select 1 from public.banners where image_url = p.image_url);
  end if;
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'delete', 'product', _product_id, jsonb_build_object('name', p.name));
  return jsonb_build_object('image_url', p.image_url, 'image_shared', img_shared, 'orders_changed', 0, 'orders_removed', 0);
end; $function$;