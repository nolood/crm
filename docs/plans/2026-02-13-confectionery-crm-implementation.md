# Confectionery CRM Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a simple CRM for a home confectionery business with purchase tracking, inventory management, recipe-based production, client/order management, and a profit dashboard.

**Architecture:** Next.js 15 App Router with Server Components for data reading and Server Actions for mutations. Supabase provides PostgreSQL database, auth (magic link), and RLS. All critical stock operations (purchase → add stock, production → deduct stock) use Supabase RPC functions for transactional safety.

**Tech Stack:** Next.js 15, TypeScript, Supabase (@supabase/ssr), shadcn/ui, Tailwind CSS, zod, date-fns, sonner (toasts)

---

## Prerequisites

- Node.js 18+
- A Supabase project created at https://supabase.com (free tier)
- Supabase project URL and anon key ready

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.env.local`, `src/app/layout.tsx`, `src/app/page.tsx`

**Step 1: Create Next.js project**

Run:
```bash
cd /home/nolood/general/crm
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

When prompted, accept defaults. If directory not empty, allow overwrite.

**Step 2: Install dependencies**

Run:
```bash
npm install @supabase/ssr @supabase/supabase-js zod date-fns sonner
npm install -D supabase
```

**Step 3: Initialize shadcn/ui**

Run:
```bash
npx shadcn@latest init -d
```

Accept defaults (New York style, Zinc color, CSS variables).

**Step 4: Add shadcn components we'll need**

Run:
```bash
npx shadcn@latest add button card input label table select dialog badge separator sheet sidebar dropdown-menu form textarea toast calendar popover command
```

**Step 5: Create .env.local**

Create file `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Ask user to fill in their Supabase credentials.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with shadcn/ui and Supabase deps"
```

---

### Task 2: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/middleware.ts`

**Step 1: Create server client**

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — ignored if middleware refreshes sessions
          }
        },
      },
    }
  )
}
```

**Step 2: Create browser client**

Create `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 3: Create middleware helper**

Create `src/lib/supabase/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

**Step 4: Create middleware**

Create `src/middleware.ts`:
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Step 5: Commit**

```bash
git add src/lib/supabase/ src/middleware.ts
git commit -m "feat: add Supabase client setup (server, browser, middleware)"
```

---

### Task 3: Database Schema

**Files:**
- Create: `supabase/schema.sql`

**Step 1: Create the full SQL schema**

Create `supabase/schema.sql`:
```sql
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
```

**Step 2: Apply schema to Supabase**

Go to Supabase Dashboard → SQL Editor → paste the contents of `supabase/schema.sql` → Run.

Alternatively if supabase CLI is configured:
```bash
npx supabase db push
```

**Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add database schema with RLS and RPC functions"
```

---

### Task 4: TypeScript Types

**Files:**
- Create: `src/lib/types.ts`

**Step 1: Define all types**

Create `src/lib/types.ts`:
```typescript
export type Ingredient = {
  id: string
  user_id: string
  name: string
  unit: string
  stock_qty: number
  created_at: string
}

export type Purchase = {
  id: string
  user_id: string
  ingredient_id: string
  quantity: number
  price_per_unit: number
  total_price: number
  date: string
  created_at: string
  ingredient?: Ingredient
}

export type Recipe = {
  id: string
  user_id: string
  name: string
  output_quantity: number
  unit: string
  created_at: string
  recipe_items?: RecipeItem[]
}

export type RecipeItem = {
  id: string
  recipe_id: string
  ingredient_id: string
  quantity: number
  ingredient?: Ingredient
}

export type Production = {
  id: string
  user_id: string
  recipe_id: string
  quantity: number
  total_cost: number
  date: string
  created_at: string
  recipe?: Recipe
  production_items?: ProductionItem[]
}

export type ProductionItem = {
  id: string
  production_id: string
  ingredient_id: string
  quantity_used: number
  ingredient?: Ingredient
}

export type Client = {
  id: string
  user_id: string
  name: string
  phone: string | null
  instagram: string | null
  notes: string | null
  created_at: string
}

export type Order = {
  id: string
  user_id: string
  client_id: string | null
  status: 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
  total_price: number
  date: string
  created_at: string
  client?: Client
  order_items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id: string
  recipe_id: string
  quantity: number
  price: number
  recipe?: Recipe
}

export type ActionResult = {
  success: boolean
  error?: string
}
```

**Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add TypeScript types for all entities"
```

---

### Task 5: Auth — Login Page

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/auth/callback/route.ts`

**Step 1: Create login page**

Create `src/app/login/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Проверьте почту — ссылка для входа отправлена!')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Вход</CardTitle>
          <CardDescription>Войдите по ссылке на почту</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Отправка...' : 'Войти'}
            </Button>
            {message && (
              <p className="text-sm text-center text-muted-foreground">{message}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 2: Create auth callback route**

Create `src/app/auth/callback/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(origin)
}
```

**Step 3: Commit**

```bash
git add src/app/login/ src/app/auth/
git commit -m "feat: add magic link login page and auth callback"
```

---

### Task 6: Dashboard Layout with Sidebar

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/app-sidebar.tsx`
- Create: `src/components/logout-button.tsx`
- Modify: `src/app/layout.tsx` — add Toaster

**Step 1: Create logout button component**

Create `src/components/logout-button.tsx`:
```tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      Выйти
    </Button>
  )
}
```

**Step 2: Create sidebar**

Create `src/components/app-sidebar.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { LogoutButton } from '@/components/logout-button'

const menuItems = [
  { title: 'Дашборд', href: '/' },
  { title: 'Склад', href: '/inventory' },
  { title: 'Закупки', href: '/purchases' },
  { title: 'Рецепты', href: '/recipes' },
  { title: 'Производство', href: '/production' },
  { title: 'Клиенты', href: '/clients' },
  { title: 'Заказы', href: '/orders' },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>CRM Кондитерская</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>{item.title}</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <LogoutButton />
      </SidebarFooter>
    </Sidebar>
  )
}
```

**Step 3: Create dashboard layout**

Create `src/app/(dashboard)/layout.tsx`:
```tsx
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex items-center gap-2 border-b p-4">
          <SidebarTrigger />
        </div>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </SidebarProvider>
  )
}
```

**Step 4: Update root layout with Toaster**

Modify `src/app/layout.tsx` — add `<Toaster />` from sonner inside the body:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'CRM Кондитерская',
  description: 'Учёт расходов и доходов кондитерского производства',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
```

**Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/\(dashboard\)/ src/components/app-sidebar.tsx src/components/logout-button.tsx
git commit -m "feat: add dashboard layout with sidebar and toaster"
```

---

### Task 7: Ingredients (Inventory) Page

**Files:**
- Create: `src/app/(dashboard)/inventory/page.tsx`
- Create: `src/lib/actions/ingredients.ts`
- Create: `src/app/(dashboard)/inventory/ingredient-form.tsx`

**Step 1: Create server actions for ingredients**

Create `src/lib/actions/ingredients.ts`:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/types'

export async function getIngredients() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

export async function createIngredient(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  const name = formData.get('name') as string
  const unit = formData.get('unit') as string

  if (!name || !unit) return { success: false, error: 'Заполните все поля' }

  const { error } = await supabase.from('ingredients').insert({
    user_id: user.id,
    name,
    unit,
    stock_qty: 0,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/inventory')
  return { success: true }
}

export async function deleteIngredient(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('ingredients').delete().eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/inventory')
  return { success: true }
}
```

**Step 2: Create ingredient form (client component)**

Create `src/app/(dashboard)/inventory/ingredient-form.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createIngredient } from '@/lib/actions/ingredients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const units = ['г', 'кг', 'мл', 'л', 'шт']

export function IngredientForm() {
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    const result = await createIngredient(formData)
    if (result.success) {
      toast.success('Ингредиент добавлен')
      setOpen(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Добавить ингредиент</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый ингредиент</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название</Label>
            <Input id="name" name="name" placeholder="Клубника" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Единица измерения</Label>
            <Select name="unit" defaultValue="г">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">Добавить</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 3: Create inventory page**

Create `src/app/(dashboard)/inventory/page.tsx`:
```tsx
import { getIngredients } from '@/lib/actions/ingredients'
import { IngredientForm } from './ingredient-form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function InventoryPage() {
  const ingredients = await getIngredients()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Склад</h1>
        <IngredientForm />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Остаток</TableHead>
              <TableHead>Единица</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Нет ингредиентов
                </TableCell>
              </TableRow>
            ) : (
              ingredients.map((ing) => (
                <TableRow key={ing.id}>
                  <TableCell className="font-medium">{ing.name}</TableCell>
                  <TableCell>
                    {ing.stock_qty <= 0 ? (
                      <Badge variant="destructive">{ing.stock_qty}</Badge>
                    ) : ing.stock_qty < 100 ? (
                      <Badge variant="secondary">{ing.stock_qty}</Badge>
                    ) : (
                      <span>{ing.stock_qty}</span>
                    )}
                  </TableCell>
                  <TableCell>{ing.unit}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)/inventory/ src/lib/actions/ingredients.ts
git commit -m "feat: add inventory page with ingredient CRUD"
```

---

### Task 8: Purchases Page

**Files:**
- Create: `src/lib/actions/purchases.ts`
- Create: `src/app/(dashboard)/purchases/page.tsx`
- Create: `src/app/(dashboard)/purchases/purchase-form.tsx`

**Step 1: Create server actions for purchases**

Create `src/lib/actions/purchases.ts`:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/types'

export async function getPurchases() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('purchases')
    .select('*, ingredient:ingredients(name, unit)')
    .order('date', { ascending: false })

  if (error) throw error
  return data
}

export async function createPurchase(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  const ingredient_id = formData.get('ingredient_id') as string
  const quantity = Number(formData.get('quantity'))
  const price_per_unit = Number(formData.get('price_per_unit'))
  const date = formData.get('date') as string

  if (!ingredient_id || !quantity || !price_per_unit || !date) {
    return { success: false, error: 'Заполните все поля' }
  }

  const { error } = await supabase.rpc('create_purchase', {
    p_user_id: user.id,
    p_ingredient_id: ingredient_id,
    p_quantity: quantity,
    p_price_per_unit: price_per_unit,
    p_date: date,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/purchases')
  revalidatePath('/inventory')
  revalidatePath('/')
  return { success: true }
}

export async function deletePurchase(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Get purchase details first to reverse stock
  const { data: purchase } = await supabase
    .from('purchases')
    .select('ingredient_id, quantity')
    .eq('id', id)
    .single()

  if (!purchase) return { success: false, error: 'Закупка не найдена' }

  // Reverse stock
  await supabase.rpc('', {}) // We'll handle this manually
  const { error: updateError } = await supabase
    .from('ingredients')
    .update({ stock_qty: supabase.rpc ? undefined : 0 })
    .eq('id', purchase.ingredient_id)

  // Actually, simpler approach — delete purchase, subtract from stock
  const { error: stockError } = await supabase.rpc('create_purchase', {
    p_user_id: (await supabase.auth.getUser()).data.user!.id,
    p_ingredient_id: purchase.ingredient_id,
    p_quantity: -purchase.quantity,
    p_price_per_unit: 0,
    p_date: new Date().toISOString().split('T')[0],
  })

  // Delete the original purchase
  const { error } = await supabase.from('purchases').delete().eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/purchases')
  revalidatePath('/inventory')
  return { success: true }
}
```

Note: The `deletePurchase` function is a nice-to-have. For the MVP, focus on `createPurchase` and `getPurchases`. The delete logic with stock reversal is complex — keep it simple for now and just don't delete purchases. If needed later, add a proper `delete_purchase` RPC function.

**Simplified version of actions — replace deletePurchase with:**
```typescript
export async function deletePurchase(id: string): Promise<ActionResult> {
  // For now, don't allow deletion to keep stock consistent
  // TODO: Add proper delete_purchase RPC that reverses stock
  return { success: false, error: 'Удаление закупок временно недоступно' }
}
```

**Step 2: Create purchase form**

Create `src/app/(dashboard)/purchases/purchase-form.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createPurchase } from '@/lib/actions/purchases'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Ingredient } from '@/lib/types'

export function PurchaseForm({ ingredients }: { ingredients: Ingredient[] }) {
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    const result = await createPurchase(formData)
    if (result.success) {
      toast.success('Закупка добавлена')
      setOpen(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Добавить закупку</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая закупка</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Ингредиент</Label>
            <Select name="ingredient_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Выберите ингредиент" />
              </SelectTrigger>
              <SelectContent>
                {ingredients.map((ing) => (
                  <SelectItem key={ing.id} value={ing.id}>
                    {ing.name} ({ing.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Количество</Label>
            <Input id="quantity" name="quantity" type="number" step="0.01" min="0" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price_per_unit">Цена за единицу (₽)</Label>
            <Input id="price_per_unit" name="price_per_unit" type="number" step="0.01" min="0" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Дата</Label>
            <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
          </div>
          <Button type="submit" className="w-full">Добавить</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 3: Create purchases page**

Create `src/app/(dashboard)/purchases/page.tsx`:
```tsx
import { getPurchases } from '@/lib/actions/purchases'
import { getIngredients } from '@/lib/actions/ingredients'
import { PurchaseForm } from './purchase-form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default async function PurchasesPage() {
  const [purchases, ingredients] = await Promise.all([
    getPurchases(),
    getIngredients(),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Закупки</h1>
        <PurchaseForm ingredients={ingredients} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Ингредиент</TableHead>
              <TableHead>Количество</TableHead>
              <TableHead>Цена за ед.</TableHead>
              <TableHead>Сумма</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Нет закупок
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{format(new Date(p.date), 'd MMM yyyy', { locale: ru })}</TableCell>
                  <TableCell>{p.ingredient?.name}</TableCell>
                  <TableCell>{p.quantity} {p.ingredient?.unit}</TableCell>
                  <TableCell>{p.price_per_unit} ₽</TableCell>
                  <TableCell className="font-medium">{p.total_price} ₽</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add src/lib/actions/purchases.ts src/app/\(dashboard\)/purchases/
git commit -m "feat: add purchases page with stock update via RPC"
```

---

### Task 9: Recipes Page

**Files:**
- Create: `src/lib/actions/recipes.ts`
- Create: `src/app/(dashboard)/recipes/page.tsx`
- Create: `src/app/(dashboard)/recipes/recipe-form.tsx`

**Step 1: Create server actions for recipes**

Create `src/lib/actions/recipes.ts`:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/types'

export async function getRecipes() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_items(*, ingredient:ingredients(name, unit))')
    .order('name')

  if (error) throw error
  return data
}

export async function getRecipe(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_items(*, ingredient:ingredients(name, unit))')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createRecipe(data: {
  name: string
  output_quantity: number
  unit: string
  items: { ingredient_id: string; quantity: number }[]
}): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  if (!data.name || data.items.length === 0) {
    return { success: false, error: 'Укажите название и ингредиенты' }
  }

  const { data: recipe, error } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      name: data.name,
      output_quantity: data.output_quantity,
      unit: data.unit,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  const recipeItems = data.items.map((item) => ({
    recipe_id: recipe.id,
    ingredient_id: item.ingredient_id,
    quantity: item.quantity,
  }))

  const { error: itemsError } = await supabase
    .from('recipe_items')
    .insert(recipeItems)

  if (itemsError) return { success: false, error: itemsError.message }

  revalidatePath('/recipes')
  return { success: true }
}

export async function deleteRecipe(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('recipes').delete().eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/recipes')
  return { success: true }
}
```

**Step 2: Create recipe form**

Create `src/app/(dashboard)/recipes/recipe-form.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createRecipe } from '@/lib/actions/recipes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Ingredient } from '@/lib/types'

export function RecipeForm({ ingredients }: { ingredients: Ingredient[] }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [outputQty, setOutputQty] = useState('1')
  const [unit, setUnit] = useState('шт')
  const [items, setItems] = useState<{ ingredient_id: string; quantity: string }[]>([
    { ingredient_id: '', quantity: '' },
  ])

  function addItem() {
    setItems([...items, { ingredient_id: '', quantity: '' }])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: string, value: string) {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  async function handleSubmit() {
    const result = await createRecipe({
      name,
      output_quantity: Number(outputQty),
      unit,
      items: items
        .filter((item) => item.ingredient_id && item.quantity)
        .map((item) => ({
          ingredient_id: item.ingredient_id,
          quantity: Number(item.quantity),
        })),
    })

    if (result.success) {
      toast.success('Рецепт создан')
      setOpen(false)
      setName('')
      setOutputQty('1')
      setItems([{ ingredient_id: '', quantity: '' }])
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Добавить рецепт</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новый рецепт</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Название продукта</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Клубника в шоколаде"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Выход</Label>
              <Input
                type="number"
                value={outputQty}
                onChange={(e) => setOutputQty(e.target.value)}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Единица</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="шт">шт</SelectItem>
                  <SelectItem value="кг">кг</SelectItem>
                  <SelectItem value="порция">порция</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ингредиенты</Label>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Select
                  value={item.ingredient_id}
                  onValueChange={(v) => updateItem(i, 'ingredient_id', v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Ингредиент" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.map((ing) => (
                      <SelectItem key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Кол-во"
                  className="w-24"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                />
                {items.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeItem(i)}>
                    ✕
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addItem}>
              + Ингредиент
            </Button>
          </div>

          <Button onClick={handleSubmit} className="w-full">Создать рецепт</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 3: Create recipes page**

Create `src/app/(dashboard)/recipes/page.tsx`:
```tsx
import { getRecipes } from '@/lib/actions/recipes'
import { getIngredients } from '@/lib/actions/ingredients'
import { RecipeForm } from './recipe-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function RecipesPage() {
  const [recipes, ingredients] = await Promise.all([
    getRecipes(),
    getIngredients(),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Рецепты</h1>
        <RecipeForm ingredients={ingredients} />
      </div>

      {recipes.length === 0 ? (
        <p className="text-muted-foreground">Нет рецептов</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe: any) => (
            <Card key={recipe.id}>
              <CardHeader>
                <CardTitle className="text-lg">{recipe.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Выход: {recipe.output_quantity} {recipe.unit}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {recipe.recipe_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.ingredient?.name}</span>
                      <Badge variant="outline">
                        {item.quantity} {item.ingredient?.unit}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add src/lib/actions/recipes.ts src/app/\(dashboard\)/recipes/
git commit -m "feat: add recipes page with ingredient composition"
```

---

### Task 10: Production Page

**Files:**
- Create: `src/lib/actions/production.ts`
- Create: `src/app/(dashboard)/production/page.tsx`
- Create: `src/app/(dashboard)/production/production-form.tsx`

**Step 1: Create server actions for production**

Create `src/lib/actions/production.ts`:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/types'

export async function getProductions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('production')
    .select('*, recipe:recipes(name, unit)')
    .order('date', { ascending: false })

  if (error) throw error
  return data
}

export async function createProduction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  const recipe_id = formData.get('recipe_id') as string
  const quantity = Number(formData.get('quantity'))
  const date = formData.get('date') as string

  if (!recipe_id || !quantity || !date) {
    return { success: false, error: 'Заполните все поля' }
  }

  const { error } = await supabase.rpc('create_production', {
    p_user_id: user.id,
    p_recipe_id: recipe_id,
    p_quantity: quantity,
    p_date: date,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/production')
  revalidatePath('/inventory')
  revalidatePath('/')
  return { success: true }
}
```

**Step 2: Create production form**

Create `src/app/(dashboard)/production/production-form.tsx`:
```tsx
'use client'

import { useState, useMemo } from 'react'
import { createProduction } from '@/lib/actions/production'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { Recipe, Ingredient } from '@/lib/types'

export function ProductionForm({
  recipes,
  ingredients,
}: {
  recipes: any[]
  ingredients: Ingredient[]
}) {
  const [open, setOpen] = useState(false)
  const [recipeId, setRecipeId] = useState('')
  const [quantity, setQuantity] = useState('1')

  const selectedRecipe = recipes.find((r) => r.id === recipeId)
  const ingredientMap = useMemo(
    () => Object.fromEntries(ingredients.map((i) => [i.id, i])),
    [ingredients]
  )

  const deductions = useMemo(() => {
    if (!selectedRecipe) return []
    return selectedRecipe.recipe_items.map((item: any) => {
      const ing = ingredientMap[item.ingredient_id]
      const needed = item.quantity * Number(quantity)
      return {
        name: ing?.name ?? 'Неизвестно',
        unit: ing?.unit ?? '',
        needed,
        available: ing?.stock_qty ?? 0,
        enough: (ing?.stock_qty ?? 0) >= needed,
      }
    })
  }, [selectedRecipe, quantity, ingredientMap])

  async function handleSubmit(formData: FormData) {
    const result = await createProduction(formData)
    if (result.success) {
      toast.success('Производство записано')
      setOpen(false)
      setRecipeId('')
      setQuantity('1')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Записать производство</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новое производство</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Рецепт</Label>
            <Select name="recipe_id" value={recipeId} onValueChange={setRecipeId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите рецепт" />
              </SelectTrigger>
              <SelectContent>
                {recipes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Количество (партий)</Label>
            <Input
              name="quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Дата</Label>
            <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>

          {deductions.length > 0 && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Будет списано:</p>
              {deductions.map((d, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{d.name}</span>
                  <span className="flex items-center gap-2">
                    {d.needed} {d.unit}
                    {!d.enough && (
                      <Badge variant="destructive">Не хватает!</Badge>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Button type="submit" className="w-full">Записать</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 3: Create production page**

Create `src/app/(dashboard)/production/page.tsx`:
```tsx
import { getProductions } from '@/lib/actions/production'
import { getRecipes } from '@/lib/actions/recipes'
import { getIngredients } from '@/lib/actions/ingredients'
import { ProductionForm } from './production-form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default async function ProductionPage() {
  const [productions, recipes, ingredients] = await Promise.all([
    getProductions(),
    getRecipes(),
    getIngredients(),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Производство</h1>
        <ProductionForm recipes={recipes} ingredients={ingredients} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Продукт</TableHead>
              <TableHead>Количество</TableHead>
              <TableHead>Себестоимость</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Нет записей
                </TableCell>
              </TableRow>
            ) : (
              productions.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{format(new Date(p.date), 'd MMM yyyy', { locale: ru })}</TableCell>
                  <TableCell>{p.recipe?.name}</TableCell>
                  <TableCell>{p.quantity} {p.recipe?.unit}</TableCell>
                  <TableCell>{p.total_cost} ₽</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add src/lib/actions/production.ts src/app/\(dashboard\)/production/
git commit -m "feat: add production page with auto stock deduction"
```

---

### Task 11: Clients Page

**Files:**
- Create: `src/lib/actions/clients.ts`
- Create: `src/app/(dashboard)/clients/page.tsx`
- Create: `src/app/(dashboard)/clients/client-form.tsx`

**Step 1: Create server actions for clients**

Create `src/lib/actions/clients.ts`:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/types'

export async function getClients() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

export async function createClientAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string || null
  const instagram = formData.get('instagram') as string || null
  const notes = formData.get('notes') as string || null

  if (!name) return { success: false, error: 'Укажите имя клиента' }

  const { error } = await supabase.from('clients').insert({
    user_id: user.id,
    name,
    phone,
    instagram,
    notes,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/clients')
  return { success: true }
}

export async function deleteClient(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/clients')
  return { success: true }
}
```

**Step 2: Create client form**

Create `src/app/(dashboard)/clients/client-form.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createClientAction } from '@/lib/actions/clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export function ClientForm() {
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    const result = await createClientAction(formData)
    if (result.success) {
      toast.success('Клиент добавлен')
      setOpen(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Добавить клиента</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый клиент</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Телефон</Label>
            <Input id="phone" name="phone" type="tel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" name="instagram" placeholder="@username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Заметки</Label>
            <Textarea id="notes" name="notes" />
          </div>
          <Button type="submit" className="w-full">Добавить</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 3: Create clients page**

Create `src/app/(dashboard)/clients/page.tsx`:
```tsx
import { getClients } from '@/lib/actions/clients'
import { ClientForm } from './client-form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Клиенты</h1>
        <ClientForm />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Instagram</TableHead>
              <TableHead>Заметки</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Нет клиентов
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.phone || '—'}</TableCell>
                  <TableCell>{client.instagram || '—'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{client.notes || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add src/lib/actions/clients.ts src/app/\(dashboard\)/clients/
git commit -m "feat: add clients page with CRUD"
```

---

### Task 12: Orders Page

**Files:**
- Create: `src/lib/actions/orders.ts`
- Create: `src/app/(dashboard)/orders/page.tsx`
- Create: `src/app/(dashboard)/orders/order-form.tsx`
- Create: `src/app/(dashboard)/orders/order-status.tsx`

**Step 1: Create server actions for orders**

Create `src/lib/actions/orders.ts`:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/types'

export async function getOrders() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, client:clients(name), order_items(*, recipe:recipes(name))')
    .order('date', { ascending: false })

  if (error) throw error
  return data
}

export async function createOrder(data: {
  client_id: string
  date: string
  items: { recipe_id: string; quantity: number; price: number }[]
}): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  if (!data.client_id || data.items.length === 0) {
    return { success: false, error: 'Укажите клиента и позиции' }
  }

  const total_price = data.items.reduce((sum, item) => sum + item.quantity * item.price, 0)

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      client_id: data.client_id,
      date: data.date,
      total_price,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  const orderItems = data.items.map((item) => ({
    order_id: order.id,
    recipe_id: item.recipe_id,
    quantity: item.quantity,
    price: item.price,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

  if (itemsError) return { success: false, error: itemsError.message }

  revalidatePath('/orders')
  revalidatePath('/')
  return { success: true }
}

export async function updateOrderStatus(id: string, status: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/orders')
  revalidatePath('/')
  return { success: true }
}
```

**Step 2: Create order status component**

Create `src/app/(dashboard)/orders/order-status.tsx`:
```tsx
'use client'

import { updateOrderStatus } from '@/lib/actions/orders'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const statuses = [
  { value: 'new', label: 'Новый' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'ready', label: 'Готов' },
  { value: 'delivered', label: 'Выдан' },
  { value: 'cancelled', label: 'Отменён' },
]

export function OrderStatus({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  async function handleChange(value: string) {
    const result = await updateOrderStatus(orderId, value)
    if (result.success) {
      toast.success('Статус обновлён')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Select defaultValue={currentStatus} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((s) => (
          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

**Step 3: Create order form**

Create `src/app/(dashboard)/orders/order-form.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createOrder } from '@/lib/actions/orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Client, Recipe } from '@/lib/types'

export function OrderForm({
  clients,
  recipes,
}: {
  clients: Client[]
  recipes: Recipe[]
}) {
  const [open, setOpen] = useState(false)
  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<{ recipe_id: string; quantity: string; price: string }[]>([
    { recipe_id: '', quantity: '1', price: '' },
  ])

  function addItem() {
    setItems([...items, { recipe_id: '', quantity: '1', price: '' }])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: string, value: string) {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const total = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.price || 0),
    0
  )

  async function handleSubmit() {
    const result = await createOrder({
      client_id: clientId,
      date,
      items: items
        .filter((item) => item.recipe_id && item.quantity && item.price)
        .map((item) => ({
          recipe_id: item.recipe_id,
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
    })

    if (result.success) {
      toast.success('Заказ создан')
      setOpen(false)
      setClientId('')
      setItems([{ recipe_id: '', quantity: '1', price: '' }])
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Новый заказ</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новый заказ</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Клиент</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите клиента" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Дата</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Позиции</Label>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Select
                  value={item.recipe_id}
                  onValueChange={(v) => updateItem(i, 'recipe_id', v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Продукт" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="1"
                  className="w-16"
                  placeholder="Кол"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  className="w-24"
                  placeholder="Цена ₽"
                  value={item.price}
                  onChange={(e) => updateItem(i, 'price', e.target.value)}
                />
                {items.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeItem(i)}>
                    ✕
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addItem}>
              + Позиция
            </Button>
          </div>

          <div className="text-right font-medium">Итого: {total} ₽</div>

          <Button onClick={handleSubmit} className="w-full">Создать заказ</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 4: Create orders page**

Create `src/app/(dashboard)/orders/page.tsx`:
```tsx
import { getOrders } from '@/lib/actions/orders'
import { getClients } from '@/lib/actions/clients'
import { getRecipes } from '@/lib/actions/recipes'
import { OrderForm } from './order-form'
import { OrderStatus } from './order-status'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default async function OrdersPage() {
  const [orders, clients, recipes] = await Promise.all([
    getOrders(),
    getClients(),
    getRecipes(),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Заказы</h1>
        <OrderForm clients={clients} recipes={recipes} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Позиции</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Нет заказов
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell>{format(new Date(order.date), 'd MMM yyyy', { locale: ru })}</TableCell>
                  <TableCell>{order.client?.name || '—'}</TableCell>
                  <TableCell className="text-sm">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id}>
                        {item.recipe?.name} x{item.quantity}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell className="font-medium">{order.total_price} ₽</TableCell>
                  <TableCell>
                    <OrderStatus orderId={order.id} currentStatus={order.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

**Step 5: Commit**

```bash
git add src/lib/actions/orders.ts src/app/\(dashboard\)/orders/
git commit -m "feat: add orders page with status management"
```

---

### Task 13: Dashboard Page

**Files:**
- Create: `src/lib/actions/dashboard.ts`
- Modify: `src/app/(dashboard)/page.tsx`

**Step 1: Create dashboard data fetching**

Create `src/lib/actions/dashboard.ts`:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDashboardData(period: 'week' | 'month' | 'all' = 'month') {
  const supabase = await createClient()

  let dateFilter = ''
  const now = new Date()
  if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    dateFilter = weekAgo.toISOString().split('T')[0]
  } else if (period === 'month') {
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    dateFilter = monthAgo.toISOString().split('T')[0]
  }

  // Expenses (purchases)
  let purchasesQuery = supabase.from('purchases').select('total_price')
  if (dateFilter) purchasesQuery = purchasesQuery.gte('date', dateFilter)
  const { data: purchases } = await purchasesQuery

  const expenses = purchases?.reduce((sum, p) => sum + Number(p.total_price), 0) ?? 0

  // Revenue (delivered orders)
  let ordersQuery = supabase
    .from('orders')
    .select('total_price')
    .eq('status', 'delivered')
  if (dateFilter) ordersQuery = ordersQuery.gte('date', dateFilter)
  const { data: orders } = await ordersQuery

  const revenue = orders?.reduce((sum, o) => sum + Number(o.total_price), 0) ?? 0

  // Low stock ingredients
  const { data: lowStock } = await supabase
    .from('ingredients')
    .select('*')
    .order('stock_qty', { ascending: true })

  return {
    expenses,
    revenue,
    profit: revenue - expenses,
    ingredients: lowStock ?? [],
  }
}
```

**Step 2: Create dashboard page**

Replace content of `src/app/(dashboard)/page.tsx`:
```tsx
import { getDashboardData } from '@/lib/actions/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const data = await getDashboardData('month')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Дашборд</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Расходы (месяц)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.expenses.toLocaleString('ru-RU')} ₽</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Доходы (месяц)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.revenue.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Прибыль (месяц)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.profit.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Остатки на складе</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ингредиент</TableHead>
                <TableHead>Остаток</TableHead>
                <TableHead>Единица</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.ingredients.map((ing) => (
                <TableRow key={ing.id}>
                  <TableCell>{ing.name}</TableCell>
                  <TableCell>
                    {ing.stock_qty <= 0 ? (
                      <Badge variant="destructive">{ing.stock_qty}</Badge>
                    ) : ing.stock_qty < 100 ? (
                      <Badge variant="secondary">{ing.stock_qty}</Badge>
                    ) : (
                      <span>{ing.stock_qty}</span>
                    )}
                  </TableCell>
                  <TableCell>{ing.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/lib/actions/dashboard.ts src/app/\(dashboard\)/page.tsx
git commit -m "feat: add dashboard with expenses, revenue, profit and stock overview"
```

---

### Task 14: Final Polish and Verification

**Step 1: Verify all routes exist**

Check that all page files are in place:
```bash
find src/app -name "page.tsx" | sort
```

Expected:
```
src/app/(dashboard)/clients/page.tsx
src/app/(dashboard)/inventory/page.tsx
src/app/(dashboard)/orders/page.tsx
src/app/(dashboard)/page.tsx
src/app/(dashboard)/production/page.tsx
src/app/(dashboard)/purchases/page.tsx
src/app/(dashboard)/recipes/page.tsx
src/app/login/page.tsx
```

**Step 2: Verify build**

Run:
```bash
npm run build
```

Fix any TypeScript errors that come up.

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: fix build errors and finalize MVP"
```

---

## Summary

| Task | What it does |
|------|-------------|
| 1 | Project scaffolding (Next.js + shadcn + deps) |
| 2 | Supabase client (server/browser/middleware) |
| 3 | Database schema + RLS + RPC functions |
| 4 | TypeScript types |
| 5 | Auth (login + callback) |
| 6 | Dashboard layout with sidebar |
| 7 | Ingredients/Inventory CRUD |
| 8 | Purchases + stock update |
| 9 | Recipes with ingredient composition |
| 10 | Production with auto stock deduction |
| 11 | Clients CRUD |
| 12 | Orders with status management |
| 13 | Dashboard (expenses/revenue/profit/stock) |
| 14 | Build verification and polish |
