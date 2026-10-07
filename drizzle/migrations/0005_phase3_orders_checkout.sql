ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'aguardando_confirmacao';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'aguardando_pagamento';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pagamento_confirmado';

ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'em_negociacao';
ALTER TABLE public.orders ADD CONSTRAINT orders_status_flow CHECK (status::text IN ('em_negociacao','aguardando_confirmacao','aguardando_pagamento','pagamento_confirmado','concluido','cancelado'));
ALTER TABLE public.order_history ADD CONSTRAINT order_history_status_flow CHECK (new_status IS NULL OR new_status::text IN ('em_negociacao','aguardando_confirmacao','aguardando_pagamento','pagamento_confirmado','concluido','cancelado'));
COMMENT ON TYPE public.order_status IS 'Active values: em_negociacao, aguardando_confirmacao, aguardando_pagamento, pagamento_confirmado, concluido, cancelado. DEPRECATED (blocked by CHECK): recebido, confirmado, pronto_retirada, enviado';

ALTER TABLE public.orders ADD COLUMN delivery_address jsonb;
ALTER TABLE public.orders ADD COLUMN client_request_id uuid;
CREATE UNIQUE INDEX orders_user_request_uidx ON public.orders (user_id, client_request_id) WHERE client_request_id IS NOT NULL;
COMMENT ON COLUMN public.orders.delivery_address IS 'Snapshot of the delivery address at order time';

-- All admin edits go through admin_update_order* RPCs so they are always logged.
DROP POLICY IF EXISTS "Admin orders update" ON public.orders;

CREATE OR REPLACE FUNCTION public.log_order_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_history (order_id, changed_by, new_status, change_note)
    values (new.id, auth.uid(), new.status, coalesce(nullif(current_setting('rarity.note', true), ''), 'Pedido criado'));
  elsif new.status is distinct from old.status then
    insert into public.order_history (order_id, changed_by, old_status, new_status, change_note)
    values (new.id, auth.uid(), old.status, new.status, nullif(current_setting('rarity.note', true), ''));
  end if;
  return new;
end; $$;
REVOKE EXECUTE ON FUNCTION public.log_order_status() FROM PUBLIC, anon, authenticated;

-- Internal pricing engine: recalculates the cart of _uid entirely from the database.
CREATE OR REPLACE FUNCTION public._quote_cart(_uid uuid, _coupon text, _delivery public.delivery_method)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
declare
  me public.profiles; is_pro boolean := false; pct numeric := 0;
  c public.coupons; coupon_err text; has_restr boolean := false; cfound boolean := false;
  r record; items jsonb := '[]'::jsonb; out_items jsonb := '[]'::jsonb; e jsonb;
  subtotal numeric := 0; elig_sub numeric := 0; disc numeric := 0; remaining numeric;
  issue text; base numeric; unit numeric; promo boolean; elig boolean; note text;
  idx int := 0; last_elig int := -1; share numeric; any_issue boolean := false; shipping numeric;
begin
  select * into me from public.profiles where id = _uid;
  is_pro := coalesce(me.account_type = 'profissional' and me.pro_status = 'aprovado', false);
  if is_pro then pct := least(100, greatest(0, coalesce(me.individual_discount_percent, 0))); end if;

  if nullif(trim(coalesce(_coupon, '')), '') is not null then
    select * into c from public.coupons where upper(code) = upper(trim(_coupon));
    cfound := found;
    if not cfound then coupon_err := 'Cupom não encontrado.';
    elsif c.status <> 'ativo' then coupon_err := 'Este cupom não está ativo.';
    elsif c.starts_at is not null and c.starts_at > now() then coupon_err := 'Este cupom ainda não está válido.';
    elsif c.ends_at is not null and c.ends_at < now() then coupon_err := 'Este cupom expirou.';
    elsif c.max_uses is not null and c.uses_count >= c.max_uses then coupon_err := 'Este cupom atingiu o limite de utilizações.';
    elsif c.audience = 'comuns' and is_pro then coupon_err := 'Este cupom é válido apenas para clientes comuns.';
    elsif c.audience = 'profissionais' and not is_pro then coupon_err := 'Este cupom é exclusivo para profissionais aprovados.';
    end if;
    if cfound then
      has_restr := exists (select 1 from public.coupon_products where coupon_id = c.id)
                or exists (select 1 from public.coupon_categories where coupon_id = c.id);
    end if;
  end if;

  for r in
    select ci.product_id as cid, ci.quantity as qty, p.*
    from public.cart_items ci left join public.products p on p.id = ci.product_id
    where ci.user_id = _uid order by ci.added_at, ci.product_id
  loop
    issue := null; note := null; unit := 0; promo := false; elig := false;
    if r.id is null then issue := 'Produto não existe mais.';
    elsif r.status <> 'ativo' then issue := 'Produto indisponível no momento.';
    elsif r.availability <> 'disponivel' then issue := 'Produto esgotado.';
    elsif r.audience = 'profissionais' and not is_pro then issue := 'Produto exclusivo para profissionais aprovados.';
    elsif r.qty < 1 or r.qty > 99 then issue := 'Quantidade inválida.';
    end if;
    if r.id is not null and (r.audience = 'todos' or is_pro) then
      base := case when is_pro then coalesce(r.pro_price, r.price) else r.price end;
      unit := round(base * (1 - pct / 100), 2);
    end if;
    if r.id is not null then
      promo := exists (
        select 1 from public.promotion_products pp join public.promotions pr on pr.id = pp.promotion_id
        where pp.product_id = r.id and pr.status = 'ativo'
          and (pr.starts_at is null or pr.starts_at <= now()) and (pr.ends_at is null or pr.ends_at >= now())
          and (pr.audience = 'todos' or (pr.audience = 'profissionais' and is_pro) or (pr.audience = 'comuns' and not is_pro)));
    end if;
    if issue is null and cfound and coupon_err is null then
      if promo then note := 'Produto em promoção: o cupom não se aplica.';
      elsif has_restr and not (
        exists (select 1 from public.coupon_products where coupon_id = c.id and product_id = r.id)
        or exists (select 1 from public.coupon_categories where coupon_id = c.id and category_id = r.category_id))
      then note := 'Produto fora das regras deste cupom.';
      else elig := true; end if;
    end if;
    if issue is not null then any_issue := true;
    else
      subtotal := subtotal + unit * r.qty;
      if elig then elig_sub := elig_sub + unit * r.qty; last_elig := idx; end if;
    end if;
    items := items || jsonb_build_object(
      'product_id', r.cid, 'name', coalesce(r.name, 'Produto removido'), 'image_url', r.image_url, 'size_label', r.size_label,
      'quantity', r.qty, 'original_price', coalesce(r.price, 0), 'unit_price', unit, 'line_total', unit * r.qty,
      'in_promotion', promo, 'coupon_eligible', elig, 'coupon_note', note, 'issue', issue, 'coupon_discount', 0);
    idx := idx + 1;
  end loop;

  if cfound and coupon_err is null then
    if elig_sub = 0 then coupon_err := 'Nenhum produto do carrinho pode receber este cupom.';
    elsif c.min_order_value is not null and subtotal < c.min_order_value then
      coupon_err := 'Este cupom exige pedido mínimo de R$ ' || replace(to_char(c.min_order_value, 'FM999999990.00'), '.', ',') || '.';
    elsif c.discount_type = 'percentual' then disc := round(elig_sub * least(c.discount_value, 100) / 100, 2);
    else disc := least(c.discount_value, elig_sub);
    end if;
  end if;

  remaining := disc; idx := 0;
  for e in select value from jsonb_array_elements(items) loop
    if disc > 0 and (e->>'coupon_eligible')::boolean and e->>'issue' is null then
      share := case when idx = last_elig then remaining else round(disc * (e->>'line_total')::numeric / elig_sub, 2) end;
      remaining := remaining - share;
      e := jsonb_set(e, '{coupon_discount}', to_jsonb(share));
    end if;
    if coupon_err is not null then e := jsonb_set(e, '{coupon_eligible}', 'false'::jsonb); end if;
    out_items := out_items || e; idx := idx + 1;
  end loop;

  shipping := case when _delivery = 'retirada' then 0 else null end;
  return jsonb_build_object(
    'items', out_items, 'empty', jsonb_array_length(out_items) = 0, 'has_issues', any_issue, 'is_pro', is_pro,
    'products_total', subtotal, 'discount', disc, 'shipping', shipping,
    'total', subtotal - disc + coalesce(shipping, 0),
    'coupon', case when cfound and coupon_err is null then jsonb_build_object('id', c.id, 'code', c.code) else null end,
    'coupon_error', coupon_err);
end; $$;
REVOKE EXECUTE ON FUNCTION public._quote_cart(uuid, text, public.delivery_method) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.quote_cart(_coupon text, _delivery public.delivery_method)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  return public._quote_cart(auth.uid(), _coupon, _delivery);
end; $$;
REVOKE EXECUTE ON FUNCTION public.quote_cart(text, public.delivery_method) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.quote_cart(text, public.delivery_method) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_order(_coupon text, _delivery public.delivery_method, _address jsonb, _note text, _request_id uuid)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare
  uid uuid := auth.uid(); q jsonb; oid bigint; addr_id uuid; addr jsonb; me public.profiles; e jsonb; cid uuid;
begin
  if uid is null then raise exception 'Faça login para finalizar o pedido.'; end if;
  perform pg_advisory_xact_lock(hashtext('order:' || uid::text));
  if _request_id is not null then
    select id into oid from public.orders where user_id = uid and client_request_id = _request_id;
    if oid is not null then return oid; end if;
  end if;
  select * into me from public.profiles where id = uid;
  if me.id is null or me.account_status <> 'ativa' then raise exception 'Conta indisponível.'; end if;

  if nullif(trim(coalesce(_coupon, '')), '') is not null then
    perform 1 from public.coupons where upper(code) = upper(trim(_coupon)) for update;
  end if;
  q := public._quote_cart(uid, _coupon, _delivery);
  if (q->>'empty')::boolean then raise exception 'Seu carrinho está vazio.'; end if;
  if (q->>'has_issues')::boolean then raise exception 'Alguns itens do carrinho estão indisponíveis. Revise o carrinho.'; end if;
  if nullif(trim(coalesce(_coupon, '')), '') is not null and q->>'coupon_error' is not null then raise exception '%', q->>'coupon_error'; end if;

  if _delivery = 'entrega' then
    if coalesce(trim(_address->>'street'), '') = '' or coalesce(trim(_address->>'city'), '') = '' or coalesce(trim(_address->>'state'), '') = '' then
      raise exception 'Informe rua, cidade e estado para a entrega.';
    end if;
    addr := jsonb_build_object(
      'street', left(trim(_address->>'street'), 200), 'number', left(trim(coalesce(_address->>'number', '')), 20),
      'complement', left(trim(coalesce(_address->>'complement', '')), 120), 'district', left(trim(coalesce(_address->>'district', '')), 120),
      'city', left(trim(_address->>'city'), 120), 'state', upper(left(trim(_address->>'state'), 2)), 'zip', left(regexp_replace(coalesce(_address->>'zip', ''), '\D', '', 'g'), 8));
    select id into addr_id from public.addresses where user_id = uid order by is_default desc, updated_at desc limit 1;
    if addr_id is null then
      insert into public.addresses (user_id, label, street, number, complement, district, city, state, zip, is_default)
      values (uid, 'Entrega', addr->>'street', addr->>'number', addr->>'complement', addr->>'district', addr->>'city', addr->>'state', addr->>'zip', true)
      returning id into addr_id;
    else
      update public.addresses set street = addr->>'street', number = addr->>'number', complement = addr->>'complement',
        district = addr->>'district', city = addr->>'city', state = addr->>'state', zip = addr->>'zip', is_default = true
      where id = addr_id;
    end if;
  end if;

  cid := nullif(q->'coupon'->>'id', '')::uuid;
  perform set_config('rarity.note', 'Pedido criado pelo cliente', true);
  insert into public.orders (user_id, customer_type, status, delivery_method, address_id, delivery_address,
    products_total, discount, shipping, total, coupon_id, note, client_request_id)
  values (uid, me.account_type, 'em_negociacao', _delivery, addr_id, addr,
    (q->>'products_total')::numeric, (q->>'discount')::numeric, (q->>'shipping')::numeric, (q->>'total')::numeric,
    cid, nullif(left(trim(coalesce(_note, '')), 500), ''), _request_id)
  returning id into oid;
  perform set_config('rarity.note', '', true);

  for e in select value from jsonb_array_elements(q->'items') loop
    insert into public.order_items (order_id, product_id, product_name, quantity, original_price, discount, unit_price, item_total)
    values (oid, e->>'product_id', e->>'name' || coalesce(' — ' || nullif(e->>'size_label', ''), ''), (e->>'quantity')::int,
      (e->>'original_price')::numeric, (e->>'coupon_discount')::numeric, (e->>'unit_price')::numeric,
      (e->>'line_total')::numeric - (e->>'coupon_discount')::numeric);
  end loop;
  if cid is not null then update public.coupons set uses_count = uses_count + 1 where id = cid; end if;
  delete from public.cart_items where user_id = uid;
  return oid;
end; $$;
REVOKE EXECUTE ON FUNCTION public.create_order(text, public.delivery_method, jsonb, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order(text, public.delivery_method, jsonb, text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_order(_order_id bigint, _status text, _shipping numeric, _tecnobyte boolean, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare o public.orders; changes text := ''; n text := nullif(trim(coalesce(_note, '')), '');
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Acesso negado'; end if;
  select * into o from public.orders where id = _order_id for update;
  if o.id is null then raise exception 'Pedido não encontrado'; end if;
  if _shipping is not null and _shipping < 0 then raise exception 'Frete inválido'; end if;
  if o.shipping is distinct from _shipping then
    changes := changes || 'Frete: ' || coalesce('R$ ' || replace(to_char(o.shipping, 'FM999999990.00'), '.', ','), 'a combinar')
      || ' → ' || coalesce('R$ ' || replace(to_char(_shipping, 'FM999999990.00'), '.', ','), 'a combinar') || '. ';
  end if;
  if o.tecnobyte_registered is distinct from _tecnobyte then
    changes := changes || 'Tecnobyte: ' || case when _tecnobyte then 'registrada' else 'não registrada' end || '. ';
  end if;
  if o.shipping is distinct from _shipping and n is null then raise exception 'Informe o motivo da alteração do frete.'; end if;
  if _status = 'cancelado' and o.status::text <> 'cancelado' and n is null then raise exception 'Informe o motivo do cancelamento.'; end if;

  perform set_config('rarity.note', coalesce(n, ''), true);
  update public.orders set status = _status::public.order_status, shipping = _shipping,
    tecnobyte_registered = coalesce(_tecnobyte, false), total = products_total - discount + coalesce(_shipping, 0)
  where id = _order_id;
  perform set_config('rarity.note', '', true);
  if changes <> '' then
    insert into public.order_history (order_id, changed_by, old_status, new_status, change_note)
    values (_order_id, auth.uid(), _status::public.order_status, _status::public.order_status, trim(changes || coalesce('Motivo: ' || n, '')));
  end if;
end; $$;
REVOKE EXECUTE ON FUNCTION public.admin_update_order(bigint, text, numeric, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_order(bigint, text, numeric, boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_order_item(_item_id bigint, _quantity int, _unit_price numeric, _discount numeric, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare i public.order_items; o public.orders; n text := nullif(trim(coalesce(_note, '')), ''); pt numeric; d numeric;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Acesso negado'; end if;
  if n is null then raise exception 'Informe o motivo da alteração.'; end if;
  if _quantity < 1 or _unit_price < 0 or _discount < 0 or _discount > _quantity * _unit_price then raise exception 'Valores inválidos'; end if;
  select * into i from public.order_items where id = _item_id;
  if i.id is null then raise exception 'Item não encontrado'; end if;
  select * into o from public.orders where id = i.order_id for update;
  update public.order_items set quantity = _quantity, unit_price = _unit_price, discount = _discount,
    item_total = _quantity * _unit_price - _discount where id = _item_id;
  select sum(quantity * unit_price), sum(discount) into pt, d from public.order_items where order_id = o.id;
  update public.orders set products_total = pt, discount = d, total = pt - d + coalesce(shipping, 0) where id = o.id;
  insert into public.order_history (order_id, changed_by, old_status, new_status, change_note)
  values (o.id, auth.uid(), o.status, o.status,
    'Item "' || i.product_name || '": qtd ' || i.quantity || ' → ' || _quantity
    || ', preço R$ ' || replace(to_char(i.unit_price, 'FM999999990.00'), '.', ',') || ' → R$ ' || replace(to_char(_unit_price, 'FM999999990.00'), '.', ',')
    || ', desconto R$ ' || replace(to_char(i.discount, 'FM999999990.00'), '.', ',') || ' → R$ ' || replace(to_char(_discount, 'FM999999990.00'), '.', ',')
    || '. Motivo: ' || n);
end; $$;
REVOKE EXECUTE ON FUNCTION public.admin_update_order_item(bigint, int, numeric, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_order_item(bigint, int, numeric, numeric, text) TO authenticated;