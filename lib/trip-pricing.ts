import type { SavedPlace } from './database.types'

export function formatEstimatedBudgetUsd(amount: number): string {
  const rounded = Math.round(amount / 50) * 50
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(rounded)
}

export function estimateTripDaysFromPlaces(
  savedPlaces: SavedPlace[] | undefined,
  dateRange?: { start: string; end: string } | null
): number {
  const places = savedPlaces ?? []
  if (dateRange?.start && dateRange?.end) {
    const s = new Date(dateRange.start)
    const e = new Date(dateRange.end)
    if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime())) {
      return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1)
    }
  }
  const maxD = Math.max(0, ...places.map(p => p.day_number || 0))
  if (maxD > 0) return maxD
  return places.length > 0 ? 1 : 1
}

export function countTripCityCount(savedPlaces: SavedPlace[] | undefined): number {
  const cities = new Set(
    (savedPlaces ?? []).map(p => p.city).filter((c): c is string => Boolean(c))
  )
  return Math.max(1, cities.size)
}

/**
 * Rough total trip spend (lodging, food, local transport, typical paid entries).
 * Excludes long-haul flights. For planning and comparison only.
 */
export function estimateCustomTripBudgetUsd(options: {
  dayCount: number
  placeCount: number
  cityCount: number
}): number {
  const days = Math.max(1, options.dayCount)
  const cities = Math.max(1, options.cityCount)
  const places = Math.max(0, options.placeCount)
  const baseDaily = 185
  const extraCityPremium = Math.max(0, cities - 1) * 125
  const activityEstimate = places * 32
  return days * baseDaily + extraCityPremium + activityEstimate
}
