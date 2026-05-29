import { Fragment, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import {
  FaCamera,
  FaChevronDown,
  FaChevronUp,
  FaFilePdf,
  FaWrench,
} from 'react-icons/fa'
import apiClient from '../api/client'
import OperationAttachments from '../components/OperationAttachments'
import {
  Badge,
  EmptyState,
  Page,
  PageHeader,
  Pagination,
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

  // Встраиваемый режим: страница открыта внутри карточки авто (/cars/:id/history),
  // где общий заголовок и навигация уже отрисованы CarLayout.
  const embedded = !!id
  const Wrapper = embedded ? Fragment : Page

  if (carsLoading || recordsLoading) {
    const skeleton = (
      <div className="auto-card overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => <RecordSkeleton key={i} />)}
      </div>
    )
    if (embedded) {
      return skeleton
    }
    return (
      <Page>
        <PageHeader title="История ТО" />
        {skeleton}
      </Page>
    )
  }

  if (!id && cars.length === 0) {
    return (
      <Page>
        <PageHeader
          title="История ТО"
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
      <EmptyState
        icon={FaWrench}
        title="Не удалось определить автомобиль"
        description="Вероятно, автомобиль удалён или у вас больше нет к нему доступа."
        action={
          <Link to="/garage" className="btn-primary">
            Вернуться в гараж
          </Link>
        }
      />
    )
  }

  return (
    <Wrapper>
      {!embedded && (
        <PageHeader
          title="История ТО"
          description="Все сервисные работы по вашему гаражу."
        />
      )}

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
              const statusMeta = operationStatusMeta(record.status)
              const toggleRecord = () => {
                if (!detailsAvailable) {
                  return
                }

                setExpandedRecordKey((key) => (key === recordKey ? null : recordKey))
              }
              const compactRowClassName = cx(
                'grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-3 text-left transition-colors md:grid-cols-[minmax(0,15rem)_8.5rem_minmax(0,1fr)_8.5rem_2rem] md:gap-x-4 md:gap-y-0',
                detailsAvailable && 'cursor-pointer hover:bg-surface-3'
              )
              const compactRowContent = (
                <>
                  <div className="min-w-0">
                    <span className="block truncate text-body font-medium text-text-primary">
                      {record.workType}
                    </span>
                  </div>

                  <div className="justify-self-start">
                    <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                  </div>

                  <div className="col-span-2 flex min-w-0 items-center gap-x-2 overflow-hidden text-caption text-text-muted md:col-span-1">
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

                  <div className="col-start-1 row-start-3 justify-self-start md:col-start-auto md:row-start-auto md:justify-self-end">
                    {costLabel && (
                      <span className="whitespace-nowrap text-body font-semibold text-success">
                        {costLabel}
                      </span>
                    )}
                  </div>

                  <div className="col-start-2 row-start-3 flex h-7 w-7 items-center justify-center justify-self-end rounded text-text-muted md:col-start-auto md:row-start-auto">
                    {detailsAvailable && (
                      isExpanded ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />
                    )}
                  </div>
                </>
              )

              return (
                <article key={recordKey} className="border-b border-border last:border-0">
                  {/* ── Compact row ── */}
                  {detailsAvailable ? (
                    <button
                      type="button"
                      onClick={toggleRecord}
                      className={cx(compactRowClassName, 'appearance-none border-0 bg-transparent')}
                      aria-expanded={isExpanded}
                      aria-controls={`maintenance-record-${recordKey}`}
                      title={isExpanded ? 'Скрыть' : 'Подробнее'}
                    >
                      {compactRowContent}
                    </button>
                  ) : (
                    <div className={compactRowClassName}>
                      {compactRowContent}
                    </div>
                  )}

                  {/* ── Expanded detail panel ── */}
                  {isExpanded && (
                    <div id={`maintenance-record-${recordKey}`} className="border-t border-border bg-surface-1 px-4 pb-5 pt-4">
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

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={totalRecords}
            pageSize={JOURNAL_PAGE_SIZE}
            onPageChange={(p) => {
              setPage(p)
              setExpandedRecordKey(null)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
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
    </Wrapper>
  )
}
