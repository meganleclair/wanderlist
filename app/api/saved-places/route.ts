import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { itinerary_id, name, category, description, address, city, lat, lon } = body

  if (!itinerary_id || !name) {
    return NextResponse.json({ error: 'Itinerary ID and name are required' }, { status: 400 })
  }

  const { data: itinerary } = await supabase
    .from('itineraries')
    .select('id')
    .eq('id', itinerary_id)
    .eq('user_id', user.id)
    .single()

  if (!itinerary) {
    return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('saved_places')
    .insert({ itinerary_id, name, category, description, address, city, lat, lon })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ place: data })
}

export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, notes, day_number, sort_order } = body

  if (!id) {
    return NextResponse.json({ error: 'Place ID is required' }, { status: 400 })
  }

  const { data: place } = await supabase
    .from('saved_places')
    .select('itinerary_id')
    .eq('id', id)
    .single()

  if (!place) {
    return NextResponse.json({ error: 'Place not found' }, { status: 404 })
  }

  const { data: itinerary } = await supabase
    .from('itineraries')
    .select('id')
    .eq('id', place.itinerary_id)
    .eq('user_id', user.id)
    .single()

  if (!itinerary) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const updateData: Record<string, unknown> = {}
  if (notes !== undefined) updateData.notes = notes
  if (day_number !== undefined) updateData.day_number = day_number
  if (sort_order !== undefined) updateData.sort_order = sort_order

  const { data, error } = await supabase
    .from('saved_places')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ place: data })
}

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Place ID is required' }, { status: 400 })
  }

  const { data: place } = await supabase
    .from('saved_places')
    .select('itinerary_id')
    .eq('id', id)
    .single()

  if (!place) {
    return NextResponse.json({ error: 'Place not found' }, { status: 404 })
  }

  const { data: itinerary } = await supabase
    .from('itineraries')
    .select('id')
    .eq('id', place.itinerary_id)
    .eq('user_id', user.id)
    .single()

  if (!itinerary) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('saved_places')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
