create type public.target_audience as enum ('todos', 'comuns', 'profissionais');

alter table public.coupons add column audience public.target_audience not null default 'todos';
alter table public.promotions add column audience public.target_audience not null default 'todos';

create table public.coupon_products (
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  primary key (coupon_id, product_id)
);
grant select, insert, update, delete on public.coupon_products to authenticated;
grant all on public.coupon_products to service_role;
alter table public.coupon_products enable row level security;
create policy "Admin coupon products" on public.coupon_products for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.coupon_categories (
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  category_id text not null references public.categories(id) on delete cascade,
  primary key (coupon_id, category_id)
);
grant select, insert, update, delete on public.coupon_categories to authenticated;
grant all on public.coupon_categories to service_role;
alter table public.coupon_categories enable row level security;
create policy "Admin coupon categories" on public.coupon_categories for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.decide_pro_request(_request_id uuid, _approve boolean, _note text)
returns void language plpgsql security definer set search_path = public as $$
declare r public.pro_requests;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Acesso negado'; end if;
  select * into r from public.pro_requests where id = _request_id for update;
  if not found then raise exception 'Solicitação não encontrada'; end if;
  if r.status <> 'em_analise' then raise exception 'Solicitação já decidida'; end if;
  if not _approve and coalesce(trim(_note), '') = '' then raise exception 'Informe o motivo da rejeição'; end if;
  update public.pro_requests set status = case when _approve then 'aprovado'::request_status else 'rejeitado'::request_status end,
    decided_at = now(), decided_by = auth.uid(), decision_note = nullif(trim(_note), '')
  where id = _request_id;
  if _approve then
    update public.profiles set pro_status = 'aprovado', account_type = 'profissional' where id = r.user_id;
    insert into public.notifications (user_id, title, body, link)
    values (r.user_id, 'Conta profissional aprovada', 'Sua solicitação foi aprovada. Os preços profissionais já estão disponíveis para você.', '/minha-conta');
  else
    update public.profiles set pro_status = 'rejeitado', account_type = 'comum' where id = r.user_id;
    insert into public.notifications (user_id, title, body, link)
    values (r.user_id, 'Conta profissional não aprovada', 'Sua solicitação foi rejeitada. Motivo: ' || trim(_note) || '. Você pode enviar uma nova solicitação em Minha conta.', '/minha-conta');
  end if;
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), case when _approve then 'approve' else 'reject' end, 'pro_request', _request_id::text, jsonb_build_object('note', _note));
end; $$;
revoke all on function public.decide_pro_request(uuid, boolean, text) from public, anon;
grant execute on function public.decide_pro_request(uuid, boolean, text) to authenticated;