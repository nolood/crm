-- ============================================
-- SEED DATA for Confectionery CRM
-- ============================================

-- Create expenses table if not exists
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  description text not null,
  amount numeric not null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

-- Drop policies first in case they already exist (idempotent)
drop policy if exists "Users can view own expenses" on public.expenses;
drop policy if exists "Users can insert own expenses" on public.expenses;
drop policy if exists "Users can update own expenses" on public.expenses;
drop policy if exists "Users can delete own expenses" on public.expenses;

create policy "Users can view own expenses" on public.expenses for select using (auth.uid() = user_id);
create policy "Users can insert own expenses" on public.expenses for insert with check (auth.uid() = user_id);
create policy "Users can update own expenses" on public.expenses for update using (auth.uid() = user_id);
create policy "Users can delete own expenses" on public.expenses for delete using (auth.uid() = user_id);

-- ============================================
-- SEED FUNCTION
-- ============================================

create or replace function public.seed_data(p_user_id uuid) returns void as $$
declare
  -- ========== Ingredient IDs ==========
  -- Main
  ing_strawberry uuid;
  ing_chocolate uuid;
  ing_blueberry uuid;
  -- Packaging
  ing_podlozhka_strawberry uuid;
  ing_sticker uuid;
  ing_card uuid;
  ing_ribbon uuid;
  ing_podlozhka_2 uuid;
  ing_box_8 uuid;
  ing_box_12 uuid;
  ing_box_17_25 uuid;
  ing_box_35 uuid;
  ing_kraft_no_handles uuid;
  ing_kraft_big uuid;
  ing_kraft_small uuid;
  ing_round_box_small uuid;
  ing_round_box_big uuid;
  ing_tissue_paper uuid;
  -- Decorations
  ing_coconut uuid;
  ing_sugar_hearts uuid;
  ing_paint uuid;
  ing_powder_paint uuid;
  ing_raspberry_sub uuid;
  ing_glaze uuid;
  ing_almond uuid;
  ing_gold_silver uuid;
  -- Consumables
  ing_gloves uuid;
  ing_parchment uuid;
  ing_paper_towels uuid;
  ing_caps uuid;

  -- ========== Recipe IDs ==========
  rec_8 uuid;
  rec_12 uuid;
  rec_17 uuid;
  rec_25 uuid;
  rec_35 uuid;
  rec_45 uuid;
begin
  -- ============================================
  -- INGREDIENTS
  -- ============================================

  -- Main ingredients
  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Клубника', 'г', 0)
  returning id into ing_strawberry;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Шоколад', 'г', 0)
  returning id into ing_chocolate;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Голубика', 'г', 0)
  returning id into ing_blueberry;

  -- Packaging
  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Подложка под клубнику', 'шт', 0)
  returning id into ing_podlozhka_strawberry;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Наклейка', 'шт', 0)
  returning id into ing_sticker;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Открытка', 'шт', 0)
  returning id into ing_card;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Атласная лента', 'м', 0)
  returning id into ing_ribbon;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Подложка под 2 ягоды', 'шт', 0)
  returning id into ing_podlozhka_2;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Коробка под 8 ягод', 'шт', 0)
  returning id into ing_box_8;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Коробка под 12 ягод', 'шт', 0)
  returning id into ing_box_12;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Коробка под 17-25 ягод', 'шт', 0)
  returning id into ing_box_17_25;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Коробка под 35 ягод', 'шт', 0)
  returning id into ing_box_35;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Крафт пакет без ручек', 'шт', 0)
  returning id into ing_kraft_no_handles;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Крафт пакет с ручками большой', 'шт', 0)
  returning id into ing_kraft_big;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Крафт пакет с ручками маленький', 'шт', 0)
  returning id into ing_kraft_small;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Коробка круглая малая', 'шт', 0)
  returning id into ing_round_box_small;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Коробка круглая большая', 'шт', 0)
  returning id into ing_round_box_big;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Бумага тишью', 'шт', 0)
  returning id into ing_tissue_paper;

  -- Decorations
  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Кокос', 'г', 0)
  returning id into ing_coconut;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Сердечки сахарные', 'г', 0)
  returning id into ing_sugar_hearts;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Краска', 'шт', 0)
  returning id into ing_paint;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Пудра краска', 'шт', 0)
  returning id into ing_powder_paint;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Малина сублимированная', 'г', 0)
  returning id into ing_raspberry_sub;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Глазурь', 'г', 0)
  returning id into ing_glaze;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Миндаль', 'г', 0)
  returning id into ing_almond;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Золото/серебро', 'шт', 0)
  returning id into ing_gold_silver;

  -- Consumables
  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Перчатки', 'пара', 0)
  returning id into ing_gloves;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Пергамент', 'шт', 0)
  returning id into ing_parchment;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Бумажные полотенца', 'шт', 0)
  returning id into ing_paper_towels;

  insert into public.ingredients (user_id, name, unit, stock_qty)
  values (p_user_id, 'Шапочки', 'шт', 0)
  returning id into ing_caps;

  -- ============================================
  -- PURCHASES + STOCK UPDATES
  -- ============================================

  -- Клубника: 1000г at 1.60₽/г = 1600₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_strawberry, 1000, 1.60, 1600, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 1000 where id = ing_strawberry;

  -- Шоколад: 2500г at 2.036₽/г = 5090₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_chocolate, 2500, 2.036, 5090, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 2500 where id = ing_chocolate;

  -- Голубика: 125г at 1.60₽/г = 200₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_blueberry, 125, 1.60, 200, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 125 where id = ing_blueberry;

  -- Подложка под клубнику: 200шт at 0.765₽/шт = 153₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_podlozhka_strawberry, 200, 0.765, 153, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 200 where id = ing_podlozhka_strawberry;

  -- Наклейка: 80шт at 3.10₽/шт = 248₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_sticker, 80, 3.10, 248, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 80 where id = ing_sticker;

  -- Открытка: 100шт at 3.60₽/шт = 360₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_card, 100, 3.60, 360, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 100 where id = ing_card;

  -- Атласная лента: 220м at 2.032₽/м = 447₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_ribbon, 220, 2.032, 447, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 220 where id = ing_ribbon;

  -- Подложка под 2 ягоды: 100шт at 1.91₽/шт = 191₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_podlozhka_2, 100, 1.91, 191, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 100 where id = ing_podlozhka_2;

  -- Коробка под 8 ягод: 1шт at 36₽/шт = 36₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_box_8, 1, 36, 36, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 1 where id = ing_box_8;

  -- Коробка под 12 ягод: 1шт at 37₽/шт = 37₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_box_12, 1, 37, 37, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 1 where id = ing_box_12;

  -- Коробка под 17-25 ягод: 1шт at 91₽/шт = 91₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_box_17_25, 1, 91, 91, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 1 where id = ing_box_17_25;

  -- Коробка под 35 ягод: 1шт at 184₽/шт = 184₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_box_35, 1, 184, 184, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 1 where id = ing_box_35;

  -- Крафт пакет без ручек: 15шт at 8.40₽/шт = 126₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_kraft_no_handles, 15, 8.40, 126, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 15 where id = ing_kraft_no_handles;

  -- Крафт пакет с ручками большой: 5шт at 28₽/шт = 140₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_kraft_big, 5, 28, 140, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 5 where id = ing_kraft_big;

  -- Крафт пакет с ручками маленький: 20шт at 19₽/шт = 380₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_kraft_small, 20, 19, 380, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 20 where id = ing_kraft_small;

  -- Коробка круглая малая: 1шт at 164₽/шт = 164₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_round_box_small, 1, 164, 164, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 1 where id = ing_round_box_small;

  -- Коробка круглая большая: 1шт at 184₽/шт = 184₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_round_box_big, 1, 184, 184, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 1 where id = ing_round_box_big;

  -- Бумага тишью: 1шт at 130₽/шт = 130₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_tissue_paper, 1, 130, 130, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 1 where id = ing_tissue_paper;

  -- Кокос: 150г at 1.067₽/г = 160₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_coconut, 150, 1.067, 160, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 150 where id = ing_coconut;

  -- Сердечки сахарные: 50г at 1.30₽/г = 65₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_sugar_hearts, 50, 1.30, 65, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 50 where id = ing_sugar_hearts;

  -- Краска: 1шт at 125₽/шт = 125₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_paint, 1, 125, 125, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 1 where id = ing_paint;

  -- Пудра краска: 1шт at 205₽/шт = 205₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_powder_paint, 1, 205, 205, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 1 where id = ing_powder_paint;

  -- Малина сублимированная: 50г at 9.80₽/г = 490₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_raspberry_sub, 50, 9.80, 490, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 50 where id = ing_raspberry_sub;

  -- Глазурь: 250г at 0.58₽/г = 145₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_glaze, 250, 0.58, 145, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 250 where id = ing_glaze;

  -- Миндаль: 150г at 2.667₽/г = 400₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_almond, 150, 2.667, 400, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 150 where id = ing_almond;

  -- Золото/серебро: 1шт at 140₽/шт = 140₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_gold_silver, 1, 140, 140, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 1 where id = ing_gold_silver;

  -- Перчатки: 50 пар at 9₽/пара = 450₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_gloves, 50, 9, 450, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 50 where id = ing_gloves;

  -- Пергамент: 1шт at 300₽/шт = 300₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_parchment, 1, 300, 300, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 1 where id = ing_parchment;

  -- Бумажные полотенца: 1шт at 45₽/шт = 45₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_paper_towels, 1, 45, 45, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 1 where id = ing_paper_towels;

  -- Шапочки: 100шт at 3₽/шт = 300₽
  insert into public.purchases (user_id, ingredient_id, quantity, price_per_unit, total_price, date)
  values (p_user_id, ing_caps, 100, 3, 300, '2026-02-12');
  update public.ingredients set stock_qty = stock_qty + 100 where id = ing_caps;

  -- ============================================
  -- RECIPES
  -- ============================================

  -- Набор 8 ягод
  insert into public.recipes (user_id, name, output_quantity, unit)
  values (p_user_id, 'Набор 8 ягод', 1, 'набор')
  returning id into rec_8;

  insert into public.recipe_items (recipe_id, ingredient_id, quantity) values
    (rec_8, ing_strawberry, 192),
    (rec_8, ing_chocolate, 77),
    (rec_8, ing_box_8, 1),
    (rec_8, ing_sticker, 1),
    (rec_8, ing_card, 1),
    (rec_8, ing_podlozhka_2, 4);

  -- Набор 12 ягод
  insert into public.recipes (user_id, name, output_quantity, unit)
  values (p_user_id, 'Набор 12 ягод', 1, 'набор')
  returning id into rec_12;

  insert into public.recipe_items (recipe_id, ingredient_id, quantity) values
    (rec_12, ing_strawberry, 288),
    (rec_12, ing_chocolate, 115),
    (rec_12, ing_box_12, 1),
    (rec_12, ing_sticker, 1),
    (rec_12, ing_card, 1),
    (rec_12, ing_podlozhka_2, 6);

  -- Набор 17 ягод
  insert into public.recipes (user_id, name, output_quantity, unit)
  values (p_user_id, 'Набор 17 ягод', 1, 'набор')
  returning id into rec_17;

  insert into public.recipe_items (recipe_id, ingredient_id, quantity) values
    (rec_17, ing_strawberry, 408),
    (rec_17, ing_chocolate, 163),
    (rec_17, ing_box_17_25, 1),
    (rec_17, ing_sticker, 1),
    (rec_17, ing_card, 1),
    (rec_17, ing_podlozhka_2, 9);

  -- Набор 25 ягод
  insert into public.recipes (user_id, name, output_quantity, unit)
  values (p_user_id, 'Набор 25 ягод', 1, 'набор')
  returning id into rec_25;

  insert into public.recipe_items (recipe_id, ingredient_id, quantity) values
    (rec_25, ing_strawberry, 600),
    (rec_25, ing_chocolate, 240),
    (rec_25, ing_box_17_25, 1),
    (rec_25, ing_sticker, 1),
    (rec_25, ing_card, 1),
    (rec_25, ing_podlozhka_2, 13);

  -- Набор 35 ягод
  insert into public.recipes (user_id, name, output_quantity, unit)
  values (p_user_id, 'Набор 35 ягод', 1, 'набор')
  returning id into rec_35;

  insert into public.recipe_items (recipe_id, ingredient_id, quantity) values
    (rec_35, ing_strawberry, 840),
    (rec_35, ing_chocolate, 336),
    (rec_35, ing_box_35, 1),
    (rec_35, ing_sticker, 1),
    (rec_35, ing_card, 1),
    (rec_35, ing_podlozhka_2, 18);

  -- Набор 45 ягод
  insert into public.recipes (user_id, name, output_quantity, unit)
  values (p_user_id, 'Набор 45 ягод', 1, 'набор')
  returning id into rec_45;

  insert into public.recipe_items (recipe_id, ingredient_id, quantity) values
    (rec_45, ing_strawberry, 1080),
    (rec_45, ing_chocolate, 432),
    (rec_45, ing_sticker, 1),
    (rec_45, ing_card, 1),
    (rec_45, ing_podlozhka_2, 23);

end;
$$ language plpgsql security definer;

-- To seed data, first sign up in the app, then run:
-- select seed_data('YOUR_USER_ID_HERE');
-- You can find your user ID in Supabase Dashboard > Authentication > Users
