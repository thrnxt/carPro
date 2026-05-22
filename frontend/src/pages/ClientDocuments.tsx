import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FaClipboardList, FaFileInvoiceDollar, FaCar } from 'react-icons/fa'
import apiClient from '../api/client'
import { normalizeCollectionResponse } from '../utils/normalizeCollectionResponse'
import {
  Badge,
  EmptyState,
  FilterBar,
  Page,
  PageHeader,
  SegmentedControl,
  Skeleton,
} from '../components/ui'
import { invoiceStatusMeta } from '../utils/statusMeta'

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
  cost?: number
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

function RowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-0">
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-4 w-20 shrink-0" />
    </div>
  )
}

function OperationRow({ record }: { record: OperationRecord }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-4 border-b border-border px-4 py-3 last:border-0 hover:bg-surface-3 transition-colors">
      <div className="min-w-0">
        <p className="truncate text-body font-medium text-text-primary">{record.workType}</p>
        <p className="mt-0.5 text-caption text-text-muted">
          {new Date(record.serviceDate).toLocaleDateString('ru-RU')}
          {' · '}
          {record.car.brand} {record.car.model}
          {record.car.licensePlate ? ` (${record.car.licensePlate})` : ''}
          {record.serviceCenter?.name ? ` · ${record.serviceCenter.name}` : ''}
        </p>
        {record.description && (
          <p className="mt-1 truncate text-caption text-text-secondary">{record.description}</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        {record.cost != null ? (
          <p className="text-body font-semibold text-success">
            {record.cost.toLocaleString('ru-RU')} ₸
          </p>
        ) : (
          <p className="text-caption text-text-muted">—</p>
        )}
      </div>
    </div>
  )
}

function InvoiceRow({ invoice }: { invoice: InvoiceRecord }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-4 border-b border-border px-4 py-3 last:border-0 hover:bg-surface-3 transition-colors">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-body font-medium text-text-primary">{invoice.invoiceNumber}</p>
          <Badge tone={invoiceStatusMeta(invoice.status).tone}>
            {invoiceStatusMeta(invoice.status).label}
          </Badge>
        </div>
        <p className="mt-0.5 text-caption text-text-muted">
          {new Date(invoice.issueDate).toLocaleDateString('ru-RU')}
          {invoice.carTitle ? ` · ${invoice.carTitle}` : ''}
          {invoice.serviceCenterName ? ` · ${invoice.serviceCenterName}` : ''}
        </p>
        {invoice.notes && (
          <p className="mt-1 truncate text-caption text-text-secondary">{invoice.notes}</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-body font-semibold text-success">
          {invoice.totalAmount.toLocaleString('ru-RU')} {invoice.currency}
        </p>
        {invoice.taxAmount != null && (
          <p className="text-caption text-text-muted">
            НДС: {invoice.taxAmount.toLocaleString('ru-RU')}
          </p>
        )}
      </div>
    </div>
  )
}

export default function ClientDocuments() {
  const [selectedCarId, setSelectedCarId] = useState('')
  const [tab, setTab] = useState<Tab>('operations')

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
      return all.flat().sort(
        (a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()
      )
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

  const filteredOperations = useMemo(
    () =>
      selectedCarId
        ? operations.filter((r) => String(r.car.id) === selectedCarId)
        : operations,
    [operations, selectedCarId]
  )

  const filteredInvoices = useMemo(
    () =>
      selectedCarId
        ? invoices.filter((inv) => String(inv.carId) === selectedCarId)
        : invoices,
    [invoices, selectedCarId]
  )

  const unpaidTotal = useMemo(
    () =>
      filteredInvoices
        .filter((inv) => inv.status === 'CREATED')
        .reduce((sum, inv) => sum + inv.totalAmount, 0),
    [filteredInvoices]
  )

  const isLoading = carsLoading || operationsLoading || invoicesLoading

  const tabOptions: Array<{ value: Tab; label: string }> = [
    {
      value: 'operations',
      label: isLoading ? 'Операции' : `Операции · ${filteredOperations.length}`,
    },
    {
      value: 'invoices',
      label: isLoading
        ? 'Счета'
        : `Счета · ${filteredInvoices.length}${unpaidTotal > 0 ? ' · к оплате' : ''}`,
    },
  ]

  return (
    <Page>
      <PageHeader
        eyebrow="Документы"
        title="Операции и счета"
        description={
          !isLoading && unpaidTotal > 0
            ? `К оплате: ${unpaidTotal.toLocaleString('ru-RU')} ₸`
            : 'История обслуживания и электронные счета по вашим автомобилям'
        }
      />

      <FilterBar className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={tabOptions}
        />

        {cars.length > 0 && (
          <div className="flex items-center gap-2">
            <FaCar className="shrink-0 text-text-muted" />
            <select
              value={selectedCarId}
              onChange={(e) => setSelectedCarId(e.target.value)}
              className="auto-select"
            >
              <option value="">Все автомобили</option>
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.brand} {car.model}
                  {car.licensePlate ? ` (${car.licensePlate})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </FilterBar>

      <div className="auto-card overflow-hidden">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
        ) : tab === 'operations' ? (
          filteredOperations.length > 0 ? (
            filteredOperations.map((record) => (
              <OperationRow key={record.id} record={record} />
            ))
          ) : (
            <div className="p-8">
              <EmptyState
                icon={FaClipboardList}
                title="Нет операций"
                description={
                  selectedCarId
                    ? 'По выбранному автомобилю операций не найдено'
                    : 'История сервисных операций появится здесь после первого обслуживания'
                }
              />
            </div>
          )
        ) : filteredInvoices.length > 0 ? (
          filteredInvoices.map((invoice) => (
            <InvoiceRow key={invoice.id} invoice={invoice} />
          ))
        ) : (
          <div className="p-8">
            <EmptyState
              icon={FaFileInvoiceDollar}
              title="Нет счетов"
              description={
                selectedCarId
                  ? 'По выбранному автомобилю счетов не найдено'
                  : 'Электронные счета от сервисных центров появятся здесь'
              }
            />
          </div>
        )}
      </div>
    </Page>
  )
}
