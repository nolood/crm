-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

create table public.ingredients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  unit text not null default 'г',
  stock_qty numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  ingredient_id uuid references public.ingredients(id) on delete cascade not null,
  quantity numeric not null,
  price_per_unit numeric not null,
  total_price numeric not null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.recipes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  output_quantity numeric not null default 1,
  unit text not null default 'шт',
  created_at timestamptz not null default now()
);

create table public.recipe_items (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  ingredient_id uuid references public.ingredients(id) on delete cascade not null,
  quantity numeric not null
);

create table public.production (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  quantity numeric not null,
  total_cost numeric not null default 0,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.production_items (
  id uuid primary key default uuid_generate_v4(),
  production_id uuid references public.production(id) on delete cascade not null,
  ingredient_id uuid references public.ingredients(id) on delete cascade not null,
  quantity_used numeric not null
);

create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  phone text,
  instagram text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'ready', 'delivered', 'cancelled')),
  total_price numeric not null default 0,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.order_items (
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
create policy "Users can view own ingredients" on public.ingredients for select using (auth.uid() = user_id);
create policy "Users can insert own ingredients" on public.ingredients for insert with check (auth.uid() = user_id);
create policy "Users can update own ingredients" on public.ingredients for update using (auth.uid() = user_id);
create policy "Users can delete own ingredients" on public.ingredients for delete using (auth.uid() = user_id);

-- Purchases
create policy "Users can view own purchases" on public.purchases for select using (auth.uid() = user_id);
create policy "Users can insert own purchases" on public.purchases for insert with check (auth.uid() = user_id);
create policy "Users can delete own purchases" on public.purchases for delete using (auth.uid() = user_id);

-- Recipes
create policy "Users can view own recipes" on public.recipes for select using (auth.uid() = user_id);
create policy "Users can insert own recipes" on public.recipes for insert with check (auth.uid() = user_id);
create policy "Users can update own recipes" on public.recipes for update using (auth.uid() = user_id);
create policy "Users can delete own recipes" on public.recipes for delete using (auth.uid() = user_id);

-- Recipe items (access through recipe ownership)
create policy "Users can view recipe items" on public.recipe_items for select using (
  exists (select 1 from public.recipes where recipes.id = recipe_items.recipe_id and recipes.user_id = auth.uid())
);
create policy "Users can insert recipe items" on public.recipe_items for insert with check (
  exists (select 1 from public.recipes where recipes.id = recipe_items.recipe_id and recipes.user_id = auth.uid())
);
create policy "Users can delete recipe items" on public.recipe_items for delete using (
  exists (select 1 from public.recipes where recipes.id = recipe_items.recipe_id and recipes.user_id = auth.uid())
);

-- Production
create policy "Users can view own production" on public.production for select using (auth.uid() = user_id);
create policy "Users can insert own production" on public.production for insert with check (auth.uid() = user_id);
create policy "Users can delete own production" on public.production for delete using (auth.uid() = user_id);

-- Production items
create policy "Users can view production items" on public.production_items for select using (
  exists (select 1 from public.production where production.id = production_items.production_id and production.user_id = auth.uid())
);
create policy "Users can insert production items" on public.production_items for insert with check (
  exists (select 1 from public.production where production.id = production_items.production_id and production.user_id = auth.uid())
);

-- Clients
create policy "Users can view own clients" on public.clients for select using (auth.uid() = user_id);
create policy "Users can insert own clients" on public.clients for insert with check (auth.uid() = user_id);
create policy "Users can update own clients" on public.clients for update using (auth.uid() = user_id);
create policy "Users can delete own clients" on public.clients for delete using (auth.uid() = user_id);

-- Orders
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Users can update own orders" on public.orders for update using (auth.uid() = user_id);
create policy "Users can delete own orders" on public.orders for delete using (auth.uid() = user_id);

-- Order items
create policy "Users can view order items" on public.order_items for select using (
  exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
create policy "Users can insert order items" on public.order_items for insert with check (
  exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
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
