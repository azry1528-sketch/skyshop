
-- Roles enum
create type public.app_role as enum ('admin', 'customer');

-- Profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles viewable by authenticated"
on public.profiles for select to authenticated using (true);

create policy "Users update own profile"
on public.profiles for update to authenticated using (auth.uid() = user_id);

create policy "Users insert own profile"
on public.profiles for insert to authenticated with check (auth.uid() = user_id);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "Users see own roles"
on public.user_roles for select to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "Admins manage roles"
on public.user_roles for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- updated_at helper
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Extend products
alter table public.products
  add column gallery_urls text[] not null default '{}',
  add column video_url text,
  add column benefits text[] not null default '{}',
  add column specifications jsonb not null default '{}'::jsonb,
  add column box_contents text[] not null default '{}',
  add column extra_details text;

-- Admin policies for products
create policy "Admins insert products"
on public.products for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins update products"
on public.products for update to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins delete products"
on public.products for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Admin policies for orders
create policy "Admins view orders"
on public.orders for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins update orders"
on public.orders for update to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins delete orders"
on public.orders for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));
