import { NextResponse } from 'next/server'
import axios from 'axios'

const POPULAR_CITIES = [
  'Paris', 'Tokyo', 'New York', 'London', 'Barcelona', 'Rome', 'Amsterdam',
  'Berlin', 'Sydney', 'Dubai', 'Singapore', 'Bangkok', 'Istanbul', 'Prague',
  'Vienna', 'Lisbon', 'Dublin', 'Copenhagen', 'Florence', 'Venice', 'Milan',
  'Athens', 'Budapest', 'Edinburgh', 'Munich', 'Kyoto', 'Seoul', 'Marrakech',
  'Cape Town', 'Rio de Janeiro', 'Buenos Aires', 'Mexico City', 'San Francisco',
  'Los Angeles', 'Chicago', 'Miami', 'Toronto', 'Vancouver', 'Montreal'
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.toLowerCase() || ''
  const type = searchParams.get('type')

  if (type === 'popular') {
    const shuffled = [...POPULAR_CITIES].sort(() => Math.random() - 0.5)
    return NextResponse.json({ cities: shuffled.slice(0, 8) })
  }

  if (type === 'random') {
    const random = POPULAR_CITIES[Math.floor(Math.random() * POPULAR_CITIES.length)]
    return NextResponse.json({ city: random })
  }

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const apiKey = process.env.GEOAPIFY_API_KEY
  if (!apiKey) {
    const filtered = POPULAR_CITIES
      .filter(city => city.toLowerCase().includes(query))
      .slice(0, 5)
    return NextResponse.json({ suggestions: filtered })
  }

  try {
    const { data } = await axios.get(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&type=city&limit=5&apiKey=${apiKey}`,
      { timeout: 5000 }
    )

    const suggestions = (data.features || [])
      .map((f: { properties: { city?: string; name?: string; country?: string } }) => {
        const city = f.properties.city || f.properties.name
        const country = f.properties.country
        return city ? `${city}${country ? `, ${country}` : ''}` : null
      })
      .filter(Boolean)
      .slice(0, 5)

    return NextResponse.json({ suggestions })
  } catch {
    const filtered = POPULAR_CITIES
      .filter(city => city.toLowerCase().includes(query))
      .slice(0, 5)
    return NextResponse.json({ suggestions: filtered })
  }
}
