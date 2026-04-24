import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import {
  FaCalendarAlt,
  FaCamera,
  FaCheckCircle,
  FaDollarSign,
  FaFilePdf,
  FaFilter,
  FaWrench,
} from 'react-icons/fa'
import apiClient from '../api/client'
import { EmptyState, Page, PageHeader, Section } from '../components/ui'
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

type MaintenanceHistoryItem = MaintenanceRecord & {
  car: CarSummary
}

function getStatusBadge(status: MaintenanceRecord['status']) {
  switch (status) {
    case 'COMPLETED':
      return 'auto-badge-success'
    case 'IN_PROGRESS':
      return 'auto-badge-info'
    case 'CANCELLED':
      return 'auto-badge-danger'
    default:
      return 'auto-badge-warning'
  }
}

function getStatusLabel(status: MaintenanceRecord['status']) {
  switch (status) {
    case 'COMPLETED':
      return 'Завершено'
    case 'IN_PROGRESS':
      return 'В процессе'
    case 'CANCELLED':
      return 'Отменено'
    default:
      return 'Запланировано'
  }
}

export default function MaintenanceHistory() {
  const { id } = useParams()
  const [selectedCarId, setSelectedCarId] = useState('')

  const { data: cars = [], isLoading: carsLoading } = useQuery<CarSummary[]>({
    queryKey: ['cars'],
    queryFn: async () => {
      const response = await apiClient.get('/cars')
      return normalizeCollectionResponse<CarSummary>(response.data)
    },
  })

  const selectedCar = useMemo(
    () => cars.find((car) => String(car.id) === String(id)),
    [cars, id]
  )

  const {
    data: records = [],
    isLoading: recordsLoading,
    isError,
  } = useQuery<MaintenanceHistoryItem[]>({
    queryKey: ['maintenance-history', id ?? 'all', cars.map((car) => car.id).join(',')],
    queryFn: async () => {
      if (id) {
        const response = await apiClient.get(`/maintenance-records/car/${id}`)
        const normalized = normalizeCollectionResponse<MaintenanceRecord>(response.data)
        const fallbackCar =
          selectedCar ||
          cars.find((car) => String(car.id) === String(id)) || {
            id: Number(id),
            brand: 'Автомобиль',
            model: '',
            year: 0,
            licensePlate: '',
          }

        return normalized.map((record) => ({
          ...record,
          car: fallbackCar,
        }))
      }

      if (cars.length === 0) {
        return []
      }

      const recordsByCar = await Promise.all(
        cars.map(async (car) => {
          const response = await apiClient.get(`/maintenance-records/car/${car.id}`)
          const normalized = normalizeCollectionResponse<MaintenanceRecord>(response.data)
          return normalized.map((record) => ({
            ...record,
            car,
          }))
        })
      )

      return recordsByCar
        .flat()
        .sort((a, b) => {
          const byServiceDate = new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()
          if (byServiceDate !== 0) {
            return byServiceDate
          }
          return b.id - a.id
        })
    },
    enabled: !!id || cars.length > 0,
  })

  const filteredRecords = useMemo(() => {
    if (id) {
      return records
    }

    if (!selectedCarId) {
      return records
    }

    return records.filter((record) => String(record.car.id) === selectedCarId)
  }, [id, records, selectedCarId])

  if (carsLoading || recordsLoading) {
    return (
      <Page>
        <div className="p-10 text-center">
          <div className="inline-block h-9 w-9 animate-spin rounded-full border-b-2 border-[#ff9b82]"></div>
          <p className="mt-3 text-sm text-slate-400">Загрузка истории обслуживания...</p>
        </div>
      </Page>
    )
  }

  if (!id && cars.length === 0) {
    return (
      <Page>
        <PageHeader
          eyebrow="Maintenance ledger"
          title="История обслуживания"
          description="Раздел показывает все работы по вашим автомобилям. Сначала нужно добавить хотя бы один автомобиль в гараж."
        />
        <Section title="Гараж пуст" description="Когда в системе появится автомобиль, здесь начнет собираться единая история ТО.">
          <EmptyState
            icon={FaWrench}
            title="Пока нечего показывать"
            description="Добавьте автомобиль в гараж, чтобы операции, работы и документы начали складываться в историю обслуживания."
            action={
              <Link to="/garage" className="auto-button-primary">
                Добавить автомобиль
              </Link>
            }
          />
        </Section>
      </Page>
    )
  }

  if (id && !selectedCar) {
    return (
      <Page>
        <Section title="Автомобиль не найден" description="Проверьте ссылку или вернитесь в общий реестр обслуживания.">
          <EmptyState
            icon={FaWrench}
            title="Не удалось определить автомобиль"
            description="Вероятно, автомобиль удален или у вас больше нет к нему доступа."
            action={
              <Link to="/maintenance-history" className="auto-button-primary">
                Открыть всю историю
              </Link>
            }
          />
        </Section>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Maintenance ledger"
        title={
          id && selectedCar
            ? `${selectedCar.brand} ${selectedCar.model}`
            : 'История обслуживания'
        }
        description={
          id && selectedCar
            ? 'Фильтрованный журнал работ по выбранному автомобилю.'
            : 'Единый журнал всех сервисных работ по вашим автомобилям. Здесь история открывается сразу, а не через экран выбора.'
        }
        actions={
          id ? (
            <Link to="/maintenance-history" className="auto-button-secondary">
              Все автомобили
            </Link>
          ) : undefined
        }
      />

      {!id && (
        <Section
          title="Фильтр"
          description="Можно быстро ограничить историю одним автомобилем, но базовый режим всегда показывает весь журнал."
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,22rem)_1fr] md:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Автомобиль
              </label>
              <select
                value={selectedCarId}
                onChange={(event) => setSelectedCarId(event.target.value)}
                className="auto-select"
              >
                <option value="">Все автомобили</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.brand} {car.model} ({car.licensePlate})
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#ff9b82]">
                  <FaFilter />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Найдено записей: {filteredRecords.length}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {selectedCarId
                      ? 'Показана история только по выбранному автомобилю.'
                      : 'Показана сводная история обслуживания по всему гаражу.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>
      )}

      <Section
        title={id ? 'Хронология работ' : 'Журнал работ'}
        description={
          isError
            ? 'Не удалось загрузить данные с сервера.'
            : 'Каждая запись включает дату, сервис, стоимость, замененные детали и вложения.'
        }
      >
        {isError ? (
          <EmptyState
            icon={FaWrench}
            title="Не удалось загрузить историю"
            description="Проверьте доступ к автомобилю или повторите попытку позже."
          />
        ) : filteredRecords.length > 0 ? (
          <div className="space-y-5">
            {filteredRecords.map((record) => (
              <div key={`${record.car.id}-${record.id}`} className="auto-card p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    {!id && (
                      <p className="mb-2 text-sm font-semibold text-[#ff9b82]">
                        {record.car.brand} {record.car.model}
                        {record.car.licensePlate ? ` · ${record.car.licensePlate}` : ''}
                      </p>
                    )}
                    <h3 className="text-2xl font-bold tracking-[-0.04em] text-white">{record.workType}</h3>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                      <FaCalendarAlt />
                      {format(new Date(record.serviceDate), 'dd MMMM yyyy', { locale: ru })}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Пробег: {record.mileageAtService?.toLocaleString('ru-RU') || 0} км
                    </p>
                  </div>

                  <span className={`auto-badge ${getStatusBadge(record.status)}`}>
                    {record.status === 'COMPLETED' ? <FaCheckCircle /> : <FaWrench />}
                    {getStatusLabel(record.status)}
                  </span>
                </div>

                {record.description && (
                  <p className="mt-4 text-sm leading-7 text-slate-300">{record.description}</p>
                )}

                {record.serviceCenter && (
                  <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                    {record.serviceCenter.name && (
                      <p className="text-sm text-slate-300">
                        <strong className="text-white">Сервисный центр:</strong> {record.serviceCenter.name}
                      </p>
                    )}
                    {record.serviceCenter.address && (
                      <p className="mt-1 text-sm text-slate-400">
                        <strong className="text-white">Адрес:</strong> {record.serviceCenter.address}
                      </p>
                    )}
                  </div>
                )}

                {record.cost != null && (
                  <p className="mt-4 flex items-center gap-2 text-lg font-semibold text-emerald-400">
                    <FaDollarSign />
                    Стоимость: {record.cost.toLocaleString('ru-RU')} ₸
                  </p>
                )}

                {record.photos && record.photos.length > 0 && (
                  <div className="mt-5">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-white">
                      <FaCamera />
                      Фотографии и документы
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {record.photos.map((photo) => (
                        <a
                          key={photo.id}
                          href={resolveFileUrl(photo.fileUrl) || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="block group"
                        >
                          <div className="flex h-56 items-center justify-center overflow-hidden rounded-[1.2rem] border border-white/10 bg-slate-950/60 p-3 transition-colors group-hover:border-[#ff9b82]/40">
                            <img
                              src={resolveFileUrl(photo.fileUrl) || undefined}
                              alt={photo.description || 'Фото ремонта'}
                              className="h-full w-full rounded-xl object-contain"
                              loading="lazy"
                            />
                          </div>
                          {photo.description && (
                            <p className="mt-2 text-xs text-slate-300">{photo.description}</p>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {record.replacedComponents && record.replacedComponents.length > 0 && (
                  <div className="mt-5">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-white">
                      <FaWrench />
                      Замененные детали
                    </h4>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
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

                {record.invoice?.pdfUrl && (
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <a
                      href={resolveFileUrl(record.invoice.pdfUrl) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-[#ff9b82] hover:text-[#ffb29f]"
                    >
                      <FaFilePdf />
                      Скачать счет (PDF)
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FaWrench}
            title="История обслуживания пуста"
            description={
              id
                ? 'По этому автомобилю еще нет записей ТО.'
                : 'По выбранному фильтру пока нет сервисных операций.'
            }
          />
        )}
      </Section>
    </Page>
  )
}
