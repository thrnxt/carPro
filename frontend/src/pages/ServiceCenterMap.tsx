import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import apiClient from '../api/client'
import { Link } from 'react-router-dom'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function MapCenter({ center }: { center: LatLngExpression }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [map, center])
  return null
}

export default function ServiceCenterMap() {
  const [userLocation, setUserLocation] = useState<LatLngExpression>([51.1694, 71.4491])
  const [radius, setRadius] = useState(10)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        () => {
          console.log('Геолокация недоступна, используется значение по умолчанию')
        }
      )
    }
  }, [])

  const { data: serviceCenters, isLoading } = useQuery({
    queryKey: ['service-centers', 'nearby', userLocation, radius],
    queryFn: async () => {
      const [lat, lng] = Array.isArray(userLocation) ? userLocation : [51.1694, 71.4491]
      const response = await apiClient.get('/service-centers/nearby', {
        params: {
          latitude: lat,
          longitude: lng,
          radiusKm: radius,
        },
      })
      return response.data
    },
  })

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">🗺️ Карта сервисных центров</h1>
          <p className="text-slate-400">Найдите ближайшие сервисы на карте</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-300">Радиус поиска:</span>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="auto-select"
            >
              <option value="5">5 км</option>
              <option value="10">10 км</option>
              <option value="20">20 км</option>
              <option value="50">50 км</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex-1 rounded-lg overflow-hidden shadow-lg border border-slate-700">
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-slate-900">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              <p className="mt-2 text-slate-400">Загрузка карты...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={userLocation}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenter center={userLocation} />
            
            <Marker position={userLocation}>
              <Popup>
                <div className="font-semibold">Ваше местоположение</div>
              </Popup>
            </Marker>

            {serviceCenters?.map((center: any) => (
              <Marker
                key={center.id}
                position={[Number(center.latitude), Number(center.longitude)]}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <h3 className="font-semibold text-lg mb-2">{center.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{center.address}</p>
                    {center.rating && (
                      <p className="text-sm mb-2">
                        ⭐ {center.rating.toFixed(1)} ({center.reviewCount} отзывов)
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mb-2">{center.phoneNumber}</p>
                    <Link
                      to={`/service-centers/${center.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Подробнее →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Список сервисных центров */}
      {serviceCenters && serviceCenters.length > 0 && (
        <div className="mt-4 auto-card p-4">
          <h2 className="text-xl font-bold text-white mb-3">
            Найдено сервисных центров: {serviceCenters.length}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceCenters.map((center: any) => (
              <div key={center.id} className="auto-card p-4 hover:scale-105 transition-transform">
                <h3 className="font-semibold text-lg text-white mb-2">{center.name}</h3>
                <p className="text-sm text-slate-400 mb-2">{center.address}</p>
                {center.rating && (
                  <p className="text-sm mb-2 text-amber-400">
                    ⭐ {center.rating.toFixed(1)} ({center.reviewCount} отзывов)
                  </p>
                )}
                <Link
                  to={`/service-centers/${center.id}`}
                  className="text-red-400 hover:text-red-300 font-medium text-sm"
                >
                  Подробнее →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
