import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import {
  FaCalendarAlt,
  FaCamera,
  FaCheckCircle,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaDollarSign,
  FaFilePdf,
  FaFilter,
  FaWrench,
} from 'react-icons/fa'
import apiClient from '../api/client'
import OperationAttachments from '../components/OperationAttachments'
import { EmptyState, Page, PageHeader, Section, cx } from '../components/ui'
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
  car: CarSummary
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

type PagedResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

const JOURNAL_PAGE_SIZE = 6

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

function formatServiceDate(value: string) {
  try {
    return format(new Date(value), 'dd MMMM yyyy', { locale: ru })
  } catch {
    return value
  }
}

function formatMileage(value?: number | null) {
  if (value == null) {
    return null
  }

  return `${value.toLocaleString('ru-RU')} км`
}

function formatCost(value?: number | null) {
  if (value == null) {
    return null
  }

  return `${value.toLocaleString('ru-RU')} ₸`
}

function getTextPreview(value?: string | null, maxLength = 150) {
  if (!value?.trim()) {
    return null
  }

  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`
}

function getRecordKey(record: MaintenanceRecord) {
  return `${record.car.id}-${record.id}`
}

function hasExpandedDetails(record: MaintenanceRecord) {
  return Boolean(
    record.description?.trim() ||
      record.serviceCenter?.address?.trim() ||
      (record.photos && record.photos.length > 0) ||
      (record.replacedComponents && record.replacedComponents.length > 0) ||
      record.invoice?.pdfUrl
  )
}

export default function MaintenanceHistory() {
  const { id } = useParams()
  const [selectedCarId, setSelectedCarId] = useState('')
  const [page, setPage] = useState(0)
  const [expandedRecordKey, setExpandedRecordKey] = useState<string | null>(null)

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

  const activeCarId = useMemo(() => {
    if (id) {
      return Number(id)
    }

    return selectedCarId ? Number(selectedCarId) : undefined
  }, [id, selectedCarId])

  const {
    data: recordsPage,
    isLoading: recordsLoading,
    isFetching: recordsFetching,
    isError,
  } = useQuery<PagedResponse<MaintenanceRecord>>({
    queryKey: ['maintenance-history', activeCarId ?? 'all', page, JOURNAL_PAGE_SIZE],
    queryFn: async () => {
      const response = await apiClient.get('/maintenance-records/my/history/search', {
        params: {
          page,
          size: JOURNAL_PAGE_SIZE,
          ...(activeCarId ? { carId: activeCarId } : {}),
        },
      })
      return response.data
    },
    enabled: !!id || cars.length > 0,
    placeholderData: (previousData) => previousData,
  })

  const records = recordsPage?.content ?? []
  const totalRecords = recordsPage?.totalElements ?? 0
  const totalPages = recordsPage?.totalPages ?? 0
  const currentPage = recordsPage?.page ?? page
  const pageStart = totalRecords > 0 ? currentPage * JOURNAL_PAGE_SIZE + 1 : 0
  const pageEnd = totalRecords > 0 ? currentPage * JOURNAL_PAGE_SIZE + records.length : 0

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
            : 'Единый журнал всех сервисных работ по вашим автомобилям. Краткая карточка оставляет в ленте только основную информацию.'
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
          description="Можно быстро ограничить историю одним автомобилем. Подробные материалы и адрес сервиса скрыты до открытия карточки."
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,22rem)_1fr] md:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Автомобиль
              </label>
              <select
                value={selectedCarId}
                onChange={(event) => {
                  setSelectedCarId(event.target.value)
                  setPage(0)
                  setExpandedRecordKey(null)
                }}
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
                    Найдено записей: {totalRecords}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {selectedCarId
                      ? 'Показана история только по выбранному автомобилю.'
                      : 'Показана сводная история обслуживания по всему гаражу.'}
                    {recordsFetching ? ' Список обновляется.' : ''}
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
            : 'Компактные записи для быстрого сканирования. Полные детали, фото и документы открываются по кнопке.'
        }
      >
        {isError ? (
          <EmptyState
            icon={FaWrench}
            title="Не удалось загрузить историю"
            description="Проверьте доступ к автомобилю или повторите попытку позже."
          />
        ) : records.length > 0 ? (
          <>
            <div className="space-y-4">
              {records.map((record) => {
                const recordKey = getRecordKey(record)
                const isExpanded = expandedRecordKey === recordKey
                const mileageLabel = formatMileage(record.mileageAtService)
                const costLabel = formatCost(record.cost)
                const descriptionPreview = isExpanded ? null : getTextPreview(record.description)
                const attachmentCount = record.photos?.length ?? 0
                const replacedPartsCount = record.replacedComponents?.length ?? 0
                const hasInvoice = Boolean(record.invoice?.pdfUrl)
                const detailsAvailable = hasExpandedDetails(record)

                return (
                  <article key={recordKey} className="auto-card p-4 sm:p-5">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          {!id && (
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff9b82]">
                              {record.car.brand} {record.car.model}
                              {record.car.licensePlate ? ` · ${record.car.licensePlate}` : ''}
                            </p>
                          )}

                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg font-semibold text-white sm:text-xl">{record.workType}</h3>

                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-400">
                                <span className="inline-flex items-center gap-2">
                                  <FaCalendarAlt className="text-slate-500" />
                                  {formatServiceDate(record.serviceDate)}
                                </span>

                                {mileageLabel && (
                                  <span className="inline-flex items-center gap-2">
                                    <FaWrench className="text-slate-500" />
                                    {mileageLabel}
                                  </span>
                                )}

                                {record.serviceCenter?.name && (
                                  <span className="min-w-0 truncate">
                                    Сервис: {record.serviceCenter.name}
                                  </span>
                                )}
                              </div>

                              {descriptionPreview && (
                                <p className="mt-3 hidden text-sm leading-6 text-slate-300 sm:block">
                                  {descriptionPreview}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
                              <span className={`auto-badge ${getStatusBadge(record.status)}`}>
                                {record.status === 'COMPLETED' ? <FaCheckCircle /> : <FaWrench />}
                                {getStatusLabel(record.status)}
                              </span>

                              {costLabel && (
                                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-400 sm:text-base">
                                  <FaDollarSign />
                                  {costLabel}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {attachmentCount > 0 && (
                              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                                <FaCamera className="text-[#ff9b82]" />
                                {attachmentCount} фото
                              </span>
                            )}

                            {replacedPartsCount > 0 && (
                              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                                <FaWrench className="text-[#ff9b82]" />
                                {replacedPartsCount} деталей
                              </span>
                            )}

                            {hasInvoice && (
                              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                                <FaFilePdf className="text-[#ff9b82]" />
                                PDF
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {detailsAvailable && (
                        <>
                          <div className="flex items-center justify-end border-t border-white/10 pt-3">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedRecordKey((currentValue) =>
                                  currentValue === recordKey ? null : recordKey
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-[#ff9b82]/35 hover:bg-white/10 hover:text-white"
                            >
                              {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                              {isExpanded ? 'Скрыть детали' : 'Подробнее'}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-white/10 pt-4">
                              <div
                                className={cx(
                                  'grid gap-4',
                                  attachmentCount > 0 && 'xl:grid-cols-[minmax(0,1fr)_18rem]'
                                )}
                              >
                                <div className="space-y-4">
                                  {record.description && (
                                    <div className="rounded-[1.1rem] border border-white/10 bg-white/5 p-4">
                                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                        Описание работ
                                      </p>
                                      <p className="mt-2 text-sm leading-7 text-slate-300">{record.description}</p>
                                    </div>
                                  )}

                                  {(record.serviceCenter?.name || record.serviceCenter?.address) && (
                                    <div className="rounded-[1.1rem] border border-white/10 bg-white/5 p-4">
                                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                        Сервисный центр
                                      </p>
                                      {record.serviceCenter?.name && (
                                        <p className="mt-2 text-sm font-medium text-white">{record.serviceCenter.name}</p>
                                      )}
                                      {record.serviceCenter?.address && (
                                        <p className="mt-1 text-sm leading-6 text-slate-400">
                                          {record.serviceCenter.address}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {replacedPartsCount > 0 && (
                                    <div className="rounded-[1.1rem] border border-white/10 bg-white/5 p-4">
                                      <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                                        <FaWrench className="text-[#ff9b82]" />
                                        Замененные детали
                                      </h4>
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {record.replacedComponents?.map((component) => (
                                          <span
                                            key={component.id}
                                            className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1.5 text-xs text-slate-300"
                                          >
                                            {component.carComponent?.name || 'Деталь'}
                                            {component.partNumber ? ` · № ${component.partNumber}` : ''}
                                            {component.manufacturer ? ` · ${component.manufacturer}` : ''}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {hasInvoice && (
                                    <div className="rounded-[1.1rem] border border-white/10 bg-white/5 p-4">
                                      <a
                                        href={resolveFileUrl(record.invoice?.pdfUrl || '') || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm font-medium text-[#ff9b82] transition-colors hover:text-[#ffb29f]"
                                      >
                                        <FaFilePdf />
                                        Открыть счет в PDF
                                      </a>
                                    </div>
                                  )}
                                </div>

                                {attachmentCount > 0 && (
                                  <OperationAttachments
                                    attachments={record.photos}
                                    title="Материалы"
                                    compact
                                    inline
                                    showLabels={false}
                                    className="mt-0 self-start"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex flex-col gap-3 rounded-[1.4rem] border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Показаны записи {pageStart}-{pageEnd} из {totalRecords}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    На мобильных устройствах вторичные данные скрыты до раскрытия карточки.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setPage((currentValue) => Math.max(currentValue - 1, 0))
                      setExpandedRecordKey(null)
                    }}
                    disabled={recordsPage?.first ?? currentPage === 0}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-[#ff9b82]/35 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <FaChevronLeft />
                    Назад
                  </button>

                  <span className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-2 text-sm font-medium text-slate-300">
                    {currentPage + 1} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setPage((currentValue) => currentValue + 1)
                      setExpandedRecordKey(null)
                    }}
                    disabled={recordsPage?.last ?? true}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-[#ff9b82]/35 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Далее
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
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
