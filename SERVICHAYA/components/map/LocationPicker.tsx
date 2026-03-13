'use client'

import { useEffect, useRef, useState } from 'react'
import { GOOGLE_MAPS_API_KEY } from '@/lib/config'

type LatLng = { lat: number; lng: number }

interface LocationPickerProps {
  /** Center of the map when it loads (usually POD or city center) */
  center: LatLng
  /** Current selected point (customer’s exact location). If not provided, marker starts at center. */
  value?: LatLng
  /** Optional radius (in km) to visualize a geofence circle */
  radiusKm?: number
  /** Height of the map container in pixels */
  height?: number
  /** When user picks/moves location */
  onChange?: (coords: LatLng) => void
  /** If true, map is read-only (no click to move marker) */
  readOnly?: boolean
}

declare global {
  interface Window {
    google?: typeof google
    __servichayaGoogleMapsLoading?: boolean
    __servichayaGoogleMapsLoaded?: boolean
    __servichayaGoogleMapsResolvers?: Array<() => void>
  }
}

async function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return

  if (window.google && window.google.maps) {
    return
  }

  if (window.__servichayaGoogleMapsLoaded) {
    return
  }

  if (window.__servichayaGoogleMapsLoading) {
    // Already loading – attach to resolver list
    await new Promise<void>((resolve) => {
      window.__servichayaGoogleMapsResolvers = window.__servichayaGoogleMapsResolvers || []
      window.__servichayaGoogleMapsResolvers.push(resolve)
    })
    return
  }

  window.__servichayaGoogleMapsLoading = true
  window.__servichayaGoogleMapsResolvers = []

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      window.__servichayaGoogleMapsLoaded = true
      window.__servichayaGoogleMapsLoading = false
      resolve()
      // Resolve any queued waiters
      if (window.__servichayaGoogleMapsResolvers) {
        window.__servichayaGoogleMapsResolvers.forEach((fn) => fn())
        window.__servichayaGoogleMapsResolvers = []
      }
    }
    script.onerror = (err) => {
      window.__servichayaGoogleMapsLoading = false
      reject(err)
    }
    document.head.appendChild(script)
  })
}

export function LocationPicker({
  center,
  value,
  radiusKm,
  height = 260,
  onChange,
  readOnly,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const circleRef = useRef<google.maps.Circle | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const [hasUsedGeolocation, setHasUsedGeolocation] = useState(false)

  useEffect(() => {
    let isCancelled = false

    ;(async () => {
      try {
        await loadGoogleMaps(GOOGLE_MAPS_API_KEY)
        if (isCancelled || !containerRef.current || !window.google?.maps) return

        let initialCenter: LatLng = value || center

        const map = new window.google.maps.Map(containerRef.current, {
          center: initialCenter,
          zoom: 14,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        })
        mapRef.current = map

        const marker = new window.google.maps.Marker({
          position: initialCenter,
          map,
          draggable: !readOnly,
        })
        markerRef.current = marker

        if (radiusKm && radiusKm > 0) {
          const circle = new window.google.maps.Circle({
            map,
            center: center,
            radius: radiusKm * 1000,
            fillColor: '#22c55e',
            fillOpacity: 0.1,
            strokeColor: '#22c55e',
            strokeOpacity: 0.6,
            strokeWeight: 1,
          })
          circleRef.current = circle
        }

        if (!readOnly && onChange) {
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return
            const next = { lat: e.latLng.lat(), lng: e.latLng.lng() }
            marker.setPosition(next)
            onChange(next)
          })

          marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return
            const next = { lat: e.latLng.lat(), lng: e.latLng.lng() }
            onChange(next)
          })
        }

        // Try to use browser's current location as a smarter default
        if (!readOnly && !value && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!mapRef.current || !markerRef.current) return
              const current: LatLng = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              }
              setHasUsedGeolocation(true)
              mapRef.current.setCenter(current)
              markerRef.current.setPosition(current)
              onChange?.(current)
            },
            () => {
              // Ignore failure; we already used provided center / city center
            },
            {
              enableHighAccuracy: true,
              timeout: 8000,
              maximumAge: 60000,
            }
          )
        }
      } catch (err) {
        console.error('Failed to initialize Google Maps', err)
        setInitError('Failed to load map')
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [])

  // If center / radius change after initial render, update circle + map center
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter(center)
    }
    if (circleRef.current) {
      circleRef.current.setCenter(center)
      if (radiusKm && radiusKm > 0) {
        circleRef.current.setRadius(radiusKm * 1000)
      }
    }
  }, [center.lat, center.lng, radiusKm])

  // If value (selected point) changes from outside, move marker
  useEffect(() => {
    if (markerRef.current && value) {
      markerRef.current.setPosition(value)
    }
  }, [value?.lat, value?.lng])

  return (
    <div className="space-y-1">
      <div
        ref={containerRef}
        style={{ width: '100%', height }}
        className="rounded-xl overflow-hidden border border-white/15 bg-slate-900/60"
      />
      {initError && (
        <p className="text-[11px] text-amber-300">
          {initError}. Please configure <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
        </p>
      )}
      {!initError && (
        <p className="text-[11px] text-slate-400">
          Move the pin or tap on the map to fine-tune your exact location.
        </p>
      )}
    </div>
  )
}

export default LocationPicker

