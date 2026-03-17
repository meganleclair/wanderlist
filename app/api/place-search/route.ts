import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const city = searchParams.get('city')
  
  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const apiKey = process.env.GEOAPIFY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    // First geocode the city to get coordinates
    const geocodeUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(city || '')}&type=city&limit=1&apiKey=${apiKey}`
    const geoResponse = await axios.get(geocodeUrl, { timeout: 5000 })
    
    if (!geoResponse.data.features?.length) {
      return NextResponse.json({ suggestions: [] })
    }
    
    const [lon, lat] = geoResponse.data.features[0].geometry.coordinates
    
    // Search for places matching the query within the city
    const searchUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=circle:${lon},${lat},20000&limit=6&apiKey=${apiKey}`
    const searchResponse = await axios.get(searchUrl, { timeout: 5000 })
    
    const suggestions = (searchResponse.data.features || [])
      .filter((f: any) => f.properties?.name)
      .map((f: any) => ({
        name: f.properties.name,
        address: f.properties.formatted || f.properties.address_line1,
        category: f.properties.categories?.[0]?.split('.').pop() || 'Place',
        lat: f.geometry?.coordinates?.[1],
        lon: f.geometry?.coordinates?.[0],
      }))
    
    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Place search error:', error)
    return NextResponse.json({ suggestions: [] })
  }
}
