import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatOrderDate(date: string, deliveryTime: string | null): string {
  const formatted = format(new Date(date), 'd MMM yyyy', { locale: ru })
  return deliveryTime ? `${formatted}, ${deliveryTime}` : formatted
}
