'use client'

import { useEffect, useRef } from 'react'
import { SavedPlace } from '@/lib/database.types'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface PlacesMapProps {
  places: SavedPlace[]
}

export default function PlacesMap({ places }: PlacesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const placesWithCoords = places.filter(p => p.lat && p.lon)
    if (placesWithCoords.length === 0) return

    const map = L.map(mapRef.current).setView(
      [placesWithCoords[0].lat!, placesWithCoords[0].lon!],
      13
    )
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)

    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background: #1c1917; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#FAF9F7">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    })

    placesWithCoords.forEach((place) => {
      L.marker([place.lat!, place.lon!], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: 'Playfair Display', serif; min-width: 150px;">
            <strong style="font-size: 14px;">${place.name}</strong>
            ${place.city ? `<br><span style="font-size: 11px; color: #666;">${place.city}</span>` : ''}
            ${place.category ? `<br><span style="font-size: 10px; color: #999; text-transform: uppercase;">${place.category}</span>` : ''}
          </div>
        `)
    })

    if (placesWithCoords.length > 1) {
      const bounds = L.latLngBounds(
        placesWithCoords.map(p => [p.lat!, p.lon!] as [number, number])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [places])

  const placesWithCoords = places.filter(p => p.lat && p.lon)
  
  if (placesWithCoords.length === 0) {
    return (
      <div className="bg-cream-100 rounded-lg p-8 text-center">
        <i className="fa-solid fa-map text-3xl text-stone-300 mb-3"></i>
        <p className="text-stone-500 text-sm">No locations to show on map yet</p>
      </div>
    )
  }

  return (
    <div 
      ref={mapRef} 
      className="h-64 md:h-80 rounded-lg overflow-hidden border border-cream-300"
      style={{ zIndex: 0 }}
    />
  )
}
