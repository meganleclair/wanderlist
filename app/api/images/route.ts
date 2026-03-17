import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

interface UnsplashPhoto {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  alt_description: string | null
  user: {
    name: string
    username: string
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')
  const count = searchParams.get('count') || '1'

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    return NextResponse.json({ error: 'Unsplash not configured' }, { status: 500 })
  }

  try {
    const { data } = await axios.get<{ results: UnsplashPhoto[] }>(
      'https://api.unsplash.com/search/photos',
      {
        params: {
          query: `${query} travel landmark`,
          per_page: count,
          orientation: 'landscape',
        },
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
        timeout: 10000,
      }
    )

    const images = data.results.map((photo) => ({
      id: photo.id,
      url: photo.urls.regular,
      urlSmall: photo.urls.small,
      urlFull: photo.urls.full,
      alt: photo.alt_description || query,
      credit: {
        name: photo.user.name,
        username: photo.user.username,
      },
    }))

    return NextResponse.json({ images })
  } catch (error) {
    console.error('Unsplash API error:', error)
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}
