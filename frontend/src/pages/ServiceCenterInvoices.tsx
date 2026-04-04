import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FaFileInvoiceDollar, FaPlus, FaReceipt } from 'react-icons/fa'
import apiClient from '../api/client'

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

export default function ServiceCenterInvoices() {
  const queryClient = useQueryClient()
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

  const { data: operations } = useQuery<MaintenanceOperationOption[]>({
    queryKey: ['service-center-operations', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/maintenance-records/service-center/my')
      return response.data
    },
  })

  const { data: clients } = useQuery<ServiceCenterClient[]>({
    queryKey: ['service-center-clients', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/service-center-clients/my')
      return response.data
    },
  })

  const selectedClientId = formData.clientId ? Number(formData.clientId) : null

  const { data: clientCars } = useQuery<CarSummary[]>({
    queryKey: ['service-center-client-cars', selectedClientId],
    queryFn: async () => {
      const response = await apiClient.get(`/service-center-clients/${selectedClientId}/cars`)
      return response.data
    },
    enabled: !!selectedClientId,
  })

  const { data: invoices, isLoading } = useQuery<InvoiceResponse[]>({
    queryKey: ['service-center-invoices', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/invoices/service-center/my')
      return response.data
    },
  })

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
    const invoicedOperationIds = new Set((invoices || []).map((invoice) => invoice.maintenanceRecordId))
    return (operations || []).filter((operation) => !invoicedOperationIds.has(operation.id))
  }, [invoices, operations])

  const sortedInvoices = useMemo(
    () =>
      (invoices || [])
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [invoices]
  )

  const addItem = () => {
    setItems((prev) => [...prev, { name: '', description: '', quantity: '1', unitPrice: '' }])
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, rowIndex) => rowIndex !== index))
  }

  const updateItem = (index: number, field: keyof InvoiceItemForm, value: string) => {
    setItems((prev) =>
      prev.map((item, rowIndex) => (rowIndex === index ? { ...item, [field]: value } : item))
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
      (item) => item.name.trim() && (!item.quantity || !item.unitPrice || Number(item.quantity) <= 0)
    )
    if (invalidItem) {
      toast.error('Проверьте позиции счета: количество и цена должны быть больше 0')
      return
    }

    createInvoiceMutation.mutate()
  }

  const parseItems = (itemsJson?: string) => {
    if (!itemsJson) {
      return [] as Array<{ name?: string; quantity?: number; unitPrice?: number }>
    }

    try {
      const parsed = JSON.parse(itemsJson)
      return Array.isArray(parsed) ? parsed : []
    } catch (_error) {
      return []
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <p className="mt-2 text-slate-400">Загрузка счетов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Счета</h1>
        <p className="text-slate-400">Создание и управление электронными счетами</p>
      </div>

      <form onSubmit={handleSubmit} className="auto-card p-6 space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FaPlus className="text-red-500" />
          Создать счет
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-300 mb-2">Операция (опционально)</label>
            <select
              value={formData.maintenanceRecordId}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, maintenanceRecordId: event.target.value }))
              }
              className="auto-select"
            >
              <option value="">Без привязки к операции</option>
              {availableOperations.map((operation) => (
                <option key={operation.id} value={operation.id}>
                  #{operation.id} - {operation.workType} - {operation.serviceDate}
                </option>
              ))}
            </select>
            <p className="text-slate-400 text-xs mt-2">
              Если операция не создана, можно выставить счет вручную по клиенту и авто.
            </p>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Клиент (для ручного счета)</label>
            <select
              value={formData.clientId}
              onChange={(event) => setFormData((prev) => ({ ...prev, clientId: event.target.value, carId: '' }))}
              className="auto-select"
              disabled={!!formData.maintenanceRecordId}
            >
              <option value="">Выберите клиента</option>
              {(clients || []).map((client) => (
                <option key={client.clientId} value={client.clientId}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Автомобиль (для ручного счета)</label>
            <select
              value={formData.carId}
              onChange={(event) => setFormData((prev) => ({ ...prev, carId: event.target.value }))}
              className="auto-select"
              disabled={!!formData.maintenanceRecordId || !formData.clientId}
            >
              <option value="">Выберите автомобиль</option>
              {(clientCars || []).map((car) => (
                <option key={car.id} value={car.id}>
                  {car.brand} {car.model}
                  {car.licensePlate ? ` (${car.licensePlate})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Сумма *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(event) => setFormData((prev) => ({ ...prev, amount: event.target.value }))}
              className="auto-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Налог</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.taxAmount}
              onChange={(event) => setFormData((prev) => ({ ...prev, taxAmount: event.target.value }))}
              className="auto-input"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Валюта</label>
            <input
              value={formData.currency}
              onChange={(event) => setFormData((prev) => ({ ...prev, currency: event.target.value }))}
              className="auto-input"
              placeholder="KZT"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Примечание</label>
            <input
              value={formData.notes}
              onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
              className="auto-input"
              placeholder="Комментарий к счету"
            />
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg text-white font-semibold">Позиции счета</h3>
            <button type="button" onClick={addItem} className="auto-button-secondary text-sm">
              <FaPlus className="inline mr-1" />
              Добавить позицию
            </button>
          </div>

          {items.map((item, index) => (
            <div key={`invoice-item-${index}`} className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
                className="auto-button-danger text-sm"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
              >
                Удалить
              </button>
            </div>
          ))}
        </div>

        <button type="submit" disabled={createInvoiceMutation.isPending} className="auto-button-primary">
          {createInvoiceMutation.isPending ? 'Создание...' : 'Создать счет'}
        </button>
      </form>

      <div className="auto-card p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <FaFileInvoiceDollar className="text-red-500" />
          Список счетов
        </h2>

        {sortedInvoices.length === 0 ? (
          <p className="text-slate-400">Счетов пока нет</p>
        ) : (
          <div className="space-y-4">
            {sortedInvoices.map((invoice) => {
              const parsedItems = parseItems(invoice.items)
              return (
                <div key={invoice.id} className="border border-slate-700 rounded-lg p-4 bg-slate-900/40">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                    <div>
                      <p className="text-white text-lg font-semibold">
                        {invoice.invoiceNumber} ({invoice.issueDate})
                      </p>
                      <p className="text-slate-300">Клиент: {invoice.clientName || '—'}</p>
                      <p className="text-slate-300">Авто: {invoice.carTitle || '—'}</p>
                      <p className="text-emerald-400 font-semibold mt-1">
                        {invoice.totalAmount.toLocaleString('ru-RU')} {invoice.currency}
                      </p>
                      {invoice.taxAmount != null && (
                        <p className="text-slate-400 text-sm">
                          Налог: {invoice.taxAmount.toLocaleString('ru-RU')} {invoice.currency}
                        </p>
                      )}
                      {invoice.notes && <p className="text-slate-300 mt-1">{invoice.notes}</p>}
                    </div>

                    <div className="space-y-2">
                      <span className={STATUS_BADGE_CLASSES[invoice.status] || 'auto-badge'}>
                        {STATUS_LABELS[invoice.status]}
                      </span>
                      {invoice.status === 'CREATED' && (
                        <div className="flex gap-2">
                          <button
                            className="auto-button-success text-sm"
                            onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'PAID' })}
                          >
                            Оплачен
                          </button>
                          <button
                            className="auto-button-danger text-sm"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: invoice.id, status: 'CANCELLED' })
                            }
                          >
                            Отменить
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {parsedItems.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <p className="text-slate-300 font-medium flex items-center gap-2 mb-2">
                        <FaReceipt className="text-red-400" />
                        Позиции
                      </p>
                      <div className="space-y-1 text-sm text-slate-300">
                        {parsedItems.map((item, index) => (
                          <p key={`invoice-${invoice.id}-item-${index}`}>
                            {item.name} x{item.quantity} - {item.unitPrice} {invoice.currency}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
