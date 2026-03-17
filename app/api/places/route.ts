import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PlaceResult } from '@/lib/database.types'
import axios from 'axios'
import { sanitizeInput, isValidCityName, checkRateLimit, getClientIP } from '@/lib/security'

const TOP_ATTRACTION_CATEGORIES = [
  'tourism.attraction',
  'tourism.sights',
  'entertainment.museum',
  'entertainment.culture',
  'building.historic',
]

const HIDDEN_GEM_CATEGORIES = [
  'catering.cafe',
  'catering.bar',
  'commercial.books',
  'commercial.marketplace',
  'entertainment.culture.arts_centre',
  'entertainment.culture.gallery',
]

interface GeoapifyPlace {
  geometry: {
    coordinates: [number, number]
  }
  properties: {
    name?: string
    categories?: string[]
    address_line1?: string
    formatted?: string
    website?: string
    contact?: {
      phone?: string
    }
    opening_hours?: string
    datasource?: {
      raw?: {
        description?: string
        website?: string
        phone?: string
        opening_hours?: string
      }
    }
    wiki_and_media?: {
      description?: string
    }
  }
}

interface GeoapifyResponse {
  features?: GeoapifyPlace[]
}

interface GeocodeResponse {
  features?: Array<{
    geometry: { coordinates: [number, number] }
    properties: { city?: string; name?: string }
  }>
}

interface UnsplashPhoto {
  urls: { regular: string; small: string }
  user: { name: string }
}

interface UnsplashResponse {
  results: UnsplashPhoto[]
}

async function fetchWithRetry(url: string, retries = 2): Promise<GeoapifyResponse> {
  for (let i = 0; i <= retries; i++) {
    try {
      const { data } = await axios.get<GeoapifyResponse>(url, { timeout: 30000 })
      return data
    } catch (e) {
      if (i === retries) throw e
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  throw new Error('Failed after retries')
}

function formatCategory(categories?: string[]): string | undefined {
  if (!categories || categories.length === 0) return undefined
  const category = categories[0].toLowerCase()
  
  // Map to user-friendly labels
  if (category.includes('museum')) return 'Museum'
  if (category.includes('gallery')) return 'Art Gallery'
  if (category.includes('theatre') || category.includes('theater')) return 'Theatre'
  if (category.includes('arts_centre')) return 'Arts Center'
  if (category.includes('historic')) return 'Historic Site'
  if (category.includes('monument')) return 'Monument'
  if (category.includes('castle')) return 'Castle'
  if (category.includes('church') || category.includes('cathedral')) return 'Church'
  if (category.includes('temple') || category.includes('mosque') || category.includes('synagogue')) return 'Place of Worship'
  if (category.includes('park')) return 'Park'
  if (category.includes('garden')) return 'Garden'
  if (category.includes('beach')) return 'Beach'
  if (category.includes('nature')) return 'Nature'
  if (category.includes('cafe')) return 'Café'
  if (category.includes('restaurant')) return 'Restaurant'
  if (category.includes('bar') || category.includes('pub')) return 'Bar'
  if (category.includes('market')) return 'Market'
  if (category.includes('shop') || category.includes('store')) return 'Shop'
  if (category.includes('book')) return 'Bookstore'
  if (category.includes('attraction') || category.includes('sights')) return 'Attraction'
  if (category.includes('entertainment')) return 'Entertainment'
  if (category.includes('culture')) return 'Cultural Site'
  if (category.includes('tourism')) return 'Tourist Spot'
  if (category.includes('building')) return 'Historic Building'
  if (category.includes('access')) return 'Landmark'
  
  // Fallback: format the last part
  const parts = category.split('.')
  const last = parts[parts.length - 1]
  return last.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function getRawCategories(categories?: string[]): string {
  // Return the full category string for filtering
  return (categories || []).join(' ').toLowerCase()
}

function isLatinScript(name: string): boolean {
  // Check if name uses Latin alphabet (allows accented chars like é, ñ, ü)
  // This filters out Japanese, Chinese, Arabic, Cyrillic, etc.
  const latinPattern = /^[\u0000-\u024F\u1E00-\u1EFF\s\d\-\.\'\,\&\(\)\!\?\/\:\;]+$/
  return latinPattern.test(name)
}

function isLikelyEnglish(text: string): boolean {
  if (!text || text.length < 20) return false
  
  // Common Spanish/French/German/Italian/Portuguese words that indicate non-English
  const nonEnglishPatterns = [
    /\bel\s/i, /\bla\s/i, /\blos\s/i, /\blas\s/i, /\bdel\s/i, /\bde\s/i, /\by\s/i,  // Spanish
    /\ble\s/i, /\bles\s/i, /\bune?\s/i, /\bdu\s/i, /\bdes\s/i, /\bet\s/i, /\bque\s/i, // French
    /\bdie\s/i, /\bder\s/i, /\bdas\s/i, /\bund\s/i, /\bein\s/i, /\beine\s/i, // German
    /\bil\s/i, /\bgli\s/i, /\bdella\s/i, /\bdel\s/i, /\bche\s/i, // Italian
    /\bo\s/i, /\bos\s/i, /\buma\s/i, /\bdos\s/i, /\bpara\s/i, // Portuguese
    /\bés\s/i, /\best\s/i, /\bson\s/i, /\bsont\s/i, // French verbs
    /\bño/i, /\büe/i, // Spanish specific
  ]
  
  // Check if text contains non-English patterns
  for (const pattern of nonEnglishPatterns) {
    if (pattern.test(text)) return false
  }
  
  // Check for common English words (at least a few should be present)
  const englishWords = /\b(the|is|are|was|were|has|have|been|this|that|with|from|for|and|but|not|its|their|which|who|what|when|where|how|can|will|would|could|should|one|two|many|most|some|all|into|over|under|about|after|before|between|through|during|since|until|while|because|although|however|therefore|also|very|more|most|such|only|other|another|each|every|both|few|several|own|same|different|new|old|large|small|great|little|long|short|high|low|good|bad|right|left|first|last|next|early|late|young|public|private|local|national|international|important|special|general|free|open|full|empty|possible|available|famous|popular|beautiful|ancient|modern|traditional|cultural|historical|original|natural|physical|political|social|economic|religious|military|official|main|major|central|western|eastern|northern|southern)\b/gi
  const matches = text.match(englishWords) || []
  
  // If we have at least 3 common English words, it's likely English
  return matches.length >= 3
}

function capitalizeCity(name: string): string {
  // Capitalize each word in the city name
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

async function fetchPlaceImage(placeName: string, cityName: string, unsplashKey: string): Promise<string | null> {
  try {
    const { data } = await axios.get<UnsplashResponse>(
      'https://api.unsplash.com/search/photos',
      {
        params: {
          query: `${placeName} ${cityName}`,
          per_page: 1,
          orientation: 'landscape',
        },
        headers: { Authorization: `Client-ID ${unsplashKey}` },
        timeout: 5000,
      }
    )
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular
    }
    return null
  } catch {
    return null
  }
}

async function fetchCityImage(cityName: string, unsplashKey: string): Promise<{ url: string; credit: string } | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data } = await axios.get<UnsplashResponse>(
        'https://api.unsplash.com/search/photos',
        {
          params: {
            query: `${cityName} city travel landmark`,
            per_page: 1,
            orientation: 'landscape',
          },
          headers: { Authorization: `Client-ID ${unsplashKey}` },
          timeout: 15000,
        }
      )
      if (data.results.length > 0) {
        return {
          url: data.results[0].urls.regular,
          credit: data.results[0].user.name,
        }
      }
      return null
    } catch (e) {
      if (attempt === 1) return null
      await new Promise(r => setTimeout(r, 500))
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(`places:${clientIP}`, 20, 60000) // 20 requests per minute
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
            'X-RateLimit-Remaining': '0'
          }
        }
      )
    }

    const body = await request.json()
    const rawCity = body.city

    // Input validation
    if (!rawCity || typeof rawCity !== 'string') {
      return NextResponse.json({ error: 'City name is required' }, { status: 400 })
    }

    const city = sanitizeInput(rawCity)
    
    if (!isValidCityName(city)) {
      return NextResponse.json({ error: 'Invalid city name' }, { status: 400 })
    }

    const apiKey = process.env.GEOAPIFY_API_KEY
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 })
    }

    const geocodeUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(city)}&type=city&limit=1&apiKey=${apiKey}`
    
    let geocodeData: GeocodeResponse | null = null
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await axios.get<GeocodeResponse>(geocodeUrl, { timeout: 30000 })
        geocodeData = response.data
        break
      } catch (e) {
        if (attempt === 2) throw e
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    if (!geocodeData || !geocodeData.features || geocodeData.features.length === 0) {
      return NextResponse.json({ error: `Could not find city: ${city}` }, { status: 404 })
    }

    const [lon, lat] = geocodeData.features[0].geometry.coordinates
    const rawCityName = geocodeData.features[0].properties.city || 
                        geocodeData.features[0].properties.name || 
                        city
    const cityName = capitalizeCity(rawCityName)

    const topCategoriesParam = TOP_ATTRACTION_CATEGORIES.join(',')
    const gemCategoriesParam = HIDDEN_GEM_CATEGORIES.join(',')
    
    // Fetch places sequentially to avoid overwhelming the API
    const topData = await fetchWithRetry(
      `https://api.geoapify.com/v2/places?categories=${topCategoriesParam}&filter=circle:${lon},${lat},15000&limit=25&lang=en&apiKey=${apiKey}`
    )
    const gemData = await fetchWithRetry(
      `https://api.geoapify.com/v2/places?categories=${gemCategoriesParam}&filter=circle:${lon},${lat},15000&limit=25&lang=en&apiKey=${apiKey}`
    )
    
    const topResponse = { data: topData }
    const gemResponse = { data: gemData }

    // Transform raw places - filter out non-Latin scripts
    // Get more to account for filtering by image availability
    const rawTopPlaces = (topResponse.data.features || [])
      .filter(p => p.properties.name && isLatinScript(p.properties.name))
      .slice(0, 15)
    
    const rawGemPlaces = (gemResponse.data.features || [])
      .filter(p => p.properties.name && isLatinScript(p.properties.name))
      .slice(0, 15)

    // Fetch city image
    let cityImage: { url: string; credit: string } | null = null
    if (unsplashKey) {
      cityImage = await fetchCityImage(cityName, unsplashKey)
    }

    // Fetch images for places (try to get real images, but include all places)
    let topResults: PlaceResult[] = []
    let hiddenGems: PlaceResult[] = []

    if (unsplashKey) {
      // Fetch images for top places - include all, even without images
      topResults = await Promise.all(
        rawTopPlaces.slice(0, 10).map(async (place) => {
          const [pLon, pLat] = place.geometry.coordinates
          const props = place.properties
          const imageUrl = await fetchPlaceImage(props.name!, cityName, unsplashKey)
          
          return {
            name: props.name!,
            category: formatCategory(props.categories),
            rawCategories: getRawCategories(props.categories),
            address: props.formatted || props.address_line1,
            lat: pLat,
            lon: pLon,
            city: cityName,
            website: props.website || props.datasource?.raw?.website,
            imageUrl: imageUrl || undefined, // Include even if no image found
          }
        })
      )
      
      // Fetch images for hidden gems
      hiddenGems = await Promise.all(
        rawGemPlaces.slice(0, 10).map(async (place) => {
          const [pLon, pLat] = place.geometry.coordinates
          const props = place.properties
          const imageUrl = await fetchPlaceImage(props.name!, cityName, unsplashKey)
          
          return {
            name: props.name!,
            category: formatCategory(props.categories),
            rawCategories: getRawCategories(props.categories),
            address: props.formatted || props.address_line1,
            lat: pLat,
            lon: pLon,
            city: cityName,
            website: props.website || props.datasource?.raw?.website,
            imageUrl: imageUrl || undefined,
          }
        })
      )
    } else {
      // No Unsplash key - return places without images
      topResults = rawTopPlaces.slice(0, 10).map((place) => {
        const [pLon, pLat] = place.geometry.coordinates
        const props = place.properties
        return {
          name: props.name!,
          category: formatCategory(props.categories),
          rawCategories: getRawCategories(props.categories),
          address: props.formatted || props.address_line1,
          lat: pLat,
          lon: pLon,
          city: cityName,
          website: props.website || props.datasource?.raw?.website,
        }
      })
      
      hiddenGems = rawGemPlaces.slice(0, 10).map((place) => {
        const [pLon, pLat] = place.geometry.coordinates
        const props = place.properties
        return {
          name: props.name!,
          category: formatCategory(props.categories),
          rawCategories: getRawCategories(props.categories),
          address: props.formatted || props.address_line1,
          lat: pLat,
          lon: pLon,
          city: cityName,
          website: props.website || props.datasource?.raw?.website,
        }
      })
    }


    try {
      await (supabase.from('searches') as any).insert({
        city: cityName,
        top_results_json: topResults,
        hidden_gems_json: hiddenGems,
      })
    } catch (dbError) {
      console.error('Database save error:', dbError)
    }

    return NextResponse.json({ 
      city: cityName,
      cityLat: lat,
      cityLon: lon,
      cityImage,
      topResults, 
      hiddenGems 
    })
  } catch (error) {
    console.error('Places API error:', error)
    return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 })
  }
}
