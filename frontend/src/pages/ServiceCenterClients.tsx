import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import { FaCar, FaClipboardList, FaUsers } from 'react-icons/fa'

interface ServiceCenterClient {
  clientId: number
  firstName: string
  lastName: string
  email?: string
  phoneNumber?: string
  status: 'NEW' | 'REGULAR' | 'VIP' | 'BLOCKED'
  totalVisits: number
  lastServiceDate?: string
  carsCount: number
}

interface CarSummary {
  id: number
  brand: string
  model: string
  year: number
  licensePlate?: string
  mileage?: number
}

interface MaintenanceOperation {
  id: number
  serviceDate: string
  workType: string
  mileageAtService: number
  cost?: number
  description?: string
}

const STATUS_OPTIONS: Array<{ value: ServiceCenterClient['status']; label: string }> = [
  { value: 'NEW', label: 'Новый клиент' },
  { value: 'REGULAR', label: 'Постоянный клиент' },
  { value: 'VIP', label: 'VIP' },
  { value: 'BLOCKED', label: 'Заблокирован' },
]

export default function ServiceCenterClients() {
  const queryClient = useQueryClient()
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null)

  const { data: clients, isLoading } = useQuery<ServiceCenterClient[]>({
    queryKey: ['service-center-clients', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/service-center-clients/my')
      return response.data
    },
  })

  const { data: clientCars } = useQuery<CarSummary[]>({
    queryKey: ['service-center-client-cars', selectedClientId],
    queryFn: async () => {
      const response = await apiClient.get(`/service-center-clients/${selectedClientId}/cars`)
      return response.data
    },
    enabled: !!selectedClientId,
  })

  const { data: operations } = useQuery<MaintenanceOperation[]>({
    queryKey: ['service-center-client-car-operations', selectedClientId, selectedCarId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/service-center-clients/${selectedClientId}/cars/${selectedCarId}/operations`
      )
      return response.data
    },
    enabled: !!selectedClientId && !!selectedCarId,
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ clientId, status }: { clientId: number; status: ServiceCenterClient['status'] }) => {
      const response = await apiClient.patch(`/service-center-clients/${clientId}/status`, null, {
        params: { status },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-center-clients', 'my'] })
      toast.success('Статус клиента обновлен')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Не удалось обновить статус')
    },
  })

  const sortedClients = useMemo(
    () => (clients || []).slice().sort((a, b) => b.totalVisits - a.totalVisits),
    [clients]
  )

  const toggleClientDetails = (clientId: number) => {
    if (selectedClientId === clientId) {
      setSelectedClientId(null)
      setSelectedCarId(null)
      return
    }

    setSelectedClientId(clientId)
    setSelectedCarId(null)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <p className="mt-2 text-slate-400">Загрузка клиентов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Клиенты</h1>
        <p className="text-slate-400">Клиенты, автомобили и история операций вашего сервиса</p>
      </div>

      {sortedClients.length === 0 ? (
        <div className="auto-card p-10 text-center">
          <FaUsers className="text-6xl text-red-500 mx-auto mb-4 opacity-50" />
          <p className="text-slate-300 text-lg">Пока нет клиентов или записей в сервис</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedClients.map((client) => (
            <div key={client.clientId} className="auto-card p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {client.firstName} {client.lastName}
                  </h3>
                  <div className="text-sm text-slate-300 mt-2 space-y-1">
                    <p>Email: {client.email || 'Не указан'}</p>
                    <p>Телефон: {client.phoneNumber || 'Не указан'}</p>
                    <p>Визитов: {client.totalVisits}</p>
                    <p>Автомобилей: {client.carsCount}</p>
                    <p>
                      Последний визит:{' '}
                      {client.lastServiceDate ? new Date(client.lastServiceDate).toLocaleDateString('ru-RU') : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={client.status}
                    onChange={(event) =>
                      updateStatusMutation.mutate({
                        clientId: client.clientId,
                        status: event.target.value as ServiceCenterClient['status'],
                      })
                    }
                    className="auto-select"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>

                  <button
                    className="auto-button-secondary text-sm"
                    onClick={() => toggleClientDetails(client.clientId)}
                  >
                    {selectedClientId === client.clientId ? 'Скрыть детали' : 'Авто и операции'}
                  </button>
                </div>
              </div>

              {selectedClientId === client.clientId && (
                <div className="mt-5 pt-5 border-t border-slate-700 space-y-4">
                  <div>
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <FaCar className="text-red-500" />
                      Автомобили клиента
                    </h4>

                    {!clientCars || clientCars.length === 0 ? (
                      <p className="text-slate-400 text-sm">Нет автомобилей с историей в этом сервисе</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {clientCars.map((car) => (
                          <button
                            key={car.id}
                            className={`text-left border rounded-lg p-3 transition-colors ${
                              selectedCarId === car.id
                                ? 'border-red-500 bg-red-900/20'
                                : 'border-slate-700 bg-slate-900/30 hover:border-slate-500'
                            }`}
                            onClick={() => setSelectedCarId((prev) => (prev === car.id ? null : car.id))}
                          >
                            <p className="text-white font-medium">
                              {car.brand} {car.model} {car.licensePlate ? `(${car.licensePlate})` : ''}
                            </p>
                            <p className="text-slate-400 text-sm">
                              {car.year} год, пробег {car.mileage?.toLocaleString('ru-RU') || 0} км
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedCarId && (
                    <div>
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <FaClipboardList className="text-red-500" />
                        История операций по выбранному авто
                      </h4>

                      {!operations || operations.length === 0 ? (
                        <p className="text-slate-400 text-sm">Операции не найдены</p>
                      ) : (
                        <div className="space-y-2">
                          {operations.map((operation) => (
                            <div
                              key={operation.id}
                              className="border border-slate-700 rounded-lg p-3 bg-slate-900/30"
                            >
                              <p className="text-white font-medium">{operation.workType}</p>
                              <p className="text-slate-400 text-sm">
                                Дата: {operation.serviceDate}, пробег: {operation.mileageAtService?.toLocaleString('ru-RU')} км
                              </p>
                              {operation.cost != null && (
                                <p className="text-emerald-400 text-sm">
                                  Сумма: {operation.cost.toLocaleString('ru-RU')} ₸
                                </p>
                              )}
                              {operation.description && (
                                <p className="text-slate-300 text-sm mt-1">{operation.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
