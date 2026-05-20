import { useMemo } from 'react'
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
  StatCard,
} from '../components/ui'
import { type ServiceOperationCardData } from '../components/ServiceOperationCard'

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

function getBookingBadge(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return 'auto-badge-success'
    case 'PENDING':
      return 'auto-badge-warning'
    case 'IN_PROGRESS':
      return 'auto-badge-info'
    case 'COMPLETED':
      return 'auto-badge-success'
    case 'CANCELLED':
      return 'auto-badge-danger'
    default:
      return 'auto-badge'
  }
}

function getBookingStatusLabel(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return 'Подтверждено'
    case 'PENDING':
      return 'Ожидает'
    case 'IN_PROGRESS':
      return 'В работе'
    case 'COMPLETED':
      return 'Завершено'
    case 'CANCELLED':
      return 'Отменено'
    default:
      return status || 'Без статуса'
  }
}

function getOperationStatusMeta(status?: string) {
  switch (status) {
    case 'COMPLETED':
      return { label: 'Завершено', tone: 'auto-badge-success' }
    case 'IN_PROGRESS':
      return { label: 'В работе', tone: 'auto-badge-info' }
    case 'SCHEDULED':
      return { label: 'Запланировано', tone: 'auto-badge-warning' }
    case 'CANCELLED':
      return { label: 'Отменено', tone: 'auto-badge-danger' }
    default:
      return { label: status || 'Без статуса', tone: 'auto-badge' }
  }
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

  const { data: cars = [] } = useQuery({
    queryKey: ['cars'],
    queryFn: async () => {
      const response = await apiClient.get('/cars')
      return response.data
    },
  })

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications/unread-count')
      return response.data
    },
  })

  const hasCars = cars.length > 0
  const nextAction = !hasCars
    ? {
        eyebrow: 'Следующий шаг',
        title: 'Добавьте первый автомобиль',
        description: 'После добавления авто откроются календарь обслуживания, сервисные записи, документы и персональные напоминания.',
        primaryTo: '/garage',
        primaryLabel: 'Добавить автомобиль',
        PrimaryIcon: FaPlus,
        secondaryTo: '/service-centers',
        secondaryLabel: 'Посмотреть сервисы',
        SecondaryIcon: FaWrench,
      }
    : unreadCount > 0
      ? {
          eyebrow: 'Требует внимания',
          title: `${unreadCount} уведомлений ждут реакции`,
          description: 'Проверьте напоминания по обслуживанию и статусам, чтобы не пропустить важные действия по автомобилю.',
          primaryTo: '/notifications',
          primaryLabel: 'Открыть уведомления',
          PrimaryIcon: FaBell,
          secondaryTo: '/bookings',
          secondaryLabel: 'Мои записи',
          SecondaryIcon: FaCalendarAlt,
        }
      : {
          eyebrow: 'Гараж готов',
          title: 'Запланируйте следующий сервисный визит',
          description: 'Выберите сервисный центр рядом с вами и создайте запись, чтобы держать обслуживание под контролем.',
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
      <PageHeader
        eyebrow="Кабинет"
        title={`Добро пожаловать, ${user?.firstName || 'пользователь'}`}
        description="Главные действия по гаражу, сервисам и документам собраны в одном рабочем кабинете."
      />

      <NextActionCard
        eyebrow={nextAction.eyebrow}
        title={nextAction.title}
        description={nextAction.description}
        primaryAction={
          <Link to={nextAction.primaryTo} className="btn-primary">
            <ClientPrimaryIcon />
            {nextAction.primaryLabel}
          </Link>
        }
        secondaryAction={
          <Link to={nextAction.secondaryTo} className="btn-secondary">
            <ClientSecondaryIcon />
            {nextAction.secondaryLabel}
          </Link>
        }
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge tone={hasCars ? 'auto-badge-success' : 'auto-badge-warning'}>
              {hasCars ? `${cars.length} авто в гараже` : 'Гараж пуст'}
            </Badge>
            <Badge tone={unreadCount > 0 ? 'auto-badge-warning' : 'auto-badge'}>
              {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Уведомлений нет'}
            </Badge>
          </div>
        }
      />

      <SectionGrid className="xl:grid-cols-4">
        <StatCard
          icon={FaCar}
          label="Автомобили"
          value={cars.length}
          meta="Подключены к вашему гаражу"
        />
        <StatCard
          icon={FaBell}
          label="Уведомления"
          value={unreadCount}
          meta="Непрочитанные напоминания и обновления"
        />
        <StatCard
          icon={FaCalendarAlt}
          label="Обслуживание"
          value={hasCars ? 'Готово' : 'Ожидает'}
          meta={hasCars ? 'Можно создавать записи и напоминания' : 'Нужен первый автомобиль'}
        />
        <StatCard
          icon={FaFileInvoiceDollar}
          label="Документы"
          value={hasCars ? 'Доступны' : 'После авто'}
          meta="Счета, операции и история обслуживания"
        />
      </SectionGrid>

      <Section
        title="Автомобили в гараже"
        description="Ключевые данные по каждому автомобилю доступны без лишнего визуального шума."
        actions={
          <Link to="/garage" className="btn-secondary">
            Открыть гараж
          </Link>
        }
      >
        {cars.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {cars.map((car: any) => (
              <Link key={car.id} to={`/cars/${car.id}`} className="auto-card p-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="section-label">Автомобиль</p>
                    <h3 className="truncate text-h2 text-text-primary">
                      {car.brand} {car.model}
                    </h3>
                    <p className="mt-1 text-body text-text-secondary">{car.year} год выпуска</p>
                  </div>
                  <div className="metric-icon">
                    <FaCar />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 rounded-md border border-border bg-surface-3 p-4 text-body">
                  <KeyValue label="Пробег" value={`${car.mileage?.toLocaleString('ru-RU') || 0} км`} />
                  <KeyValue
                    label="Гос. номер"
                    value={car.licensePlate ? <span className="font-mono text-info">{car.licensePlate}</span> : 'Не указан'}
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
                  <span className="text-body font-medium text-text-secondary">Открыть</span>
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
  const { data: serviceCenter } = useQuery<ServiceCenterProfile>({
    queryKey: ['service-center', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/service-centers/my')
      return response.data
    },
  })

  const { data: bookings = [] } = useQuery<ServiceCenterBooking[]>({
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

  const { data: operations = [] } = useQuery<ServiceOperationCardData[]>({
    queryKey: ['service-center-operations', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/maintenance-records/service-center/my')
      return response.data
    },
    enabled: !!serviceCenter?.id,
  })

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

      <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
        <Section
          title="Ближайшие записи"
          description="Короткий список ближайших визитов."
        >
          {upcomingBookings.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-border bg-surface-2">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="grid gap-3 border-b border-border px-4 py-3 last:border-b-0 md:grid-cols-[8.5rem_minmax(0,1.2fr)_minmax(0,1fr)_auto] md:items-center"
                >
                  <div>
                    <p className="section-label">
                      Визит
                    </p>
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
                    <Badge tone={getBookingBadge(booking.status)}>
                      {getBookingStatusLabel(booking.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-surface-2 px-4 py-5 text-body text-text-secondary">
              Предстоящих записей пока нет.
            </div>
          )}
        </Section>

        <Section
          title="Последние операции"
          description="Последние зафиксированные работы в компактном виде."
        >
          {recentOperations.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-border bg-surface-2">
              {recentOperations.map((operation) => {
                const statusMeta = getOperationStatusMeta(operation.status)

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
            <div className="rounded-md border border-dashed border-border bg-surface-2 px-4 py-5 text-body text-text-secondary">
              Операций пока нет.
            </div>
          )}
        </Section>
      </div>
    </Page>
  )
}
