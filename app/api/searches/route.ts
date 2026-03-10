import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('searches')
      .select('*')
      .order('searched_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch searches' },
        { status: 500 }
      )
    }

    return NextResponse.json({ searches: data || [] })
  } catch (error) {
    console.error('Searches API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch searches' },
      { status: 500 }
    )
  }
}
