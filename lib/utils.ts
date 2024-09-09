import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPercentage(value: number | string | null): string {
  if (value === null || value === '') return 'N/A'
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return 'N/A'
  return `${(numValue * 100).toFixed(2)}%`
}
