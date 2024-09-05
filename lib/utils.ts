import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  const gold = Math.floor(price / 10000)
  const silver = Math.floor((price % 10000) / 100)
  const copper = price % 100

  let formattedPrice = ''

  if (gold > 0) {
    formattedPrice += `${gold}g `
  }
  if (silver > 0 || gold > 0) {
    formattedPrice += `${silver}s `
  }
  formattedPrice += `${copper}c`

  return formattedPrice.trim()
}