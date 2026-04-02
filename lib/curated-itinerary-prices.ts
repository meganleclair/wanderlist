/**
 * Ballpark minimum trip budget per curated itinerary (USD).
 * Covers typical mid-range lodging, food, local transport, and activities — not flights.
 */
export const CURATED_ITINERARY_PRICE_FROM_USD: Record<string, number> = {
  'paris-classic': 3200,
  'tokyo-adventure': 3800,
  'barcelona-sun': 2700,
  'rome-history': 2900,
  'bali-escape': 2100,
  'nyc-first-timer': 3600,
  'greece-islands': 4100,
  'amalfi-coast': 3900,
  'japan-grand-tour': 9200,
  'portugal-complete': 4400,
  'vietnam-journey': 3100,
  'balkans-adventure': 3900,
  'southeast-asia': 3400,
  'scandinavia-road-trip': 8200,
}

export function getCuratedPriceFromUsd(id: string): number {
  return CURATED_ITINERARY_PRICE_FROM_USD[id] ?? 2800
}
