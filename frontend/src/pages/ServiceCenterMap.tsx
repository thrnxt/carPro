import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { FaMapMarkerAlt, FaSearch, FaStar } from 'react-icons/fa'
import apiClient from '../api/client'
import { Page, PageHeader, Section } from '../components/ui'

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
    if (!navigator.geolocation) {
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude])
      },
      () => {
        console.log('Геолокация недоступна, используется значение по умолчанию')
      }
    )
  }, [])

  const { data: serviceCenters = [], isLoading } = useQuery({
    queryKey: ['service-centers', 'nearby', userLocation, radius],
    queryFn: async () => {
      const [latitude, longitude] = Array.isArray(userLocation) ? userLocation : [51.1694, 71.4491]
      const response = await apiClient.get('/service-centers/nearby', {
        params: {
          latitude,
          longitude,
          radiusKm: radius,
        },
      })
      return response.data
    },
  })

  const locationLabel = useMemo(() => {
    const [latitude, longitude] = Array.isArray(userLocation) ? userLocation : [51.1694, 71.4491]
    return `${Number(latitude).toFixed(3)}, ${Number(longitude).toFixed(3)}`
  }, [userLocation])

  return (
    <Page>
      <PageHeader
        eyebrow="Nearby search"
        title="Карта сервисных центров"
        description="Локальный поиск и карта собраны в одном экране: радиус поиска, текущее положение и список найденных центров доступны без отдельного режима."
        actions={
          <div className="flex items-center gap-3 rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3">
            <FaSearch className="text-slate-400" />
            <label className="flex items-center gap-3 text-sm text-slate-300">
              <span>Радиус</span>
              <select
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
                className="auto-select min-w-[8rem] py-2"
              >
                <option value="5">5 км</option>
                <option value="10">10 км</option>
                <option value="20">20 км</option>
                <option value="50">50 км</option>
              </select>
            </label>
          </div>
        }
      />

      <Section
        title="Поиск на карте"
        description={`Текущая точка поиска: ${locationLabel}. Найдено центров: ${serviceCenters.length}.`}
      >
        <div className="overflow-hidden rounded-[1.7rem] border border-white/10">
          {isLoading ? (
            <div className="flex min-h-[34rem] items-center justify-center bg-slate-950/50">
              <div className="text-center">
                <div className="inline-block h-9 w-9 animate-spin rounded-full border-b-2 border-[#ff9b82]"></div>
                <p className="mt-3 text-sm text-slate-400">Загрузка карты...</p>
              </div>
            </div>
          ) : (
            <div className="h-[34rem] w-full overflow-hidden rounded-[1.7rem]">
              <MapContainer center={userLocation} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenter center={userLocation} />

                <Marker position={userLocation}>
                  <Popup>
                    <div className="min-w-[200px]">
                      <div className="text-sm font-semibold text-white">Ваше местоположение</div>
                      <p className="mt-1 text-xs text-slate-400">{locationLabel}</p>
                    </div>
                  </Popup>
                </Marker>

                {serviceCenters.map((center: any) => (
                  <Marker
                    key={center.id}
                    position={[Number(center.latitude), Number(center.longitude)]}
                  >
                    <Popup>
                      <div className="min-w-[220px]">
                        <h3 className="text-base font-semibold text-white">{center.name}</h3>
                        <p className="mt-2 text-sm text-slate-400">{center.address}</p>
                        {center.rating && (
                          <p className="mt-2 flex items-center gap-2 text-sm text-amber-300">
                            <FaStar />
                            {center.rating.toFixed(1)} ({center.reviewCount} отзывов)
                          </p>
                        )}
                        {center.phoneNumber && (
                          <p className="mt-2 text-sm text-slate-300">{center.phoneNumber}</p>
                        )}
                        <Link
                          to={`/service-centers/${center.id}`}
                          className="mt-3 inline-flex text-sm font-semibold text-[#ff9b82] transition-colors hover:text-[#ffb29f]"
                        >
                          Открыть карточку
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </div>
      </Section>

      <Section title="Найденные сервисные центры" description="Список синхронизирован с картой и подходит для быстрого выбора по рейтингу и адресу.">
        {serviceCenters.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {serviceCenters.map((center: any) => (
              <div key={center.id} className="auto-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{center.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{center.address}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#ff9b82]">
                    <FaMapMarkerAlt />
                  </div>
                </div>

                {center.rating && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-amber-300">
                    <FaStar />
                    <span>
                      {center.rating.toFixed(1)} ({center.reviewCount} отзывов)
                    </span>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link to={`/service-centers/${center.id}`} className="auto-button-primary">
                    Открыть
                  </Link>
                  {center.phoneNumber && (
                    <a href={`tel:${center.phoneNumber}`} className="auto-button-secondary">
                      Позвонить
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/5 p-10 text-center">
            <FaMapMarkerAlt className="mx-auto text-5xl text-[#ff9b82]/70" />
            <p className="mt-4 text-lg font-semibold text-white">Ничего не найдено в выбранном радиусе</p>
            <p className="mt-2 text-sm text-slate-400">Увеличьте радиус поиска или измените текущую точку.</p>
          </div>
        )}
      </Section>
    </Page>
  )
}
