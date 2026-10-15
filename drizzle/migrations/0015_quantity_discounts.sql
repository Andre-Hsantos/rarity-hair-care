CREATE TABLE public.quantity_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL REFERENCES public.products(id),
  min_quantity integer NOT NULL CHECK (min_quantity BETWEEN 2 AND 99),
  percent numeric(5,2) NOT NULL CHECK (percent > 0 AND percent <= 100),
  status public.record_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, min_quantity)
);
GRANT SELECT ON public.quantity_discounts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quantity_discounts TO authenticated;
GRANT ALL ON public.quantity_discounts TO service_role;
ALTER TABLE public.quantity_discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qd public read active" ON public.quantity_discounts FOR SELECT TO anon, authenticated
  USING (status = 'ativo' AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.status = 'ativo'));
CREATE POLICY "qd admin all" ON public.quantity_discounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER quantity_discounts_updated BEFORE UPDATE ON public.quantity_discounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.quantity_discounts_validate() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  if new.status = 'ativo' and exists (
    select 1 from public.quantity_discounts q where q.product_id = new.product_id and q.id <> new.id and q.status = 'ativo'
      and ((q.min_quantity < new.min_quantity and q.percent >= new.percent) or (q.min_quantity > new.min_quantity and q.percent <= new.percent)))
  then raise exception 'Faixa conflitante: quantidades maiores devem ter percentual maior.'; end if;
  return new;
end; $$;
CREATE TRIGGER quantity_discounts_check BEFORE INSERT OR UPDATE ON public.quantity_discounts FOR EACH ROW EXECUTE FUNCTION public.quantity_discounts_validate();

CREATE OR REPLACE FUNCTION public.quantity_discounts_audit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), lower(tg_op), 'quantity_discount', coalesce(new.product_id, old.product_id),
    jsonb_build_object('min_quantity', coalesce(new.min_quantity, old.min_quantity), 'percent', coalesce(new.percent, old.percent), 'status', coalesce(new.status, old.status)));
  return coalesce(new, old);
end; $$;
CREATE TRIGGER quantity_discounts_log AFTER INSERT OR UPDATE OR DELETE ON public.quantity_discounts FOR EACH ROW EXECUTE FUNCTION public.quantity_discounts_audit();

ALTER TABLE public.coupons ADD COLUMN allow_with_quantity_discount boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public._qty_tier(_product_id text, _qty integer)
 RETURNS TABLE(min_quantity integer, percent numeric) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT q.min_quantity, q.percent FROM public.quantity_discounts q
  WHERE q.product_id = _product_id AND q.status = 'ativo' AND q.min_quantity <= _qty
  ORDER BY q.percent DESC, q.min_quantity DESC LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public._quote_cart(_uid uuid, _coupon text, _delivery delivery_method)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare
  me public.profiles; is_pro boolean := false; pct numeric := 0;
  c public.coupons; coupon_err text; has_restr boolean := false; cfound boolean := false;
  r record; items jsonb := '[]'::jsonb; out_items jsonb := '[]'::jsonb; e jsonb;
  subtotal numeric := 0; elig_sub numeric := 0; disc numeric := 0; remaining numeric;
  issue text; base numeric; pre numeric; list numeric; unit numeric; promo boolean; elig boolean; note text;
  idx int := 0; last_elig int := -1; share numeric; any_issue boolean := false; shipping numeric;
  qmin int; qpct numeric; eff numeric; qty_applied boolean;
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
    issue := null; note := null; unit := 0; pre := 0; list := 0; promo := false; elig := false;
    qmin := null; qpct := 0; qty_applied := false;
    if r.id is null then issue := 'Produto não existe mais.';
    elsif r.status <> 'ativo' then issue := 'Produto indisponível no momento.';
    elsif r.availability <> 'disponivel' then issue := 'Produto esgotado.';
    elsif r.audience = 'profissionais' and not is_pro then issue := 'Produto exclusivo para profissionais aprovados.';
    elsif r.qty < 1 or r.qty > 99 then issue := 'Quantidade inválida.';
    end if;
    if r.id is not null and (r.audience = 'todos' or is_pro) then
      base := case when is_pro then coalesce(r.pro_price, r.price) else r.price end;
      select t.min_quantity, t.percent into qmin, qpct from public._qty_tier(r.id, r.qty) t;
      qpct := coalesce(qpct, 0);
      -- Quantity tier vs individual pro discount: only the larger one applies, never both.
      qty_applied := qpct > pct;
      eff := greatest(pct, qpct);
      list := round(base * (1 - pct / 100), 2);
      pre := round(base * (1 - eff / 100), 2);
      unit := public._promo_price(r.id, pre, is_pro);
      promo := public._has_promo(r.id, is_pro);
    end if;
    if issue is null and cfound and coupon_err is null then
      if promo then note := 'Produto em promoção: o cupom não se aplica.';
      elsif qty_applied and not c.allow_with_quantity_discount then note := 'Produto com desconto por quantidade: o cupom não se aplica.';
      elsif has_restr and not (
        exists (select 1 from public.coupon_products where coupon_id = c.id and product_id = r.id)
        or exists (select 1 from public.coupon_categories where coupon_id = c.id and category_id = r.category_id) or exists (select 1 from public.coupon_categories cc join public.product_categories pc on pc.category_id = cc.category_id where cc.coupon_id = c.id and pc.product_id = r.id))
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
      'quantity', r.qty, 'original_price', pre, 'list_price', list, 'unit_price', unit, 'line_total', unit * r.qty,
      'in_promotion', promo, 'qty_discount_applied', qty_applied, 'qty_min', case when qty_applied then qmin end,
      'qty_percent', case when qty_applied then qpct end,
      'coupon_eligible', elig, 'coupon_note', note, 'issue', issue, 'coupon_discount', 0);
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
end; $function$;

CREATE OR REPLACE FUNCTION public.admin_delete_product(_product_id text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare p public.products; affected bigint[]; removed_orders int := 0; img_shared boolean := false;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Acesso negado'; end if;
  select * into p from public.products where id = _product_id for update;
  if p.id is null then raise exception 'Produto não encontrado'; end if;
  select coalesce(array_agg(distinct order_id), '{}') into affected from public.order_items where product_id = _product_id;
  delete from public.order_items where product_id = _product_id;
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
  delete from public.quantity_discounts where product_id = _product_id;
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
end; $function$;