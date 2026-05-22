import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import {
  FaCamera,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaFilePdf,
  FaWrench,
} from 'react-icons/fa'
import apiClient from '../api/client'
import OperationAttachments from '../components/OperationAttachments'
import {
  Badge,
  Button,
  EmptyState,
  Page,
  PageHeader,
  Section,
  Skeleton,
  cx,
} from '../components/ui'
import { normalizeCollectionResponse } from '../utils/normalizeCollectionResponse'
import { resolveFileUrl } from '../utils/resolveFileUrl'
import { operationStatusMeta } from '../utils/statusMeta'

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
    carComponent?: { name?: string } | null
  }> | null
  invoice?: { id: number; pdfUrl?: string | null } | null
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

const JOURNAL_PAGE_SIZE = 10

function formatServiceDate(value: string) {
  try {
    return format(new Date(value), 'dd MMMM yyyy', { locale: ru })
  } catch {
    return value
  }
}

function formatMileage(value?: number | null) {
  return value != null ? `${value.toLocaleString('ru-RU')} км` : null
}

function formatCost(value?: number | null) {
  return value != null ? `${value.toLocaleString('ru-RU')} ₸` : null
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

function RecordSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-0">
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
    </div>
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
    if (id) return Number(id)
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
    placeholderData: (prev) => prev,
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
        <PageHeader eyebrow="История ТО" title="История обслуживания" />
        <div className="auto-card overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => <RecordSkeleton key={i} />)}
        </div>
      </Page>
    )
  }

  if (!id && cars.length === 0) {
    return (
      <Page>
        <PageHeader
          eyebrow="История ТО"
          title="История обслуживания"
          description="Раздел показывает все работы по вашим автомобилям. Сначала добавьте хотя бы один автомобиль в гараж."
        />
        <Section>
          <EmptyState
            icon={FaWrench}
            title="Гараж пока пуст"
            description="Добавьте автомобиль, чтобы операции, работы и документы начали складываться в историю обслуживания."
            action={
              <Link to="/garage" className="btn-primary">
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
        <Section title="Автомобиль не найден">
          <EmptyState
            icon={FaWrench}
            title="Не удалось определить автомобиль"
            description="Вероятно, автомобиль удалён или у вас больше нет к нему доступа."
            action={
              <Link to="/maintenance-history" className="btn-primary">
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
        eyebrow="История ТО"
        title={id && selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : 'История обслуживания'}
        description={
          id && selectedCar
            ? 'Фильтрованный журнал работ по выбранному автомобилю.'
            : 'Единый журнал всех сервисных работ по вашему гаражу.'
        }
        actions={
          id ? (
            <Link to="/maintenance-history" className="btn-secondary">
              Все автомобили
            </Link>
          ) : undefined
        }
      />

      {/* ── Filter bar ── */}
      {!id && (
        <div className="glass-panel flex flex-wrap items-center justify-between gap-3 p-3">
          <select
            value={selectedCarId}
            onChange={(e) => {
              setSelectedCarId(e.target.value)
              setPage(0)
              setExpandedRecordKey(null)
            }}
            className="auto-select max-w-xs flex-1"
          >
            <option value="">Все автомобили</option>
            {cars.map((car) => (
              <option key={car.id} value={car.id}>
                {car.brand} {car.model} ({car.licensePlate})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span className="auto-badge">{totalRecords} записей</span>
            {recordsFetching && (
              <span className="text-caption text-text-muted">Обновление…</span>
            )}
          </div>
        </div>
      )}

      {/* ── Journal ── */}
      {isError ? (
        <div className="auto-card p-8">
          <EmptyState
            icon={FaWrench}
            title="Не удалось загрузить историю"
            description="Проверьте доступ к автомобилю или повторите попытку позже."
          />
        </div>
      ) : records.length > 0 ? (
        <>
          <div className="auto-card overflow-hidden">
            {records.map((record) => {
              const recordKey = getRecordKey(record)
              const isExpanded = expandedRecordKey === recordKey
              const mileageLabel = formatMileage(record.mileageAtService)
              const costLabel = formatCost(record.cost)
              const attachmentCount = record.photos?.length ?? 0
              const replacedPartsCount = record.replacedComponents?.length ?? 0
              const hasInvoice = Boolean(record.invoice?.pdfUrl)
              const detailsAvailable = hasExpandedDetails(record)

              return (
                <article key={recordKey} className="border-b border-border last:border-0">
                  {/* ── Compact row ── */}
                  <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 hover:bg-surface-3 transition-colors">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-body font-medium text-text-primary truncate">
                          {record.workType}
                        </span>
                        <Badge tone={operationStatusMeta(record.status).tone}>
                          {operationStatusMeta(record.status).label}
                        </Badge>
                      </div>

                      <div className="mt-0.5 flex items-center gap-x-2 overflow-hidden text-caption text-text-muted">
                        <span className="truncate">
                          {formatServiceDate(record.serviceDate)}
                          {mileageLabel ? ` · ${mileageLabel}` : ''}
                          {record.serviceCenter?.name ? ` · ${record.serviceCenter.name}` : ''}
                          {!id ? ` · ${record.car.brand} ${record.car.model}` : ''}
                        </span>
                        {attachmentCount > 0 && (
                          <span className="inline-flex shrink-0 items-center gap-1">
                            <FaCamera aria-hidden="true" />
                            {attachmentCount}
                          </span>
                        )}
                        {replacedPartsCount > 0 && (
                          <span className="inline-flex shrink-0 items-center gap-1">
                            <FaWrench aria-hidden="true" />
                            {replacedPartsCount} дет.
                          </span>
                        )}
                        {hasInvoice && (
                          <span className="inline-flex shrink-0 items-center gap-1">
                            <FaFilePdf aria-hidden="true" />
                            PDF
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {costLabel && (
                        <span className="text-body font-semibold text-success whitespace-nowrap">
                          {costLabel}
                        </span>
                      )}
                      {detailsAvailable && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedRecordKey((k) => (k === recordKey ? null : recordKey))
                          }
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:bg-surface-3 hover:text-text-primary"
                          title={isExpanded ? 'Скрыть' : 'Подробнее'}
                        >
                          {isExpanded ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Expanded detail panel ── */}
                  {isExpanded && (
                    <div className="border-t border-border bg-surface-1 px-4 pb-5 pt-4">
                      <div
                        className={cx(
                          'grid gap-4',
                          attachmentCount > 0 && 'xl:grid-cols-[minmax(0,1fr)_18rem]'
                        )}
                      >
                        <div className="space-y-3">
                          {record.description && (
                            <div className="glass-panel p-4">
                              <p className="section-label">Описание работ</p>
                              <p className="mt-2 text-body leading-relaxed text-text-secondary">
                                {record.description}
                              </p>
                            </div>
                          )}

                          {(record.serviceCenter?.name || record.serviceCenter?.address) && (
                            <div className="glass-panel p-4">
                              <p className="section-label">Сервисный центр</p>
                              {record.serviceCenter?.name && (
                                <p className="mt-2 text-body font-medium text-text-primary">
                                  {record.serviceCenter.name}
                                </p>
                              )}
                              {record.serviceCenter?.address && (
                                <p className="mt-1 text-body text-text-secondary">
                                  {record.serviceCenter.address}
                                </p>
                              )}
                            </div>
                          )}

                          {replacedPartsCount > 0 && (
                            <div className="glass-panel p-4">
                              <p className="section-label mb-3">Замененные детали</p>
                              <div className="flex flex-wrap gap-2">
                                {record.replacedComponents?.map((component) => (
                                  <span key={component.id} className="auto-badge">
                                    {component.carComponent?.name || 'Деталь'}
                                    {component.partNumber ? ` · ${component.partNumber}` : ''}
                                    {component.manufacturer ? ` · ${component.manufacturer}` : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {hasInvoice && (
                            <div className="glass-panel p-4">
                              <a
                                href={resolveFileUrl(record.invoice?.pdfUrl || '') || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-body font-medium text-accent transition-colors hover:text-accent-hover"
                              >
                                <FaFilePdf />
                                Открыть счёт в PDF
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
                </article>
              )
            })}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 glass-panel p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-body text-text-secondary">
                <span className="font-medium text-text-primary">{pageStart}–{pageEnd}</span>
                {' '}из {totalRecords}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled={recordsPage?.first ?? currentPage === 0}
                  onClick={() => {
                    setPage((p) => Math.max(p - 1, 0))
                    setExpandedRecordKey(null)
                  }}
                >
                  <FaChevronLeft />
                  Назад
                </Button>

                <span className="auto-badge px-4">
                  {currentPage + 1} / {totalPages}
                </span>

                <Button
                  variant="secondary"
                  disabled={recordsPage?.last ?? true}
                  onClick={() => {
                    setPage((p) => p + 1)
                    setExpandedRecordKey(null)
                  }}
                >
                  Далее
                  <FaChevronRight />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="auto-card p-8">
          <EmptyState
            icon={FaWrench}
            title="История обслуживания пуста"
            description={
              id
                ? 'По этому автомобилю ещё нет записей ТО.'
                : 'По выбранному фильтру пока нет сервисных операций.'
            }
          />
        </div>
      )}
    </Page>
  )
}
