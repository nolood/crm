import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  Receipt,
  ShoppingCart,
  CookingPot,
  Warehouse,
  Trash2,
  Factory,
  Users,
} from 'lucide-react'

export type NavItem = {
  readonly title: string
  readonly shortTitle: string
  readonly href: string
  readonly icon: LucideIcon
}

export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

export const NAV_ITEMS: readonly NavItem[] = [
  { title: 'Дашборд', shortTitle: 'Главная', href: '/', icon: LayoutDashboard },
  { title: 'Аналитика', shortTitle: 'Аналитика', href: '/analytics', icon: BarChart3 },
  { title: 'Заказы', shortTitle: 'Заказы', href: '/orders', icon: ClipboardList },
  { title: 'Расходы', shortTitle: 'Расходы', href: '/expenses', icon: Receipt },
  { title: 'Закупки', shortTitle: 'Закупки', href: '/purchases', icon: ShoppingCart },
  { title: 'Рецепты', shortTitle: 'Рецепты', href: '/recipes', icon: CookingPot },
  { title: 'Производство', shortTitle: 'Производство', href: '/production', icon: Factory },
  { title: 'Клиенты', shortTitle: 'Клиенты', href: '/clients', icon: Users },
  { title: 'Склад', shortTitle: 'Склад', href: '/inventory', icon: Warehouse },
  { title: 'Списания', shortTitle: 'Списания', href: '/write-offs', icon: Trash2 },
] as const

export const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 5)
