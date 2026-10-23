CREATE OR REPLACE FUNCTION public.admin_catalog_preview(_mode text)
RETURNS TABLE (
  id text, name text, category_id text, category_name text, description text, image_url text,
  price numeric, pro_price numeric, audience public.product_audience, availability public.availability,
  is_kit boolean, size_group text, size_label text, created_at timestamptz,
  original_price numeric, final_price numeric, in_promotion boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;
  IF _mode IS NULL OR _mode NOT IN ('normal', 'profissional') THEN
    RAISE EXCEPTION 'Modo de visualização inválido' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
  WITH base AS (
    SELECT p.*, (_mode = 'profissional') AS pro,
      CASE WHEN p.audience = 'profissionais' AND _mode = 'normal' THEN NULL
           WHEN _mode = 'profissional' THEN round(coalesce(p.pro_price, p.price), 2)
           ELSE round(p.price, 2) END AS applicable
    FROM public.products p WHERE p.status = 'ativo'
  )
  SELECT b.id, b.name, b.category_id, c.name, b.description, b.image_url,
    CASE WHEN b.applicable IS NULL THEN NULL ELSE b.price END,
    CASE WHEN b.pro THEN b.pro_price ELSE NULL END,
    b.audience, b.availability, b.is_kit, b.size_group, b.size_label, b.created_at,
    b.applicable,
    CASE WHEN b.applicable IS NULL THEN NULL ELSE public._promo_price(b.id, b.applicable, b.pro) END,
    CASE WHEN b.applicable IS NULL THEN false ELSE public._has_promo(b.id, b.pro) END
  FROM base b LEFT JOIN public.categories c ON c.id = b.category_id AND c.status = 'ativo';
END;
$$;
REVOKE ALL ON FUNCTION public.admin_catalog_preview(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_catalog_preview(text) TO authenticated;
COMMENT ON FUNCTION public.admin_catalog_preview(text) IS 'Admin-only storefront preview of normal or approved professional prices, without personal discount; does not affect account, cart quote or orders.';