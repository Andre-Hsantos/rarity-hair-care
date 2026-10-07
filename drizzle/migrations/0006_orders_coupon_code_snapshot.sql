ALTER TABLE public.orders ADD COLUMN coupon_code text;
CREATE OR REPLACE FUNCTION public.orders_set_coupon_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  if new.coupon_id is not null and new.coupon_code is null then
    select code into new.coupon_code from public.coupons where id = new.coupon_id;
  end if;
  return new;
end; $$;
REVOKE EXECUTE ON FUNCTION public.orders_set_coupon_code() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER orders_coupon_code BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.orders_set_coupon_code();