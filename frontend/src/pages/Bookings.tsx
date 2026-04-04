import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import toast from 'react-hot-toast'
import { FaPlus, FaTimes, FaCalendarAlt, FaCar, FaPhone, FaMapMarkerAlt, FaCheck, FaClock, FaSpinner, FaTimesCircle, FaClipboardList } from 'react-icons/fa'

interface Booking {
  id: number
  bookingDateTime: string
  serviceCenter?: {
    id: number
    name: string
    address: string
    phoneNumber?: string
  }
  car?: {
    id: number
    brand: string
    model: string
    licensePlate: string
  }
  status: string
  description?: string
  contactPhone?: string
  createdAt: string
}

export default function Bookings() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    carId: '',
    serviceCenterId: '',
    bookingDateTime: '',
    description: '',
    contactPhone: '',
  })

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await apiClient.get('/bookings/my')
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

  const { data: serviceCenters } = useQuery({
    queryKey: ['service-centers'],
    queryFn: async () => {
      const response = await apiClient.get('/service-centers')
      return response.data
    },
  })

  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/bookings', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Запись создана успешно')
      setShowCreateForm(false)
      setFormData({
        carId: '',
        serviceCenterId: '',
        bookingDateTime: '',
        description: '',
        contactPhone: '',
      })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка создания записи')
    },
  })

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await apiClient.patch(`/bookings/${bookingId}/status`, null, {
        params: { status: 'CANCELLED' }
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Запись отменена')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка отмены записи')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.carId || !formData.serviceCenterId || !formData.bookingDateTime || !formData.contactPhone) {
      toast.error('Заполните все обязательные поля')
      return
    }

    createBookingMutation.mutate({
      carId: parseInt(formData.carId),
      serviceCenterId: parseInt(formData.serviceCenterId),
      bookingDateTime: formData.bookingDateTime,
      description: formData.description,
      contactPhone: formData.contactPhone,
    })
  }

  const getStatusBadge = (status: string) => {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="flex items-center gap-1">
            <FaCheck />
            Подтверждена
          </span>
        )
      case 'PENDING':
        return (
          <span className="flex items-center gap-1">
            <FaClock />
            Ожидает подтверждения
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className="flex items-center gap-1">
            <FaSpinner className="animate-spin" />
            В процессе
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1">
            <FaCheck />
            Завершена
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="flex items-center gap-1">
            <FaTimesCircle />
            Отменена
          </span>
        )
      default:
        return status
    }
  }

  const upcomingBookings = bookings?.filter((b: Booking) => 
    new Date(b.bookingDateTime) >= new Date() && b.status !== 'CANCELLED'
  ) || []

  const pastBookings = bookings?.filter((b: Booking) => 
    new Date(b.bookingDateTime) < new Date() || b.status === 'CANCELLED'
  ) || []

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <p className="mt-2 text-slate-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Мои записи</h1>
          <p className="text-slate-400">Управление записями на обслуживание</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="auto-button-primary flex items-center gap-2"
        >
          {showCreateForm ? (
            <>
              <FaTimes />
              Отмена
            </>
          ) : (
            <>
              <FaPlus />
              Новая запись
            </>
          )}
        </button>
      </div>

      {/* Форма создания записи */}
      {showCreateForm && (
        <div className="auto-card p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <FaCalendarAlt />
            Создать новую запись
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <FaCar />
                  Автомобиль *
                </label>
                <select
                  value={formData.carId}
                  onChange={(e) => setFormData({ ...formData, carId: e.target.value })}
                  required
                  className="auto-select"
                >
                  <option value="">Выберите автомобиль</option>
                  {cars?.map((car: any) => (
                    <option key={car.id} value={car.id}>
                      {car.brand} {car.model} ({car.licensePlate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Сервисный центр *
                </label>
                <select
                  value={formData.serviceCenterId}
                  onChange={(e) => setFormData({ ...formData, serviceCenterId: e.target.value })}
                  required
                  className="auto-select"
                >
                  <option value="">Выберите сервисный центр</option>
                  {serviceCenters?.map((center: any) => (
                    <option key={center.id} value={center.id}>
                      {center.name} - {center.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <FaCalendarAlt />
                  Дата и время *
                </label>
                <input
                  type="datetime-local"
                  value={formData.bookingDateTime}
                  onChange={(e) => setFormData({ ...formData, bookingDateTime: e.target.value })}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="auto-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <FaPhone />
                  Контактный телефон *
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  required
                  placeholder="+7 (XXX) XXX-XX-XX"
                  className="auto-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Описание проблемы/работы
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Опишите проблему или необходимые работы..."
                rows={4}
                className="auto-textarea"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={createBookingMutation.isPending}
                className="auto-button-primary flex items-center gap-2"
              >
                {createBookingMutation.isPending ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Создание...
                  </>
                ) : (
                  <>
                    <FaCheck />
                    Создать запись
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setFormData({
                    carId: '',
                    serviceCenterId: '',
                    bookingDateTime: '',
                    description: '',
                    contactPhone: '',
                  })
                }}
                className="auto-button-secondary"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Предстоящие записи */}
      {upcomingBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <FaCalendarAlt />
            Предстоящие записи
          </h2>
          <div className="space-y-4">
            {upcomingBookings
              .sort((a: Booking, b: Booking) => 
                new Date(a.bookingDateTime).getTime() - new Date(b.bookingDateTime).getTime()
              )
              .map((booking: Booking) => (
                <div key={booking.id} className="auto-card p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-2xl font-bold text-white">
                          {booking.serviceCenter?.name || 'Сервисный центр'}
                        </h3>
                        <span className={getStatusBadge(booking.status)}>
                          {getStatusText(booking.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start gap-2">
                          <FaCalendarAlt className="text-slate-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-slate-400 text-sm mb-1">Дата и время</p>
                            <p className="text-white font-semibold">
                              {format(new Date(booking.bookingDateTime), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                            </p>
                          </div>
                        </div>
                        {booking.car && (
                          <div className="flex items-start gap-2">
                            <FaCar className="text-slate-400 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-slate-400 text-sm mb-1">Автомобиль</p>
                              <p className="text-white font-semibold">
                                {booking.car.brand} {booking.car.model}
                              </p>
                              <p className="text-red-400 font-mono text-sm">{booking.car.licensePlate}</p>
                            </div>
                          </div>
                        )}
                        {booking.serviceCenter?.address && (
                          <div className="flex items-start gap-2">
                            <FaMapMarkerAlt className="text-slate-400 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-slate-400 text-sm mb-1">Адрес</p>
                              <p className="text-white">{booking.serviceCenter.address}</p>
                            </div>
                          </div>
                        )}
                        {booking.serviceCenter?.phoneNumber && (
                          <div className="flex items-start gap-2">
                            <FaPhone className="text-slate-400 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-slate-400 text-sm mb-1">Телефон</p>
                              <a href={`tel:${booking.serviceCenter.phoneNumber}`} className="text-red-400 hover:text-red-300">
                                {booking.serviceCenter.phoneNumber}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {booking.description && (
                        <div className="mb-4">
                          <p className="text-slate-400 text-sm mb-1">Описание</p>
                          <p className="text-white">{booking.description}</p>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      {booking.serviceCenter && (
                        <button
                          onClick={() => navigate(`/service-centers/${booking.serviceCenter?.id}`)}
                          className="auto-button-secondary text-sm whitespace-nowrap"
                        >
                          Подробнее
                        </button>
                      )}
                      {booking.status === 'PENDING' && (
                        <button
                          onClick={() => {
                            if (confirm('Вы уверены, что хотите отменить запись?')) {
                              cancelBookingMutation.mutate(booking.id)
                            }
                          }}
                          className="auto-button-danger text-sm whitespace-nowrap flex items-center gap-2"
                        >
                          <FaTimes />
                          Отменить
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Прошлые записи */}
      {pastBookings.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <FaClipboardList />
            История записей
          </h2>
          <div className="space-y-4">
            {pastBookings
              .sort((a: Booking, b: Booking) => 
                new Date(b.bookingDateTime).getTime() - new Date(a.bookingDateTime).getTime()
              )
              .map((booking: Booking) => (
                <div key={booking.id} className="auto-card p-6 opacity-75">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-white">
                          {booking.serviceCenter?.name || 'Сервисный центр'}
                        </h3>
                        <span className={getStatusBadge(booking.status)}>
                          {getStatusText(booking.status)}
                        </span>
                      </div>
                      
                      <p className="text-slate-400 mb-2">
                        {format(new Date(booking.bookingDateTime), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                      </p>
                      {booking.car && (
                        <p className="text-slate-300">
                          {booking.car.brand} {booking.car.model} ({booking.car.licensePlate})
                        </p>
                      )}
                      {booking.description && (
                        <p className="text-slate-400 mt-2 text-sm">{booking.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Пустое состояние */}
      {(!bookings || bookings.length === 0) && !showCreateForm && (
        <div className="auto-card p-12 text-center">
          <FaCalendarAlt className="text-6xl text-red-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-2xl font-bold text-white mb-4">Нет записей</h3>
          <p className="text-slate-400 mb-6">Создайте первую запись на обслуживание</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="auto-button-primary flex items-center gap-2 mx-auto"
          >
            <FaPlus />
            Создать первую запись
          </button>
        </div>
      )}
    </div>
  )
}
