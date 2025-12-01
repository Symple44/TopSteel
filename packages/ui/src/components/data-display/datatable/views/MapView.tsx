'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '../../badge'

// CSS URLs pour Leaflet - chargés uniquement quand MapView est utilisé
const LEAFLET_CSS = [
  { id: 'leaflet-css', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' },
  { id: 'markercluster-css', href: 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css' },
  { id: 'markercluster-default-css', href: 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css' },
]

// Hook pour charger/décharger le CSS Leaflet
function useLeafletCSS() {
  useEffect(() => {
    const links: HTMLLinkElement[] = []

    // Injecter les CSS
    LEAFLET_CSS.forEach(({ id, href }) => {
      if (!document.getElementById(id)) {
        const link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        link.href = href
        document.head.appendChild(link)
        links.push(link)
      }
    })

    // Cleanup : retirer les CSS quand le composant est démonté
    return () => {
      links.forEach((link) => {
        if (link.parentNode) {
          link.parentNode.removeChild(link)
        }
      })
    }
  }, [])
}

// Types pour les markers
export interface MapMarker {
  id: string
  lat: number
  lng: number
  title: string
  subtitle?: string
  description?: string
  color?: string
  category?: string
  icon?: string
  meta?: { label: string; value: string }[]
}

interface MapViewProps {
  markers: MapMarker[]
  center?: [number, number]
  zoom?: number
  height?: string
  onMarkerClick?: (marker: MapMarker) => void
  onMarkerEdit?: (marker: MapMarker) => void
  onMarkerDelete?: (marker: MapMarker) => void
}

// Mapping des couleurs hex vers noms de couleurs pour les icônes
const getIconColorName = (hexColor?: string): string => {
  if (!hexColor) return 'blue'
  const colorMap: Record<string, string> = {
    '#3b82f6': 'blue',
    '#10b981': 'green',
    '#f59e0b': 'orange',
    '#ef4444': 'red',
    '#8b5cf6': 'violet',
    '#ec4899': 'red',
    '#6b7280': 'grey',
    '#06b6d4': 'blue',
  }
  return colorMap[hexColor.toLowerCase()] || 'blue'
}

// Composant interne avec la carte
function MapViewInner({
  markers,
  center,
  zoom = 6,
  height = '500px',
  onMarkerClick,
}: MapViewProps) {
  // Charger CSS Leaflet (avec cleanup au démontage)
  useLeafletCSS()

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const clusterGroupRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)
  const isInitializingRef = useRef(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Calculer le centre par défaut basé sur les markers
  const defaultCenter = useMemo(() => {
    if (center) return center
    if (markers.length === 0) return [46.603354, 1.888334] as [number, number] // France par défaut

    const avgLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length
    const avgLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length
    return [avgLat, avgLng] as [number, number]
  }, [center, markers])

  // Fonction pour créer le contenu du popup
  const createPopupContent = useCallback((marker: MapMarker) => {
    const metaHtml = marker.meta && marker.meta.length > 0
      ? `<div style="margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 8px;">
          ${marker.meta.map(m => `
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
              <span style="color: #6b7280;">${m.label}:</span>
              <span style="font-weight: 500;">${m.value}</span>
            </div>
          `).join('')}
        </div>`
      : ''

    return `
      <div style="padding: 12px; min-width: 220px; font-family: system-ui, sans-serif;">
        <div style="margin-bottom: 8px;">
          <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0; color: #111827;">
            ${marker.title}
          </h3>
          ${marker.subtitle ? `<p style="font-size: 12px; color: #6b7280; margin: 0 0 4px 0;">${marker.subtitle}</p>` : ''}
          ${marker.description ? `<p style="font-size: 12px; color: #374151; margin: 0 0 8px 0;">${marker.description}</p>` : ''}
          ${marker.category ? `
            <span style="
              display: inline-block;
              padding: 2px 8px;
              background: ${marker.color}20;
              color: ${marker.color};
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 500;
            ">${marker.category}</span>
          ` : ''}
        </div>

        ${metaHtml}

        <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 4px;">
            <button
              onclick="window.openInGoogleMaps(${marker.lat}, ${marker.lng}, '${marker.title.replace(/'/g, "\\'")}')"
              style="
                flex: 1;
                background: #f3f4f6;
                border: 1px solid #e5e7eb;
                padding: 6px 8px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
              "
            >
              Maps
            </button>
            <button
              onclick="window.openInWaze(${marker.lat}, ${marker.lng}, '${marker.title.replace(/'/g, "\\'")}')"
              style="
                flex: 1;
                background: #f3f4f6;
                border: 1px solid #e5e7eb;
                padding: 6px 8px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
              "
            >
              Waze
            </button>
          </div>

          <div style="text-align: center; font-size: 10px; color: #9ca3af;">
            ${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)}
          </div>
        </div>
      </div>
    `
  }, [])

  // Effet 1: Initialiser la carte UNE SEULE fois
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || isInitializingRef.current) return

    isInitializingRef.current = true

    const initMap = async () => {
      try {
        // Import dynamique de Leaflet
        const L = (await import('leaflet')).default
        leafletRef.current = L

        // Import de markercluster (doit être après leaflet)
        await import('leaflet.markercluster')

        // Vérifier que le container existe encore
        if (!mapRef.current) {
          isInitializingRef.current = false
          return
        }

        // Configuration des icônes par défaut
        ;(L.Icon.Default.prototype as any)._getIconUrl = undefined
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        // Créer la carte
        const map = L.map(mapRef.current, {
          center: defaultCenter,
          zoom: zoom,
          zoomControl: true,
        })

        // Tuiles OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map)

        // Définir les fonctions globales pour les popups
        if (typeof window !== 'undefined') {
          ;(window as any).openInGoogleMaps = (lat: number, lng: number, name: string) => {
            const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_name=${encodeURIComponent(name)}`
            window.open(url, '_blank')
          }
          ;(window as any).openInWaze = (lat: number, lng: number, name: string) => {
            const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&zoom=17&q=${encodeURIComponent(name)}`
            window.open(url, '_blank')
          }
        }

        // Créer le groupe de clusters
        const markerClusterGroup = (L as any).markerClusterGroup({
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          disableClusteringAtZoom: 14,
          animate: false,
          chunkedLoading: true,
          iconCreateFunction: (cluster: any) => {
            const count = cluster.getChildCount()
            let size = 'small'
            if (count >= 100) size = 'large'
            else if (count >= 20) size = 'medium'

            return new L.DivIcon({
              html: `<div><span>${count}</span></div>`,
              className: `marker-cluster marker-cluster-${size}`,
              iconSize: new L.Point(40, 40),
            })
          },
        })

        map.addLayer(markerClusterGroup)

        mapInstanceRef.current = map
        clusterGroupRef.current = markerClusterGroup
        setIsLoaded(true)
        isInitializingRef.current = false
      } catch (error) {
        console.error('Error initializing map:', error)
        isInitializingRef.current = false
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        clusterGroupRef.current = null
        leafletRef.current = null
        isInitializingRef.current = false
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Volontairement vide - on veut initialiser qu'une seule fois

  // Effet 2: Mettre à jour les marqueurs quand ils changent
  useEffect(() => {
    // Attendre que la carte soit chargée
    if (!isLoaded || !mapInstanceRef.current || !clusterGroupRef.current || !leafletRef.current) return

    const L = leafletRef.current
    const map = mapInstanceRef.current
    const clusterGroup = clusterGroupRef.current

    // Supprimer tous les anciens marqueurs
    clusterGroup.clearLayers()

    // Créer une icône personnalisée
    const createCustomIcon = (color = 'blue') => {
      return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })
    }

    // Ajouter les nouveaux marqueurs
    markers.forEach((marker) => {
      const iconColor = getIconColorName(marker.color)
      const leafletMarker = L.marker([marker.lat, marker.lng], {
        icon: createCustomIcon(iconColor),
      })

      leafletMarker.bindPopup(createPopupContent(marker), { maxWidth: 300 })
      leafletMarker.on('click', () => onMarkerClick?.(marker))
      clusterGroup.addLayer(leafletMarker)
    })

    // Ajuster les bounds si on a des marqueurs
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m: MapMarker) => [m.lat, m.lng]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [markers, onMarkerClick, createPopupContent, isLoaded])

  // Statistiques
  const categories = Array.from(new Set(markers.map((m) => m.category).filter(Boolean)))

  // État vide - seulement si vraiment pas de marqueurs
  const showEmptyState = markers.length === 0

  return (
    <div className="relative">
      {/* Barre d'info */}
      <div className="bg-background border-b px-4 py-2 flex items-center justify-between rounded-t-lg border border-b-0 border-border">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            <strong className="text-foreground">{markers.length}</strong> point{markers.length > 1 ? 's' : ''}
          </span>
          {categories.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {categories.slice(0, 3).map((cat) => {
                const catMarkers = markers.filter((m) => m.category === cat)
                const color = catMarkers[0]?.color || '#6b7280'
                return (
                  <Badge
                    key={cat}
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: color,
                      color: color,
                      backgroundColor: `${color}10`,
                    }}
                  >
                    {cat} ({catMarkers.length})
                  </Badge>
                )
              })}
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground hidden sm:block">Cliquez sur un marqueur pour les détails</span>
      </div>

      {/* Carte */}
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className="rounded-b-lg border border-t-0 border-border"
      />

      {/* Loading */}
      {!isLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg"
          style={{ top: '40px' }}
        >
          <div className="text-muted-foreground text-center">
            <div className="animate-spin text-3xl mb-2">⏳</div>
            <p>Chargement de la carte...</p>
          </div>
        </div>
      )}

      {/* Empty state overlay */}
      {isLoaded && showEmptyState && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg pointer-events-none"
          style={{ top: '40px' }}
        >
          <div className="text-muted-foreground text-center">
            <div className="text-4xl mb-2">📍</div>
            <p className="font-medium">Aucun point à afficher</p>
            <p className="text-sm mt-1">Les données ne contiennent pas de coordonnées GPS valides</p>
          </div>
        </div>
      )}

      {/* Styles pour les clusters */}
      <style>{`
        .marker-cluster {
          background-clip: padding-box;
          border-radius: 20px;
        }
        .marker-cluster div {
          width: 30px;
          height: 30px;
          margin-left: 5px;
          margin-top: 5px;
          text-align: center;
          border-radius: 15px;
          font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
          font-weight: 600;
        }
        .marker-cluster span {
          line-height: 30px;
        }
        .marker-cluster-small {
          background-color: rgba(59, 130, 246, 0.6);
        }
        .marker-cluster-small div {
          background-color: rgba(59, 130, 246, 0.8);
          color: white;
        }
        .marker-cluster-medium {
          background-color: rgba(245, 158, 11, 0.6);
        }
        .marker-cluster-medium div {
          background-color: rgba(245, 158, 11, 0.8);
          color: white;
        }
        .marker-cluster-large {
          background-color: rgba(239, 68, 68, 0.6);
        }
        .marker-cluster-large div {
          background-color: rgba(239, 68, 68, 0.8);
          color: white;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  )
}

// Export avec chargement dynamique pour SSR
export const MapView = dynamic(
  () => Promise.resolve(MapViewInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-muted/20 rounded-lg border border-border" style={{ height: '500px' }}>
        <div className="text-center text-muted-foreground">
          <div className="animate-spin text-4xl mb-2">⏳</div>
          <p>Chargement de la carte...</p>
        </div>
      </div>
    ),
  }
)

export default MapView
