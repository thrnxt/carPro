import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FaClipboardList, FaFileInvoiceDollar } from 'react-icons/fa'
import apiClient from '../api/client'
import { normalizeCollectionResponse } from '../utils/normalizeCollectionResponse'

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
  serviceCenter?: {
    id?: number
    name?: string
  }
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

const INVOICE_STATUS_LABELS: Record<InvoiceRecord['status'], string> = {
  CREATED: 'Создан',
  PAID: 'Оплачен',
  CANCELLED: 'Отменен',
}

export default function ClientDocuments() {
  const [selectedCarId, setSelectedCarId] = useState('')

  const { data: cars, isLoading: carsLoading } = useQuery<CarSummary[]>({
    queryKey: ['cars'],
    queryFn: async () => {
      const response = await apiClient.get('/cars')
      return response.data
    },
  })

  const { data: operations, isLoading: operationsLoading } = useQuery<OperationRecord[]>({
    queryKey: ['client-operations', (cars || []).map((car) => car.id).join(',')],
    queryFn: async () => {
      if (!cars || cars.length === 0) {
        return []
      }

      const allRecords = await Promise.all(
        cars.map(async (car) => {
          const response = await apiClient.get(`/maintenance-records/car/${car.id}`)
          const records = normalizeCollectionResponse<Omit<OperationRecord, 'car'>>(response.data)
          return records.map((record) => ({
            ...record,
            car,
          }))
        })
      )

      return allRecords
        .flat()
        .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())
    },
    enabled: !!cars,
  })

  const { data: invoices, isLoading: invoicesLoading } = useQuery<InvoiceRecord[]>({
    queryKey: ['invoices', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/invoices/my')
      return response.data
    },
  })

  const filteredOperations = useMemo(() => {
    if (!selectedCarId) {
      return operations || []
    }
    return (operations || []).filter((record) => String(record.car.id) === selectedCarId)
  }, [operations, selectedCarId])

  const filteredInvoices = useMemo(() => {
    if (!selectedCarId) {
      return invoices || []
    }
    return (invoices || []).filter((invoice) => String(invoice.carId) === selectedCarId)
  }, [invoices, selectedCarId])

  if (carsLoading || operationsLoading || invoicesLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <p className="mt-2 text-slate-400">Загрузка данных...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Операции и счета</h1>
        <p className="text-slate-400">Просмотр операций и электронных счетов по вашим автомобилям</p>
      </div>

      <div className="auto-card p-6">
        <label className="block text-sm text-slate-300 mb-2">Фильтр по автомобилю</label>
        <select
          value={selectedCarId}
          onChange={(event) => setSelectedCarId(event.target.value)}
          className="auto-select"
        >
          <option value="">Все автомобили</option>
          {(cars || []).map((car) => (
            <option key={car.id} value={car.id}>
              {car.brand} {car.model}
              {car.licensePlate ? ` (${car.licensePlate})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="auto-card p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <FaClipboardList className="text-red-500" />
          Сервисные операции
        </h2>

        {filteredOperations.length === 0 ? (
          <p className="text-slate-400">Операции не найдены</p>
        ) : (
          <div className="space-y-4">
            {filteredOperations.map((record) => (
              <div key={record.id} className="border border-slate-700 rounded-lg p-4 bg-slate-900/40">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <p className="text-white font-semibold text-lg">{record.workType}</p>
                    <p className="text-slate-300 text-sm mt-1">
                      Авто: {record.car.brand} {record.car.model}
                      {record.car.licensePlate ? ` (${record.car.licensePlate})` : ''}
                    </p>
                    <p className="text-slate-400 text-sm">Дата: {record.serviceDate}</p>
                    <p className="text-slate-400 text-sm">
                      Пробег: {record.mileageAtService?.toLocaleString('ru-RU')} км
                    </p>
                    <p className="text-slate-300 text-sm">
                      Сервис: {record.serviceCenter?.name || 'Не указан'}
                    </p>
                    {record.description && <p className="text-slate-300 mt-1">{record.description}</p>}
                  </div>

                  {record.cost != null && (
                    <p className="text-emerald-400 font-semibold">
                      {record.cost.toLocaleString('ru-RU')} ₸
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="auto-card p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <FaFileInvoiceDollar className="text-red-500" />
          Электронные счета
        </h2>

        {filteredInvoices.length === 0 ? (
          <p className="text-slate-400">Счета не найдены</p>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="border border-slate-700 rounded-lg p-4 bg-slate-900/40">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {invoice.invoiceNumber} ({invoice.issueDate})
                    </p>
                    <p className="text-slate-300 text-sm mt-1">
                      Авто: {invoice.carTitle || 'Не указано'}
                    </p>
                    <p className="text-slate-300 text-sm">
                      Сервис: {invoice.serviceCenterName || 'Не указан'}
                    </p>
                    {invoice.notes && <p className="text-slate-300 mt-1">{invoice.notes}</p>}
                  </div>

                  <div className="text-right">
                    <p className="text-emerald-400 font-semibold">
                      {invoice.totalAmount.toLocaleString('ru-RU')} {invoice.currency}
                    </p>
                    <span className="auto-badge auto-badge-info">{INVOICE_STATUS_LABELS[invoice.status]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
