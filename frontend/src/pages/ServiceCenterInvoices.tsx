import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FaCheck,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaFileInvoiceDollar,
  FaPlus,
  FaReceipt,
  FaTimes,
} from 'react-icons/fa'
import apiClient from '../api/client'
import { Badge, EmptyState, Page, PageHeader, Section } from '../components/ui'

interface MaintenanceOperationOption {
  id: number
  serviceDate: string
  workType: string
  cost?: number
  car?: {
    id: number
    brand?: string
    model?: string
    licensePlate?: string
    owner?: {
      id?: number
      firstName?: string
      lastName?: string
    }
  }
}

interface ServiceCenterClient {
  clientId: number
  firstName: string
  lastName: string
}

interface CarSummary {
  id: number
  brand: string
  model: string
  year: number
  licensePlate?: string
  mileage?: number
}

interface InvoiceResponse {
  id: number
  invoiceNumber: string
  issueDate: string
  totalAmount: number
  taxAmount?: number
  currency: string
  status: 'CREATED' | 'PAID' | 'CANCELLED'
  notes?: string
  items?: string
  maintenanceRecordId?: number
  carId?: number
  carTitle?: string
  clientName?: string
  createdAt: string
}

interface InvoiceItemForm {
  name: string
  description: string
  quantity: string
  unitPrice: string
}

type InvoiceStatusFilter = 'ALL' | InvoiceResponse['status']

const STATUS_LABELS: Record<InvoiceResponse['status'], string> = {
  CREATED: 'Создан',
  PAID: 'Оплачен',
  CANCELLED: 'Отменен',
}

const STATUS_BADGE_CLASSES: Record<InvoiceResponse['status'], string> = {
  CREATED: 'auto-badge-warning',
  PAID: 'auto-badge-success',
  CANCELLED: 'auto-badge-danger',
}

const STATUS_FILTER_OPTIONS: Array<{ value: InvoiceStatusFilter; label: string }> = [
  { value: 'ALL', label: 'Все статусы' },
  { value: 'CREATED', label: 'Созданы' },
  { value: 'PAID', label: 'Оплачены' },
  { value: 'CANCELLED', label: 'Отменены' },
]

const PAGE_SIZE_OPTIONS = [8, 12, 20]

function formatDate(value?: string) {
  if (!value) {
    return '—'
  }

  try {
    return new Date(value).toLocaleDateString('ru-RU')
  } catch {
    return value
  }
}

function formatMoney(value: number, currency = 'KZT') {
  const currencyLabel = currency === 'KZT' ? '₸' : currency
  return `${value.toLocaleString('ru-RU')}\u00A0${currencyLabel}`
}

function parseItems(itemsJson?: string) {
  if (!itemsJson) {
    return [] as Array<{
      name?: string
      description?: string | null
      quantity?: number
      unitPrice?: number
    }>
  }

  try {
    const parsed = JSON.parse(itemsJson)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getOperationOptionLabel(operation: MaintenanceOperationOption) {
  const carTitle = `${operation.car?.brand || ''} ${operation.car?.model || ''}`.trim()
  return `#${operation.id} • ${operation.workType} • ${formatDate(operation.serviceDate)}${carTitle ? ` • ${carTitle}` : ''}`
}

export default function ServiceCenterInvoices() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('ALL')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    maintenanceRecordId: '',
    clientId: '',
    carId: '',
    amount: '',
    taxAmount: '',
    currency: 'KZT',
    notes: '',
  })
  const [items, setItems] = useState<InvoiceItemForm[]>([
    { name: '', description: '', quantity: '1', unitPrice: '' },
  ])

  const { data: operations = [] } = useQuery<MaintenanceOperationOption[]>({
    queryKey: ['service-center-operations', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/maintenance-records/service-center/my')
      return response.data
    },
  })

  const { data: clients = [] } = useQuery<ServiceCenterClient[]>({
    queryKey: ['service-center-clients', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/service-center-clients/my')
      return response.data
    },
  })

  const selectedClientId = formData.clientId ? Number(formData.clientId) : null

  const { data: clientCars = [] } = useQuery<CarSummary[]>({
    queryKey: ['service-center-client-cars', selectedClientId],
    queryFn: async () => {
      const response = await apiClient.get(`/service-center-clients/${selectedClientId}/cars`)
      return response.data
    },
    enabled: !!selectedClientId,
  })

  const { data: invoices = [], isLoading } = useQuery<InvoiceResponse[]>({
    queryKey: ['service-center-invoices', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/invoices/service-center/my')
      return response.data
    },
  })

  const resetCreateState = () => {
    setFormData({
      maintenanceRecordId: '',
      clientId: '',
      carId: '',
      amount: '',
      taxAmount: '',
      currency: 'KZT',
      notes: '',
    })
    setItems([{ name: '', description: '', quantity: '1', unitPrice: '' }])
  }

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        maintenanceRecordId: formData.maintenanceRecordId ? Number(formData.maintenanceRecordId) : null,
        clientId: formData.clientId ? Number(formData.clientId) : null,
        carId: formData.carId ? Number(formData.carId) : null,
        amount: Number(formData.amount),
        taxAmount: formData.taxAmount ? Number(formData.taxAmount) : null,
        currency: formData.currency || 'KZT',
        notes: formData.notes || null,
        items: items
          .filter((item) => item.name.trim())
          .map((item) => ({
            name: item.name,
            description: item.description || null,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          })),
      }
      const response = await apiClient.post('/invoices/service-center', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-center-invoices', 'my'] })
      toast.success('Счет создан')
      resetCreateState()
      setIsCreateOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Не удалось создать счет')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: InvoiceResponse['status'] }) => {
      const response = await apiClient.patch(`/invoices/service-center/${id}/status`, null, {
        params: { status },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-center-invoices', 'my'] })
      toast.success('Статус счета обновлен')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Не удалось обновить статус')
    },
  })

  const availableOperations = useMemo(() => {
    const invoicedOperationIds = new Set(invoices.map((invoice) => invoice.maintenanceRecordId))
    return operations.filter((operation) => !invoicedOperationIds.has(operation.id))
  }, [invoices, operations])

  const sortedInvoices = useMemo(
    () =>
      invoices
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [invoices]
  )

  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'ALL') {
      return sortedInvoices
    }

    return sortedInvoices.filter((invoice) => invoice.status === statusFilter)
  }, [sortedInvoices, statusFilter])

  const totalInvoices = filteredInvoices.length
  const totalPages = Math.max(Math.ceil(totalInvoices / pageSize), 1)
  const currentPage = Math.min(page, totalPages - 1)
  const pageStartIndex = currentPage * pageSize
  const paginatedInvoices = filteredInvoices.slice(pageStartIndex, pageStartIndex + pageSize)
  const pageStart = totalInvoices > 0 ? pageStartIndex + 1 : 0
  const pageEnd = totalInvoices > 0 ? pageStartIndex + paginatedInvoices.length : 0

  const addItem = () => {
    setItems((currentValue) => [
      ...currentValue,
      { name: '', description: '', quantity: '1', unitPrice: '' },
    ])
  }

  const removeItem = (index: number) => {
    setItems((currentValue) => currentValue.filter((_, rowIndex) => rowIndex !== index))
  }

  const updateItem = (index: number, field: keyof InvoiceItemForm, value: string) => {
    setItems((currentValue) =>
      currentValue.map((item, rowIndex) =>
        rowIndex === index ? { ...item, [field]: value } : item
      )
    )
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.amount) {
      toast.error('Укажите сумму счета')
      return
    }

    if (!formData.maintenanceRecordId && (!formData.clientId || !formData.carId)) {
      toast.error('Выберите операцию или выберите клиента и автомобиль')
      return
    }

    const invalidItem = items.find(
      (item) =>
        item.name.trim() && (!item.quantity || !item.unitPrice || Number(item.quantity) <= 0)
    )

    if (invalidItem) {
      toast.error('Проверьте позиции счета: количество и цена должны быть больше 0')
      return
    }

    createInvoiceMutation.mutate()
  }

  if (isLoading) {
    return (
      <Page>
        <div className="p-10 text-center">
          <div className="inline-block h-9 w-9 animate-spin rounded-full border-b-2 border-[#ff9b82]"></div>
          <p className="mt-3 text-sm text-slate-400">Загрузка счетов...</p>
        </div>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Service invoices"
        title="Счета"
        actions={
          <button
            type="button"
            onClick={() => setIsCreateOpen((currentValue) => !currentValue)}
            className={isCreateOpen ? 'auto-button-secondary' : 'auto-button-primary'}
          >
            {isCreateOpen ? <FaChevronUp /> : <FaPlus />}
            {isCreateOpen ? 'Скрыть форму' : 'Создать счет'}
          </button>
        }
      />

      {isCreateOpen && (
        <Section title="Новый счет" className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-slate-300">Операция</label>
                <select
                  value={formData.maintenanceRecordId}
                  onChange={(event) =>
                    setFormData((currentValue) => ({
                      ...currentValue,
                      maintenanceRecordId: event.target.value,
                      ...(event.target.value ? { clientId: '', carId: '' } : {}),
                    }))
                  }
                  className="auto-select"
                >
                  <option value="">Без привязки к операции</option>
                  {availableOperations.map((operation) => (
                    <option key={operation.id} value={operation.id}>
                      {getOperationOptionLabel(operation)}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500">
                  Если операция еще не создана, счет можно выставить вручную по клиенту и автомобилю.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Клиент</label>
                <select
                  value={formData.clientId}
                  onChange={(event) =>
                    setFormData((currentValue) => ({
                      ...currentValue,
                      clientId: event.target.value,
                      carId: '',
                    }))
                  }
                  className="auto-select"
                  disabled={!!formData.maintenanceRecordId}
                >
                  <option value="">Выберите клиента</option>
                  {clients.map((client) => (
                    <option key={client.clientId} value={client.clientId}>
                      {client.firstName} {client.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Автомобиль</label>
                <select
                  value={formData.carId}
                  onChange={(event) =>
                    setFormData((currentValue) => ({ ...currentValue, carId: event.target.value }))
                  }
                  className="auto-select"
                  disabled={!!formData.maintenanceRecordId || !formData.clientId}
                >
                  <option value="">Выберите автомобиль</option>
                  {clientCars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.brand} {car.model}
                      {car.licensePlate ? ` (${car.licensePlate})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Сумма</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(event) =>
                    setFormData((currentValue) => ({ ...currentValue, amount: event.target.value }))
                  }
                  className="auto-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Налог</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.taxAmount}
                  onChange={(event) =>
                    setFormData((currentValue) => ({
                      ...currentValue,
                      taxAmount: event.target.value,
                    }))
                  }
                  className="auto-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Валюта</label>
                <input
                  value={formData.currency}
                  onChange={(event) =>
                    setFormData((currentValue) => ({ ...currentValue, currency: event.target.value }))
                  }
                  className="auto-input"
                  placeholder="KZT"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-slate-300">Примечание</label>
                <input
                  value={formData.notes}
                  onChange={(event) =>
                    setFormData((currentValue) => ({ ...currentValue, notes: event.target.value }))
                  }
                  className="auto-input"
                  placeholder="Комментарий к счету"
                />
              </div>
            </div>

            <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">Позиции счета</h3>
                <button type="button" onClick={addItem} className="auto-button-secondary px-3 py-2 text-sm">
                  <FaPlus />
                  Добавить позицию
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {items.map((item, index) => (
                  <div
                    key={`invoice-item-${index}`}
                    className="grid gap-3 rounded-[1rem] border border-white/10 bg-slate-950/25 p-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_7rem_9rem_auto]"
                  >
                    <input
                      value={item.name}
                      onChange={(event) => updateItem(index, 'name', event.target.value)}
                      className="auto-input"
                      placeholder="Название"
                    />
                    <input
                      value={item.description}
                      onChange={(event) => updateItem(index, 'description', event.target.value)}
                      className="auto-input"
                      placeholder="Описание"
                    />
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                      className="auto-input"
                      placeholder="Кол-во"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(event) => updateItem(index, 'unitPrice', event.target.value)}
                      className="auto-input"
                      placeholder="Цена"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="auto-button-danger px-3 py-2 text-sm"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={createInvoiceMutation.isPending}
                className="auto-button-primary"
              >
                {createInvoiceMutation.isPending ? 'Создание...' : 'Создать счет'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false)
                }}
                className="auto-button-secondary"
              >
                Закрыть
              </button>
            </div>
          </form>
        </Section>
      )}

      <Section
        title="Реестр счетов"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="auto-badge-info">{totalInvoices} счетов</Badge>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Статус</span>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as InvoiceStatusFilter)
                  setPage(0)
                  setExpandedInvoiceId(null)
                }}
                className="auto-select min-w-[12rem] py-2"
              >
                {STATUS_FILTER_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>На странице</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value))
                  setPage(0)
                  setExpandedInvoiceId(null)
                }}
                className="auto-select min-w-[5.5rem] py-2"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
      >
        {sortedInvoices.length === 0 ? (
          <EmptyState
            icon={FaFileInvoiceDollar}
            title="Счетов пока нет"
            description="Когда сервис начнет выставлять счета, они появятся в этом реестре."
          />
        ) : filteredInvoices.length === 0 ? (
          <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
            По выбранному статусу счетов нет.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.03]">
            {paginatedInvoices.map((invoice) => {
              const parsedItems = parseItems(invoice.items)
              const isExpanded = expandedInvoiceId === invoice.id
              const hasDetails =
                parsedItems.length > 0 ||
                Boolean(invoice.notes?.trim()) ||
                invoice.taxAmount != null ||
                invoice.maintenanceRecordId != null

              return (
                <article
                  key={invoice.id}
                  className="border-b border-white/10 px-4 py-4 last:border-b-0 sm:px-5"
                >
                  <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[13rem_minmax(0,1.15fr)_11rem_auto] lg:items-center">
                    <div>
                      <p className="text-sm font-semibold text-white">{invoice.invoiceNumber}</p>
                      <p className="mt-1 text-sm text-slate-400">{formatDate(invoice.issueDate)}</p>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {invoice.clientName || 'Клиент не указан'}
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-400">
                        {invoice.carTitle || 'Автомобиль не указан'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-emerald-300">
                        {formatMoney(invoice.totalAmount, invoice.currency)}
                      </p>
                      {invoice.taxAmount != null && (
                        <p className="mt-1 text-xs text-slate-500">
                          Налог {formatMoney(invoice.taxAmount, invoice.currency)}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <span className={STATUS_BADGE_CLASSES[invoice.status]}>
                        {STATUS_LABELS[invoice.status]}
                      </span>

                      {invoice.status === 'CREATED' && (
                        <>
                          <button
                            type="button"
                            onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'PAID' })}
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:border-emerald-400/30 hover:bg-emerald-500/15"
                          >
                            <FaCheck />
                            Оплачен
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: invoice.id, status: 'CANCELLED' })
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 transition-colors hover:border-rose-400/30 hover:bg-rose-500/15"
                          >
                            <FaTimes />
                            Отменить
                          </button>
                        </>
                      )}

                      {hasDetails && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedInvoiceId((currentValue) =>
                              currentValue === invoice.id ? null : invoice.id
                            )
                          }
                          className="auto-button-secondary px-3 py-2 text-sm"
                        >
                          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                          {isExpanded ? 'Скрыть' : 'Детали'}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && hasDetails && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
                        <div className="rounded-[1.2rem] border border-white/10 bg-slate-950/25 p-4">
                          <h4 className="text-sm font-semibold text-white">Информация по счету</h4>
                          <div className="mt-3 space-y-2 text-sm text-slate-400">
                            {invoice.maintenanceRecordId != null && (
                              <p>Операция: #{invoice.maintenanceRecordId}</p>
                            )}
                            <p>Дата выпуска: {formatDate(invoice.issueDate)}</p>
                            <p>Создан: {formatDate(invoice.createdAt)}</p>
                            {invoice.notes?.trim() && <p>Примечание: {invoice.notes}</p>}
                          </div>
                        </div>

                        <div className="rounded-[1.2rem] border border-white/10 bg-slate-950/25 p-4">
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                            <FaReceipt className="text-[#ff9b82]" />
                            Позиции
                          </h4>

                          {parsedItems.length === 0 ? (
                            <p className="mt-3 text-sm text-slate-400">Позиции не добавлены.</p>
                          ) : (
                            <div className="mt-3 space-y-2">
                              {parsedItems.map((item, index) => (
                                <div
                                  key={`invoice-${invoice.id}-item-${index}`}
                                  className="rounded-[1rem] border border-white/10 bg-white/[0.03] px-3 py-2"
                                >
                                  <p className="text-sm font-medium text-white">
                                    {item.name || `Позиция ${index + 1}`}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-400">
                                    {item.quantity || 0} x {formatMoney(item.unitPrice || 0, invoice.currency)}
                                  </p>
                                  {item.description && (
                                    <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {totalInvoices > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span>
                Показаны {pageStart}-{pageEnd} из {totalInvoices}
              </span>
              <span>
                Страница {currentPage + 1} из {totalPages}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setPage((currentValue) => Math.max(currentValue - 1, 0))
                  setExpandedInvoiceId(null)
                }}
                disabled={currentPage === 0}
                className="auto-button-secondary"
              >
                <FaChevronLeft />
                Назад
              </button>
              <button
                type="button"
                onClick={() => {
                  setPage((currentValue) => Math.min(currentValue + 1, totalPages - 1))
                  setExpandedInvoiceId(null)
                }}
                disabled={currentPage >= totalPages - 1}
                className="auto-button-secondary"
              >
                Далее
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </Section>
    </Page>
  )
}
