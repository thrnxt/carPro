import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FaCar,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaClipboardList,
  FaCrown,
  FaEllipsisH,
  FaPhoneAlt,
  FaPlus,
  FaRegClock,
  FaSearch,
  FaUserPlus,
  FaUsers,
  FaUserSlash,
} from 'react-icons/fa'
import apiClient from '../api/client'
import { EmptyState, Page, PageHeader, Pagination, Section, StatCard, cx } from '../components/ui'

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

type ClientStatus = ServiceCenterClient['status']
type ClientStatusFilter = 'ALL' | ClientStatus
type SortKey = 'visits' | 'name' | 'lastVisit'

const STATUS_META: Record<ClientStatus, { label: string; tone: string }> = {
  VIP: { label: 'VIP', tone: 'auto-badge-warning' },
  REGULAR: { label: 'Постоянный', tone: 'auto-badge-info' },
  BLOCKED: { label: 'Заблокирован', tone: 'auto-badge-danger' },
  NEW: { label: 'Новый', tone: 'auto-badge' },
}

const STATUS_ORDER: ClientStatus[] = ['NEW', 'REGULAR', 'VIP', 'BLOCKED']

const STATUS_FILTER_OPTIONS: Array<{ value: ClientStatusFilter; label: string }> = [
  { value: 'ALL', label: 'Все статусы' },
  ...STATUS_ORDER.map((value) => ({ value, label: STATUS_META[value].label })),
]

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'visits', label: 'По визитам' },
  { value: 'name', label: 'По имени' },
  { value: 'lastVisit', label: 'По последнему визиту' },
]

const PAGE_SIZE_OPTIONS = [8, 12, 20]

const AVATAR_COLORS = [
  '#B45309',
  '#0E7490',
  '#4338CA',
  '#9D174D',
  '#15803D',
  '#7C3AED',
  '#9A6A00',
  '#1D4ED8',
  '#A21CAF',
  '#0F766E',
]

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
  return value != null ? `${value.toLocaleString('ru-RU')} ₸` : '—'
}

function getClientFullName(client: ServiceCenterClient) {
  return `${client.firstName} ${client.lastName}`.trim() || 'Клиент не указан'
}

function getClientInitials(client: ServiceCenterClient) {
  const first = client.firstName?.trim()?.[0] || ''
  const last = client.lastName?.trim()?.[0] || ''
  const initials = `${first}${last}`.toUpperCase()
  return initials || '—'
}

function getAvatarColor(client: ServiceCenterClient) {
  const seed = getClientFullName(client)
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
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

function StatusPill({ status }: { status: ClientStatus }) {
  const meta = STATUS_META[status]
  return <span className={meta.tone}>{meta.label}</span>
}

function StatusMenu({
  current,
  disabled,
  onSelect,
}: {
  current: ClientStatus
  disabled?: boolean
  onSelect: (status: ClientStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative" style={open ? { zIndex: 40 } : undefined}>
      <button
        type="button"
        className={cx('icon-btn', open && 'icon-btn-active')}
        aria-label="Действия с клиентом"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <FaEllipsisH />
      </button>

      {open && (
        <div className="menu-panel right-0 mt-2" role="menu">
          <p className="menu-label">Изменить статус</p>
          {STATUS_ORDER.map((status) => (
            <button
              key={status}
              type="button"
              role="menuitemradio"
              aria-checked={status === current}
              disabled={disabled}
              className={cx('menu-item', status === current && 'menu-item-active', status === 'BLOCKED' && 'menu-item-danger')}
              onClick={() => {
                setOpen(false)
                if (status !== current) {
                  onSelect(status)
                }
              }}
            >
              <span className="flex h-4 w-4 items-center justify-center">
                {status === current ? <FaCheck className="text-accent" /> : null}
              </span>
              {STATUS_META[status].label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ServiceCenterClients() {
  const queryClient = useQueryClient()
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('visits')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false)
  const bulkMenuRef = useRef<HTMLDivElement>(null)

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
    mutationFn: async ({ clientId, status }: { clientId: number; status: ClientStatus }) => {
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

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ clientIds, status }: { clientIds: number[]; status: ClientStatus }) => {
      await Promise.all(
        clientIds.map((clientId) =>
          apiClient.patch(`/service-center-clients/${clientId}/status`, null, { params: { status } })
        )
      )
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-center-clients', 'my'] })
      toast.success(`Статус обновлён для ${variables.clientIds.length} клиентов`)
      setSelectedIds(new Set())
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Не удалось обновить статусы')
    },
  })

  const stats = useMemo(() => {
    return {
      total: clients.length,
      vip: clients.filter((client) => client.status === 'VIP').length,
      blocked: clients.filter((client) => client.status === 'BLOCKED').length,
      isNew: clients.filter((client) => client.status === 'NEW').length,
    }
  }, [clients])

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase()

    const matched = clients.filter((client) => {
      if (statusFilter !== 'ALL' && client.status !== statusFilter) {
        return false
      }

      if (!query) {
        return true
      }

      const haystack = [
        getClientFullName(client),
        client.email || '',
        client.phoneNumber || '',
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })

    return matched.sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return getClientFullName(a).localeCompare(getClientFullName(b), 'ru')
        case 'lastVisit': {
          const aTime = a.lastServiceDate ? new Date(a.lastServiceDate).getTime() : 0
          const bTime = b.lastServiceDate ? new Date(b.lastServiceDate).getTime() : 0
          return bTime - aTime
        }
        case 'visits':
        default:
          return b.totalVisits - a.totalVisits
      }
    })
  }, [clients, search, statusFilter, sortKey])

  const totalClients = filteredClients.length
  const totalPages = Math.max(Math.ceil(totalClients / pageSize), 1)
  const currentPage = Math.min(page, totalPages - 1)
  const pageStartIndex = currentPage * pageSize
  const paginatedClients = filteredClients.slice(pageStartIndex, pageStartIndex + pageSize)

  const sortedOperations = useMemo(
    () =>
      operations
        .slice()
        .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()),
    [operations]
  )

  const pageIds = useMemo(() => paginatedClients.map((client) => client.clientId), [paginatedClients])
  const selectedOnPage = pageIds.filter((id) => selectedIds.has(id)).length
  const allOnPageSelected = pageIds.length > 0 && selectedOnPage === pageIds.length
  const someOnPageSelected = selectedOnPage > 0 && !allOnPageSelected

  const selectAllRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someOnPageSelected
    }
  }, [someOnPageSelected])

  useEffect(() => {
    if (!bulkMenuOpen) {
      return
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(event.target as Node)) {
        setBulkMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [bulkMenuOpen])

  const resetExpandedState = () => {
    setSelectedClientId(null)
    setSelectedCarId(null)
  }

  const handleFilterChange = (apply: () => void) => {
    apply()
    setPage(0)
    resetExpandedState()
  }

  const toggleClientDetails = (clientId: number) => {
    if (selectedClientId === clientId) {
      setSelectedClientId(null)
      setSelectedCarId(null)
      return
    }

    setSelectedClientId(clientId)
    setSelectedCarId(null)
  }

  const toggleSelected = (clientId: number) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(clientId)) {
        next.delete(clientId)
      } else {
        next.add(clientId)
      }
      return next
    })
  }

  const toggleSelectAllOnPage = () => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id))
      } else {
        pageIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const resetFilters = () => {
    handleFilterChange(() => {
      setSearch('')
      setStatusFilter('ALL')
    })
  }

  if (isLoading) {
    return (
      <Page>
        <PageHeader title="Клиенты" description="База клиентов, автомобилей и сервисной истории." />
        <div className="p-10 text-center">
          <div className="inline-block h-9 w-9 animate-spin rounded-full border-b-2 border-accent"></div>
          <p className="mt-3 text-sm text-text-secondary">Загрузка клиентов...</p>
        </div>
      </Page>
    )
  }

  const hasClients = clients.length > 0
  const hasResults = filteredClients.length > 0

  return (
    <Page>
      <PageHeader title="Клиенты" description="База клиентов, автомобилей и сервисной истории." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FaUsers} label="Всего клиентов" value={stats.total} />
        <StatCard icon={FaCrown} label="VIP" value={stats.vip} tone="warning" />
        <StatCard icon={FaUserSlash} label="Заблокировано" value={stats.blocked} tone="danger" />
        <StatCard icon={FaUserPlus} label="Новые" value={stats.isNew} />
      </div>

      <Section>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="toolbar-search">
            <FaSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => handleFilterChange(() => setSearch(event.target.value))}
              placeholder="Поиск по имени, телефону или email"
              className="auto-input"
              aria-label="Поиск клиентов"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="control-group">
              <span>Статус</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  handleFilterChange(() => setStatusFilter(event.target.value as ClientStatusFilter))
                }
                className="auto-select min-w-[10rem] py-2 text-text-primary"
              >
                {STATUS_FILTER_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="control-group">
              <span>Сортировка</span>
              <select
                value={sortKey}
                onChange={(event) => handleFilterChange(() => setSortKey(event.target.value as SortKey))}
                className="auto-select min-w-[11rem] py-2 text-text-primary"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="control-group">
              <span>На странице</span>
              <select
                value={pageSize}
                onChange={(event) => handleFilterChange(() => setPageSize(Number(event.target.value)))}
                className="auto-select min-w-[4.5rem] py-2 text-text-primary"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            <Link to="/service-center/operations/new" className="btn-primary">
              <FaPlus />
              Добавить клиента
            </Link>
          </div>
        </div>

        {/* List header / bulk bar */}
        <div className="mt-6">
          {selectedIds.size > 0 ? (
            <div className="bulk-bar">
              <span className="text-sm font-medium text-text-primary">
                Выбрано: {selectedIds.size}
              </span>
              <div ref={bulkMenuRef} className="relative">
                <button
                  type="button"
                  className="btn-secondary py-2 text-sm"
                  aria-haspopup="menu"
                  aria-expanded={bulkMenuOpen}
                  disabled={bulkStatusMutation.isPending}
                  onClick={() => setBulkMenuOpen((value) => !value)}
                >
                  Сменить статус
                  <FaChevronDown className="text-xs" />
                </button>
                {bulkMenuOpen && (
                  <div className="menu-panel left-0 mt-2" role="menu">
                    {STATUS_ORDER.map((status) => (
                      <button
                        key={status}
                        type="button"
                        role="menuitem"
                        className={cx('menu-item', status === 'BLOCKED' && 'menu-item-danger')}
                        onClick={() => {
                          setBulkMenuOpen(false)
                          bulkStatusMutation.mutate({ clientIds: [...selectedIds], status })
                        }}
                      >
                        {STATUS_META[status].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn-ghost py-2 text-sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Снять выделение
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-h3 text-text-primary">
                Клиентская база
                <span className="ml-2 text-sm font-normal text-text-muted">
                  {totalClients} {totalClients === 1 ? 'клиент' : 'клиентов'}
                </span>
              </h3>
            </div>
          )}
        </div>

        {/* List */}
        <div className="mt-4">
          {!hasClients ? (
            <EmptyState
              icon={FaUsers}
              title="Пока нет клиентов"
              description="Клиенты появляются здесь после первой записи или сервисной операции. Создайте операцию, чтобы добавить клиента в базу."
              action={
                <Link to="/service-center/operations/new" className="btn-primary">
                  <FaPlus />
                  Добавить клиента
                </Link>
              }
            />
          ) : !hasResults ? (
            <EmptyState
              icon={FaSearch}
              title="Ничего не найдено"
              description="По заданным фильтрам клиентов нет. Попробуйте изменить запрос или сбросить фильтры."
              action={
                <button type="button" className="btn-secondary" onClick={resetFilters}>
                  Сбросить фильтры
                </button>
              }
            />
          ) : (
            <>
              <div className="mb-2 hidden items-center gap-3 px-card lg:flex">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="client-check"
                  checked={allOnPageSelected}
                  onChange={toggleSelectAllOnPage}
                  aria-label="Выбрать всех на странице"
                />
                <span className="text-caption uppercase tracking-wide text-text-muted">
                  Выбрать всех на странице
                </span>
              </div>

              <div className="client-list">
                {paginatedClients.map((client) => {
                  const isExpanded = selectedClientId === client.clientId
                  const isSelected = selectedIds.has(client.clientId)

                  const identity = (
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="client-avatar" style={{ background: getAvatarColor(client) }}>
                        {getClientInitials(client)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text-primary">
                          {getClientFullName(client)}
                        </p>
                        <p className="truncate text-caption text-text-muted">
                          {client.email || 'Email не указан'}
                        </p>
                      </div>
                    </div>
                  )

                  const phone = (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <FaPhoneAlt className="text-xs text-text-muted" />
                      <span className="truncate">{client.phoneNumber || 'Не указан'}</span>
                    </div>
                  )

                  const activity = (
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="client-chip">
                          <FaClipboardList />
                          Визиты: {client.totalVisits}
                        </span>
                        <span className="client-chip">
                          <FaCar />
                          Авто: {client.carsCount}
                        </span>
                      </div>
                      <p className="mt-1.5 flex items-center gap-1.5 text-caption text-text-muted">
                        <FaRegClock />
                        Последний визит: {formatDate(client.lastServiceDate)}
                      </p>
                    </div>
                  )

                  const detailsButton = (
                    <button
                      type="button"
                      className="btn-secondary py-2 text-sm"
                      onClick={() => toggleClientDetails(client.clientId)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      {isExpanded ? 'Скрыть' : 'Авто и операции'}
                    </button>
                  )

                  const actionsMenu = (
                    <StatusMenu
                      current={client.status}
                      disabled={updateStatusMutation.isPending}
                      onSelect={(status) =>
                        updateStatusMutation.mutate({ clientId: client.clientId, status })
                      }
                    />
                  )

                  return (
                    <article
                      key={client.clientId}
                      className={cx('client-row', isSelected && 'client-row-selected')}
                    >
                      {/* Desktop layout */}
                      <div className="hidden lg:grid lg:grid-cols-[auto_minmax(0,1.3fr)_minmax(0,0.85fr)_minmax(0,1.05fr)_auto_auto] lg:items-center lg:gap-4">
                        <input
                          type="checkbox"
                          className="client-check"
                          checked={isSelected}
                          onChange={() => toggleSelected(client.clientId)}
                          aria-label={`Выбрать клиента ${getClientFullName(client)}`}
                        />
                        {identity}
                        {phone}
                        {activity}
                        <div className="justify-self-start">
                          <StatusPill status={client.status} />
                        </div>
                        <div className="flex items-center gap-2 justify-self-end">
                          {detailsButton}
                          {actionsMenu}
                        </div>
                      </div>

                      {/* Mobile / compact layout */}
                      <div className="flex flex-col gap-3 lg:hidden">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="client-check mt-1"
                            checked={isSelected}
                            onChange={() => toggleSelected(client.clientId)}
                            aria-label={`Выбрать клиента ${getClientFullName(client)}`}
                          />
                          <div className="min-w-0 flex-1">{identity}</div>
                          <StatusPill status={client.status} />
                        </div>
                        <div className="flex flex-col gap-2 pl-[30px]">
                          {phone}
                          {activity}
                        </div>
                        <div className="flex items-center gap-2 pl-[30px]">
                          <div className="flex-1">{detailsButton}</div>
                          {actionsMenu}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 border-t border-border pt-4">
                          <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
                            <div className="rounded-md border border-border bg-surface-1 p-4">
                              <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                                <FaCar className="text-text-muted" />
                                Автомобили клиента
                              </h4>

                              {clientCarsLoading ? (
                                <p className="mt-3 text-sm text-text-secondary">Загрузка автомобилей...</p>
                              ) : clientCars.length === 0 ? (
                                <p className="mt-3 text-sm text-text-secondary">
                                  Нет автомобилей с историей в этом сервисе.
                                </p>
                              ) : (
                                <div className="mt-3 space-y-2">
                                  {clientCars.map((car) => (
                                    <button
                                      key={car.id}
                                      type="button"
                                      onClick={() =>
                                        setSelectedCarId((currentValue) =>
                                          currentValue === car.id ? null : car.id
                                        )
                                      }
                                      className={cx(
                                        'w-full rounded-md border px-3 py-3 text-left transition-colors',
                                        selectedCarId === car.id
                                          ? 'border-accent bg-surface-3'
                                          : 'border-border bg-surface-2 hover:border-[var(--border-strong)] hover:bg-surface-3'
                                      )}
                                    >
                                      <p className="text-sm font-medium text-text-primary">{getCarTitle(car)}</p>
                                      <p className="mt-1 text-xs text-text-muted">
                                        {car.year} год, пробег {formatMileage(car.mileage)}
                                      </p>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="rounded-md border border-border bg-surface-1 p-4">
                              <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                                <FaClipboardList className="text-text-muted" />
                                История операций
                              </h4>

                              {!selectedCarId ? (
                                <p className="mt-3 text-sm text-text-secondary">
                                  Выберите автомобиль слева, чтобы увидеть операции.
                                </p>
                              ) : operationsLoading ? (
                                <p className="mt-3 text-sm text-text-secondary">Загрузка операций...</p>
                              ) : sortedOperations.length === 0 ? (
                                <p className="mt-3 text-sm text-text-secondary">Операции не найдены.</p>
                              ) : (
                                <div className="mt-3 overflow-hidden rounded-md border border-border bg-surface-2">
                                  {sortedOperations.map((operation) => (
                                    <div
                                      key={operation.id}
                                      className="grid gap-2 border-b border-border px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.2fr)_9rem_8rem]"
                                    >
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-text-primary">
                                          {operation.workType}
                                        </p>
                                        <p className="mt-1 text-xs text-text-muted">
                                          {getOperationPreview(operation.description)}
                                        </p>
                                      </div>

                                      <div className="text-sm text-text-secondary">
                                        <p>{formatDate(operation.serviceDate)}</p>
                                        <p className="mt-1 text-xs text-text-muted">
                                          {formatMileage(operation.mileageAtService)}
                                        </p>
                                      </div>

                                      <p className="text-sm font-semibold text-success md:text-right">
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

              <Pagination
                className="mt-4"
                page={currentPage}
                totalPages={totalPages}
                totalItems={totalClients}
                pageSize={pageSize}
                onPageChange={(nextPage) => {
                  setPage(nextPage)
                  resetExpandedState()
                }}
              />
            </>
          )}
        </div>
      </Section>
    </Page>
  )
}
