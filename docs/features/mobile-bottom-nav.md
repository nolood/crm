# Mobile Bottom Navigation UI Adaptation

Date: 2026-02-13 | Status: Implemented

## Overview

Responsive navigation for mobile devices with a bottom navigation bar on screens smaller than 768px. Reordered sidebar items prioritize frequent operations (Dashboard, Orders, Expenses, Purchases, Recipes) at the top, with secondary items below a visual separator. On mobile, the top 5 navigation items are accessible via a fixed bottom nav bar for ergonomic thumb reach.

## Key Features

- **Reordered navigation hierarchy**: Most-used items (Dashboard, Orders, Expenses, Purchases, Recipes) positioned at top
- **Mobile bottom nav**: 5-item fixed navigation bar on devices < 768px (md breakpoint)
- **Icon system**: All navigation items have Lucide icons for visual identification
- **Auto-closing sidebar**: Sidebar automatically collapses on mobile after navigation
- **Safe area support**: iOS notched device padding via `env(safe-area-inset-bottom)`
- **Content padding**: Main content area avoids bottom nav overlap on mobile
- **No FOUC**: CSS-based visibility toggle prevents flash of unstyled content

## Navigation Structure

### Item Priority Order

| Priority | Item | Icon | Desktop | Mobile | Usage |
|----------|------|------|---------|--------|-------|
| 1 | Dashboard | Home | Sidebar | Bottom Nav | Quick overview |
| 2 | Orders | ShoppingCart | Sidebar | Bottom Nav | Main workflow |
| 3 | Expenses | DollarSign | Sidebar | Bottom Nav | Cost tracking |
| 4 | Purchases | Package | Sidebar | Bottom Nav | Inventory management |
| 5 | Recipes | ChefHat | Sidebar | Bottom Nav | Product definitions |
| 6 | Production | Zap | Sidebar only | — | Batch operations |
| 7 | Clients | Users | Sidebar only | — | Contact management |
| 8 | Inventory | Package2 | Sidebar only | — | Stock overview |
| 9 | Write-offs | Trash2 | Sidebar only | — | Waste tracking |

Two groups separated by visual divider: Primary (1-5) and Secondary (6-9).

## Implementation Files

### New Files

#### `src/lib/navigation.ts`

Centralized navigation data source with icons, types, and active state helper.

```typescript
// src/lib/navigation.ts:1-50
import { LucideIcon, Home, ShoppingCart, DollarSign, Package, ChefHat, Zap, Users, Package2, Trash2 } from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  group: 'primary' | 'secondary'
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, group: 'primary' },
  { href: '/orders', label: 'Orders', icon: ShoppingCart, group: 'primary' },
  { href: '/expenses', label: 'Expenses', icon: DollarSign, group: 'primary' },
  { href: '/purchases', label: 'Purchases', icon: Package, group: 'primary' },
  { href: '/recipes', label: 'Recipes', icon: ChefHat, group: 'primary' },
  { href: '/production', label: 'Production', icon: Zap, group: 'secondary' },
  { href: '/clients', label: 'Clients', icon: Users, group: 'secondary' },
  { href: '/inventory', label: 'Inventory', icon: Package2, group: 'secondary' },
  { href: '/write-offs', label: 'Write-offs', icon: Trash2, group: 'secondary' },
]

export const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter(item => item.group === 'primary')

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
```

#### `src/components/bottom-nav.tsx`

Mobile-only fixed bottom navigation component.

```typescript
// src/components/bottom-nav.tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { PRIMARY_NAV_ITEMS, isNavItemActive } from '@/lib/navigation'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex h-16 [padding-bottom:env(safe-area-inset-bottom)]">
        {PRIMARY_NAV_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = isNavItemActive(pathname, item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

### Modified Files

#### `src/components/app-sidebar.tsx`

- Reordered items using `NAV_ITEMS` from navigation data
- Added Lucide icons to all items
- Added auto-close on mobile: `useSidebar` hook closes sidebar when link clicked
- Separated primary and secondary groups with `Separator` component

```typescript
// src/components/app-sidebar.tsx:1-20
'use client'

import { useSidebar } from '@/components/ui/sidebar'
import { NAV_ITEMS, PRIMARY_NAV_ITEMS, isNavItemActive } from '@/lib/navigation'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpen } = useSidebar()
  const secondaryItems = NAV_ITEMS.filter(item => item.group === 'secondary')

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setOpen(false)
    }
  }

  return (
    <nav>
      {/* Primary items group */}
      {PRIMARY_NAV_ITEMS.map(item => {
        const Icon = item.icon
        const isActive = isNavItemActive(pathname, item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleNavClick}
            className={isActive ? 'active' : ''}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        )
      })}

      {/* Separator */}
      <Separator className="my-2" />

      {/* Secondary items group */}
      {secondaryItems.map(item => {
        const Icon = item.icon
        const isActive = isNavItemActive(pathname, item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleNavClick}
            className={isActive ? 'active' : ''}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

#### `src/app/(dashboard)/layout.tsx`

Added BottomNav component and mobile bottom padding to main content.

```typescript
// src/app/(dashboard)/layout.tsx:1-30
import { BottomNav } from '@/components/bottom-nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-auto md:pb-0 pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
```

The `pb-20` (padding-bottom: 5rem) on mobile prevents content from being covered by the fixed bottom navigation bar. The mobile padding is hidden on md and above breakpoints.

#### `src/app/layout.tsx`

Added viewport-fit for safe area support.

```typescript
// src/app/layout.tsx:1-20
export const metadata = {
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
  },
}
```

The `viewportFit: 'cover'` enables `env(safe-area-inset-*)` CSS values for notched devices (iPhone X, etc.).

## Technical Decisions

### CSS-based Visibility (No FOUC)

Bottom nav uses `md:hidden` class instead of conditional rendering hooks. This prevents Flash Of Unstyled Content when page loads, as CSS media queries apply instantly before React hydrates.

```typescript
// src/components/bottom-nav.tsx
<nav className="md:hidden fixed ...">
  {/* Content always rendered but hidden on desktop via CSS */}
</nav>
```

### Shared Active State Function

Both sidebar and bottom nav use the same `isNavItemActive()` function to determine active state, ensuring consistent behavior across both navigation components.

```typescript
// src/lib/navigation.ts
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
```

### Safe Area Integration

Bottom nav respects iOS safe areas via CSS environment variable without conditional logic:

```typescript
// src/components/bottom-nav.tsx
<div className="flex h-16 [padding-bottom:env(safe-area-inset-bottom)]">
```

This automatically adds padding on notched devices. The `safe-area-inset-bottom` is 0 on devices without a notch.

### Z-index Layering

- Bottom nav: `z-50` — visible above content
- Main content: no z-index — renders below fixed nav
- Sidebar (desktop): `z-40` or higher in shadcn sidebar component

## Browser Compatibility

| Feature | iOS | Android | Desktop |
|---------|-----|---------|---------|
| Bottom nav | ✅ | ✅ | Hidden (md:hidden) |
| Safe area padding | ✅ | ✅ (if notched) | ✅ (0 padding) |
| Icon rendering | ✅ | ✅ | ✅ |
| Auto-close sidebar | ✅ | ✅ | ✅ (width < 768px) |

## Benefits

1. **Ergonomic**: Thumb-friendly navigation on mobile devices
2. **Discoverable**: 5 most-used features always visible and accessible
3. **Consistent**: Shared navigation data prevents sync issues between sidebar and bottom nav
4. **Future-proof**: Easy to add/reorder items (modify `src/lib/navigation.ts`)
5. **Performance**: No layout shift (uses CSS breakpoint, not JS detection)
6. **Accessible**: Semantic nav element, icon + label combination aids screen readers

## Related Documentation

- [Sidebar Component](https://shadcn-ui.com/docs/components/sidebar) - shadcn/ui sidebar
- Navigation hooks: `src/components/ui/sidebar.tsx` — `useSidebar` hook for open/close state
- Lucide icons: [Icon documentation](https://lucide.dev)
- Safe areas: [MDN: safe-area-inset-*](https://developer.mozilla.org/en-US/docs/Web/CSS/safe-area-inset-bottom)

## Future Enhancements

- **Badge notifications**: Add unread count badges to Orders and Expenses items
- **Route transitions**: Smooth page transitions between nav clicks (use `useTransition()`)
- **Haptic feedback**: Trigger device vibration on nav clicks (Haptic Feedback API)
- **Dark mode icons**: Automatically invert icon colors in dark mode
