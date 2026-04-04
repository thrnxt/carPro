import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import { FaWrench, FaClipboardList, FaCalendarAlt, FaInfoCircle, FaChartBar } from 'react-icons/fa'

export default function CarDetails() {
  const { id } = useParams()

  const { data: car, isLoading } = useQuery({
    queryKey: ['car', id],
    queryFn: async () => {
      const response = await apiClient.get(`/cars/${id}`)
      return response.data
    },
  })

  const { data: components } = useQuery({
    queryKey: ['car-components', id],
    queryFn: async () => {
      const response = await apiClient.get(`/cars/${id}/components`)
      return response.data
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <p className="mt-2 text-slate-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!car) {
    return (
      <div className="p-6">
        <div className="auto-card p-12 text-center">
          <p className="text-white text-xl">Автомобиль не найден</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {car.brand} {car.model} ({car.year})
          </h1>
          <p className="text-slate-400">Детальная информация об автомобиле</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/cars/${id}/components`}
            className="auto-button-secondary flex items-center gap-2"
          >
            <FaWrench />
            Все детали
          </Link>
          <Link
            to={`/cars/${id}/history`}
            className="auto-button-secondary flex items-center gap-2"
          >
            <FaClipboardList />
            История ТО
          </Link>
          <Link
            to={`/maintenance-calendar`}
            className="auto-button-success flex items-center gap-2"
          >
            <FaCalendarAlt />
            Календарь ТО
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="auto-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FaInfoCircle className="text-red-500" />
            Информация
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Гос. номер:</span>
              <span className="text-white font-semibold font-mono">{car.licensePlate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">VIN:</span>
              <span className="text-white font-mono">{car.vin || 'Не указан'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Цвет:</span>
              <span className="text-white">{car.color || 'Не указан'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Пробег:</span>
              <span className="text-red-400 font-bold">{car.mileage?.toLocaleString()} км</span>
            </div>
            {car.lastServiceDate && (
              <div className="flex justify-between">
                <span className="text-slate-400">Последнее ТО:</span>
                <span className="text-emerald-400">
                  {new Date(car.lastServiceDate).toLocaleDateString('ru-RU')}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Стиль вождения:</span>
              <span className="text-white">
                {car.drivingStyle === 'CALM' ? 'Спокойный' :
                 car.drivingStyle === 'MODERATE' ? 'Умеренный' :
                 'Агрессивный'}
              </span>
            </div>
          </div>
        </div>

        <div className="auto-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FaChartBar className="text-red-500" />
            Статистика
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Критических деталей</p>
              <p className="text-4xl font-bold text-red-400">
                {components?.filter((c: any) => c.wearLevel >= 90).length || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Требуют внимания</p>
              <p className="text-4xl font-bold text-amber-400">
                {components?.filter((c: any) => c.wearLevel >= 70 && c.wearLevel < 90).length || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">В хорошем состоянии</p>
              <p className="text-4xl font-bold text-emerald-400">
                {components?.filter((c: any) => c.wearLevel < 70).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
