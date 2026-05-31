import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import {
  FaCar,
  FaCarBattery,
  FaCarCrash,
  FaClipboardList,
  FaCogs,
  FaFileInvoiceDollar,
  FaOilCan,
  FaRedo,
  FaRegFileAlt,
  FaSearch,
  FaTachometerAlt,
  FaWrench,
} from 'react-icons/fa'
import type { IconType } from 'react-icons'
import apiClient from '../api/client'
import { normalizeCollectionResponse } from '../utils/normalizeCollectionResponse'
import { Badge, EmptyState, Page, PageHeader, Skeleton, cx } from '../components/ui'
import { invoiceStatusMeta, operationStatusMeta } from '../utils/statusMeta'

const PAGE_STEP = 8

interface CarSummary {
  id: number
  brand: string
  model: string
  licensePlate?: string
}

interface OperationRecord {
  id: number
  workType: string
  description?: string
  serviceDate: string
  mileageAtService: number
  cost?: number | null
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  serviceCenter?: { id?: number; name?: string }
  car: CarSummary
}

interface InvoiceRecord {
  id: number
  invoiceNumber: string
  issueDate: string
  totalAmount: number
  taxAmount?: number
  currency: string
  status: 'CREATED' | 'PAID' | 'CANCELLED'
  notes?: string
  items?: string
  carId?: number
  carTitle?: string
  serviceCenterName?: string
}

type Tab = 'operations' | 'invoices'

function money(value?: number | null, currency = '₸') {
  if (value == null) return '—'
  return `${value.toLocaleString('ru-RU')} ${currency}`
}

function shortDate(value: string) {
  try {
    return format(new Date(value), 'd MMM yyyy', { locale: ru })
  } catch {
    return value
  }
}

function carLabel(car: CarSummary) {
  return `${car.brand} ${car.model}${car.licensePlate ? ` (${car.licensePlate})` : ''}`
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function periodLabel(dates: string[]) {
  const valid = dates
    .map((d) => new Date(d))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())
  if (valid.length === 0) return '—'
  const fmt = (d: Date) => capitalize(format(d, 'LLLL yyyy', { locale: ru }))
  const first = fmt(valid[0])
  const last = fmt(valid[valid.length - 1])
  return first === last ? first : `${first} – ${last}`
}

/* ── Operation type → icon + colour (HEX, для мягкого фона через alpha) ── */
function operationVisual(workType: string): { Icon: IconType; color: string } {
  const w = workType.toLowerCase()
  if (/масл|oil|жидкост|антифриз|тосол/.test(w)) return { Icon: FaOilCan, color: '#EF9F27' }
  if (/диагност|комп|сканир|ошибк/.test(w)) return { Icon: FaTachometerAlt, color: '#378ADD' }
  if (/тормоз|колодк|диск/.test(w)) return { Icon: FaCarCrash, color: '#E24B4A' }
  if (/аккум|батар|электр|генератор|стартер/.test(w)) return { Icon: FaCarBattery, color: '#1D9E75' }
  if (/шин|колес|развал|схожден|баланс|резин/.test(w)) return { Icon: FaCogs, color: '#E8541A' }
  return { Icon: FaWrench, color: '#378ADD' }
}

/* 40px coloured icon circle */
function IconCircle({ Icon, color }: { Icon: IconType; color: string }) {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px]"
      style={{ backgroundColor: `${color}22`, color }}
      aria-hidden="true"
    >
      <Icon />
    </span>
  )
}

/* ============================================================
   Toolbar
   ============================================================ */
function Toolbar({
  tab,
  onTab,
  counts,
  cars,
  selectedCarId,
  onCar,
  query,
  onQuery,
}: {
  tab: Tab
  onTab: (t: Tab) => void
  counts: Record<Tab, number>
  cars: CarSummary[]
  selectedCarId: string
  onCar: (v: string) => void
  query: string
  onQuery: (v: string) => void
}) {
  const tabs: Array<{ value: Tab; label: string }> = [
    { value: 'operations', label: 'Операции' },
    { value: 'invoices', label: 'Счета' },
  ]

  return (
    <div className="glass-panel flex flex-col gap-3 p-2.5 lg:flex-row lg:items-center lg:justify-between">
      {/* pill tabs */}
      <div role="tablist" className="inline-flex gap-1 rounded-lg border border-border bg-surface-1 p-1">
        {tabs.map((t) => {
          const active = tab === t.value
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTab(t.value)}
              className={cx(
                'inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-body font-semibold transition-colors lg:flex-none',
                active
                  ? 'bg-surface-3 text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {t.label}
              <span
                className={cx(
                  'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-caption font-bold',
                  active ? 'text-accent' : 'bg-surface-3 text-text-muted'
                )}
                style={active ? { backgroundColor: 'rgba(232,84,26,0.16)' } : undefined}
              >
                {counts[t.value]}
              </span>
            </button>
          )
        })}
      </div>

      {/* right controls */}
      <div className="grid w-full gap-2 sm:grid-cols-[minmax(0,14rem)_minmax(14rem,18rem)] lg:w-auto">
        <div className="relative min-w-0">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-caption text-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Поиск…"
            aria-label="Поиск по документам"
            className="auto-input h-9 w-full pl-9 text-text-primary placeholder:text-text-secondary"
          />
        </div>

        {cars.length > 0 && (
          <div className="relative min-w-0">
            <FaCar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-caption text-text-secondary" />
            <select
              value={selectedCarId}
              onChange={(e) => onCar(e.target.value)}
              aria-label="Фильтр по автомобилю"
              className="auto-select h-9 w-full min-w-0 py-1.5 pl-9 text-text-primary"
            >
              <option value="">Все автомобили</option>
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {carLabel(car)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   Summary strip
   ============================================================ */
function SummaryStrip({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="glass-panel mt-3 flex flex-col divide-y divide-border px-4 py-1 sm:flex-row sm:divide-x sm:divide-y-0 sm:py-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-baseline justify-between gap-2 py-2.5 sm:justify-start sm:px-5 sm:py-0 sm:first:pl-1"
        >
          <span className="text-caption text-text-muted">{item.label}</span>
          <span className="text-body font-bold tracking-tight text-text-primary">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ============================================================
   Rows
   ============================================================ */
function OperationRow({ record }: { record: OperationRecord }) {
  const { Icon, color } = operationVisual(record.workType)
  const statusMeta = record.status ? operationStatusMeta(record.status) : null

  return (
    <Link
      to={`/cars/${record.car.id}/history`}
      className="grid grid-cols-[40px_1fr_auto] items-center gap-3.5 border-b border-border px-4 py-3.5 transition-colors last:border-0 hover:bg-surface-3"
    >
      <IconCircle Icon={Icon} color={color} />

      <div className="min-w-0">
        <p className="truncate text-body font-semibold text-text-primary">{record.workType}</p>
        <p className="mt-0.5 truncate text-caption text-text-muted">
          {shortDate(record.serviceDate)}
          {' · '}
          {carLabel(record.car)}
          {record.serviceCenter?.name ? ` · ${record.serviceCenter.name}` : ''}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-base font-bold tracking-tight text-text-primary">{money(record.cost)}</p>
        {statusMeta && (
          <span className="mt-1 inline-flex">
            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
          </span>
        )}
      </div>
    </Link>
  )
}

function InvoiceRow({ invoice }: { invoice: InvoiceRecord }) {
  const statusMeta = invoiceStatusMeta(invoice.status)
  const title = invoice.serviceCenterName
    ? `Счёт на оплату · ${invoice.serviceCenterName}`
    : 'Счёт на оплату'
  const subtitle = [invoice.invoiceNumber, shortDate(invoice.issueDate), invoice.carTitle]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="grid grid-cols-[40px_1fr_auto] items-center gap-3.5 border-b border-border px-4 py-3.5 transition-colors last:border-0 hover:bg-surface-3">
      <IconCircle Icon={FaRegFileAlt} color="#E8541A" />

      <div className="min-w-0">
        <p className="truncate text-body font-semibold text-text-primary">{title}</p>
        <p className="mt-0.5 truncate text-caption text-text-muted">{subtitle}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-base font-bold tracking-tight text-text-primary">
          {money(invoice.totalAmount, invoice.currency || '₸')}
        </p>
        <span className="mt-1 inline-flex">
          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
        </span>
      </div>
    </div>
  )
}

function RowSkeleton() {
  return (
    <div className="grid grid-cols-[40px_1fr_auto] items-center gap-3.5 border-b border-border px-4 py-3.5 last:border-0">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  )
}

/* ============================================================
   Page
   ============================================================ */
export default function ClientDocuments() {
  const [selectedCarId, setSelectedCarId] = useState('')
  const [tab, setTab] = useState<Tab>('operations')
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_STEP)

  const { data: cars = [], isLoading: carsLoading } = useQuery<CarSummary[]>({
    queryKey: ['cars'],
    queryFn: async () => {
      const response = await apiClient.get('/cars')
      return response.data as CarSummary[]
    },
  })

  const { data: operations = [], isLoading: operationsLoading } = useQuery<OperationRecord[]>({
    queryKey: ['client-operations', cars.map((c) => c.id).join(',')],
    queryFn: async () => {
      if (cars.length === 0) return []
      const all = await Promise.all(
        cars.map(async (car) => {
          const response = await apiClient.get(`/maintenance-records/car/${car.id}`)
          const records = normalizeCollectionResponse<Omit<OperationRecord, 'car'>>(response.data)
          return records.map((r) => ({ ...r, car }))
        })
      )
      return all
        .flat()
        .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())
    },
    enabled: !carsLoading,
  })

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<InvoiceRecord[]>({
    queryKey: ['invoices', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/invoices/my')
      return response.data as InvoiceRecord[]
    },
  })

  const isLoading = carsLoading || operationsLoading || invoicesLoading

  const q = query.trim().toLowerCase()

  const filteredOperations = useMemo(() => {
    return operations.filter((r) => {
      if (selectedCarId && String(r.car.id) !== selectedCarId) return false
      if (!q) return true
      return [r.workType, r.serviceCenter?.name, carLabel(r.car), r.description]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q))
    })
  }, [operations, selectedCarId, q])

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (selectedCarId && String(inv.carId) !== selectedCarId) return false
      if (!q) return true
      return [inv.invoiceNumber, inv.serviceCenterName, inv.carTitle, inv.notes]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q))
    })
  }, [invoices, selectedCarId, q])

  // Сброс пагинации при смене вкладки/фильтра/поиска
  useEffect(() => {
    setVisibleCount(PAGE_STEP)
  }, [tab, selectedCarId, q])

  const activeList = tab === 'operations' ? filteredOperations : filteredInvoices
  const visibleList = activeList.slice(0, visibleCount)
  const remaining = activeList.length - visibleList.length

  const summaryItems = useMemo<Array<{ label: string; value: string }>>(() => {
    if (tab === 'operations') {
      const total = filteredOperations.reduce((sum, r) => sum + (r.cost ?? 0), 0)
      return [
        { label: 'Всего операций', value: String(filteredOperations.length) },
        { label: 'Общая сумма', value: money(total) },
        { label: 'Период', value: periodLabel(filteredOperations.map((r) => r.serviceDate)) },
      ]
    }
    const toPay = filteredInvoices
      .filter((inv) => inv.status === 'CREATED')
      .reduce((sum, inv) => sum + inv.totalAmount, 0)
    const paid = filteredInvoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.totalAmount, 0)
    return [
      { label: 'Всего счетов', value: String(filteredInvoices.length) },
      { label: 'К оплате', value: money(toPay) },
      { label: 'Оплачено', value: money(paid) },
    ]
  }, [tab, filteredOperations, filteredInvoices])

  const hasFilter = Boolean(selectedCarId || q)
  const resetFilters = () => {
    setSelectedCarId('')
    setQuery('')
  }

  return (
    <Page>
      <PageHeader
        title="Документы"
        description="Сервисные операции и электронные счета по вашему гаражу — в одном месте."
      />

      <Toolbar
        tab={tab}
        onTab={setTab}
        counts={{ operations: filteredOperations.length, invoices: filteredInvoices.length }}
        cars={cars}
        selectedCarId={selectedCarId}
        onCar={setSelectedCarId}
        query={query}
        onQuery={setQuery}
      />

      {!isLoading && activeList.length > 0 && <SummaryStrip items={summaryItems} />}

      <div className="auto-card mt-3 overflow-hidden">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
        ) : visibleList.length > 0 ? (
          <>
            {tab === 'operations'
              ? (visibleList as OperationRecord[]).map((record) => (
                  <OperationRow key={record.id} record={record} />
                ))
              : (visibleList as InvoiceRecord[]).map((invoice) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} />
                ))}

            {/* Footer: load more / показаны все */}
            <div className="px-4 py-3.5 text-center">
              {remaining > 0 ? (
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_STEP)}
                  className="btn-secondary"
                >
                  Загрузить ещё{' '}
                  <span className="text-text-muted">· {Math.min(remaining, PAGE_STEP)}</span>
                </button>
              ) : (
                <p className="text-caption text-text-muted">
                  Показаны все записи · {activeList.length}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="p-8">
            <EmptyState
              icon={tab === 'operations' ? FaClipboardList : FaFileInvoiceDollar}
              title={tab === 'operations' ? 'Нет операций' : 'Нет счетов'}
              description={
                hasFilter
                  ? tab === 'operations'
                    ? 'Под текущий фильтр операций не нашлось. Попробуйте изменить условия.'
                    : 'Под текущий фильтр счетов не нашлось. Попробуйте изменить условия.'
                  : tab === 'operations'
                    ? 'История сервисных операций появится здесь после первого обслуживания.'
                    : 'Электронные счета от сервисных центров появятся здесь.'
              }
              action={
                hasFilter ? (
                  <button type="button" onClick={resetFilters} className="btn-primary">
                    <FaRedo /> Сбросить фильтр
                  </button>
                ) : undefined
              }
            />
          </div>
        )}
      </div>
    </Page>
  )
}
