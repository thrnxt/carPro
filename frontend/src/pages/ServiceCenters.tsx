import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { FaMapMarkerAlt, FaPhone, FaSearch, FaWrench, FaArrowRight, FaStar } from 'react-icons/fa'

interface ServiceCenter {
  id: number
  name: string
  address: string
  city: string
  region: string
  phoneNumber?: string
  email?: string
  website?: string
  description?: string
  rating?: number
  reviewCount?: number
  latitude: number
  longitude: number
}

export default function ServiceCenters() {
  const navigate = useNavigate()
  const [searchCity, setSearchCity] = useState('')
  const [searchRegion, setSearchRegion] = useState('')
  const [showAll, setShowAll] = useState(true)

  const { data: allCenters, isLoading: loadingAll } = useQuery({
    queryKey: ['service-centers-all'],
    queryFn: async () => {
      const response = await apiClient.get('/service-centers')
      return response.data
    },
    enabled: showAll,
  })

  const { data: cityCenters, isLoading: loadingCity } = useQuery({
    queryKey: ['service-centers-city', searchCity],
    queryFn: async () => {
      const response = await apiClient.get(`/service-centers/city/${encodeURIComponent(searchCity)}`)
      return response.data
    },
    enabled: !showAll && !!searchCity,
  })

  const { data: regionCenters, isLoading: loadingRegion } = useQuery({
    queryKey: ['service-centers-region', searchRegion],
    queryFn: async () => {
      const response = await apiClient.get(`/service-centers/region/${encodeURIComponent(searchRegion)}`)
      return response.data
    },
    enabled: !showAll && !!searchRegion && !searchCity,
  })

  const serviceCenters: ServiceCenter[] = showAll 
    ? (allCenters || [])
    : searchCity 
      ? (cityCenters || [])
      : (regionCenters || [])

  const isLoading = loadingAll || loadingCity || loadingRegion

  const handleSearch = () => {
    setShowAll(false)
  }

  const handleShowAll = () => {
    setShowAll(true)
    setSearchCity('')
    setSearchRegion('')
  }

  const getRatingColor = (rating?: number) => {
    if (!rating) return 'text-slate-400'
    if (rating >= 4.5) return 'text-emerald-400'
    if (rating >= 4.0) return 'text-blue-400'
    if (rating >= 3.5) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Сервисные центры</h1>
          <p className="text-slate-400">Найдите надежный сервис для вашего автомобиля</p>
        </div>
        <button
          onClick={() => navigate('/service-centers/map')}
          className="auto-button-primary flex items-center gap-2"
        >
          <FaMapMarkerAlt />
          Показать на карте
        </button>
      </div>

      {/* Поиск и фильтры */}
      <div className="auto-card p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <FaSearch className="text-red-500" />
          Поиск сервисных центров
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Город</label>
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Например: Алматы"
              className="auto-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Регион</label>
            <input
              type="text"
              value={searchRegion}
              onChange={(e) => setSearchRegion(e.target.value)}
              placeholder="Например: Алматинская область"
              className="auto-input"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              className="auto-button-primary flex-1 flex items-center justify-center gap-2"
            >
              <FaSearch />
              Найти
            </button>
            <button
              onClick={handleShowAll}
              className="auto-button-secondary"
            >
              Все
            </button>
          </div>
        </div>
      </div>

      {/* Список сервисных центров */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <p className="mt-2 text-slate-400">Загрузка...</p>
        </div>
      ) : serviceCenters && serviceCenters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviceCenters.map((center) => (
            <div
              key={center.id}
              className="auto-card p-6 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => navigate(`/service-centers/${center.id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white flex-1">{center.name}</h3>
                {center.rating && (
                  <div className={`text-right ${getRatingColor(center.rating)} flex items-center gap-1`}>
                    <FaStar className="text-xl" />
                    <div>
                      <div className="text-xl font-bold">{center.rating.toFixed(1)}</div>
                      {center.reviewCount !== undefined && center.reviewCount > 0 && (
                        <div className="text-xs text-slate-400">{center.reviewCount} отзывов</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <FaMapMarkerAlt className="text-slate-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">{center.address}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      {center.city}, {center.region}
                    </p>
                  </div>
                </div>
                {center.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <FaPhone className="text-slate-400" />
                    <a 
                      href={`tel:${center.phoneNumber}`}
                      className="text-red-400 hover:text-red-300 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {center.phoneNumber}
                    </a>
                  </div>
                )}
              </div>

              {center.description && (
                <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                  {center.description}
                </p>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/service-centers/${center.id}`)
                }}
                className="w-full auto-button-primary flex items-center justify-center gap-2"
              >
                Подробнее
                <FaArrowRight />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="auto-card p-12 text-center">
          <FaWrench className="text-6xl text-red-500 mx-auto mb-4 opacity-50" />
          <p className="text-slate-400 text-lg mb-6">Сервисные центры не найдены</p>
          <button
            onClick={handleShowAll}
            className="auto-button-primary"
          >
            Показать все центры
          </button>
        </div>
      )}
    </div>
  )
}
