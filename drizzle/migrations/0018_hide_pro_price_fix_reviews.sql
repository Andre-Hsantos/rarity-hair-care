CREATE OR REPLACE FUNCTION public._product_is_active(_id text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select exists(select 1 from public.products where id = _id and status = 'ativo')
$$;
REVOKE EXECUTE ON FUNCTION public._product_is_active(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._product_is_active(text) TO anon, authenticated;

DROP POLICY IF EXISTS "qd public read active" ON public.quantity_discounts;
CREATE POLICY "qd public read active" ON public.quantity_discounts FOR SELECT TO anon, authenticated
  USING (status = 'ativo' AND public._product_is_active(product_id));

DROP POLICY IF EXISTS "Public products" ON public.products;
DROP POLICY IF EXISTS "Pro products" ON public.products;

DROP POLICY IF EXISTS "Public approved reviews" ON public.reviews;
CREATE POLICY "Anon approved reviews" ON public.reviews FOR SELECT TO anon USING (approved);
CREATE POLICY "Auth reviews read" ON public.reviews FOR SELECT TO authenticated
  USING (approved OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));