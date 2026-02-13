'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { AnalyticsPeriod } from '@/lib/types'

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'quarter', label: 'Квартал' },
  { value: 'year', label: 'Год' },
  { value: 'all', label: 'Всё время' },
]

interface AnalyticsPeriodFilterProps {
  currentPeriod: AnalyticsPeriod
}

export function AnalyticsPeriodFilter({ currentPeriod }: AnalyticsPeriodFilterProps) {
  const router = useRouter()

  return (
    <div className="flex gap-1">
      {PERIODS.map(({ value, label }) => (
        <Button
          key={value}
          variant={currentPeriod === value ? 'default' : 'outline'}
          size="sm"
          onClick={() => router.push(`/analytics?period=${value}`, { scroll: false })}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
