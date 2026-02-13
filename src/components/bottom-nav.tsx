'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BOTTOM_NAV_ITEMS, isNavItemActive } from '@/lib/navigation'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(item.href, pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors',
                isActive
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="size-5" />
              <span className="truncate">{item.shortTitle}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
