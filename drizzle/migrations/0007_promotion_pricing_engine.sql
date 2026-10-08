-- Pure money rule for a single promotion over a base price.
CREATE OR REPLACE FUNCTION public._promo_apply(_base numeric, _type public.discount_type, _value numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT CASE WHEN _type = 'percentual' THEN round(_base * (1 - least(100, greatest(0, _value)) / 100), 2)
              ELSE greatest(0, round(_base - greatest(0, _value), 2)) END
$$;
REVOKE EXECUTE ON FUNCTION public._promo_apply(numeric, public.discount_type, numeric) FROM PUBLIC, anon, authenticated;

-- Price after the single best active promotion for this customer type (lowest resulting price; ties → earliest created).
-- Returns _base unchanged when no promotion applies. Never stacks promotions.
CREATE OR REPLACE FUNCTION public._promo_price(_product_id text, _base numeric, _is_pro boolean)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT coalesce((
    SELECT public._promo_apply(_base, pr.discount_type, pr.discount_value)
    FROM public.promotion_products pp JOIN public.promotions pr ON pr.id = pp.promotion_id
    WHERE pp.product_id = _product_id AND pr.status = 'ativo'
      AND (pr.starts_at IS NULL OR pr.starts_at <= now()) AND (pr.ends_at IS NULL OR pr.ends_at >= now())
      AND (pr.audience = 'todos' OR (pr.audience = 'profissionais' AND _is_pro) OR (pr.audience = 'comuns' AND NOT _is_pro))
    ORDER BY public._promo_apply(_base, pr.discount_type, pr.discount_value) ASC, pr.created_at ASC, pr.id ASC
    LIMIT 1), _base)
$$;
REVOKE EXECUTE ON FUNCTION public._promo_price(text, numeric, boolean) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public._has_promo(_product_id text, _is_pro boolean)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.promotion_products pp JOIN public.promotions pr ON pr.id = pp.promotion_id
    WHERE pp.product_id = _product_id AND pr.status = 'ativo'
      AND (pr.starts_at IS NULL OR pr.starts_at <= now()) AND (pr.ends_at IS NULL OR pr.ends_at >= now())
      AND (pr.audience = 'todos' OR (pr.audience = 'profissionais' AND _is_pro) OR (pr.audience = 'comuns' AND NOT _is_pro)))
$$;
REVOKE EXECUTE ON FUNCTION public._has_promo(text, boolean) FROM PUBLIC, anon, authenticated;

-- Catalog now returns the final per-visitor price computed by the same rule as the cart.
DROP FUNCTION IF EXISTS public.catalog_products();
CREATE FUNCTION public.catalog_products()
RETURNS TABLE (
  id text, name text, category_id text, category_name text, description text, image_url text,
  price numeric, pro_price numeric, audience product_audience, availability availability,
  is_kit boolean, size_group text, size_label text, created_at timestamptz,
  original_price numeric, final_price numeric, in_promotion boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH me AS (
    SELECT coalesce(bool_or(true), false) AS pro, coalesce(max(least(100, greatest(0, individual_discount_percent))), 0) AS pct
    FROM profiles WHERE profiles.id = auth.uid() AND pro_status = 'aprovado' AND account_type = 'profissional'
  ), base AS (
    SELECT p.*, me.pro,
      CASE WHEN p.audience = 'profissionais' AND NOT me.pro THEN NULL
           WHEN me.pro THEN round(coalesce(p.pro_price, p.price) * (1 - me.pct / 100), 2)
           ELSE round(p.price, 2) END AS applicable
    FROM products p CROSS JOIN me WHERE p.status = 'ativo'
  )
  SELECT b.id, b.name, b.category_id, c.name, b.description, b.image_url,
    CASE WHEN b.applicable IS NULL THEN NULL ELSE b.price END,
    CASE WHEN b.pro THEN b.pro_price ELSE NULL END,
    b.audience, b.availability, b.is_kit, b.size_group, b.size_label, b.created_at,
    b.applicable,
    CASE WHEN b.applicable IS NULL THEN NULL ELSE public._promo_price(b.id, b.applicable, b.pro) END,
    CASE WHEN b.applicable IS NULL THEN false ELSE public._has_promo(b.id, b.pro) END
  FROM base b
  LEFT JOIN categories c ON c.id = b.category_id AND c.status = 'ativo'
$$;
REVOKE ALL ON FUNCTION public.catalog_products() FROM public;
GRANT EXECUTE ON FUNCTION public.catalog_products() TO anon, authenticated;

-- Cart engine: applicable price → individual pro discount → promotion. original_price = price before promotion.
CREATE OR REPLACE FUNCTION public._quote_cart(_uid uuid, _coupon text, _delivery public.delivery_method)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
declare
  me public.profiles; is_pro boolean := false; pct numeric := 0;
  c public.coupons; coupon_err text; has_restr boolean := false; cfound boolean := false;
  r record; items jsonb := '[]'::jsonb; out_items jsonb := '[]'::jsonb; e jsonb;
  subtotal numeric := 0; elig_sub numeric := 0; disc numeric := 0; remaining numeric;
  issue text; base numeric; pre numeric; unit numeric; promo boolean; elig boolean; note text;
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
    issue := null; note := null; unit := 0; pre := 0; promo := false; elig := false;
    if r.id is null then issue := 'Produto não existe mais.';
    elsif r.status <> 'ativo' then issue := 'Produto indisponível no momento.';
    elsif r.availability <> 'disponivel' then issue := 'Produto esgotado.';
    elsif r.audience = 'profissionais' and not is_pro then issue := 'Produto exclusivo para profissionais aprovados.';
    elsif r.qty < 1 or r.qty > 99 then issue := 'Quantidade inválida.';
    end if;
    if r.id is not null and (r.audience = 'todos' or is_pro) then
      base := case when is_pro then coalesce(r.pro_price, r.price) else r.price end;
      pre := round(base * (1 - pct / 100), 2);
      unit := public._promo_price(r.id, pre, is_pro);
      promo := public._has_promo(r.id, is_pro);
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
      'quantity', r.qty, 'original_price', pre, 'unit_price', unit, 'line_total', unit * r.qty,
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