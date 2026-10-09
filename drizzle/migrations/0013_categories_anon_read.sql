DROP POLICY IF EXISTS "Public active categories" ON public.categories;
CREATE POLICY "Anon active categories" ON public.categories FOR SELECT TO anon USING (status = 'ativo'::record_status);
CREATE POLICY "Auth active categories" ON public.categories FOR SELECT TO authenticated USING (status = 'ativo'::record_status OR public.has_role(auth.uid(), 'admin'::app_role));