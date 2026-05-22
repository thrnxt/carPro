import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  FaBell,
  FaCalendarAlt,
  FaCar,
  FaClock,
  FaFileInvoiceDollar,
  FaPlus,
  FaStar,
  FaTools,
  FaUsers,
  FaWrench,
} from 'react-icons/fa'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import {
  Badge,
  EmptyState,
  KeyValue,
  NextActionCard,
  Page,
  PageHeader,
  Section,
  SectionGrid,
  Skeleton,
  SkeletonCard,
  SkeletonStatCard,
  StatCard,
} from '../components/ui'
import { type ServiceOperationCardData } from '../components/ServiceOperationCard'
import { bookingStatusMeta, operationStatusMeta } from '../utils/statusMeta'
import { resolveFileUrl } from '../utils/resolveFileUrl'

interface ServiceCenterProfile {
  id: number
  name: string
  rating?: number
}

interface ServiceCenterBooking {
  id: number
  bookingDateTime: string
  status: string
  description?: string
  car?: {
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
}

function formatCompactDateTime(value: string) {
  try {
    return new Date(value).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function formatCompactDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('ru-RU')
  } catch {
    return value
  }
}

function formatCompactMoney(value?: number | null) {
  return value != null ? `${value.toLocaleString('ru-RU')}\u00A0₸` : '—'
}

function getBookingCarTitle(booking: ServiceCenterBooking) {
  const baseTitle = `${booking.car?.brand || ''} ${booking.car?.model || ''}`.trim()
  return baseTitle
    ? `${baseTitle}${booking.car?.licensePlate ? ` (${booking.car.licensePlate})` : ''}`
    : 'Автомобиль не указан'
}

function getBookingClientName(booking: ServiceCenterBooking) {
  return `${booking.car?.owner?.firstName || ''} ${booking.car?.owner?.lastName || ''}`.trim() || 'Клиент не указан'
}

function getOperationCarTitle(operation: ServiceOperationCardData) {
  const baseTitle = `${operation.car?.brand || ''} ${operation.car?.model || ''}`.trim()
  return baseTitle
    ? `${baseTitle}${operation.car?.licensePlate ? ` (${operation.car.licensePlate})` : ''}`
    : 'Автомобиль не указан'
}

function getOperationClientName(operation: ServiceOperationCardData) {
  return `${operation.car?.owner?.firstName || ''} ${operation.car?.owner?.lastName || ''}`.trim() || 'Клиент не указан'
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const isServiceCenter = user?.role === 'SERVICE_CENTER'

  if (isServiceCenter) {
    return <ServiceCenterDashboard />
  }

  return <ClientDashboard />
}

function ClientDashboard() {
  const { user } = useAuthStore()
  const [avatarFailed, setAvatarFailed] = useState(false)

  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
  const avatarSrc = resolveFileUrl(user?.avatarUrl)
  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || (user?.email?.[0]?.toUpperCase() ?? 'U')

  const { data: cars = [], isLoading: carsLoading } = useQuery({
    queryKey: ['cars'],
    queryFn: async () => {
      const response = await apiClient.get('/cars')
      return response.data
    },
  })

  const { data: unreadCount = 0, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications/unread-count')
      return response.data
    },
  })

  const isLoading = carsLoading || notificationsLoading

  const hasCars = cars.length > 0
  const nextAction = !hasCars
    ? {
        hint: 'Добавьте первый автомобиль, чтобы открыть записи, документы и напоминания.',
        primaryTo: '/garage',
        primaryLabel: 'Добавить автомобиль',
        PrimaryIcon: FaPlus,
        secondaryTo: '/service-centers',
        secondaryLabel: 'Посмотреть сервисы',
        SecondaryIcon: FaWrench,
      }
    : unreadCount > 0
      ? {
          hint: `Непрочитанные уведомления: ${unreadCount}. Проверьте напоминания по обслуживанию.`,
          primaryTo: '/notifications',
          primaryLabel: 'Открыть уведомления',
          PrimaryIcon: FaBell,
          secondaryTo: '/bookings',
          secondaryLabel: 'Мои записи',
          SecondaryIcon: FaCalendarAlt,
        }
      : {
          hint: 'Гараж в порядке — можно запланировать следующий визит в сервис.',
          primaryTo: '/service-centers',
          primaryLabel: 'Найти сервис',
          PrimaryIcon: FaWrench,
          secondaryTo: '/my-documents',
          secondaryLabel: 'Документы',
          SecondaryIcon: FaFileInvoiceDollar,
        }
  const ClientPrimaryIcon = nextAction.PrimaryIcon
  const ClientSecondaryIcon = nextAction.SecondaryIcon

  return (
    <Page>
      <section className="next-action-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="app-avatar h-16 w-16 text-xl sm:h-20 sm:w-20 sm:text-2xl">
                {avatarSrc && !avatarFailed ? (
                  <img
                    src={avatarSrc}
                    alt={fullName || 'Профиль'}
                    className="h-full w-full object-cover"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-surface-2 bg-success" />
            </div>

            <div className="min-w-0">
              <p className="section-label">Личный кабинет</p>
              <h1 className="mt-1 text-h1 text-text-primary">
                Добро пожаловать, {user?.firstName || 'пользователь'}
              </h1>
              <p className="mt-2 max-w-xl text-body text-text-secondary">{nextAction.hint}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:shrink-0 lg:justify-end">
            <Link to={nextAction.primaryTo} className="btn-primary">
              <ClientPrimaryIcon />
              {nextAction.primaryLabel}
            </Link>
            <Link to={nextAction.secondaryTo} className="btn-secondary">
              <ClientSecondaryIcon />
              {nextAction.secondaryLabel}
            </Link>
          </div>
        </div>
      </section>

      {isLoading ? (
        <SectionGrid className="xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </SectionGrid>
      ) : (
        <SectionGrid className="xl:grid-cols-4">
          <StatCard
            icon={FaCar}
            label="Автомобили"
            value={cars.length}
            tone={cars.length > 0 ? 'success' : undefined}
          />
          <StatCard
            icon={FaBell}
            label="Уведомлений"
            value={unreadCount}
            tone={unreadCount > 0 ? 'warning' : undefined}
          />
          <StatCard
            icon={FaCalendarAlt}
            label="Сервисных записей"
            value={hasCars ? 'Активно' : 'Нет авто'}
          />
          <StatCard
            icon={FaFileInvoiceDollar}
            label="Документы"
            value={hasCars ? 'Доступны' : 'Закрыто'}
          />
        </SectionGrid>
      )}

      <Section
        title="Автомобили в гараже"
        actions={
          <Link to="/garage" className="btn-secondary">
            Открыть гараж
          </Link>
        }
      >
        {carsLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
          </div>
        ) : cars.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {cars.map((car: any) => (
              <Link key={car.id} to={`/cars/${car.id}`} className="auto-card p-card block">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="section-label">Автомобиль</p>
                    <h3 className="truncate text-h2 text-text-primary">
                      {car.brand} {car.model}
                    </h3>
                    <p className="mt-1 text-body text-text-secondary">{car.year} г.в.</p>
                  </div>
                  <div className="metric-icon shrink-0">
                    <FaCar />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 rounded-md border border-border bg-surface-3 p-4 text-body">
                  <KeyValue label="Пробег" value={`${car.mileage?.toLocaleString('ru-RU') || 0} км`} />
                  <KeyValue
                    label="Гос. номер"
                    value={car.licensePlate ? <span className="font-mono text-info">{car.licensePlate}</span> : '—'}
                  />
                  <KeyValue
                    label="Последнее ТО"
                    value={
                      car.lastServiceDate
                        ? new Date(car.lastServiceDate).toLocaleDateString('ru-RU')
                        : 'Нет данных'
                    }
                  />
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <Badge tone="auto-badge-info">Карточка автомобиля</Badge>
                  <span className="text-caption text-text-muted">Открыть →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FaCar}
            title="Гараж пока пуст"
            description="Добавьте первый автомобиль, чтобы открыть календарь обслуживания, сервисные записи и документы."
            action={
              <Link to="/garage" className="btn-primary">
                <FaPlus />
                Добавить автомобиль
              </Link>
            }
          />
        )}
      </Section>
    </Page>
  )
}

function ServiceCenterDashboard() {
  const { data: serviceCenter, isLoading: scLoading } = useQuery<ServiceCenterProfile>({
    queryKey: ['service-center', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/service-centers/my')
      return response.data
    },
  })

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<ServiceCenterBooking[]>({
    queryKey: ['service-center-bookings', serviceCenter?.id],
    queryFn: async () => {
      const response = await apiClient.get(`/bookings/service-center/${serviceCenter?.id}`)
      return response.data
    },
    enabled: !!serviceCenter?.id,
  })

  const { data: clients = [] } = useQuery<ServiceCenterClient[]>({
    queryKey: ['service-center-clients', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/service-center-clients/my')
      return response.data
    },
    enabled: !!serviceCenter?.id,
  })

  const { data: operations = [], isLoading: operationsLoading } = useQuery<ServiceOperationCardData[]>({
    queryKey: ['service-center-operations', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/maintenance-records/service-center/my')
      return response.data
    },
    enabled: !!serviceCenter?.id,
  })

  const isLoading = scLoading || bookingsLoading || operationsLoading

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const todayBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.bookingDateTime)
    return bookingDate >= todayStart && bookingDate < tomorrowStart
  })

  const pendingBookings = bookings.filter((booking) => booking.status === 'PENDING')
  const inProgressOperations = operations.filter((operation) => operation.status === 'IN_PROGRESS')

  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter((booking) => new Date(booking.bookingDateTime) >= now)
        .sort(
          (a, b) =>
            new Date(a.bookingDateTime).getTime() - new Date(b.bookingDateTime).getTime()
        )
        .slice(0, 4),
    [bookings, now]
  )

  const recentOperations = useMemo(
    () =>
      operations
        .slice()
        .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())
        .slice(0, 4),
    [operations]
  )

  const overviewMetrics = [
    {
      label: 'Записи сегодня',
      value: todayBookings.length,
      meta: 'На текущий день',
      icon: FaCalendarAlt,
    },
    {
      label: 'Ожидают',
      value: pendingBookings.length,
      meta: 'Ждут подтверждения',
      icon: FaClock,
    },
    {
      label: 'Клиенты',
      value: clients.length,
      meta: 'В базе сервиса',
      icon: FaUsers,
    },
    {
      label: 'Операции',
      value: operations.length,
      meta: 'Зафиксировано',
      icon: FaTools,
    },
    {
      label: 'Рейтинг',
      value: serviceCenter?.rating ? serviceCenter.rating.toFixed(1) : '—',
      meta: 'Средняя оценка',
      icon: FaStar,
    },
  ]

  const serviceAction = pendingBookings.length > 0
    ? {
        eyebrow: 'Приоритет смены',
        title: `${pendingBookings.length} записей ждут подтверждения`,
        description: 'Подтвердите или отклоните входящие заявки, чтобы клиенты видели актуальное расписание сервиса.',
        primaryTo: '/service-center/bookings',
        primaryLabel: 'Разобрать записи',
        PrimaryIcon: FaClock,
        secondaryTo: '/service-center/operations',
        secondaryLabel: 'Операции',
        SecondaryIcon: FaTools,
      }
    : inProgressOperations.length > 0
      ? {
          eyebrow: 'В работе',
          title: `${inProgressOperations.length} операций требуют завершения`,
          description: 'Закройте активные работы, добавьте материалы и обновите статус для клиента.',
          primaryTo: '/service-center/operations',
          primaryLabel: 'Открыть операции',
          PrimaryIcon: FaTools,
          secondaryTo: '/service-center/invoices',
          secondaryLabel: 'Счета',
          SecondaryIcon: FaFileInvoiceDollar,
        }
      : {
          eyebrow: 'Готово к работе',
          title: 'Создайте новую сервисную операцию',
          description: 'Зафиксируйте работы, детали и стоимость, чтобы клиент получил прозрачную историю обслуживания.',
          primaryTo: '/service-center/operations/new',
          primaryLabel: 'Создать операцию',
          PrimaryIcon: FaPlus,
          secondaryTo: '/service-center/clients',
          secondaryLabel: 'Клиенты',
          SecondaryIcon: FaUsers,
        }
  const ServicePrimaryIcon = serviceAction.PrimaryIcon
  const ServiceSecondaryIcon = serviceAction.SecondaryIcon

  return (
    <Page>
      <PageHeader
        eyebrow="Сервисный центр"
        title={serviceCenter?.name || 'Панель сервисного центра'}
        description="Операционный центр для записей, клиентов, работ и счетов."
      />

      <NextActionCard
        eyebrow={serviceAction.eyebrow}
        title={serviceAction.title}
        description={serviceAction.description}
        primaryAction={
          <Link to={serviceAction.primaryTo} className="btn-primary">
            <ServicePrimaryIcon />
            {serviceAction.primaryLabel}
          </Link>
        }
        secondaryAction={
          <Link to={serviceAction.secondaryTo} className="btn-secondary">
            <ServiceSecondaryIcon />
            {serviceAction.secondaryLabel}
          </Link>
        }
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge tone={pendingBookings.length > 0 ? 'auto-badge-warning' : 'auto-badge-success'}>
              {pendingBookings.length > 0 ? `${pendingBookings.length} ожидают` : 'Очередь обработана'}
            </Badge>
            <Badge tone={inProgressOperations.length > 0 ? 'auto-badge-info' : 'auto-badge'}>
              {inProgressOperations.length > 0 ? `${inProgressOperations.length} в работе` : 'Нет активных работ'}
            </Badge>
          </div>
        }
      />

      {isLoading ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </section>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {overviewMetrics.map((metric) => (
            <StatCard
              key={metric.label}
              icon={metric.icon}
              label={metric.label}
              value={metric.value}
              meta={metric.meta}
            />
          ))}
        </section>
      )}

      <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
        <Section
          title="Ближайшие записи"
          description="Короткий список ближайших визитов."
        >
          {bookingsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-md border border-border bg-surface-2 px-4 py-3 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : upcomingBookings.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-border bg-surface-2">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="grid gap-3 border-b border-border px-4 py-3 last:border-b-0 md:grid-cols-[8.5rem_minmax(0,1.2fr)_minmax(0,1fr)_auto] md:items-center"
                >
                  <div>
                    <p className="section-label">Визит</p>
                    <p className="mt-1 text-body font-medium text-text-primary">
                      {formatCompactDateTime(booking.bookingDateTime)}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-body font-medium text-text-primary">
                      {getBookingCarTitle(booking)}
                    </p>
                    <p className="mt-1 truncate text-body text-text-secondary">
                      {getBookingClientName(booking)}
                    </p>
                  </div>

                  <p className="min-w-0 text-body text-text-secondary md:truncate">
                    {booking.description?.trim() || 'Без комментария'}
                  </p>

                  <div className="md:justify-self-end">
                    <Badge tone={bookingStatusMeta(booking.status).tone}>
                      {bookingStatusMeta(booking.status).label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FaCalendarAlt}
              title="Записей пока нет"
              description="Предстоящие визиты клиентов появятся здесь."
            />
          )}
        </Section>

        <Section
          title="Последние операции"
          description="Последние зафиксированные работы в компактном виде."
        >
          {operationsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-md border border-border bg-surface-2 px-4 py-3 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : recentOperations.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-border bg-surface-2">
              {recentOperations.map((operation) => {
                const statusMeta = operationStatusMeta(operation.status)

                return (
                  <div
                    key={operation.id}
                    className="grid gap-3 border-b border-border px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_7rem_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-body font-medium text-text-primary">{operation.workType}</p>
                      <p className="mt-1 truncate text-body text-text-secondary">
                        {getOperationCarTitle(operation)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-body text-text-secondary">
                        {getOperationClientName(operation)}
                      </p>
                      <p className="mt-1 text-caption text-text-muted">
                        {formatCompactDate(operation.serviceDate)}
                      </p>
                    </div>

                    <p className="text-body font-medium text-success md:text-right">
                      {formatCompactMoney(operation.cost)}
                    </p>

                    <div className="md:justify-self-end">
                      <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={FaTools}
              title="Операций пока нет"
              description="Последние зафиксированные работы появятся здесь."
            />
          )}
        </Section>
      </div>
    </Page>
  )
}
