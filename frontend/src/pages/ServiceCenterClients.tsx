import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FaCar,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaClipboardList,
  FaUsers,
} from 'react-icons/fa'
import apiClient from '../api/client'
import { Badge, EmptyState, Page, PageHeader, Section, cx } from '../components/ui'

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

type ClientStatusFilter = 'ALL' | ServiceCenterClient['status']

const STATUS_OPTIONS: Array<{ value: ServiceCenterClient['status']; label: string }> = [
  { value: 'NEW', label: 'Новый клиент' },
  { value: 'REGULAR', label: 'Постоянный клиент' },
  { value: 'VIP', label: 'VIP' },
  { value: 'BLOCKED', label: 'Заблокирован' },
]

const STATUS_FILTER_OPTIONS: Array<{ value: ClientStatusFilter; label: string }> = [
  { value: 'ALL', label: 'Все статусы' },
  ...STATUS_OPTIONS,
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

function formatMileage(value?: number) {
  return `${value?.toLocaleString('ru-RU') || 0} км`
}

function formatCost(value?: number) {
  return value != null ? `${value.toLocaleString('ru-RU')}\u00A0₸` : '—'
}

function getClientFullName(client: ServiceCenterClient) {
  return `${client.firstName} ${client.lastName}`.trim() || 'Клиент не указан'
}

function getCarTitle(car: CarSummary) {
  const baseTitle = `${car.brand} ${car.model}`.trim()
  return baseTitle ? `${baseTitle}${car.licensePlate ? ` (${car.licensePlate})` : ''}` : 'Автомобиль не указан'
}

function getOperationPreview(value?: string, maxLength = 110) {
  if (!value?.trim()) {
    return 'Без комментария'
  }

  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`
}

export default function ServiceCenterClients() {
  const queryClient = useQueryClient()
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>('ALL')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])

  const { data: clients = [], isLoading } = useQuery<ServiceCenterClient[]>({
    queryKey: ['service-center-clients', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/service-center-clients/my')
      return response.data
    },
  })

  const { data: clientCars = [], isLoading: clientCarsLoading } = useQuery<CarSummary[]>({
    queryKey: ['service-center-client-cars', selectedClientId],
    queryFn: async () => {
      const response = await apiClient.get(`/service-center-clients/${selectedClientId}/cars`)
      return response.data
    },
    enabled: !!selectedClientId,
  })

  const { data: operations = [], isLoading: operationsLoading } = useQuery<MaintenanceOperation[]>({
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
    () => clients.slice().sort((a, b) => b.totalVisits - a.totalVisits),
    [clients]
  )

  const filteredClients = useMemo(() => {
    if (statusFilter === 'ALL') {
      return sortedClients
    }

    return sortedClients.filter((client) => client.status === statusFilter)
  }, [sortedClients, statusFilter])

  const totalClients = filteredClients.length
  const totalPages = Math.max(Math.ceil(totalClients / pageSize), 1)
  const currentPage = Math.min(page, totalPages - 1)
  const pageStartIndex = currentPage * pageSize
  const paginatedClients = filteredClients.slice(pageStartIndex, pageStartIndex + pageSize)
  const pageStart = totalClients > 0 ? pageStartIndex + 1 : 0
  const pageEnd = totalClients > 0 ? pageStartIndex + paginatedClients.length : 0

  const sortedOperations = useMemo(
    () =>
      operations
        .slice()
        .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()),
    [operations]
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

  const resetExpandedState = () => {
    setSelectedClientId(null)
    setSelectedCarId(null)
  }

  if (isLoading) {
    return (
      <Page>
        <div className="p-10 text-center">
          <div className="inline-block h-9 w-9 animate-spin rounded-full border-b-2 border-[#ff9b82]"></div>
          <p className="mt-3 text-sm text-slate-400">Загрузка клиентов...</p>
        </div>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Service clients"
        title="Клиенты"
        description="База клиентов, автомобилей и сервисной истории."
      />

      <Section
        title="Клиентская база"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="auto-badge-info">{totalClients} клиентов</Badge>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Статус</span>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as ClientStatusFilter)
                  setPage(0)
                  resetExpandedState()
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
                  resetExpandedState()
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
        {sortedClients.length === 0 ? (
          <EmptyState
            icon={FaUsers}
            title="Пока нет клиентов"
            description="Когда появятся записи и сервисная история, клиенты начнут собираться в этот реестр."
          />
        ) : filteredClients.length === 0 ? (
          <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
            По выбранному статусу клиентов нет.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.03]">
            {paginatedClients.map((client) => {
              const isExpanded = selectedClientId === client.clientId

              return (
                <article
                  key={client.clientId}
                  className="border-b border-white/10 px-4 py-4 last:border-b-0 sm:px-5"
                >
                  <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_14rem_auto] lg:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {getClientFullName(client)}
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-400">
                        {client.email || 'Email не указан'}
                      </p>
                    </div>

                    <div className="grid gap-1 text-sm text-slate-400 sm:grid-cols-2 lg:block lg:space-y-1">
                      <p>Телефон: {client.phoneNumber || 'Не указан'}</p>
                      <p>Визитов: {client.totalVisits}</p>
                      <p>Автомобилей: {client.carsCount}</p>
                      <p>Последний визит: {formatDate(client.lastServiceDate)}</p>
                    </div>

                    <div className="lg:justify-self-end">
                      <select
                        value={client.status}
                        onChange={(event) =>
                          updateStatusMutation.mutate({
                            clientId: client.clientId,
                            status: event.target.value as ServiceCenterClient['status'],
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="auto-select min-w-[12rem] py-2 text-sm"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <button
                        type="button"
                        className="auto-button-secondary px-3 py-2 text-sm"
                        onClick={() => toggleClientDetails(client.clientId)}
                      >
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                        {isExpanded ? 'Скрыть' : 'Авто и операции'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
                        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                            <FaCar className="text-[#ff9b82]" />
                            Автомобили клиента
                          </h4>

                          {clientCarsLoading ? (
                            <p className="mt-3 text-sm text-slate-400">Загрузка автомобилей...</p>
                          ) : clientCars.length === 0 ? (
                            <p className="mt-3 text-sm text-slate-400">
                              Нет автомобилей с историей в этом сервисе.
                            </p>
                          ) : (
                            <div className="mt-3 space-y-2">
                              {clientCars.map((car) => (
                                <button
                                  key={car.id}
                                  type="button"
                                  onClick={() => setSelectedCarId((currentValue) => (currentValue === car.id ? null : car.id))}
                                  className={cx(
                                    'w-full rounded-[1rem] border px-3 py-3 text-left transition-colors',
                                    selectedCarId === car.id
                                      ? 'border-[#ff9b82]/35 bg-[#ff9b82]/10'
                                      : 'border-white/10 bg-slate-950/30 hover:border-white/20 hover:bg-white/[0.04]'
                                  )}
                                >
                                  <p className="text-sm font-medium text-white">{getCarTitle(car)}</p>
                                  <p className="mt-1 text-xs text-slate-400">
                                    {car.year} год, пробег {formatMileage(car.mileage)}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                            <FaClipboardList className="text-[#ff9b82]" />
                            История операций
                          </h4>

                          {!selectedCarId ? (
                            <p className="mt-3 text-sm text-slate-400">
                              Выберите автомобиль слева, чтобы увидеть операции.
                            </p>
                          ) : operationsLoading ? (
                            <p className="mt-3 text-sm text-slate-400">Загрузка операций...</p>
                          ) : sortedOperations.length === 0 ? (
                            <p className="mt-3 text-sm text-slate-400">Операции не найдены.</p>
                          ) : (
                            <div className="mt-3 overflow-hidden rounded-[1rem] border border-white/10 bg-slate-950/25">
                              {sortedOperations.map((operation) => (
                                <div
                                  key={operation.id}
                                  className="grid gap-2 border-b border-white/10 px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.2fr)_9rem_8rem]"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-white">
                                      {operation.workType}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                      {getOperationPreview(operation.description)}
                                    </p>
                                  </div>

                                  <div className="text-sm text-slate-400">
                                    <p>{formatDate(operation.serviceDate)}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {formatMileage(operation.mileageAtService)}
                                    </p>
                                  </div>

                                  <p className="text-sm font-semibold text-emerald-300 md:text-right">
                                    {formatCost(operation.cost)}
                                  </p>
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

        {totalClients > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span>
                Показаны {pageStart}-{pageEnd} из {totalClients}
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
                  resetExpandedState()
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
                  resetExpandedState()
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
