import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth, addMonths, subMonths } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { FaExclamationTriangle, FaCalendarAlt, FaWrench, FaCar, FaCheckCircle, FaClock, FaSearch, FaClipboardList, FaChevronLeft, FaChevronRight, FaBolt, FaTimes } from 'react-icons/fa'
import { normalizeCollectionResponse } from '../utils/normalizeCollectionResponse'

interface Booking {
  id: number
  bookingDateTime: string
  serviceCenter?: {
    id: number
    name: string
  }
  car?: {
    id: number
    brand: string
    model: string
  }
  status: string
  description?: string
}

interface MaintenanceRecord {
  id: number
  serviceDate: string
  workType: string
  description?: string
  car?: {
    id: number
    brand: string
    model: string
  }
}

export default function MaintenanceCalendar() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications')
      return response.data
    },
  })

  const { data: cars } = useQuery({
    queryKey: ['cars'],
    queryFn: async () => {
      const response = await apiClient.get('/cars')
      return response.data
    },
  })

  const { data: bookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await apiClient.get('/bookings/my')
      return response.data
    },
  })

  const { data: maintenanceRecords } = useQuery({
    queryKey: ['maintenance-records'],
    queryFn: async () => {
      if (!cars || cars.length === 0) return []
      const records = await Promise.all(
        cars.map((car: any) =>
          apiClient
            .get(`/maintenance-records/car/${car.id}`)
            .then((r: any) => normalizeCollectionResponse<MaintenanceRecord>(r.data))
        )
      )
      return records.flat()
    },
    enabled: !!cars && cars.length > 0,
  })

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const firstDayOfWeek = monthStart.getDay()
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  const maintenanceNotifications = notifications?.filter((n: any) => 
    n.type === 'MAINTENANCE_DUE' || n.type === 'COMPONENT_WEAR' || n.type === 'MILEAGE_REMINDER'
  ) || []

  const getDayEvents = (day: Date) => {
    const events: any[] = []
    
    maintenanceNotifications.forEach((n: any) => {
      const notificationDate = new Date(n.createdAt)
      if (isSameDay(notificationDate, day)) {
        events.push({ ...n, type: 'notification', color: 'yellow' })
      }
    })
    
    bookings?.forEach((booking: Booking) => {
      const bookingDate = new Date(booking.bookingDateTime)
      if (isSameDay(bookingDate, day)) {
        events.push({ ...booking, type: 'booking', color: 'blue' })
      }
    })
    
    maintenanceRecords?.forEach((record: MaintenanceRecord) => {
      const recordDate = new Date(record.serviceDate)
      if (isSameDay(recordDate, day)) {
        events.push({ ...record, type: 'maintenance', color: 'green' })
      }
    })
    
    return events
  }

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getEventColor = (event: any) => {
    if (event.type === 'notification') {
      return event.priority === 'CRITICAL' ? 'bg-red-900/50 text-red-300 border border-red-700/50' :
             event.priority === 'HIGH' ? 'bg-orange-900/50 text-orange-300 border border-orange-700/50' :
             'bg-amber-900/50 text-amber-300 border border-amber-700/50'
    }
    if (event.type === 'booking') {
      return 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
    }
    if (event.type === 'maintenance') {
      return 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
    }
    return 'bg-slate-800 text-slate-300'
  }

  const getEventIcon = (event: any) => {
    if (event.type === 'notification') return <FaExclamationTriangle className="inline text-xs" />
    if (event.type === 'booking') return <FaCalendarAlt className="inline text-xs" />
    if (event.type === 'maintenance') return <FaWrench className="inline text-xs" />
    return '•'
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Календарь обслуживания</h1>
          <p className="text-slate-400">Планирование и отслеживание обслуживания</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={goToToday}
            className="auto-button-secondary"
          >
            Сегодня
          </button>
          <button
            onClick={goToPreviousMonth}
            className="auto-button-secondary flex items-center"
          >
            <FaChevronLeft />
          </button>
          <button
            onClick={goToNextMonth}
            className="auto-button-secondary flex items-center"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      <div className="auto-card p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          {format(currentDate, 'MMMM yyyy', { locale: ru })}
        </h2>

        {/* Легенда */}
        <div className="flex gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-amber-900/50 border border-amber-700/50 rounded"></span>
            <span className="text-slate-300">Напоминания</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-blue-900/50 border border-blue-700/50 rounded"></span>
            <span className="text-slate-300">Записи</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-emerald-900/50 border border-emerald-700/50 rounded"></span>
            <span className="text-slate-300">Обслуживание</span>
          </div>
        </div>

        {/* Календарь */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
            <div key={day} className="text-center font-semibold text-slate-300 p-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: adjustedFirstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-24"></div>
          ))}
          
          {daysInMonth.map((day) => {
            const dayEvents = getDayEvents(day)
            const isCurrentDay = isToday(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            
            return (
              <div
                key={day.toISOString()}
                className={`min-h-24 p-2 border rounded cursor-pointer transition-colors ${
                  isCurrentDay ? 'bg-red-900/30 border-red-500 ring-2 ring-red-400' : 
                  isCurrentMonth ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-slate-900/30 opacity-50'
                }`}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  isCurrentDay ? 'text-red-400' : 'text-white'
                }`}>
                  {format(day, 'd')}
                </div>
                {dayEvents.length > 0 && (
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event: any, idx: number) => (
                      <div
                        key={`${event.id || idx}-${event.type}`}
                        className={`text-xs p-1 rounded truncate ${getEventColor(event)}`}
                        title={event.message || event.description || event.title}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (event.type === 'booking') {
                            navigate('/bookings')
                          } else if (event.type === 'maintenance') {
                            navigate(`/cars/${event.car?.id}/history`)
                          }
                        }}
                      >
                        <span className="inline-flex items-center gap-1">{getEventIcon(event)} {event.title || event.workType || 'Событие'}</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-slate-400">
                        +{dayEvents.length - 2} еще
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Предстоящие события */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Предстоящие напоминания */}
        <div className="auto-card p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <FaExclamationTriangle className="text-red-500" />
            Предстоящие напоминания
          </h2>
          <div className="space-y-3">
            {maintenanceNotifications
              .filter((n: any) => new Date(n.createdAt) >= new Date())
              .slice(0, 5)
              .map((notification: any) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    notification.priority === 'CRITICAL' ? 'border-red-500 bg-red-900/20' :
                    notification.priority === 'HIGH' ? 'border-orange-500 bg-orange-900/20' :
                    'border-amber-500 bg-amber-900/20'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">{notification.title}</h3>
                      <p className="text-slate-300 mt-1 text-sm">{notification.message}</p>
                      {notification.car && (
                        <p className="text-sm text-slate-400 mt-1">
                          <FaCar className="inline mr-1" /> {notification.car.brand} {notification.car.model}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-slate-400 whitespace-nowrap ml-4">
                      {format(new Date(notification.createdAt), 'dd MMM', { locale: ru })}
                    </span>
                  </div>
                </div>
              ))}
            {maintenanceNotifications.filter((n: any) => new Date(n.createdAt) >= new Date()).length === 0 && (
              <p className="text-slate-400 text-center py-4">Нет предстоящих напоминаний</p>
            )}
          </div>
        </div>

        {/* Предстоящие записи */}
        <div className="auto-card p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <FaCalendarAlt className="text-blue-500" />
            Предстоящие записи
          </h2>
          <div className="space-y-3">
            {bookings
              ?.filter((b: Booking) => new Date(b.bookingDateTime) >= new Date())
              .sort((a: Booking, b: Booking) => 
                new Date(a.bookingDateTime).getTime() - new Date(b.bookingDateTime).getTime()
              )
              .slice(0, 5)
              .map((booking: Booking) => (
                <div
                  key={booking.id}
                  className="p-4 rounded-lg border-l-4 border-blue-500 bg-blue-900/20"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">
                        {booking.serviceCenter?.name || 'Сервисный центр'}
                      </h3>
                      <p className="text-slate-300 mt-1 text-sm">
                        {format(new Date(booking.bookingDateTime), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                      </p>
                      {booking.car && (
                        <p className="text-sm text-slate-400 mt-1">
                          <FaCar className="inline mr-1" /> {booking.car.brand} {booking.car.model}
                        </p>
                      )}
                      <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                        booking.status === 'CONFIRMED' ? 'auto-badge-success' :
                        booking.status === 'PENDING' ? 'auto-badge-warning' :
                        booking.status === 'CANCELLED' ? 'auto-badge-danger' :
                        'auto-badge'
                      }`}>
                        {booking.status === 'CONFIRMED' ? (
                          <span className="flex items-center gap-1"><FaCheckCircle /> Подтверждена</span>
                        ) : booking.status === 'PENDING' ? (
                          <span className="flex items-center gap-1"><FaClock /> Ожидает</span>
                        ) : booking.status === 'CANCELLED' ? (
                          <span className="flex items-center gap-1"><FaTimes /> Отменена</span>
                        ) : (
                          booking.status
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            {(!bookings || bookings.filter((b: Booking) => new Date(b.bookingDateTime) >= new Date()).length === 0) && (
              <p className="text-slate-400 text-center py-4">Нет предстоящих записей</p>
            )}
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="mt-6 auto-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <FaBolt className="text-yellow-500" />
          Быстрые действия
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/service-centers')}
            className="auto-button-primary"
          >
            <FaSearch className="inline mr-2" /> Найти сервисный центр
          </button>
          <button
            onClick={() => navigate('/bookings')}
            className="auto-button-success"
          >
            <FaCalendarAlt className="inline mr-2" /> Мои записи
          </button>
          <button
            onClick={() => navigate('/maintenance-history')}
            className="auto-button-secondary"
          >
            <FaClipboardList className="inline mr-2" /> История обслуживания
          </button>
        </div>
      </div>
    </div>
  )
}
