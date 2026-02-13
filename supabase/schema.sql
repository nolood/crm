-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

create table if not exists public.ingredients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  unit text not null default 'г',
  stock_qty numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  ingredient_id uuid references public.ingredients(id) on delete cascade not null,
  quantity numeric not null,
  price_per_unit numeric not null,
  total_price numeric not null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  output_quantity numeric not null default 1,
  unit text not null default 'шт',
  price numeric default null,
  created_at timestamptz not null default now()
);

create table if not exists public.recipe_items (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  ingredient_id uuid references public.ingredients(id) on delete cascade not null,
  quantity numeric not null
);

create table if not exists public.production (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  quantity numeric not null,
  total_cost numeric not null default 0,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.production_items (
  id uuid primary key default uuid_generate_v4(),
  production_id uuid references public.production(id) on delete cascade not null,
  ingredient_id uuid references public.ingredients(id) on delete cascade not null,
  quantity_used numeric not null
);

create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  phone text,
  instagram text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'ready', 'delivered', 'cancelled')),
  total_price numeric not null default 0,
  date date not null default current_date,
  delivery_time text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  quantity numeric not null,
  price numeric not null
);

-- ============================================
-- RLS POLICIES
-- ============================================

alter table public.ingredients enable row level security;
alter table public.purchases enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_items enable row level security;
alter table public.production enable row level security;
alter table public.production_items enable row level security;
alter table public.clients enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Ingredients
drop policy if exists "Users can view own ingredients" on public.ingredients;
create policy "Users can view own ingredients" on public.ingredients for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own ingredients" on public.ingredients;
create policy "Users can insert own ingredients" on public.ingredients for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own ingredients" on public.ingredients;
create policy "Users can update own ingredients" on public.ingredients for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own ingredients" on public.ingredients;
create policy "Users can delete own ingredients" on public.ingredients for delete using (auth.uid() = user_id);

-- Purchases
drop policy if exists "Users can view own purchases" on public.purchases;
create policy "Users can view own purchases" on public.purchases for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own purchases" on public.purchases;
create policy "Users can insert own purchases" on public.purchases for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete own purchases" on public.purchases;
create policy "Users can delete own purchases" on public.purchases for delete using (auth.uid() = user_id);

-- Recipes
drop policy if exists "Users can view own recipes" on public.recipes;
create policy "Users can view own recipes" on public.recipes for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own recipes" on public.recipes;
create policy "Users can insert own recipes" on public.recipes for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own recipes" on public.recipes;
create policy "Users can update own recipes" on public.recipes for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own recipes" on public.recipes;
create policy "Users can delete own recipes" on public.recipes for delete using (auth.uid() = user_id);

-- Recipe items (access through recipe ownership)
drop policy if exists "Users can view recipe items" on public.recipe_items;
create policy "Users can view recipe items" on public.recipe_items for select using (
  exists (select 1 from public.recipes where recipes.id = recipe_items.recipe_id and recipes.user_id = auth.uid())
);
drop policy if exists "Users can insert recipe items" on public.recipe_items;
create policy "Users can insert recipe items" on public.recipe_items for insert with check (
  exists (select 1 from public.recipes where recipes.id = recipe_items.recipe_id and recipes.user_id = auth.uid())
);
drop policy if exists "Users can delete recipe items" on public.recipe_items;
create policy "Users can delete recipe items" on public.recipe_items for delete using (
  exists (select 1 from public.recipes where recipes.id = recipe_items.recipe_id and recipes.user_id = auth.uid())
);

-- Production
drop policy if exists "Users can view own production" on public.production;
create policy "Users can view own production" on public.production for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own production" on public.production;
create policy "Users can insert own production" on public.production for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete own production" on public.production;
create policy "Users can delete own production" on public.production for delete using (auth.uid() = user_id);

-- Production items
drop policy if exists "Users can view production items" on public.production_items;
create policy "Users can view production items" on public.production_items for select using (
  exists (select 1 from public.production where production.id = production_items.production_id and production.user_id = auth.uid())
);
drop policy if exists "Users can insert production items" on public.production_items;
create policy "Users can insert production items" on public.production_items for insert with check (
  exists (select 1 from public.production where production.id = production_items.production_id and production.user_id = auth.uid())
);

-- Clients
drop policy if exists "Users can view own clients" on public.clients;
create policy "Users can view own clients" on public.clients for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own clients" on public.clients;
create policy "Users can insert own clients" on public.clients for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own clients" on public.clients;
create policy "Users can update own clients" on public.clients for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own clients" on public.clients;
create policy "Users can delete own clients" on public.clients for delete using (auth.uid() = user_id);

-- Orders
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own orders" on public.orders;
create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own orders" on public.orders;
create policy "Users can update own orders" on public.orders for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own orders" on public.orders;
create policy "Users can delete own orders" on public.orders for delete using (auth.uid() = user_id);

-- Order items
drop policy if exists "Users can view order items" on public.order_items;
create policy "Users can view order items" on public.order_items for select using (
  exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
drop policy if exists "Users can insert order items" on public.order_items;
create policy "Users can insert order items" on public.order_items for insert with check (
  exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
drop policy if exists "Users can delete order items" on public.order_items;
create policy "Users can delete order items" on public.order_items for delete using (
  exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);

-- ============================================
-- RPC FUNCTIONS (transactional operations)
-- ============================================

-- Add purchase and update stock in one transaction
create or replace function public.create_purchase(
  p_user_id uuid,
  p_ingredient_id uuid,
  p_quantity numeric,
  p_price_per_unit numeric,
  p_date date
) returns uuid as $$
declare
  purchase_id uuid;
begin
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, p_ingredient_id, p_quantity, p_price_per_unit, p_quantity * p_price_per_unit, p_date)
  returning id into purchase_id;

  update public.ingredients
  set stock_qty = stock_qty + p_quantity
  where id = p_ingredient_id and user_id = p_user_id;

  return purchase_id;
end;
$$ language plpgsql security definer;

-- Record production: deduct ingredients, create production record
create or replace function public.create_production(
  p_user_id uuid,
  p_recipe_id uuid,
  p_quantity numeric,
  p_date date
) returns uuid as $$
declare
  prod_id uuid;
  item record;
  total numeric := 0;
  ingredient_cost numeric;
begin
  -- Create production record
  insert into public.production (user_id, recipe_id, quantity, date)
  values (p_user_id, p_recipe_id, p_quantity, p_date)
  returning id into prod_id;

  -- For each recipe item, deduct from stock and record
  for item in
    select ri.ingredient_id, ri.quantity * p_quantity as qty_needed
    from public.recipe_items ri
    where ri.recipe_id = p_recipe_id
  loop
    -- Deduct from stock
    update public.ingredients
    set stock_qty = stock_qty - item.qty_needed
    where id = item.ingredient_id and user_id = p_user_id;

    -- Record what was used
    insert into public.production_items (production_id, ingredient_id, quantity_used)
    values (prod_id, item.ingredient_id, item.qty_needed);

    -- Calculate cost based on latest purchase price
    select p.price_per_unit * item.qty_needed into ingredient_cost
    from public.purchases p
    where p.ingredient_id = item.ingredient_id and p.user_id = p_user_id
    order by p.date desc, p.created_at desc
    limit 1;

    total := total + coalesce(ingredient_cost, 0);
  end loop;

  -- Update total cost
  update public.production set total_cost = total where id = prod_id;

  return prod_id;
end;
$$ language plpgsql security definer;

-- Purchase history (audit trail)
create table if not exists public.purchase_history (
  id uuid primary key default uuid_generate_v4(),
  purchase_id uuid references public.purchases(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  ingredient_id uuid references public.ingredients(id) on delete cascade not null,
  quantity numeric not null,
  price_per_unit numeric not null,
  total_price numeric not null,
  date date not null,
  changed_at timestamptz not null default now()
);

alter table public.purchase_history enable row level security;

drop policy if exists "Users can view own purchase history" on public.purchase_history;
create policy "Users can view own purchase history"
  on public.purchase_history for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own purchase history" on public.purchase_history;
create policy "Users can insert own purchase history"
  on public.purchase_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own purchases" on public.purchases;
create policy "Users can update own purchases"
  on public.purchases for update
  using (auth.uid() = user_id);

create or replace function public.update_purchase(
  p_purchase_id uuid,
  p_user_id uuid,
  p_ingredient_id uuid,
  p_quantity numeric,
  p_price_per_unit numeric,
  p_date date
) returns void as $$
declare
  old_record record;
begin
  select * into old_record
  from public.purchases
  where id = p_purchase_id and user_id = p_user_id;

  if not found then
    raise exception 'Purchase not found or access denied';
  end if;

  -- Save old state to history
  insert into public.purchase_history (
    purchase_id, user_id, ingredient_id, quantity,
    price_per_unit, total_price, date
  ) values (
    old_record.id, old_record.user_id, old_record.ingredient_id,
    old_record.quantity, old_record.price_per_unit,
    old_record.total_price, old_record.date
  );

  -- Reverse stock for old ingredient
  update public.ingredients
  set stock_qty = stock_qty - old_record.quantity
  where id = old_record.ingredient_id and user_id = p_user_id;

  -- Apply stock for new ingredient
  update public.ingredients
  set stock_qty = stock_qty + p_quantity
  where id = p_ingredient_id and user_id = p_user_id;

  -- Update the purchase
  update public.purchases
  set ingredient_id = p_ingredient_id,
      quantity = p_quantity,
      price_per_unit = p_price_per_unit,
      total_price = p_quantity * p_price_per_unit,
      date = p_date
  where id = p_purchase_id and user_id = p_user_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- EXPENSES (Расходы)
-- ============================================

create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  description text not null,
  amount numeric not null check (amount > 0),
  date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

drop policy if exists "Users can view own expenses" on public.expenses;
create policy "Users can view own expenses" on public.expenses for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own expenses" on public.expenses;
create policy "Users can insert own expenses" on public.expenses for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own expenses" on public.expenses;
create policy "Users can update own expenses" on public.expenses for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own expenses" on public.expenses;
create policy "Users can delete own expenses" on public.expenses for delete using (auth.uid() = user_id);

-- ============================================
-- WRITE-OFFS (Списания)
-- ============================================

create table if not exists public.write_offs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  ingredient_id uuid references public.ingredients(id) on delete cascade not null,
  quantity numeric not null check (quantity > 0),
  note text,
  estimated_cost numeric not null default 0,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.write_offs enable row level security;

drop policy if exists "Users can view own write_offs" on public.write_offs;
create policy "Users can view own write_offs" on public.write_offs for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own write_offs" on public.write_offs;
create policy "Users can insert own write_offs" on public.write_offs for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own write_offs" on public.write_offs;
create policy "Users can update own write_offs" on public.write_offs for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own write_offs" on public.write_offs;
create policy "Users can delete own write_offs" on public.write_offs for delete using (auth.uid() = user_id);

create or replace function public.create_write_off(
  p_user_id uuid,
  p_ingredient_id uuid,
  p_quantity numeric,
  p_note text,
  p_date date
) returns uuid as $$
declare
  wo_id uuid;
  cost numeric;
begin
  -- Look up latest purchase price for this ingredient
  select pur.price_per_unit * p_quantity into cost
  from public.purchases pur
  where pur.ingredient_id = p_ingredient_id and pur.user_id = p_user_id
  order by pur.date desc, pur.created_at desc
  limit 1;

  -- Insert write-off record
  insert into public.write_offs (user_id, ingredient_id, quantity, note, estimated_cost, date)
  values (p_user_id, p_ingredient_id, p_quantity, p_note, coalesce(cost, 0), p_date)
  returning id into wo_id;

  -- Deduct from stock
  update public.ingredients
  set stock_qty = stock_qty - p_quantity
  where id = p_ingredient_id and user_id = p_user_id;

  return wo_id;
end;
$$ language plpgsql security definer;

create or replace function public.delete_write_off(
  p_write_off_id uuid,
  p_user_id uuid
) returns void as $$
declare
  wo_record record;
begin
  select ingredient_id, quantity into wo_record
  from public.write_offs
  where id = p_write_off_id and user_id = p_user_id;

  if not found then
    raise exception 'Списание не найдено';
  end if;

  -- Restore stock
  update public.ingredients
  set stock_qty = stock_qty + wo_record.quantity
  where id = wo_record.ingredient_id and user_id = p_user_id;

  -- Delete write-off record
  delete from public.write_offs
  where id = p_write_off_id and user_id = p_user_id;
end;
$$ language plpgsql security definer;
