import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import toast from 'react-hot-toast'
import {
  FaCalendarAlt,
  FaCar,
  FaMapMarkerAlt,
  FaPhone,
  FaPlus,
  FaTimes,
} from 'react-icons/fa'
import apiClient from '../api/client'
import {
  Badge,
  Button,
  EmptyState,
  FormField,
  Input,
  Page,
  PageHeader,
  Section,
  Skeleton,
} from '../components/ui'

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

type BookingFormFields = {
  carId: string
  serviceCenterId: string
  bookingDateTime: string
  contactPhone: string
  description: string
}

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Подтверждена',
  PENDING: 'Ожидает',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
}

const STATUS_TONE: Record<string, string> = {
  CONFIRMED: 'auto-badge-success',
  PENDING: 'auto-badge-warning',
  IN_PROGRESS: 'auto-badge-info',
  COMPLETED: 'auto-badge-success',
  CANCELLED: 'auto-badge-danger',
}

function formatBookingDate(value: string) {
  try {
    return format(new Date(value), 'dd MMMM yyyy, HH:mm', { locale: ru })
  } catch {
    return value
  }
}

const minDateTime = () => {
  const d = new Date(Date.now() - 60_000)
  return d.toISOString().slice(0, 16)
}

export default function Bookings() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null)

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await apiClient.get('/bookings/my')
      return response.data as Booking[]
    },
  })

  const { data: cars = [] } = useQuery({
    queryKey: ['cars'],
    queryFn: async () => {
      const response = await apiClient.get('/cars')
      return response.data
    },
  })

  const { data: serviceCenters = [] } = useQuery({
    queryKey: ['service-centers'],
    queryFn: async () => {
      const response = await apiClient.get('/service-centers')
      return response.data
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormFields>({
    mode: 'onTouched',
    defaultValues: {
      carId: '',
      serviceCenterId: '',
      bookingDateTime: '',
      contactPhone: '',
      description: '',
    },
  })

  const createBookingMutation = useMutation({
    mutationFn: async (data: Omit<BookingFormFields, 'carId' | 'serviceCenterId'> & { carId: number; serviceCenterId: number }) => {
      const response = await apiClient.post('/bookings', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Запись создана')
      setShowCreateForm(false)
      reset()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка создания записи')
    },
  })

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await apiClient.patch(`/bookings/${bookingId}/status`, null, {
        params: { status: 'CANCELLED' },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Запись отменена')
      setConfirmCancelId(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка отмены записи')
    },
  })

  const onSubmit = async (data: BookingFormFields) => {
    try {
      await createBookingMutation.mutateAsync({
        carId: parseInt(data.carId, 10),
        serviceCenterId: parseInt(data.serviceCenterId, 10),
        bookingDateTime: data.bookingDateTime,
        description: data.description,
        contactPhone: data.contactPhone,
      })
    } catch {
      // handled by mutation onError
    }
  }

  const handleCancelForm = () => {
    setShowCreateForm(false)
    reset()
  }

  const now = new Date()
  const upcomingBookings = (bookings ?? [])
    .filter((b) => new Date(b.bookingDateTime) >= now && b.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.bookingDateTime).getTime() - new Date(b.bookingDateTime).getTime())

  const pastBookings = (bookings ?? [])
    .filter((b) => new Date(b.bookingDateTime) < now || b.status === 'CANCELLED')
    .sort((a, b) => new Date(b.bookingDateTime).getTime() - new Date(a.bookingDateTime).getTime())

  return (
    <Page>
      <PageHeader
        eyebrow="Записи"
        title="Мои записи"
        description="Управление записями на обслуживание в сервисные центры."
        actions={
          <Button
            variant={showCreateForm ? 'secondary' : 'primary'}
            onClick={showCreateForm ? handleCancelForm : () => setShowCreateForm(true)}
          >
            {showCreateForm ? <><FaTimes /> Отмена</> : <><FaPlus /> Новая запись</>}
          </Button>
        }
      />

      {/* ── Create form ── */}
      {showCreateForm && (
        <Section title="Создать запись">
          {cars.length === 0 ? (
            <p className="text-body text-warning">
              Для создания записи необходимо сначала добавить автомобиль в гараж.
            </p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Автомобиль" required error={errors.carId?.message}>
                  <select
                    className={`auto-select${errors.carId ? ' auto-input-error' : ''}`}
                    {...register('carId', { required: 'Выберите автомобиль' })}
                  >
                    <option value="">Выберите автомобиль</option>
                    {cars.map((car: any) => (
                      <option key={car.id} value={car.id}>
                        {car.brand} {car.model}
                        {car.licensePlate ? ` (${car.licensePlate})` : ''}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Сервисный центр" required error={errors.serviceCenterId?.message}>
                  <select
                    className={`auto-select${errors.serviceCenterId ? ' auto-input-error' : ''}`}
                    {...register('serviceCenterId', { required: 'Выберите сервисный центр' })}
                  >
                    <option value="">Выберите сервисный центр</option>
                    {serviceCenters.map((center: any) => (
                      <option key={center.id} value={center.id}>
                        {center.name}{center.city ? ` — ${center.city}` : ''}
                      </option>
                    ))}
                  </select>
                </FormField>

                <Input
                  label="Дата и время"
                  type="datetime-local"
                  required
                  min={minDateTime()}
                  error={errors.bookingDateTime?.message}
                  {...register('bookingDateTime', {
                    required: 'Выберите дату и время',
                    validate: (v) =>
                      new Date(v) > new Date() || 'Выберите дату в будущем',
                  })}
                />

                <Input
                  label="Контактный телефон"
                  type="tel"
                  placeholder="+7 (700) 000-00-00"
                  required
                  error={errors.contactPhone?.message}
                  {...register('contactPhone', {
                    required: 'Укажите контактный телефон',
                    pattern: {
                      value: /^[+]?[\d\s\-() ]{7,20}$/,
                      message: 'Некорректный формат номера',
                    },
                  })}
                />

                <div className="md:col-span-2">
                  <FormField
                    label="Описание проблемы"
                    hint="Необязательно — опишите работы или жалобы"
                  >
                    <textarea
                      rows={3}
                      placeholder="Плановое ТО, замена масла, стук в подвеске…"
                      className="auto-textarea"
                      {...register('description')}
                    />
                  </FormField>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button type="submit" variant="primary" loading={isSubmitting}>
                  Создать запись
                </Button>
                <Button type="button" variant="secondary" onClick={handleCancelForm}>
                  Отмена
                </Button>
              </div>
            </form>
          )}
        </Section>
      )}

      {/* ── Upcoming bookings ── */}
      {bookingsLoading ? (
        <Section title="Предстоящие записи">
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-md border border-border bg-surface-2 p-card space-y-3">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            ))}
          </div>
        </Section>
      ) : upcomingBookings.length > 0 ? (
        <Section
          eyebrow={`${upcomingBookings.length} записей`}
          title="Предстоящие записи"
        >
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onViewCenter={() => navigate(`/service-centers/${booking.serviceCenter?.id}`)}
                confirmCancelId={confirmCancelId}
                onRequestCancel={() => setConfirmCancelId(booking.id)}
                onConfirmCancel={() => cancelBookingMutation.mutate(booking.id)}
                onDismissCancel={() => setConfirmCancelId(null)}
                cancelPending={cancelBookingMutation.isPending}
              />
            ))}
          </div>
        </Section>
      ) : null}

      {/* ── Past bookings ── */}
      {!bookingsLoading && pastBookings.length > 0 && (
        <Section
          eyebrow={`${pastBookings.length} записей`}
          title="История записей"
        >
          <div className="overflow-hidden rounded-md border border-border bg-surface-2">
            {pastBookings.map((booking) => (
              <div
                key={booking.id}
                className="grid gap-3 border-b border-border px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] md:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-body font-medium text-text-primary">
                    {booking.serviceCenter?.name ?? 'Сервисный центр'}
                  </p>
                  <p className="mt-0.5 text-caption text-text-muted">
                    {formatBookingDate(booking.bookingDateTime)}
                  </p>
                </div>

                <p className="min-w-0 text-body text-text-secondary">
                  {booking.car
                    ? `${booking.car.brand} ${booking.car.model} (${booking.car.licensePlate})`
                    : '—'}
                </p>

                <div className="md:justify-self-end">
                  <Badge tone={STATUS_TONE[booking.status] ?? 'auto-badge'}>
                    {STATUS_LABEL[booking.status] ?? booking.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Empty state ── */}
      {!bookingsLoading && !bookings?.length && !showCreateForm && (
        <EmptyState
          icon={FaCalendarAlt}
          title="Записей пока нет"
          description="Создайте первую запись на обслуживание, выбрав автомобиль и удобное время."
          action={
            <Button variant="primary" onClick={() => setShowCreateForm(true)}>
              <FaPlus />
              Создать первую запись
            </Button>
          }
        />
      )}
    </Page>
  )
}

function BookingCard({
  booking,
  onViewCenter,
  confirmCancelId,
  onRequestCancel,
  onConfirmCancel,
  onDismissCancel,
  cancelPending,
}: {
  booking: Booking
  onViewCenter: () => void
  confirmCancelId: number | null
  onRequestCancel: () => void
  onConfirmCancel: () => void
  onDismissCancel: () => void
  cancelPending: boolean
}) {
  const isPending = booking.status === 'PENDING'
  const isConfirming = confirmCancelId === booking.id

  return (
    <div className="auto-card p-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-h2 text-text-primary">
            {booking.serviceCenter?.name ?? 'Сервисный центр'}
          </h3>
          <Badge tone={STATUS_TONE[booking.status] ?? 'auto-badge'}>
            {STATUS_LABEL[booking.status] ?? booking.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {booking.serviceCenter && (
            <Button variant="secondary" onClick={onViewCenter}>
              Подробнее
            </Button>
          )}
          {isPending && (
            isConfirming ? (
              <>
                <span className="text-caption text-text-muted">Отменить запись?</span>
                <Button
                  variant="secondary"
                  className="text-danger"
                  loading={cancelPending}
                  onClick={onConfirmCancel}
                >
                  Да, отменить
                </Button>
                <Button variant="secondary" onClick={onDismissCancel}>
                  Нет
                </Button>
              </>
            ) : (
              <Button variant="secondary" className="text-danger" onClick={onRequestCancel}>
                <FaTimes />
                Отменить
              </Button>
            )
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="flex items-start gap-3">
          <FaCalendarAlt className="mt-0.5 shrink-0 text-text-muted" />
          <div>
            <p className="section-label">Дата и время</p>
            <p className="mt-1 text-body font-medium text-text-primary">
              {formatBookingDate(booking.bookingDateTime)}
            </p>
          </div>
        </div>

        {booking.car && (
          <div className="flex items-start gap-3">
            <FaCar className="mt-0.5 shrink-0 text-text-muted" />
            <div>
              <p className="section-label">Автомобиль</p>
              <p className="mt-1 text-body font-medium text-text-primary">
                {booking.car.brand} {booking.car.model}
              </p>
              <p className="font-mono text-caption text-info">{booking.car.licensePlate}</p>
            </div>
          </div>
        )}

        {booking.serviceCenter?.address && (
          <div className="flex items-start gap-3">
            <FaMapMarkerAlt className="mt-0.5 shrink-0 text-text-muted" />
            <div>
              <p className="section-label">Адрес</p>
              <p className="mt-1 text-body text-text-primary">{booking.serviceCenter.address}</p>
            </div>
          </div>
        )}

        {booking.serviceCenter?.phoneNumber && (
          <div className="flex items-start gap-3">
            <FaPhone className="mt-0.5 shrink-0 text-text-muted" />
            <div>
              <p className="section-label">Телефон сервиса</p>
              <a
                href={`tel:${booking.serviceCenter.phoneNumber}`}
                className="mt-1 block text-body font-medium text-accent hover:text-accent-hover transition-colors"
              >
                {booking.serviceCenter.phoneNumber}
              </a>
            </div>
          </div>
        )}
      </div>

      {booking.description && (
        <div className="mt-4 rounded-md border border-border bg-surface-3 px-4 py-3">
          <p className="section-label">Описание</p>
          <p className="mt-1 text-body text-text-secondary">{booking.description}</p>
        </div>
      )}
    </div>
  )
}
