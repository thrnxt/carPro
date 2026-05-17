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
  HeroCard,
  KeyValue,
  Page,
  PageHeader,
  Section,
  SectionGrid,
  StatCard,
  Surface,
  cx,
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

  return (
    <Page>
      <PageHeader
        eyebrow="Cabinet overview"
        title={`Добро пожаловать, ${user?.firstName || 'пользователь'}`}
        description="Следите за гаражом, обслуживанием, уведомлениями и ближайшими сервисными действиями в одном рабочем контуре."
        actions={
          <>
            <Link to="/garage" className="auto-button-primary">
              <FaPlus />
              Добавить автомобиль
            </Link>
            <Link to="/service-centers" className="auto-button-secondary">
              <FaWrench />
              Найти сервис
            </Link>
          </>
        }
      />

      <SectionGrid className="xl:grid-cols-4">
        <StatCard
          icon={FaCar}
          label="Автомобили"
          value={cars.length}
          meta="Подключены к вашему гаражу"
          tone="text-[#ff9b82]"
        />
        <StatCard
          icon={FaBell}
          label="Уведомления"
          value={unreadCount}
          meta="Непрочитанные напоминания и обновления"
          tone="text-sky-300"
        />
        <StatCard
          icon={FaCalendarAlt}
          label="Контур обслуживания"
          value={cars.length > 0 ? 'Активен' : 'Пусто'}
          meta={cars.length > 0 ? 'Можно работать с календарем, сервисами и документами' : 'Сначала добавьте автомобиль'}
          tone="text-emerald-300"
        />
        <StatCard
          icon={FaFileInvoiceDollar}
          label="Документы"
          value="Единый доступ"
          meta="Операции, счета и история доступны из общего кабинета"
          tone="text-violet-300"
        />
      </SectionGrid>

      <HeroCard
        eyebrow="Workspace"
        title="Гараж, сервисы и документы в одном потоке"
        description="Новый shell собран как рабочий кабинет: меньше учебной визуальности, больше операционной ясности и сканируемых поверхностей."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/bookings" className="auto-button-primary">
              <FaCalendarAlt />
              Мои записи
            </Link>
            <Link to="/my-documents" className="auto-button-secondary">
              <FaFileInvoiceDollar />
              Документы
            </Link>
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <Surface>
            <KeyValue label="Статус workspace" value="Онлайн" />
            <KeyValue label="Контур данных" value={cars.length > 0 ? `${cars.length} авто` : 'Нет авто'} className="mt-3" />
          </Surface>
          <Surface>
            <KeyValue label="Следующий шаг" value={cars.length > 0 ? 'Проверить сервисы' : 'Добавить VIN'} />
            <KeyValue label="Уведомления" value={`${unreadCount} активных`} className="mt-3" />
          </Surface>
          <Surface>
            <KeyValue label="Операции и счета" value="Доступны" />
            <KeyValue label="История обслуживания" value="В кабинете" className="mt-3" />
          </Surface>
        </div>
      </HeroCard>

      <Section
        title="Автомобили в гараже"
        description="Карточки автомобиля стали спокойнее и плотнее: важные атрибуты видны сразу, без лишнего шума."
        actions={
          <Link to="/garage" className="auto-button-secondary">
            Открыть гараж
          </Link>
        }
      >
        {cars.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cars.map((car: any) => (
              <Link key={car.id} to={`/cars/${car.id}`} className="auto-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-400">Автомобиль</p>
                    <h3 className="truncate text-2xl font-bold tracking-[-0.05em] text-white">
                      {car.brand} {car.model}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">{car.year} год выпуска</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#ff9b82]">
                    <FaCar />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 rounded-[1.35rem] border border-white/10 bg-white/5 p-4 text-sm">
                  <KeyValue label="Пробег" value={`${car.mileage?.toLocaleString('ru-RU') || 0} км`} />
                  <KeyValue
                    label="Гос. номер"
                    value={car.licensePlate ? <span className="font-mono text-[#ff9b82]">{car.licensePlate}</span> : 'Не указан'}
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
                  <span className="text-sm font-semibold text-slate-300">Открыть</span>
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
              <Link to="/garage" className="auto-button-primary">
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
      tone: 'text-[#ff9b82]',
    },
    {
      label: 'Ожидают',
      value: pendingBookings.length,
      meta: 'Ждут подтверждения',
      icon: FaClock,
      tone: 'text-amber-300',
    },
    {
      label: 'Клиенты',
      value: clients.length,
      meta: 'В базе сервиса',
      icon: FaUsers,
      tone: 'text-sky-300',
    },
    {
      label: 'Операции',
      value: operations.length,
      meta: 'Зафиксировано',
      icon: FaTools,
      tone: 'text-emerald-300',
    },
    {
      label: 'Рейтинг',
      value: serviceCenter?.rating ? serviceCenter.rating.toFixed(1) : '—',
      meta: 'Средняя оценка',
      icon: FaStar,
      tone: 'text-yellow-300',
    },
  ]

  return (
    <Page>
      <section className="auto-card p-5 sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="min-w-0 max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Сервисный центр
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-[2rem] font-bold tracking-[-0.04em] text-white sm:text-[2.35rem]">
                {serviceCenter?.name || 'Панель сервисного центра'}
              </h1>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Обзор
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {overviewMetrics.map((metric) => {
            const Icon = metric.icon

            return (
              <div
                key={metric.label}
                className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_34px_-30px_rgba(2,6,23,0.78)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {metric.label}
                    </p>
                    <p className="mt-3 text-[2.15rem] font-bold leading-none tracking-[-0.04em] text-white">
                      {metric.value}
                    </p>
                  </div>
                  <div
                    className={cx(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950/35 text-lg',
                      metric.tone
                    )}
                  >
                    <Icon />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{metric.meta}</p>
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Section
          title="Ближайшие записи"
          description="Короткий список ближайших визитов."
          className="p-5 sm:p-6"
        >
          {upcomingBookings.length > 0 ? (
            <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.03]">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="grid gap-3 border-b border-white/10 px-4 py-3 last:border-b-0 md:grid-cols-[8.5rem_minmax(0,1.2fr)_minmax(0,1fr)_auto] md:items-center"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Визит
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatCompactDateTime(booking.bookingDateTime)}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {getBookingCarTitle(booking)}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-400">
                      {getBookingClientName(booking)}
                    </p>
                  </div>

                  <p className="min-w-0 text-sm text-slate-400 md:truncate">
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
            <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-slate-400">
              Предстоящих записей пока нет.
            </div>
          )}
        </Section>

        <Section
          title="Последние операции"
          description="Последние зафиксированные работы в компактном виде."
          className="p-5 sm:p-6"
        >
          {recentOperations.length > 0 ? (
            <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.03]">
              {recentOperations.map((operation) => {
                const statusMeta = getOperationStatusMeta(operation.status)

                return (
                  <div
                    key={operation.id}
                    className="grid gap-3 border-b border-white/10 px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_7rem_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{operation.workType}</p>
                      <p className="mt-1 truncate text-sm text-slate-400">
                        {getOperationCarTitle(operation)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-300">
                        {getOperationClientName(operation)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatCompactDate(operation.serviceDate)}
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-emerald-300 md:text-right">
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
            <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-slate-400">
              Операций пока нет.
            </div>
          )}
        </Section>
      </div>
    </Page>
  )
}
