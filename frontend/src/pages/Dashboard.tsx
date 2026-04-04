import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import apiClient from '../api/client'
import { Link } from 'react-router-dom'
import {
  FaBell,
  FaCalendarAlt,
  FaCar,
  FaCarSide,
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaCog,
  FaFileInvoiceDollar,
  FaPlus,
  FaStar,
  FaTools,
  FaUsers,
} from 'react-icons/fa'

interface ServiceCenterProfile {
  id: number
  name: string
  rating?: number
}

interface ServiceCenterBooking {
  id: number
  bookingDateTime: string
  status: string
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

export default function Dashboard() {
  const { user } = useAuthStore()
  const isServiceCenter = user?.role === 'SERVICE_CENTER'

  const { data: cars } = useQuery({
    queryKey: ['cars'],
    queryFn: async () => {
      const response = await apiClient.get('/cars')
      return response.data
    },
    enabled: !isServiceCenter,
  })

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications/unread-count')
      return response.data
    },
  })

  if (isServiceCenter) {
    return <ServiceCenterDashboard />
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Добро пожаловать, {user?.firstName}!</h1>
        <p className="text-slate-400 text-lg">Управляйте своими автомобилями и обслуживанием</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="auto-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-300">Автомобили</h2>
            <FaCar className="text-3xl text-red-500" />
          </div>
          <p className="text-4xl font-bold text-red-400 mb-2">{cars?.length || 0}</p>
          <p className="text-sm text-slate-400">в гараже</p>
        </div>

        <div className="auto-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-300">Уведомления</h2>
            <FaBell className="text-3xl text-amber-500" />
          </div>
          <p className="text-4xl font-bold text-amber-400 mb-2">{unreadCount || 0}</p>
          <p className="text-sm text-slate-400">непрочитанных</p>
        </div>

        <div className="auto-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-300">Статус</h2>
            <FaCheckCircle className="text-3xl text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-400 mb-2">Активен</p>
          <p className="text-sm text-slate-400">Все системы работают</p>
        </div>
      </div>

      <div className="auto-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Мои автомобили</h2>
          <Link to="/garage" className="auto-button-primary text-sm flex items-center gap-2">
            <FaPlus />
            Добавить авто
          </Link>
        </div>
        {cars && cars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cars.map((car: any) => (
              <Link
                key={car.id}
                to={`/cars/${car.id}`}
                className="auto-card p-5 hover:scale-105 transition-transform cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-slate-400 text-sm">{car.year} год</p>
                  </div>
                  <FaCarSide className="text-3xl text-red-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Пробег:</span>
                    <span className="text-white font-semibold">{car.mileage?.toLocaleString()} км</span>
                  </div>
                  {car.licensePlate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Номер:</span>
                      <span className="text-red-400 font-mono font-bold">{car.licensePlate}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <span className="text-red-400 text-sm font-medium flex items-center gap-2">
                    Подробнее <span>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FaCar className="text-6xl text-red-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 text-lg mb-6">У вас пока нет автомобилей</p>
            <Link to="/garage" className="auto-button-primary inline-block">
              Добавить первый автомобиль
            </Link>
          </div>
        )}
      </div>
    </div>
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

  const { data: bookings } = useQuery<ServiceCenterBooking[]>({
    queryKey: ['service-center-bookings', serviceCenter?.id],
    queryFn: async () => {
      const response = await apiClient.get(`/bookings/service-center/${serviceCenter?.id}`)
      return response.data
    },
    enabled: !!serviceCenter?.id,
  })

  const { data: clients } = useQuery<ServiceCenterClient[]>({
    queryKey: ['service-center-clients', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/service-center-clients/my')
      return response.data
    },
    enabled: !!serviceCenter?.id,
  })

  const { data: operations } = useQuery<ServiceCenterOperation[]>({
    queryKey: ['service-center-operations', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/maintenance-records/service-center/my')
      return response.data
    },
    enabled: !!serviceCenter?.id,
  })

  const bookingsList = bookings || []
  const operationsList = operations || []

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const todayBookings = bookingsList.filter((booking) => {
    const bookingDate = new Date(booking.bookingDateTime)
    return bookingDate >= todayStart && bookingDate < tomorrowStart
  })

  const pendingBookings = bookingsList.filter((booking) => booking.status === 'PENDING')

  const upcomingBookings = useMemo(
    () =>
      bookingsList
        .filter((booking) => new Date(booking.bookingDateTime) >= now)
        .sort(
          (a, b) =>
            new Date(a.bookingDateTime).getTime() - new Date(b.bookingDateTime).getTime()
        )
        .slice(0, 5),
    [bookingsList, now]
  )

  const recentOperations = useMemo(
    () =>
      operationsList
        .slice()
        .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())
        .slice(0, 5),
    [operationsList]
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Панель управления сервисом</h1>
        <p className="text-slate-400 text-lg">Клиенты, записи и выполненные операции</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="service-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Записи сегодня</h2>
            <FaCalendarAlt className="text-xl text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-700">{todayBookings.length}</p>
        </div>

        <div className="service-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Ожидают</h2>
            <FaClock className="text-xl text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-amber-700">{pendingBookings.length}</p>
        </div>

        <div className="service-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Клиенты</h2>
            <FaUsers className="text-xl text-indigo-600" />
          </div>
          <p className="text-3xl font-bold text-indigo-700">{(clients || []).length}</p>
        </div>

        <div className="service-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Операции</h2>
            <FaTools className="text-xl text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-700">{operationsList.length}</p>
        </div>

        <div className="service-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Рейтинг</h2>
            <FaStar className="text-xl text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-700">
            {serviceCenter?.rating ? serviceCenter.rating.toFixed(1) : '—'}
          </p>
        </div>
      </div>

      <div className="service-card p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Link to="/service-center/bookings" className="service-button flex items-center justify-center gap-2">
            <FaClipboardList />
            Записи
          </Link>
          <Link to="/service-center/clients" className="service-button flex items-center justify-center gap-2">
            <FaUsers />
            Клиенты
          </Link>
          <Link to="/service-center/operations" className="service-button flex items-center justify-center gap-2">
            <FaTools />
            Операции
          </Link>
          <Link to="/service-center/invoices" className="service-button flex items-center justify-center gap-2">
            <FaFileInvoiceDollar />
            Счета
          </Link>
          <Link to="/service-center/settings" className="service-button flex items-center justify-center gap-2">
            <FaCog />
            Настройки
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="service-card p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Ближайшие записи</h2>
          {upcomingBookings.length === 0 ? (
            <p className="text-slate-600">Пока нет предстоящих записей</p>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-lg p-4 border border-blue-100">
                  <p className="text-slate-900 font-semibold">
                    {booking.car?.brand} {booking.car?.model}
                    {booking.car?.licensePlate ? ` (${booking.car.licensePlate})` : ''}
                  </p>
                  <p className="text-slate-700 text-sm">
                    Клиент: {booking.car?.owner?.firstName} {booking.car?.owner?.lastName}
                  </p>
                  <p className="text-slate-600 text-sm">
                    {new Date(booking.bookingDateTime).toLocaleString('ru-RU')} • {booking.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="service-card p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Последние операции</h2>
          {recentOperations.length === 0 ? (
            <p className="text-slate-600">Пока нет операций</p>
          ) : (
            <div className="space-y-3">
              {recentOperations.map((operation) => (
                <div key={operation.id} className="bg-white rounded-lg p-4 border border-blue-100">
                  <p className="text-slate-900 font-semibold">{operation.workType}</p>
                  <p className="text-slate-700 text-sm">
                    {operation.car?.brand} {operation.car?.model}
                    {operation.car?.licensePlate ? ` (${operation.car.licensePlate})` : ''}
                  </p>
                  <p className="text-slate-700 text-sm">
                    Клиент: {operation.car?.owner?.firstName} {operation.car?.owner?.lastName}
                  </p>
                  <p className="text-slate-600 text-sm">{operation.serviceDate}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
