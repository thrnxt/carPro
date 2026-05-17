import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardList,
  FaExternalLinkAlt,
  FaPlus,
  FaTimes,
} from 'react-icons/fa'
import apiClient from '../api/client'
import ServiceOperationCard, { type ServiceOperationCardData } from '../components/ServiceOperationCard'
import { Badge, EmptyState, Page, PageHeader, Section, cx } from '../components/ui'

interface ServiceCenterClient {
  clientId: number
  firstName: string
  lastName: string
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

type OperationStatusFilter = '' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

type OperationFilters = {
  clientId: string
  status: OperationStatusFilter
  dateFrom: string
  dateTo: string
}

const DEFAULT_FILTERS: OperationFilters = {
  clientId: '',
  status: '',
  dateFrom: '',
  dateTo: '',
}

const STATUS_OPTIONS: Array<{ value: OperationStatusFilter; label: string }> = [
  { value: '', label: 'Все статусы' },
  { value: 'SCHEDULED', label: 'Запланировано' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'COMPLETED', label: 'Завершено' },
  { value: 'CANCELLED', label: 'Отменено' },
]

const STATUS_BADGE_CLASSES: Record<Exclude<OperationStatusFilter, ''>, string> = {
  SCHEDULED: 'auto-badge-warning',
  IN_PROGRESS: 'auto-badge-info',
  COMPLETED: 'auto-badge-success',
  CANCELLED: 'auto-badge-danger',
}

const STATUS_LABELS: Record<Exclude<OperationStatusFilter, ''>, string> = {
  SCHEDULED: 'Запланировано',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
}

function formatOperationDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('ru-RU')
  } catch {
    return value
  }
}

function getOwnerName(operation: ServiceOperationCardData) {
  const owner = operation.car?.owner
  return `${owner?.firstName || ''} ${owner?.lastName || ''}`.trim() || 'Клиент не указан'
}

function getCarTitle(operation: ServiceOperationCardData) {
  const baseTitle = `${operation.car?.brand || ''} ${operation.car?.model || ''}`.trim()
  return baseTitle ? `${baseTitle}${operation.car?.licensePlate ? ` (${operation.car.licensePlate})` : ''}` : 'Автомобиль не указан'
}

function getTotalLabel(value?: number | null) {
  return value != null ? `${value.toLocaleString('ru-RU')}\u00A0₸` : '—'
}

function OperationDetailsModal({
  operation,
  onClose,
}: {
  operation: ServiceOperationCardData | null
  onClose: () => void
}) {
  if (!operation) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
        aria-label="Закрыть детали операции"
      />

      <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#08111d]/95 p-5 shadow-[0_44px_120px_-42px_rgba(2,6,23,0.96)] sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Закрыть окно"
        >
          <FaTimes />
        </button>

        <div className="pr-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Operation details</p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-white">Детали операции</h2>
          <p className="mt-2 text-sm text-slate-400">
            Операция #{operation.id} от {formatOperationDate(operation.serviceDate)}
          </p>
        </div>

        <div className="mt-6">
          <ServiceOperationCard operation={operation} />
        </div>
      </div>
    </div>
  )
}

export default function ServiceCenterOperations() {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(5)
  const [draftFilters, setDraftFilters] = useState<OperationFilters>(DEFAULT_FILTERS)
  const [filters, setFilters] = useState<OperationFilters>(DEFAULT_FILTERS)
  const [openedOperationId, setOpenedOperationId] = useState<number | null>(null)

  const { data: clients = [] } = useQuery<ServiceCenterClient[]>({
    queryKey: ['service-center-clients', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/service-center-clients/my')
      return response.data
    },
  })

  const {
    data: operationsPage,
    isLoading,
    isFetching,
  } = useQuery<PagedResponse<ServiceOperationCardData>>({
    queryKey: ['service-center-operations', 'search', page, pageSize, filters],
    queryFn: async () => {
      const response = await apiClient.get('/maintenance-records/service-center/my/search', {
        params: {
          page,
          size: pageSize,
          ...(filters.clientId ? { clientId: Number(filters.clientId) } : {}),
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
          ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
        },
      })
      return response.data
    },
    placeholderData: (previousData) => previousData,
  })

  const openedOperation = useMemo(
    () => operationsPage?.content.find((operation) => operation.id === openedOperationId) || null,
    [openedOperationId, operationsPage]
  )

  const hasActiveFilters = useMemo(() => Object.values(filters).some((value) => value !== ''), [filters])

  const pageStart = operationsPage && operationsPage.totalElements > 0 ? page * pageSize + 1 : 0
  const pageEnd = operationsPage ? page * pageSize + operationsPage.content.length : 0

  const handleApplyFilters = (event: React.FormEvent) => {
    event.preventDefault()

    if (draftFilters.dateFrom && draftFilters.dateTo && draftFilters.dateFrom > draftFilters.dateTo) {
      toast.error('Начало периода не может быть позже конца периода')
      return
    }

    setFilters(draftFilters)
    setPage(0)
    setOpenedOperationId(null)
  }

  const handleResetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS)
    setFilters(DEFAULT_FILTERS)
    setPage(0)
    setOpenedOperationId(null)
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Service operations"
        title="Журнал операций"
        actions={
          <Link to="/service-center/operations/new" className="auto-button-primary">
            <FaPlus />
            Создать операцию
          </Link>
        }
      />

      <Section
        title="Операции"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="auto-badge-info">{operationsPage?.totalElements ?? 0} в журнале</Badge>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>На странице</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value))
                  setPage(0)
                }}
                className="auto-select min-w-[5.5rem] py-2"
              >
                {[5, 10, 15, 20].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            {isFetching ? <span className="text-sm text-slate-400">Обновляем...</span> : null}
          </div>
        }
      >
        {isLoading && !operationsPage ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-[#ff9b82]" />
            <p className="mt-2 text-slate-400">Загрузка журнала операций...</p>
          </div>
        ) : !operationsPage || operationsPage.content.length === 0 ? (
          <EmptyState
            icon={FaClipboardList}
            title={hasActiveFilters ? 'Операции по фильтрам не найдены' : 'Журнал пока пуст'}
            description={
              hasActiveFilters
                ? 'Снимите часть ограничений или измените поисковый запрос.'
                : 'Создайте первую операцию отдельно от журнала, чтобы история сервиса начала наполняться.'
            }
            action={
              hasActiveFilters ? (
                <button type="button" onClick={handleResetFilters} className="auto-button-secondary">
                  Сбросить фильтры
                </button>
              ) : (
                <Link to="/service-center/operations/new" className="auto-button-primary">
                  <FaPlus />
                  Создать операцию
                </Link>
              )
            }
          />
        ) : (
          <>
            <div className="mb-6 rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <form onSubmit={handleApplyFilters} className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto_auto] 2xl:items-end">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    Клиент
                  </label>
                  <select
                    value={draftFilters.clientId}
                    onChange={(event) =>
                      setDraftFilters((currentValue) => ({ ...currentValue, clientId: event.target.value }))
                    }
                    className="auto-select"
                  >
                    <option value="">Все клиенты</option>
                    {clients.map((client) => (
                      <option key={client.clientId} value={client.clientId}>
                        {client.firstName} {client.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    Статус
                  </label>
                  <select
                    value={draftFilters.status}
                    onChange={(event) =>
                      setDraftFilters((currentValue) => ({
                        ...currentValue,
                        status: event.target.value as OperationStatusFilter,
                      }))
                    }
                    className="auto-select"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value || 'all'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    Дата от
                  </label>
                  <input
                    type="date"
                    value={draftFilters.dateFrom}
                    onChange={(event) =>
                      setDraftFilters((currentValue) => ({ ...currentValue, dateFrom: event.target.value }))
                    }
                    className="auto-input"
                    aria-label="Дата от"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    Дата до
                  </label>
                  <input
                    type="date"
                    value={draftFilters.dateTo}
                    onChange={(event) =>
                      setDraftFilters((currentValue) => ({ ...currentValue, dateTo: event.target.value }))
                    }
                    className="auto-input"
                    aria-label="Дата до"
                  />
                </div>

                <button type="button" onClick={handleResetFilters} className="auto-button-secondary 2xl:self-end">
                  Сбросить
                </button>
                <button type="submit" className="auto-button-primary 2xl:self-end">
                  Применить
                </button>
              </form>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-[0.16em] text-slate-500">
                      <th className="px-4 py-3 font-medium">Дата</th>
                      <th className="px-4 py-3 font-medium">Операция</th>
                      <th className="px-4 py-3 font-medium">Клиент</th>
                      <th className="px-4 py-3 font-medium">Автомобиль</th>
                      <th className="px-4 py-3 font-medium">Сумма</th>
                      <th className="px-4 py-3 font-medium">Статус</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {operationsPage.content.map((operation) => {
                      const status = operation.status as Exclude<OperationStatusFilter, ''> | undefined

                      return (
                        <tr
                          key={operation.id}
                          className={cx(
                            'border-b border-white/10 align-top transition-colors last:border-b-0',
                            openedOperationId === operation.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                          )}
                        >
                          <td className="px-4 py-4 text-slate-300">{formatOperationDate(operation.serviceDate)}</td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-white">{operation.workType}</p>
                            <p className="mt-1 text-xs text-slate-400">#{operation.id}</p>
                          </td>
                          <td className="px-4 py-4 text-slate-300">{getOwnerName(operation)}</td>
                          <td className="px-4 py-4 text-slate-300">{getCarTitle(operation)}</td>
                          <td className="whitespace-nowrap px-4 py-4 font-medium text-emerald-300">
                            {getTotalLabel(operation.cost)}
                          </td>
                          <td className="px-4 py-4">
                            {status ? <span className={STATUS_BADGE_CLASSES[status]}>{STATUS_LABELS[status]}</span> : '—'}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setOpenedOperationId(operation.id)}
                              className="auto-button-secondary px-3 py-2 text-sm"
                            >
                              <FaExternalLinkAlt />
                              Открыть
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span>
                  Показаны {pageStart}-{pageEnd} из {operationsPage.totalElements}
                </span>
                <span className="flex items-center gap-2">
                  <FaCalendarAlt className="text-[#ff9b82]" />
                  Страница {operationsPage.page + 1} из {Math.max(operationsPage.totalPages, 1)}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPage((currentValue) => Math.max(currentValue - 1, 0))
                    setOpenedOperationId(null)
                  }}
                  disabled={operationsPage.first}
                  className="auto-button-secondary"
                >
                  <FaChevronLeft />
                  Назад
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPage((currentValue) => currentValue + 1)
                    setOpenedOperationId(null)
                  }}
                  disabled={operationsPage.last}
                  className="auto-button-secondary"
                >
                  Далее
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </Section>

      <OperationDetailsModal operation={openedOperation} onClose={() => setOpenedOperationId(null)} />
    </Page>
  )
}
