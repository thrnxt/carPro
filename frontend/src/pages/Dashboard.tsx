import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  FaBell,
  FaCalendarAlt,
  FaCar,
  FaClipboardList,
  FaClock,
  FaCog,
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
} from '../components/ui'

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

interface ServiceCenterOperation {
  id: number
  serviceDate: string
  workType: string
  car?: {
    brand?: string
    model?: string
    licensePlate?: string
    owner?: {
      firstName?: string
      lastName?: string
    }
  }
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

  const { data: operations = [] } = useQuery<ServiceCenterOperation[]>({
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
        .slice(0, 5),
    [bookings, now]
  )

  const recentOperations = useMemo(
    () =>
      operations
        .slice()
        .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())
        .slice(0, 5),
    [operations]
  )

  return (
    <Page>
      <PageHeader
        eyebrow="Service operations"
        title={serviceCenter?.name || 'Панель сервисного центра'}
        description="Роль сервисного центра собрана как B2B workspace: записи, клиенты, операции, счета и рейтинг сканируются без визуального шума."
        actions={
          <>
            <Link to="/service-center/operations" className="auto-button-primary">
              <FaTools />
              Новая операция
            </Link>
            <Link to="/service-center/invoices" className="auto-button-secondary">
              <FaFileInvoiceDollar />
              Счета
            </Link>
          </>
        }
      />

      <SectionGrid className="xl:grid-cols-5">
        <StatCard
          icon={FaCalendarAlt}
          label="Записи сегодня"
          value={todayBookings.length}
          meta="Задачи текущего дня"
          tone="text-[#ff9b82]"
        />
        <StatCard
          icon={FaClock}
          label="Ожидают"
          value={pendingBookings.length}
          meta="Неподтвержденные визиты"
          tone="text-amber-300"
        />
        <StatCard
          icon={FaUsers}
          label="Клиенты"
          value={clients.length}
          meta="Контакты в базе сервиса"
          tone="text-sky-300"
        />
        <StatCard
          icon={FaTools}
          label="Операции"
          value={operations.length}
          meta="Зафиксированные работы"
          tone="text-emerald-300"
        />
        <StatCard
          icon={FaStar}
          label="Рейтинг"
          value={serviceCenter?.rating ? serviceCenter.rating.toFixed(1) : '—'}
          meta="Средняя оценка сервиса"
          tone="text-yellow-300"
        />
      </SectionGrid>

      <HeroCard
        eyebrow="Dispatch"
        title="Операционный контур сервиса"
        description="Приоритеты дня, поток записей и выполненные операции собраны в одном экране без переключения между разрозненными модулями."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/service-center/bookings" className="auto-button-primary">
              <FaClipboardList />
              Записи
            </Link>
            <Link to="/service-center/clients" className="auto-button-secondary">
              <FaUsers />
              Клиенты
            </Link>
            <Link to="/service-center/settings" className="auto-button-secondary">
              <FaCog />
              Настройки
            </Link>
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <Surface>
            <KeyValue label="Сегодня" value={`${todayBookings.length} записей`} />
            <KeyValue label="В ожидании" value={`${pendingBookings.length} визитов`} className="mt-3" />
          </Surface>
          <Surface>
            <KeyValue label="Клиентская база" value={`${clients.length} клиентов`} />
            <KeyValue label="Работы" value={`${operations.length} операций`} className="mt-3" />
          </Surface>
          <Surface>
            <KeyValue label="Рейтинг" value={serviceCenter?.rating ? serviceCenter.rating.toFixed(1) : '—'} />
            <KeyValue label="Контур" value="Активен" className="mt-3" />
          </Surface>
        </div>
      </HeroCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Ближайшие записи" description="Самые актуальные визиты и клиенты на горизонте сервиса.">
          {upcomingBookings.length > 0 ? (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <Surface key={booking.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white">
                        {booking.car?.brand} {booking.car?.model}
                        {booking.car?.licensePlate ? ` (${booking.car.licensePlate})` : ''}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Клиент: {booking.car?.owner?.firstName} {booking.car?.owner?.lastName}
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        {new Date(booking.bookingDateTime).toLocaleString('ru-RU')}
                      </p>
                      {booking.description && (
                        <p className="mt-3 text-sm leading-6 text-slate-400">{booking.description}</p>
                      )}
                    </div>
                    <Badge tone={getBookingBadge(booking.status)}>{booking.status}</Badge>
                  </div>
                </Surface>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FaCalendarAlt}
              title="Нет предстоящих записей"
              description="Когда клиенты начнут бронировать визиты, ближайшие записи появятся здесь."
            />
          )}
        </Section>

        <Section title="Последние операции" description="Свежие выполненные работы для быстрой проверки и контроля качества.">
          {recentOperations.length > 0 ? (
            <div className="space-y-4">
              {recentOperations.map((operation) => (
                <Surface key={operation.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{operation.workType}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {operation.car?.brand} {operation.car?.model}
                        {operation.car?.licensePlate ? ` (${operation.car.licensePlate})` : ''}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Клиент: {operation.car?.owner?.firstName} {operation.car?.owner?.lastName}
                      </p>
                    </div>
                    <Badge tone="auto-badge-success">{operation.serviceDate}</Badge>
                  </div>
                </Surface>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FaTools}
              title="Операции пока не зафиксированы"
              description="После создания сервисных работ последние операции появятся в этом блоке."
            />
          )}
        </Section>
      </div>
    </Page>
  )
}
