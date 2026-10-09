CREATE TABLE public.product_categories (
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id text NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);
CREATE INDEX product_categories_category_idx ON public.product_categories(category_id);
GRANT SELECT ON public.product_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product categories" ON public.product_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage product categories" ON public.product_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.product_categories (product_id, category_id)
SELECT id, category_id FROM public.products WHERE category_id IS NOT NULL ON CONFLICT DO NOTHING;

DO $do$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public._quote_cart(uuid,text,delivery_method)'::regprocedure);
  d := replace(d, 'category_id = r.category_id)',
    'category_id = r.category_id) or exists (select 1 from public.coupon_categories cc join public.product_categories pc on pc.category_id = cc.category_id where cc.coupon_id = c.id and pc.product_id = r.id)');
  EXECUTE d;
  d := pg_get_functiondef('public.admin_delete_category(text)'::regprocedure);
  d := replace(d, 'from public.products where category_id = _id;',
    'from public.products p where p.category_id = _id or exists (select 1 from public.product_categories pc where pc.product_id = p.id and pc.category_id = _id);');
  EXECUTE d;
END $do$;