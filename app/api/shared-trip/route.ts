import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const shareId = searchParams.get('shareId')

  if (!shareId) {
    return NextResponse.json({ error: 'Share ID is required' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: itinerary, error } = await supabase
    .from('itineraries')
    .select(`
      id,
      name,
      created_at,
      saved_places (*)
    `)
    .eq('share_id', shareId)
    .single()

  if (error || !itinerary) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  return NextResponse.json({ itinerary })
}
