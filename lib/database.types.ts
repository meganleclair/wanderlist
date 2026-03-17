export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      searches: {
        Row: {
          id: string
          city: string
          searched_at: string
          top_results_json: Json
          hidden_gems_json: Json
        }
        Insert: {
          id?: string
          city: string
          searched_at?: string
          top_results_json: Json
          hidden_gems_json: Json
        }
        Update: {
          id?: string
          city?: string
          searched_at?: string
          top_results_json?: Json
          hidden_gems_json?: Json
        }
      }
      itineraries: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      saved_places: {
        Row: {
          id: string
          itinerary_id: string
          name: string
          category: string | null
          description: string | null
          address: string | null
          city: string | null
          lat: number | null
          lon: number | null
          created_at: string
        }
        Insert: {
          id?: string
          itinerary_id: string
          name: string
          category?: string | null
          description?: string | null
          address?: string | null
          city?: string | null
          lat?: number | null
          lon?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          itinerary_id?: string
          name?: string
          category?: string | null
          description?: string | null
          address?: string | null
          city?: string | null
          lat?: number | null
          lon?: number | null
          created_at?: string
        }
      }
    }
  }
}

export interface PlaceResult {
  name: string
  category?: string
  rawCategories?: string
  description?: string
  address?: string
  city?: string
  lat?: number
  lon?: number
  distance?: number
  imageUrl?: string
  imageCredit?: string
  website?: string
  phone?: string
  openingHours?: string
}

export interface SearchRecord {
  id: string
  city: string
  searched_at: string
  top_results_json: PlaceResult[]
  hidden_gems_json: PlaceResult[]
}

export interface Itinerary {
  id: string
  user_id: string
  name: string
  share_id: string | null
  created_at: string
  updated_at: string
  saved_places?: SavedPlace[]
}

export interface SavedPlace {
  id: string
  itinerary_id: string
  place_id?: string
  name: string
  category: string | null
  description: string | null
  address: string | null
  city: string | null
  lat: number | null
  lon: number | null
  notes: string | null
  day_number: number | null
  sort_order: number | null
  created_at: string
}
