REVOKE EXECUTE ON FUNCTION public.quantity_discounts_validate() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.quantity_discounts_audit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._qty_tier(text, integer) FROM PUBLIC, anon, authenticated;