import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { FaCalendarAlt, FaCheckCircle, FaWrench, FaDollarSign, FaCamera, FaFilePdf } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { normalizeCollectionResponse } from '../utils/normalizeCollectionResponse'
import { resolveFileUrl } from '../utils/resolveFileUrl'

interface CarSummary {
  id: number
  brand: string
  model: string
  year: number
  licensePlate: string
}

interface MaintenanceRecord {
  id: number
  workType: string
  description?: string | null
  serviceDate: string
  mileageAtService?: number | null
  cost?: number | null
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  serviceCenter?: {
    id?: number
    name?: string
    address?: string
  } | null
  photos?: Array<{
    id: number
    fileUrl: string
    description?: string | null
  }> | null
  replacedComponents?: Array<{
    id: number
    partNumber?: string | null
    manufacturer?: string | null
    carComponent?: {
      name?: string
    } | null
  }> | null
  invoice?: {
    id: number
    pdfUrl?: string | null
  } | null
}

export default function MaintenanceHistory() {
  const { id } = useParams()

  const { data: cars, isLoading: carsLoading } = useQuery<CarSummary[]>({
    queryKey: ['cars'],
    queryFn: async () => {
      const response = await apiClient.get('/cars')
      return normalizeCollectionResponse<CarSummary>(response.data)
    },
    enabled: !id,
  })

  const {
    data: records = [],
    isLoading,
    isError,
  } = useQuery<MaintenanceRecord[]>({
    queryKey: ['maintenance-records', id],
    queryFn: async () => {
      const response = await apiClient.get(`/maintenance-records/car/${id}`)
      return normalizeCollectionResponse<MaintenanceRecord>(response.data)
    },
    enabled: !!id,
  })

  if ((id && isLoading) || (!id && carsLoading)) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <p className="mt-2 text-slate-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!id) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">История обслуживания</h1>
          <p className="text-slate-400">Выберите автомобиль, чтобы посмотреть историю ТО</p>
        </div>

        {cars && cars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cars.map((car: any) => (
              <Link
                key={car.id}
                to={`/cars/${car.id}/history`}
                className="auto-card p-5 hover:scale-105 transition-transform"
              >
                <h3 className="text-xl font-bold text-white">
                  {car.brand} {car.model}
                </h3>
                <p className="text-slate-400">{car.year} год</p>
                <p className="text-red-400 font-mono mt-2">{car.licensePlate}</p>
                <p className="text-slate-300 mt-3">Открыть историю →</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="auto-card p-12 text-center">
            <FaWrench className="text-6xl text-red-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 text-lg">Сначала добавьте автомобиль в гараж</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">История обслуживания</h1>
        <p className="text-slate-400">Полная история технического обслуживания</p>
      </div>

      <div className="space-y-6">
        {isError ? (
          <div className="auto-card p-12 text-center">
            <FaWrench className="text-6xl text-red-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-300 text-lg">Не удалось загрузить историю обслуживания</p>
          </div>
        ) : records.length > 0 ? (
          records.map((record) => (
            <div key={record.id} className="auto-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{record.workType}</h3>
                  <p className="text-slate-400 mb-1 flex items-center gap-2">
                    <FaCalendarAlt />
                    {format(new Date(record.serviceDate), 'dd MMMM yyyy', { locale: ru })}
                  </p>
                  <p className="text-sm text-slate-500">
                    Пробег: {record.mileageAtService?.toLocaleString()} км
                  </p>
                </div>
                <span className={`auto-badge ${
                  record.status === 'COMPLETED' ? 'auto-badge-success' :
                  record.status === 'IN_PROGRESS' ? 'auto-badge-info' :
                  'auto-badge-warning'
                }`}>
                  {record.status === 'COMPLETED' ? (
                    <span className="flex items-center gap-1"><FaCheckCircle /> Завершено</span>
                  ) : record.status === 'IN_PROGRESS' ? (
                    <span className="flex items-center gap-1"><FaWrench /> В процессе</span>
                  ) : (
                    <span className="flex items-center gap-1"><FaCalendarAlt /> Запланировано</span>
                  )}
                </span>
              </div>

              {record.description && (
                <p className="text-slate-300 mb-4">{record.description}</p>
              )}

              {record.serviceCenter && (
                <div className="mb-4 p-4 bg-slate-800/50 rounded-lg">
                  {record.serviceCenter.name && (
                    <p className="text-sm text-slate-400 mb-1">
                      <strong className="text-white">Сервисный центр:</strong> {record.serviceCenter.name}
                    </p>
                  )}
                  {record.serviceCenter.address && (
                    <p className="text-sm text-slate-400">
                      <strong className="text-white">Адрес:</strong> {record.serviceCenter.address}
                    </p>
                  )}
                </div>
              )}

              {record.cost && (
                <p className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                  <FaDollarSign />
                  Стоимость: {record.cost.toLocaleString('ru-RU')} ₸
                </p>
              )}

              {/* Фото */}
              {record.photos && record.photos.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <FaCamera />
                    Фотографии:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {record.photos.map((photo) => (
                      <a
                        key={photo.id}
                        href={resolveFileUrl(photo.fileUrl) || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="block group"
                      >
                        <div className="h-56 rounded-xl border border-slate-600 bg-slate-950/60 p-3 flex items-center justify-center overflow-hidden transition-colors group-hover:border-red-400/60">
                          <img
                            src={resolveFileUrl(photo.fileUrl) || undefined}
                            alt={photo.description || 'Фото ремонта'}
                            className="h-full w-full object-contain rounded-lg"
                            loading="lazy"
                          />
                        </div>
                        {photo.description && (
                          <p className="text-xs text-slate-300 mt-2">{photo.description}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Открыть в полном размере</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Замененные детали */}
              {record.replacedComponents && record.replacedComponents.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <FaWrench />
                    Замененные детали:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {record.replacedComponents.map((rc) => (
                      <li key={rc.id}>
                        {rc.carComponent?.name || 'Деталь'}
                        {rc.partNumber && ` (№ ${rc.partNumber})`}
                        {rc.manufacturer && ` - ${rc.manufacturer}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Счет */}
              {record.invoice?.pdfUrl && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <a
                    href={resolveFileUrl(record.invoice.pdfUrl) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:text-red-300 font-medium"
                  >
                    <FaFilePdf className="inline mr-2" />
                    Скачать счет (PDF)
                  </a>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="auto-card p-12 text-center">
            <FaWrench className="text-6xl text-red-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 text-lg">История обслуживания пуста</p>
          </div>
        )}
      </div>
    </div>
  )
}
