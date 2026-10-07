CREATE TABLE public.home_section_products (
  section text NOT NULL CHECK (section IN ('featured','best_sellers')),
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (section, product_id)
);
GRANT SELECT ON public.home_section_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_section_products TO authenticated;
GRANT ALL ON public.home_section_products TO service_role;
ALTER TABLE public.home_section_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public home sections" ON public.home_section_products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin home sections" ON public.home_section_products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public catalog: active products incl. pro-only ones; prices masked unless caller is an approved professional.
CREATE OR REPLACE FUNCTION public.catalog_products()
RETURNS TABLE (
  id text, name text, category_id text, category_name text, description text, image_url text,
  price numeric, pro_price numeric, audience product_audience, availability availability,
  is_kit boolean, size_group text, size_label text, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH me AS (
    SELECT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND pro_status = 'aprovado' AND account_type = 'profissional') AS pro
  )
  SELECT p.id, p.name, p.category_id, c.name, p.description, p.image_url,
    CASE WHEN p.audience = 'profissionais' AND NOT me.pro THEN NULL ELSE p.price END,
    CASE WHEN me.pro THEN p.pro_price ELSE NULL END,
    p.audience, p.availability, p.is_kit, p.size_group, p.size_label, p.created_at
  FROM products p
  CROSS JOIN me
  LEFT JOIN categories c ON c.id = p.category_id AND c.status = 'ativo'
  WHERE p.status = 'ativo'
$$;
REVOKE ALL ON FUNCTION public.catalog_products() FROM public;
GRANT EXECUTE ON FUNCTION public.catalog_products() TO anon, authenticated;