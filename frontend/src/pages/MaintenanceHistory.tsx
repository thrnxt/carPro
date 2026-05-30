import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import {
  FaCamera,
  FaCar,
  FaChevronDown,
  FaCommentDots,
  FaFileAlt,
  FaFilePdf,
  FaMapMarkerAlt,
  FaTimes,
  FaTools,
  FaWrench,
} from 'react-icons/fa'
import apiClient from '../api/client'
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

interface Attachment {
  id: number
  fileUrl: string
  description?: string | null
  replacedComponentId?: number | null
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
  photos?: Attachment[] | null
  replacedComponents?: Array<{
    id: number
    partNumber?: string | null
    manufacturer?: string | null
    carComponent?: { name?: string } | null
    photos?: Attachment[] | null
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

type LightboxPhoto = { url: string; label: string }

const JOURNAL_PAGE_SIZE = 10
const VISIBLE_PARTS = 3
const IMAGE_FILE_PATTERN = /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|webp)(?:[?#].*)?$/i

function isImageAttachment(attachment: Attachment) {
  return (
    IMAGE_FILE_PATTERN.test(attachment.fileUrl) ||
    IMAGE_FILE_PATTERN.test(attachment.description || '')
  )
}

function attachmentLabel(attachment: Attachment) {
  if (attachment.description?.trim()) return attachment.description.trim()
  const name = attachment.fileUrl.split('/').pop()?.split('?')[0]?.split('#')[0]
  if (!name) return 'Файл'
  try {
    return decodeURIComponent(name)
  } catch {
    return name
  }
}

function formatServiceDate(value: string) {
  try {
    return format(new Date(value), 'd MMMM yyyy', { locale: ru })
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

function carTitle(car: CarSummary) {
  return `${car.brand} ${car.model}`.trim()
}

function RecordSkeleton() {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-6 w-24 rounded-lg" />
      </div>
    </div>
  )
}

/* ── Photo lightbox (overlay, React-state driven) ── */
function Lightbox({ photo, onClose }: { photo: LightboxPhoto; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={photo.label}
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl overflow-hidden rounded-lg border border-border bg-surface-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/80"
        >
          <FaTimes />
        </button>
        <img
          src={photo.url}
          alt={photo.label}
          className="max-h-[72vh] w-full bg-black object-contain"
        />
        <p className="truncate px-4 py-3 text-caption text-text-secondary">{photo.label}</p>
      </div>
    </div>
  )
}

/* ── Horizontal divided metadata strip ── */
function MetaStrip({ items }: { items: Array<{ icon: typeof FaCar; node: React.ReactNode }> }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-y-1 rounded-md border border-border bg-surface-1 px-1.5 py-2 text-caption text-text-secondary">
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <span
            key={i}
            className="flex min-w-0 items-center gap-2 border-l border-border px-3 first:border-l-0"
          >
            <Icon className="shrink-0 text-text-muted" aria-hidden="true" />
            <span className="truncate">{item.node}</span>
          </span>
        )
      })}
    </div>
  )
}

/* ── A single image thumbnail that opens the lightbox ── */
function PhotoThumb({
  attachment,
  size,
  badge,
  onOpen,
}: {
  attachment: Attachment
  size: 'sm' | 'md'
  badge?: number
  onOpen: (photo: LightboxPhoto) => void
}) {
  const url = resolveFileUrl(attachment.fileUrl) || ''
  const label = attachmentLabel(attachment)
  return (
    <button
      type="button"
      onClick={() => url && onOpen({ url, label })}
      title={label}
      className={cx(
        'group relative shrink-0 cursor-zoom-in overflow-hidden rounded-lg border border-border bg-surface-3 transition-colors hover:border-text-muted',
        size === 'sm' ? 'h-12 w-12' : 'h-20 w-20'
      )}
    >
      <img
        src={url || undefined}
        alt={label}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
      />
      {badge ? (
        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/65 px-1 text-[10px] font-semibold text-white">
          +{badge}
        </span>
      ) : null}
    </button>
  )
}

function SectionTitle({
  icon: Icon,
  children,
  count,
}: {
  icon: typeof FaCar
  children: React.ReactNode
  count?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <span className="flex items-center gap-2 text-caption font-semibold uppercase tracking-wider text-text-secondary">
        <Icon className="text-text-muted" aria-hidden="true" />
        {children}
      </span>
      {count != null ? (
        <span className="rounded-full bg-surface-3 px-2.5 py-0.5 text-caption font-medium text-text-muted">
          {count}
        </span>
      ) : null}
    </div>
  )
}

/* ── Record card with header + accordion body ── */
function RecordCard({
  record,
  showCar,
  isExpanded,
  onToggle,
  onOpenPhoto,
}: {
  record: MaintenanceRecord
  showCar: boolean
  isExpanded: boolean
  onToggle: () => void
  onOpenPhoto: (photo: LightboxPhoto) => void
}) {
  const [showAllParts, setShowAllParts] = useState(false)

  const statusMeta = operationStatusMeta(record.status)
  const mileageLabel = formatMileage(record.mileageAtService)
  const costLabel = formatCost(record.cost)

  const parts = record.replacedComponents ?? []
  const generalImages = (record.photos ?? []).filter(
    (p) => !p.replacedComponentId && isImageAttachment(p)
  )
  const generalDocs = (record.photos ?? []).filter(
    (p) => !p.replacedComponentId && !isImageAttachment(p)
  )
  const partPhotoCount = parts.reduce((t, c) => t + (c.photos?.length ?? 0), 0)
  const photoCount = generalImages.length + partPhotoCount
  const hasInvoice = Boolean(record.invoice?.pdfUrl)

  const expandable = Boolean(
    record.description?.trim() ||
      record.serviceCenter?.name ||
      record.serviceCenter?.address ||
      parts.length > 0 ||
      generalImages.length > 0 ||
      generalDocs.length > 0 ||
      hasInvoice
  )

  const visibleParts = showAllParts ? parts : parts.slice(0, VISIBLE_PARTS)
  const hiddenPartsCount = parts.length - VISIBLE_PARTS

  const metaItems: Array<{ icon: typeof FaCar; node: React.ReactNode }> = []
  if (record.serviceCenter?.name) {
    metaItems.push({ icon: FaMapMarkerAlt, node: <b className="font-semibold text-text-primary">{record.serviceCenter.name}</b> })
  }
  if (showCar) {
    metaItems.push({
      icon: FaCar,
      node: (
        <>
          {carTitle(record.car)} · <b className="font-semibold text-text-primary">{record.car.licensePlate}</b>
        </>
      ),
    })
  }
  if (photoCount > 0) {
    metaItems.push({ icon: FaCamera, node: <><b className="font-semibold text-text-primary">{photoCount}</b> фото</> })
  }
  if (parts.length > 0) {
    metaItems.push({ icon: FaWrench, node: <><b className="font-semibold text-text-primary">{parts.length}</b> дет.</> })
  }

  const header = (
    <>
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-3 text-accent"
        aria-hidden="true"
      >
        <FaTools />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="truncate text-h3 font-semibold text-text-primary">{record.workType}</span>
          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
        </div>

        <div className="text-left sm:shrink-0 sm:text-right">
          {costLabel && (
            <span className="block text-h3 font-bold leading-tight text-text-primary">{costLabel}</span>
          )}
          <span className="mt-0.5 flex items-center justify-start gap-2 text-caption text-text-muted sm:justify-end">
            <span className="whitespace-nowrap">{formatServiceDate(record.serviceDate)}</span>
            {mileageLabel && (
              <>
                <span className="h-1 w-1 rounded-full bg-current opacity-60" />
                <span className="whitespace-nowrap">{mileageLabel}</span>
              </>
            )}
          </span>
        </div>
      </div>

      {expandable && (
        <FaChevronDown
          className={cx(
            'shrink-0 text-text-muted transition-transform duration-300',
            isExpanded && 'rotate-180'
          )}
        />
      )}
    </>
  )

  const headerClass = 'flex w-full items-center gap-3 px-4 py-4 text-left sm:gap-4'

  return (
    <article className="overflow-hidden rounded-md border border-border bg-surface-2 transition-colors">
      {expandable ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          className={cx(headerClass, 'appearance-none border-0 bg-transparent transition-colors hover:bg-surface-3')}
        >
          {header}
        </button>
      ) : (
        <div className={headerClass}>{header}</div>
      )}

      {expandable && isExpanded && (
        <div className="space-y-5 border-t border-border bg-surface-1 px-4 py-4 sm:px-5">
          <MetaStrip items={metaItems} />

          {/* Replaced parts */}
          {parts.length > 0 && (
            <section>
              <SectionTitle icon={FaWrench} count={parts.length}>
                Замененные детали
              </SectionTitle>
              <div className="overflow-hidden rounded-lg border border-border">
                {visibleParts.map((part) => {
                  const photos = part.photos ?? []
                  return (
                    <div
                      key={part.id}
                      className="flex items-center gap-3.5 px-3 py-2.5 transition-colors hover:bg-surface-2 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-border"
                    >
                      {photos[0] ? (
                        <PhotoThumb
                          attachment={photos[0]}
                          size="sm"
                          badge={photos.length > 1 ? photos.length - 1 : undefined}
                          onOpen={onOpenPhoto}
                        />
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-3 text-text-muted">
                          <FaTools />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body font-medium text-text-primary">
                          {part.carComponent?.name || 'Деталь'}
                        </span>
                        {part.partNumber && (
                          <span className="block truncate text-caption text-text-muted">
                            Артикул: {part.partNumber}
                          </span>
                        )}
                      </span>
                      {part.manufacturer && (
                        <span className="shrink-0 rounded-md border border-border bg-surface-3 px-2.5 py-1 text-caption font-medium text-text-secondary">
                          {part.manufacturer}
                        </span>
                      )}
                    </div>
                  )
                })}

                {hiddenPartsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllParts((v) => !v)}
                    className="flex w-full items-center justify-center gap-2 border-t border-border bg-surface-2 py-2.5 text-caption font-semibold text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
                  >
                    {showAllParts ? 'Свернуть' : `Показать ещё ${hiddenPartsCount}`}
                    <FaChevronDown className={cx('transition-transform', showAllParts && 'rotate-180')} />
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Service center */}
          {(record.serviceCenter?.name || record.serviceCenter?.address) && (
            <section>
              <SectionTitle icon={FaMapMarkerAlt}>Сервисный центр</SectionTitle>
              <div className="flex items-center gap-3.5 rounded-lg border border-border bg-surface-2 px-4 py-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-info to-accent text-body font-bold text-white">
                  {(record.serviceCenter?.name || 'СЦ').trim().slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  {record.serviceCenter?.name && (
                    <span className="block truncate text-body font-semibold text-text-primary">
                      {record.serviceCenter.name}
                    </span>
                  )}
                  {record.serviceCenter?.address && (
                    <span className="mt-0.5 flex items-center gap-1.5 text-caption text-text-muted">
                      <FaMapMarkerAlt className="shrink-0" aria-hidden="true" />
                      <span className="truncate">{record.serviceCenter.address}</span>
                    </span>
                  )}
                </span>
              </div>
            </section>
          )}

          {/* Description */}
          {record.description?.trim() && (
            <section>
              <SectionTitle icon={FaCommentDots}>Описание работ</SectionTitle>
              <p className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-body italic leading-relaxed text-text-secondary">
                {record.description}
              </p>
            </section>
          )}

          {/* General materials */}
          {(generalImages.length > 0 || generalDocs.length > 0) && (
            <section>
              <SectionTitle icon={FaCamera} count={generalImages.length + generalDocs.length}>
                Материалы
              </SectionTitle>
              {generalImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {generalImages.map((photo) => (
                    <PhotoThumb key={photo.id} attachment={photo} size="md" onOpen={onOpenPhoto} />
                  ))}
                </div>
              )}
              {generalDocs.length > 0 && (
                <div className={cx('flex flex-wrap gap-2', generalImages.length > 0 && 'mt-2')}>
                  {generalDocs.map((doc) => (
                    <a
                      key={doc.id}
                      href={resolveFileUrl(doc.fileUrl) || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-[15rem] items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-caption text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary"
                    >
                      <FaFileAlt className="shrink-0 text-text-muted" />
                      <span className="truncate">{attachmentLabel(doc)}</span>
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Footer actions */}
          {hasInvoice && (
            <div className="-mx-4 -mb-4 flex items-center gap-1 border-t border-border bg-surface-2 px-4 py-2.5 sm:-mx-5 sm:px-5">
              <a
                href={resolveFileUrl(record.invoice?.pdfUrl || '') || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-caption font-medium text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
              >
                <FaFilePdf className="text-text-muted" />
                Открыть счёт PDF
              </a>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

export default function MaintenanceHistory() {
  const { id } = useParams()
  const [selectedCarId, setSelectedCarId] = useState('')
  const [page, setPage] = useState(0)
  const [expandedRecordKey, setExpandedRecordKey] = useState<string | null>(null)
  const [lightboxPhoto, setLightboxPhoto] = useState<LightboxPhoto | null>(null)

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
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <RecordSkeleton key={i} />)}
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
          <div className="space-y-3">
            {records.map((record) => {
              const recordKey = getRecordKey(record)
              return (
                <RecordCard
                  key={recordKey}
                  record={record}
                  showCar={!id}
                  isExpanded={expandedRecordKey === recordKey}
                  onToggle={() =>
                    setExpandedRecordKey((key) => (key === recordKey ? null : recordKey))
                  }
                  onOpenPhoto={setLightboxPhoto}
                />
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

      {lightboxPhoto && (
        <Lightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
      )}
    </Wrapper>
  )
}
