import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FaCalendarAlt,
  FaCar,
  FaCheck,
  FaClock,
  FaPhoneAlt,
  FaTimes,
} from 'react-icons/fa'
import apiClient from '../api/client'
import { Badge, EmptyState, Page, PageHeader, Section, cx } from '../components/ui'

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

type BookingStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

const STATUS_LABELS: Record<Exclude<BookingStatus, 'ALL'>, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
}

const STATUS_BADGE_CLASSES: Record<Exclude<BookingStatus, 'ALL'>, string> = {
  PENDING: 'auto-badge-warning',
  CONFIRMED: 'auto-badge-success',
  IN_PROGRESS: 'auto-badge-info',
  COMPLETED: 'auto-badge-success',
  CANCELLED: 'auto-badge-danger',
}

const STATUS_FILTER_OPTIONS: Array<{ value: BookingStatus; label: string }> = [
  { value: 'ALL', label: 'Все статусы' },
  { value: 'PENDING', label: 'Ожидают' },
  { value: 'CONFIRMED', label: 'Подтверждены' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'COMPLETED', label: 'Завершены' },
  { value: 'CANCELLED', label: 'Отменены' },
]

function formatBookingDateTime(value: string) {
  try {
    return new Date(value).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function getTextPreview(value?: string, maxLength = 120) {
  if (!value?.trim()) {
    return 'Без комментария'
  }

  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`
}

function getCarTitle(booking: Booking) {
  const baseTitle = `${booking.car?.brand || ''} ${booking.car?.model || ''}`.trim()
  return baseTitle
    ? `${baseTitle}${booking.car?.licensePlate ? ` (${booking.car.licensePlate})` : ''}`
    : 'Автомобиль не указан'
}

function getClientName(booking: Booking) {
  return `${booking.car?.owner?.firstName || ''} ${booking.car?.owner?.lastName || ''}`.trim() || 'Клиент не указан'
}

function getPhoneLabel(booking: Booking) {
  return booking.contactPhone?.trim() || booking.car?.owner?.phoneNumber?.trim() || 'Не указан'
}

function getActions(booking: Booking) {
  if (booking.status === 'PENDING') {
    return ['CONFIRMED', 'CANCELLED'] as const
  }
  if (booking.status === 'CONFIRMED') {
    return ['IN_PROGRESS', 'CANCELLED'] as const
  }
  if (booking.status === 'IN_PROGRESS') {
    return ['COMPLETED'] as const
  }
  return [] as const
}

function getActionMeta(status: string) {
  switch (status) {
    case 'CANCELLED':
      return {
        label: 'Отменить',
        icon: FaTimes,
        className:
          'border-rose-400/20 bg-rose-500/10 text-rose-200 hover:border-rose-400/30 hover:bg-rose-500/15',
      }
    case 'CONFIRMED':
      return {
        label: 'Подтвердить',
        icon: FaCheck,
        className:
          'border-emerald-400/20 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/30 hover:bg-emerald-500/15',
      }
    case 'IN_PROGRESS':
      return {
        label: 'В работу',
        icon: FaClock,
        className:
          'border-sky-400/20 bg-sky-500/10 text-sky-200 hover:border-sky-400/30 hover:bg-sky-500/15',
      }
    default:
      return {
        label: 'Завершить',
        icon: FaCheck,
        className:
          'border-emerald-400/20 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/30 hover:bg-emerald-500/15',
      }
  }
}

export default function ServiceCenterBookings() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<BookingStatus>('ALL')

  const { data: serviceCenter, isLoading: serviceCenterLoading } = useQuery<ServiceCenter>({
    queryKey: ['service-center', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/service-centers/my')
      return response.data
    },
  })

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
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
      toast.success('Статус обновлен')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Не удалось обновить статус')
    },
  })

  const sortedBookings = useMemo(
    () =>
      bookings
        .slice()
        .sort((a, b) => new Date(a.bookingDateTime).getTime() - new Date(b.bookingDateTime).getTime()),
    [bookings]
  )

  const filteredBookings = useMemo(() => {
    if (statusFilter === 'ALL') {
      return sortedBookings
    }

    return sortedBookings.filter((booking) => booking.status === statusFilter)
  }, [sortedBookings, statusFilter])

  if (serviceCenterLoading || bookingsLoading) {
    return (
      <Page>
        <div className="p-10 text-center">
          <div className="inline-block h-9 w-9 animate-spin rounded-full border-b-2 border-[#ff9b82]"></div>
          <p className="mt-3 text-sm text-slate-400">Загрузка записей...</p>
        </div>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Service bookings"
        title="Записи"
        description={serviceCenter?.name ? `Сервис: ${serviceCenter.name}` : undefined}
      />

      <Section
        title="Поток записей"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="auto-badge-info">{filteredBookings.length} записей</Badge>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Статус</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as BookingStatus)}
                className="auto-select min-w-[12rem] py-2"
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
      >
        {sortedBookings.length === 0 ? (
          <EmptyState
            icon={FaCalendarAlt}
            title="Пока нет записей"
            description="Когда клиенты начнут бронировать обслуживание, записи появятся в этом реестре."
          />
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
            По выбранному статусу записей нет.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.03]">
            {filteredBookings.map((booking) => {
              const currentStatus = booking.status as Exclude<BookingStatus, 'ALL'>

              return (
                <article
                  key={booking.id}
                  className="border-b border-white/10 px-4 py-4 last:border-b-0 sm:px-5"
                >
                  <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[12rem_minmax(0,1.15fr)_minmax(0,1fr)_auto] xl:items-center">
                    <div className="flex items-start justify-between gap-3 xl:block">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Запись
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {formatBookingDateTime(booking.bookingDateTime)}
                        </p>
                      </div>

                      <span className={cx('xl:hidden', STATUS_BADGE_CLASSES[currentStatus] || 'auto-badge')}>
                        {STATUS_LABELS[currentStatus] || booking.status}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-white">
                        <FaCar className="shrink-0 text-[#ff9b82]" />
                        <span className="truncate">{getCarTitle(booking)}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-300">{getClientName(booking)}</p>
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <p className="text-sm text-slate-400">{getTextPreview(booking.description)}</p>
                      <p className="inline-flex items-center gap-2 text-sm text-slate-500">
                        <FaPhoneAlt className="text-[12px]" />
                        <span>{getPhoneLabel(booking)}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <span className={cx('hidden xl:inline-flex', STATUS_BADGE_CLASSES[currentStatus] || 'auto-badge')}>
                        {STATUS_LABELS[currentStatus] || booking.status}
                      </span>

                      {getActions(booking).map((status) => {
                        const actionMeta = getActionMeta(status)
                        const Icon = actionMeta.icon

                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => updateStatusMutation.mutate({ bookingId: booking.id, status })}
                            disabled={updateStatusMutation.isPending}
                            className={cx(
                              'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors',
                              actionMeta.className,
                              updateStatusMutation.isPending && 'cursor-not-allowed opacity-60'
                            )}
                          >
                            <Icon />
                            {actionMeta.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </Section>
    </Page>
  )
}
