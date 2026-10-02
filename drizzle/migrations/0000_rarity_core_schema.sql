create type public.app_role as enum ('admin', 'user');
create type public.account_type as enum ('comum', 'profissional');
create type public.pro_status as enum ('nao_solicitado', 'em_analise', 'aprovado', 'rejeitado');
create type public.account_status as enum ('ativa', 'excluida');
create type public.product_audience as enum ('todos', 'profissionais');
create type public.availability as enum ('disponivel', 'esgotado');
create type public.record_status as enum ('ativo', 'inativo');
create type public.proof_type as enum ('cnpj', 'mei', 'certificado');
create type public.request_status as enum ('em_analise', 'aprovado', 'rejeitado');
create type public.order_status as enum ('recebido', 'em_negociacao', 'confirmado', 'pronto_retirada', 'enviado', 'concluido', 'cancelado');
create type public.delivery_method as enum ('retirada', 'entrega');
create type public.discount_type as enum ('percentual', 'valor_fixo');

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.profiles (
  id uuid primary key,
  name text not null,
  cpf text unique,
  phone text,
  birth_date date,
  email text not null unique,
  account_type public.account_type not null default 'comum',
  pro_status public.pro_status not null default 'nao_solicitado',
  account_status public.account_status not null default 'ativa',
  individual_discount_percent numeric(5,2) not null default 0 check (individual_discount_percent between 0 and 100),
  created_at timestamptz not null default now(),
  last_access_at timestamptz,
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Own profile read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Own profile insert" on public.profiles for insert to authenticated
  with check (id = auth.uid() and account_type = 'comum' and pro_status = 'nao_solicitado' and individual_discount_percent = 0);
create policy "Admin profile update" on public.profiles for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.update_own_profile(_name text, _phone text, _birth_date date, _cpf text)
returns void language sql security definer set search_path = public as $$
  update public.profiles set name = _name, phone = _phone, birth_date = _birth_date, cpf = _cpf
  where id = auth.uid();
$$;
revoke execute on function public.update_own_profile(text, text, date, text) from public, anon;
grant execute on function public.update_own_profile(text, text, date, text) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  street text not null, number text, complement text, district text,
  city text not null, state text not null, zip text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;
alter table public.addresses enable row level security;
create policy "Own addresses" on public.addresses for all to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create trigger addresses_updated before update on public.addresses for each row execute function public.set_updated_at();

create table public.categories (
  id text primary key,
  name text not null,
  description text,
  status public.record_status not null default 'ativo',
  image_url text,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Public active categories" on public.categories for select to anon, authenticated
  using (status = 'ativo' or public.has_role(auth.uid(), 'admin'));
create policy "Admin categories" on public.categories for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger categories_updated before update on public.categories for each row execute function public.set_updated_at();

create table public.products (
  id text primary key,
  name text not null,
  category_id text references public.categories(id) on delete set null,
  description text,
  image_url text,
  price numeric(10,2) not null check (price >= 0),
  pro_price numeric(10,2) check (pro_price >= 0),
  audience public.product_audience not null default 'todos',
  availability public.availability not null default 'disponivel',
  status public.record_status not null default 'ativo',
  is_kit boolean not null default false,
  size_group text,
  size_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.products (category_id);
create index on public.products (size_group);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Public products" on public.products for select to anon, authenticated
  using (status = 'ativo' and audience = 'todos');
create policy "Pro products" on public.products for select to authenticated
  using (status = 'ativo' and audience = 'profissionais'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.pro_status = 'aprovado'));
create policy "Admin products" on public.products for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();

create table public.kit_items (
  kit_id text not null references public.products(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  quantity int not null default 1 check (quantity > 0),
  primary key (kit_id, product_id),
  check (kit_id <> product_id)
);
grant select on public.kit_items to anon, authenticated;
grant insert, update, delete on public.kit_items to authenticated;
grant all on public.kit_items to service_role;
alter table public.kit_items enable row level security;
create policy "Public kit items" on public.kit_items for select to anon, authenticated using (true);
create policy "Admin kit items" on public.kit_items for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  discount_type public.discount_type not null,
  discount_value numeric(10,2) not null check (discount_value >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  status public.record_status not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.promotion_products (
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  primary key (promotion_id, product_id)
);
grant select on public.promotions, public.promotion_products to anon, authenticated;
grant insert, update, delete on public.promotions, public.promotion_products to authenticated;
grant all on public.promotions, public.promotion_products to service_role;
alter table public.promotions enable row level security;
alter table public.promotion_products enable row level security;
create policy "Public promotions" on public.promotions for select to anon, authenticated using (status = 'ativo');
create policy "Admin promotions" on public.promotions for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Public promotion products" on public.promotion_products for select to anon, authenticated using (true);
create policy "Admin promotion products" on public.promotion_products for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger promotions_updated before update on public.promotions for each row execute function public.set_updated_at();

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type public.discount_type not null,
  discount_value numeric(10,2) not null check (discount_value >= 0),
  min_order_value numeric(10,2),
  max_uses int,
  uses_count int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  status public.record_status not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.coupons to authenticated;
grant all on public.coupons to service_role;
alter table public.coupons enable row level security;
create policy "Admin coupons" on public.coupons for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger coupons_updated before update on public.coupons for each row execute function public.set_updated_at();

create table public.pro_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  proof_type public.proof_type not null,
  document_path text not null,
  status public.request_status not null default 'em_analise',
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id) on delete set null,
  decision_note text
);
grant select, insert, update on public.pro_requests to authenticated;
grant all on public.pro_requests to service_role;
alter table public.pro_requests enable row level security;
create policy "Own pro requests read" on public.pro_requests for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Own pro requests insert" on public.pro_requests for insert to authenticated
  with check (user_id = auth.uid() and status = 'em_analise' and decided_at is null and decided_by is null);
create policy "Admin pro requests update" on public.pro_requests for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create table public.orders (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete restrict,
  customer_type public.account_type not null,
  status public.order_status not null default 'recebido',
  delivery_method public.delivery_method not null,
  address_id uuid references public.addresses(id) on delete set null,
  products_total numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  shipping numeric(10,2),
  total numeric(10,2) not null default 0,
  coupon_id uuid references public.coupons(id) on delete set null,
  note text,
  tecnobyte_registered boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.orders.shipping is 'NULL = entrega a combinar; definido pelo administrador';
create index on public.orders (user_id);
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "Own orders read" on public.orders for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Admin orders update" on public.orders for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admin orders insert" on public.orders for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  product_name text not null,
  quantity int not null check (quantity > 0),
  original_price numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  unit_price numeric(10,2) not null,
  item_total numeric(10,2) not null
);
create index on public.order_items (order_id);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "Own order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
    and (o.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))));

create table public.order_history (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  changed_by uuid,
  old_status public.order_status,
  new_status public.order_status,
  change_note text,
  created_at timestamptz not null default now()
);
grant select on public.order_history to authenticated;
grant all on public.order_history to service_role;
alter table public.order_history enable row level security;
create policy "Own order history" on public.order_history for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
    and (o.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))));

create or replace function public.log_order_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_history (order_id, changed_by, new_status) values (new.id, auth.uid(), new.status);
  elsif new.status is distinct from old.status then
    insert into public.order_history (order_id, changed_by, old_status, new_status) values (new.id, auth.uid(), old.status, new.status);
  end if;
  return new;
end; $$;
create trigger orders_history after insert or update on public.orders for each row execute function public.log_order_status();

create table public.cart_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  added_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create table public.stock_alerts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  primary key (user_id, product_id)
);
grant select, insert, update, delete on public.cart_items, public.favorites, public.stock_alerts to authenticated;
grant all on public.cart_items, public.favorites, public.stock_alerts to service_role;
alter table public.cart_items enable row level security;
alter table public.favorites enable row level security;
alter table public.stock_alerts enable row level security;
create policy "Own cart" on public.cart_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own favorites" on public.favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own stock alerts" on public.stock_alerts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
grant select on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "Public approved reviews" on public.reviews for select to anon, authenticated
  using (approved or user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Own review insert" on public.reviews for insert to authenticated
  with check (user_id = auth.uid() and approved = false);
create policy "Own review delete" on public.reviews for delete to authenticated using (user_id = auth.uid());
create policy "Admin review update" on public.reviews for update to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "Own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "Own notifications mark read" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own notifications delete" on public.notifications for delete to authenticated using (user_id = auth.uid());

create table public.store_info (
  id int primary key default 1 check (id = 1),
  name text, phone text, whatsapp text, email text, address text, opening_hours text, map_url text,
  updated_at timestamptz not null default now()
);
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text, subtitle text, image_url text, link text,
  placement text not null default 'home_hero',
  display_order int not null default 0,
  status public.record_status not null default 'ativo',
  starts_at timestamptz, ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  network text not null, url text not null,
  display_order int not null default 0,
  status public.record_status not null default 'ativo'
);
grant select on public.store_info, public.banners, public.social_links to anon, authenticated;
grant insert, update, delete on public.store_info, public.banners, public.social_links to authenticated;
grant all on public.store_info, public.banners, public.social_links to service_role;
alter table public.store_info enable row level security;
alter table public.banners enable row level security;
alter table public.social_links enable row level security;
create policy "Public store info" on public.store_info for select to anon, authenticated using (true);
create policy "Admin store info" on public.store_info for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Public banners" on public.banners for select to anon, authenticated using (status = 'ativo');
create policy "Admin banners" on public.banners for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Public social" on public.social_links for select to anon, authenticated using (status = 'ativo');
create policy "Admin social" on public.social_links for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger banners_updated before update on public.banners for each row execute function public.set_updated_at();
create trigger store_info_updated before update on public.store_info for each row execute function public.set_updated_at();

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "Admin audit read" on public.audit_log for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Private pro documents: client uploads to own folder; only admins can read
create policy "Pro docs upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'pro-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Pro docs admin read" on storage.objects for select to authenticated
  using (bucket_id = 'pro-documents' and public.has_role(auth.uid(), 'admin'));
create policy "Pro docs admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'pro-documents' and public.has_role(auth.uid(), 'admin'));
