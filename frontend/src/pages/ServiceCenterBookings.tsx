import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import { FaCalendarAlt, FaCar, FaCheck, FaClock, FaTimes } from 'react-icons/fa'

interface ServiceCenter {
  id: number
  name: string
}

interface Booking {
  id: number
  bookingDateTime: string
  status: string
  description?: string
  contactPhone?: string
  car?: {
    brand?: string
    model?: string
    licensePlate?: string
    owner?: {
      firstName?: string
      lastName?: string
      phoneNumber?: string
    }
  }
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  PENDING: 'auto-badge-warning',
  CONFIRMED: 'auto-badge-success',
  IN_PROGRESS: 'auto-badge-info',
  COMPLETED: 'auto-badge-success',
  CANCELLED: 'auto-badge-danger',
}

export default function ServiceCenterBookings() {
  const queryClient = useQueryClient()

  const { data: serviceCenter } = useQuery<ServiceCenter>({
    queryKey: ['service-center', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/service-centers/my')
      return response.data
    },
  })

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ['service-center-bookings', serviceCenter?.id],
    queryFn: async () => {
      const response = await apiClient.get(`/bookings/service-center/${serviceCenter?.id}`)
      return response.data
    },
    enabled: !!serviceCenter?.id,
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {
      const response = await apiClient.patch(`/bookings/${bookingId}/status`, null, {
        params: { status },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-center-bookings', serviceCenter?.id] })
      toast.success('Статус обновлён')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Не удалось обновить статус')
    },
  })

  const sortedBookings = (bookings || []).slice().sort((a, b) => {
    return new Date(a.bookingDateTime).getTime() - new Date(b.bookingDateTime).getTime()
  })

  const getActions = (booking: Booking) => {
    if (booking.status === 'PENDING') {
      return ['CONFIRMED', 'CANCELLED']
    }
    if (booking.status === 'CONFIRMED') {
      return ['IN_PROGRESS', 'CANCELLED']
    }
    if (booking.status === 'IN_PROGRESS') {
      return ['COMPLETED']
    }
    return []
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <p className="mt-2 text-slate-400">Загрузка записей...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Записи клиентов</h1>
        <p className="text-slate-400">
          {serviceCenter?.name ? `Сервис: ${serviceCenter.name}` : 'Управление записями на обслуживание'}
        </p>
      </div>

      {sortedBookings.length === 0 ? (
        <div className="auto-card p-10 text-center">
          <FaCalendarAlt className="text-6xl text-red-500 mx-auto mb-4 opacity-50" />
          <p className="text-slate-300 text-lg">Пока нет записей</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedBookings.map((booking) => (
            <div key={booking.id} className="auto-card p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaCar className="text-red-500" />
                    {booking.car?.brand} {booking.car?.model}
                    <span className="text-red-400 text-base">({booking.car?.licensePlate})</span>
                  </h3>
                  <p className="text-slate-300">
                    Клиент: {booking.car?.owner?.firstName} {booking.car?.owner?.lastName}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {new Date(booking.bookingDateTime).toLocaleString('ru-RU')}
                  </p>
                  {booking.description && <p className="text-slate-300">{booking.description}</p>}
                  {booking.contactPhone && (
                    <p className="text-slate-400 text-sm">Контактный телефон: {booking.contactPhone}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className={STATUS_BADGE_CLASSES[booking.status] || 'auto-badge'}>
                    {STATUS_LABELS[booking.status] || booking.status}
                  </span>
                  {getActions(booking).map((status) => (
                    <button
                      key={status}
                      onClick={() => updateStatusMutation.mutate({ bookingId: booking.id, status })}
                      disabled={updateStatusMutation.isPending}
                      className={status === 'CANCELLED' ? 'auto-button-danger text-sm' : 'auto-button-primary text-sm'}
                    >
                      {status === 'CANCELLED' ? (
                        <span className="flex items-center gap-1">
                          <FaTimes />
                          Отменить
                        </span>
                      ) : status === 'CONFIRMED' ? (
                        <span className="flex items-center gap-1">
                          <FaCheck />
                          Подтвердить
                        </span>
                      ) : status === 'IN_PROGRESS' ? (
                        <span className="flex items-center gap-1">
                          <FaClock />
                          В работу
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <FaCheck />
                          Завершить
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
