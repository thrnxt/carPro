import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns'
import ru from 'date-fns/locale/ru'
import toast from 'react-hot-toast'
import {
  FaCar,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaHistory,
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
  cx,
} from '../components/ui'
import { bookingStatusMeta } from '../utils/statusMeta'
import { normalizeCollectionResponse } from '../utils/normalizeCollectionResponse'

/* ─────────────────────────────────────────────────────── types ── */

interface Booking {
  id: number
  bookingDateTime: string
  serviceCenter?: { id: number; name: string; address: string; phoneNumber?: string }
  car?: { id: number; brand: string; model: string; licensePlate: string }
  status: string
  description?: string
  contactPhone?: string
  createdAt: string
}

interface MaintenanceRecord {
  id: number
  serviceDate: string
  workType: string
  car?: { id: number; brand: string; model: string }
}

type BookingFormFields = {
  carId: string
  serviceCenterId: string
  bookingDateTime: string
  contactPhone: string
  description: string
}

type Tab = 'upcoming' | 'history' | 'calendar'

type EventType = 'booking' | 'maintenance' | 'notification'
type CalEvent = {
  id: string
  type: EventType
  date: Date
  title: string
  subtitle?: string
  status?: string
  to: string
}

/* ─────────────────────────────────────────────── helpers ── */

function formatDate(value: string) {
  try { return format(new Date(value), 'dd MMMM yyyy, HH:mm', { locale: ru }) } catch { return value }
}

const minDateTime = () => new Date(Date.now() - 60_000).toISOString().slice(0, 16)

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const EVENT_DOT: Record<EventType, string> = {
  booking: 'bg-info',
  maintenance: 'bg-success',
  notification: 'bg-warning',
}

/* ════════════════════════════════════════════════════════════════ */
export default function Bookings() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as Tab) || 'upcoming'

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null)
  const [calCurrentDate, setCalCurrentDate] = useState(new Date())
  const [calSelectedDay, setCalSelectedDay] = useState<Date | null>(null)

  const setTab = (tab: Tab) => {
    setSearchParams(tab === 'upcoming' ? {} : { tab })
    setShowCreateForm(false)
  }

  /* ── data ── */
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => (await apiClient.get('/bookings/my')).data as Booking[],
  })

  const { data: cars = [] } = useQuery({
    queryKey: ['cars'],
    queryFn: async () => (await apiClient.get('/cars')).data,
  })

  const { data: serviceCenters = [] } = useQuery({
    queryKey: ['service-centers'],
    queryFn: async () => (await apiClient.get('/service-centers')).data,
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await apiClient.get('/notifications')).data,
    enabled: activeTab === 'calendar',
  })

  const { data: maintenanceRecords } = useQuery({
    queryKey: ['maintenance-records-all'],
    queryFn: async () => {
      if (!cars || cars.length === 0) return []
      const results = await Promise.all(
        cars.map((car: any) =>
          apiClient.get(`/maintenance-records/car/${car.id}`)
            .then((r: any) => normalizeCollectionResponse<MaintenanceRecord>(r.data))
        )
      )
      return results.flat()
    },
    enabled: activeTab === 'calendar' && cars.length > 0,
  })

  /* ── form ── */
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BookingFormFields>({
    mode: 'onTouched',
    defaultValues: { carId: '', serviceCenterId: '', bookingDateTime: '', contactPhone: '', description: '' },
  })

  const createBookingMutation = useMutation({
    mutationFn: async (data: Omit<BookingFormFields, 'carId' | 'serviceCenterId'> & { carId: number; serviceCenterId: number }) => {
      const res = await apiClient.post('/bookings', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Запись создана')
      setShowCreateForm(false)
      reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка создания записи'),
  })

  const cancelBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.patch(`/bookings/${id}/status`, null, { params: { status: 'CANCELLED' } })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Запись отменена')
      setConfirmCancelId(null)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка отмены'),
  })

  const onSubmit = async (data: BookingFormFields) => {
    await createBookingMutation.mutateAsync({
      carId: parseInt(data.carId, 10),
      serviceCenterId: parseInt(data.serviceCenterId, 10),
      bookingDateTime: data.bookingDateTime,
      description: data.description,
      contactPhone: data.contactPhone,
    })
  }

  /* ── derived ── */
  const now = new Date()
  const upcomingBookings = useMemo(
    () => (bookings ?? [])
      .filter(b => new Date(b.bookingDateTime) >= now && b.status !== 'CANCELLED')
      .sort((a, b) => new Date(a.bookingDateTime).getTime() - new Date(b.bookingDateTime).getTime()),
    [bookings]
  )
  const pastBookings = useMemo(
    () => (bookings ?? [])
      .filter(b => new Date(b.bookingDateTime) < now || b.status === 'CANCELLED')
      .sort((a, b) => new Date(b.bookingDateTime).getTime() - new Date(a.bookingDateTime).getTime()),
    [bookings]
  )

  /* ── calendar events ── */
  const calEvents = useMemo<CalEvent[]>(() => {
    const list: CalEvent[] = []
    ;(notifications ?? [])
      .filter((n: any) => ['MAINTENANCE_DUE', 'COMPONENT_WEAR', 'MILEAGE_REMINDER'].includes(n.type))
      .forEach((n: any) => list.push({
        id: `n-${n.id}`, type: 'notification', date: new Date(n.createdAt),
        title: n.title || 'Напоминание', subtitle: n.message, to: '/notifications',
      }))
    ;(bookings ?? []).forEach(b => list.push({
      id: `b-${b.id}`, type: 'booking', date: new Date(b.bookingDateTime),
      title: b.serviceCenter?.name || 'Запись',
      subtitle: b.car ? `${b.car.brand} ${b.car.model}` : undefined,
      status: b.status, to: '/bookings',
    }))
    ;(maintenanceRecords ?? []).forEach((r: MaintenanceRecord) => list.push({
      id: `m-${r.id}`, type: 'maintenance', date: new Date(r.serviceDate),
      title: r.workType || 'Обслуживание',
      subtitle: r.car ? `${r.car.brand} ${r.car.model}` : undefined,
      to: r.car ? `/cars/${r.car.id}/history` : '/maintenance-history',
    }))
    return list
  }, [notifications, bookings, maintenanceRecords])

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calCurrentDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(calCurrentDate), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [calCurrentDate])

  const eventsForDay = (day: Date) => calEvents.filter(e => isSameDay(e.date, day))

  const agendaEvents = useMemo(() => {
    if (calSelectedDay) return eventsForDay(calSelectedDay)
    return calEvents
      .filter(e => e.date >= startOfDay(now))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 8)
  }, [calEvents, calSelectedDay])

  /* ─────────────────────────────────────────────────────── render ── */
  return (
    <Page>
      {/* ── Page header ── */}
      <PageHeader
        title="Записи"
        description="Ваши визиты в сервисные центры и план обслуживания."
        actions={
          activeTab === 'upcoming' ? (
            <Button
              variant={showCreateForm ? 'secondary' : 'primary'}
              onClick={showCreateForm ? () => { setShowCreateForm(false); reset() } : () => setShowCreateForm(true)}
            >
              {showCreateForm ? <><FaTimes /> Отмена</> : <><FaPlus /> Новая запись</>}
            </Button>
          ) : activeTab === 'history' ? (
            <Button variant="secondary" onClick={() => { setTab('upcoming'); setShowCreateForm(true) }}>
              <FaPlus /> Новая запись
            </Button>
          ) : null
        }
      />

      {/* ── Tab bar ── */}
      <div className="flex gap-1 rounded-xl border border-border bg-surface-3 p-1">
        <TabButton
          active={activeTab === 'upcoming'}
          onClick={() => setTab('upcoming')}
          icon={<FaCalendarAlt className="text-xs" />}
          label="Предстоящие"
          badge={upcomingBookings.length > 0 ? String(upcomingBookings.length) : undefined}
        />
        <TabButton
          active={activeTab === 'history'}
          onClick={() => setTab('history')}
          icon={<FaHistory className="text-xs" />}
          label="История"
          badge={pastBookings.length > 0 ? String(pastBookings.length) : undefined}
        />
        <TabButton
          active={activeTab === 'calendar'}
          onClick={() => setTab('calendar')}
          icon={<FaCalendarAlt className="text-xs" />}
          label="Календарь"
        />
      </div>

      {/* ══════════════════════════════════ TAB: UPCOMING ══ */}
      {activeTab === 'upcoming' && (
        <>
          {/* Create form */}
          {showCreateForm && (
            <Section title="Новая запись">
              {cars.length === 0 ? (
                <p className="text-body text-warning">
                  Для создания записи сначала{' '}
                  <Link to="/garage" className="text-accent hover:underline">добавьте автомобиль</Link>.
                </p>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Автомобиль" required error={errors.carId?.message}>
                      <select className={`auto-select${errors.carId ? ' auto-input-error' : ''}`}
                        {...register('carId', { required: 'Выберите автомобиль' })}>
                        <option value="">Выберите автомобиль</option>
                        {cars.map((car: any) => (
                          <option key={car.id} value={car.id}>
                            {car.brand} {car.model}{car.licensePlate ? ` (${car.licensePlate})` : ''}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Сервисный центр" required error={errors.serviceCenterId?.message}>
                      <select className={`auto-select${errors.serviceCenterId ? ' auto-input-error' : ''}`}
                        {...register('serviceCenterId', { required: 'Выберите сервисный центр' })}>
                        <option value="">Выберите сервисный центр</option>
                        {serviceCenters.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}{c.city ? ` — ${c.city}` : ''}</option>
                        ))}
                      </select>
                    </FormField>

                    <Input label="Дата и время" type="datetime-local" required min={minDateTime()}
                      error={errors.bookingDateTime?.message}
                      {...register('bookingDateTime', {
                        required: 'Выберите дату и время',
                        validate: v => new Date(v) > new Date() || 'Выберите дату в будущем',
                      })} />

                    <Input label="Контактный телефон" type="tel" placeholder="+7 (700) 000-00-00" required
                      error={errors.contactPhone?.message}
                      {...register('contactPhone', {
                        required: 'Укажите контактный телефон',
                        pattern: { value: /^[+]?[\d\s\-() ]{7,20}$/, message: 'Некорректный формат' },
                      })} />

                    <div className="md:col-span-2">
                      <FormField label="Описание" hint="Необязательно — работы или жалобы">
                        <textarea rows={3} placeholder="Плановое ТО, замена масла…"
                          className="auto-textarea" {...register('description')} />
                      </FormField>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Button type="submit" variant="primary" loading={isSubmitting}>Создать запись</Button>
                    <Button type="button" variant="secondary" onClick={() => { setShowCreateForm(false); reset() }}>Отмена</Button>
                  </div>
                </form>
              )}
            </Section>
          )}

          {/* Upcoming list */}
          {bookingsLoading ? (
            <Section title="Предстоящие записи">
              <div className="space-y-3">
                {[0, 1].map(i => (
                  <div key={i} className="rounded-md border border-border bg-surface-2 p-card space-y-3">
                    <Skeleton className="h-5 w-1/3" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/4" />
                  </div>
                ))}
              </div>
            </Section>
          ) : upcomingBookings.length > 0 ? (
            <Section eyebrow={`${upcomingBookings.length} предстоящих`} title="Предстоящие записи">
              <div className="space-y-4">
                {upcomingBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking}
                    onViewCenter={() => navigate(`/service-centers/${booking.serviceCenter?.id}`)}
                    confirmCancelId={confirmCancelId}
                    onRequestCancel={() => setConfirmCancelId(booking.id)}
                    onConfirmCancel={() => cancelBookingMutation.mutate(booking.id)}
                    onDismissCancel={() => setConfirmCancelId(null)}
                    cancelPending={cancelBookingMutation.isPending} />
                ))}
              </div>
            </Section>
          ) : !showCreateForm ? (
            <EmptyState icon={FaCalendarAlt} title="Нет предстоящих записей"
              description="Запишитесь в сервис — выберите авто, центр и удобное время."
              action={
                <Button variant="primary" onClick={() => setShowCreateForm(true)}>
                  <FaPlus /> Создать первую запись
                </Button>
              } />
          ) : null}
        </>
      )}

      {/* ══════════════════════════════════ TAB: HISTORY ══ */}
      {activeTab === 'history' && (
        <>
          {bookingsLoading ? (
            <Section title="История записей">
              <div className="space-y-2">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-md">
                    <Skeleton className="h-4 w-1/4" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-16 ml-auto" />
                  </div>
                ))}
              </div>
            </Section>
          ) : pastBookings.length > 0 ? (
            <Section eyebrow={`${pastBookings.length} записей`} title="История записей">
              <div className="overflow-hidden rounded-xl border border-border bg-surface-2">
                {pastBookings.map(booking => (
                  <div key={booking.id}
                    className="grid gap-3 border-b border-border px-4 py-3.5 last:border-b-0 hover:bg-surface-3 transition-colors md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-body font-medium text-text-primary">
                        {booking.serviceCenter?.name ?? 'Сервисный центр'}
                      </p>
                      <p className="mt-0.5 text-caption text-text-muted">{formatDate(booking.bookingDateTime)}</p>
                    </div>
                    <p className="text-body text-text-secondary truncate">
                      {booking.car ? `${booking.car.brand} ${booking.car.model}` : '—'}
                      {booking.car?.licensePlate ? (
                        <span className="ml-1.5 font-mono text-caption text-info">{booking.car.licensePlate}</span>
                      ) : null}
                    </p>
                    <div className="md:justify-self-end">
                      <Badge tone={bookingStatusMeta(booking.status).tone}>
                        {bookingStatusMeta(booking.status).label}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          ) : (
            <EmptyState icon={FaHistory} title="История пуста"
              description="Завершённые и отменённые записи появятся здесь." />
          )}
        </>
      )}

      {/* ══════════════════════════════════ TAB: CALENDAR ══ */}
      {activeTab === 'calendar' && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          {/* Calendar grid */}
          <section className="auto-card p-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-h3 capitalize text-text-primary">
                {format(calCurrentDate, 'LLLL yyyy', { locale: ru })}
              </h2>
              <div className="flex items-center gap-2">
                <button type="button"
                  onClick={() => { setCalCurrentDate(new Date()); setCalSelectedDay(null) }}
                  className="btn-secondary h-9 px-3 text-sm">
                  Сегодня
                </button>
                <button type="button" onClick={() => setCalCurrentDate(d => subMonths(d, 1))}
                  className="btn-secondary h-9 w-9 p-0" aria-label="Предыдущий месяц">
                  <FaChevronLeft className="text-xs" />
                </button>
                <button type="button" onClick={() => setCalCurrentDate(d => addMonths(d, 1))}
                  className="btn-secondary h-9 w-9 p-0" aria-label="Следующий месяц">
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-1">
              {WEEKDAYS.map(d => (
                <div key={d} className="pb-1 text-center text-caption text-text-muted">{d}</div>
              ))}
              {calendarDays.map(day => {
                const dayEvts = eventsForDay(day)
                const isCurrentDay = isToday(day)
                const isCurrentMonth = isSameMonth(day, calCurrentDate)
                const isSelected = calSelectedDay ? isSameDay(day, calSelectedDay) : false

                return (
                  <button type="button" key={day.toISOString()}
                    onClick={() => setCalSelectedDay(isSelected ? null : day)}
                    className={cx(
                      'flex min-h-[52px] flex-col items-center gap-1 rounded-md border p-1 transition-colors',
                      isSelected ? 'border-accent bg-surface-3'
                        : isCurrentMonth ? 'border-border bg-surface-2 hover:bg-surface-3'
                        : 'border-transparent hover:bg-surface-2'
                    )}>
                    <span className={cx(
                      'flex h-6 w-6 items-center justify-center rounded-full text-caption',
                      isCurrentDay ? 'bg-accent font-semibold text-white'
                        : isCurrentMonth ? 'text-text-primary' : 'text-text-muted'
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayEvts.length > 0 && (
                      <span className="flex items-center gap-0.5">
                        {dayEvts.slice(0, 3).map(e => (
                          <span key={e.id} className={cx('h-1.5 w-1.5 rounded-full', EVENT_DOT[e.type])} />
                        ))}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4">
              {([['booking', 'Записи'], ['maintenance', 'Обслуживание'], ['notification', 'Напоминания']] as const).map(([type, label]) => (
                <div key={type} className="flex items-center gap-2 text-caption text-text-secondary">
                  <span className={cx('h-2 w-2 rounded-full', EVENT_DOT[type])} />
                  {label}
                </div>
              ))}
            </div>
          </section>

          {/* Agenda panel */}
          <Section
            title={calSelectedDay ? format(calSelectedDay, 'd MMMM', { locale: ru }) : 'Ближайшие события'}
            actions={calSelectedDay ? (
              <button type="button" onClick={() => setCalSelectedDay(null)} className="btn-ghost text-sm">
                Сбросить
              </button>
            ) : undefined}
          >
            {agendaEvents.length > 0 ? (
              <div className="space-y-2">
                {agendaEvents.map(event => {
                  const statusMeta = event.type === 'booking' && event.status ? bookingStatusMeta(event.status) : null
                  return (
                    <button key={event.id} type="button"
                      onClick={() => navigate(event.to)}
                      className="flex w-full items-start gap-3 rounded-md border border-border bg-surface-3 p-3 text-left transition-colors hover:bg-surface-2">
                      <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', EVENT_DOT[event.type])} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body font-medium text-text-primary">{event.title}</p>
                        {event.subtitle && (
                          <p className="mt-0.5 flex items-center gap-1.5 truncate text-caption text-text-secondary">
                            {event.type !== 'notification' ? <FaCar className="shrink-0" /> : null}
                            {event.subtitle}
                          </p>
                        )}
                        {statusMeta && (
                          <span className="mt-1.5 inline-block">
                            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-caption text-text-muted">
                        {format(event.date, event.type === 'booking' ? 'dd MMM, HH:mm' : 'dd MMM', { locale: ru })}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <EmptyState icon={FaCalendarAlt}
                title={calSelectedDay ? 'В этот день событий нет' : 'Нет ближайших событий'}
                description={calSelectedDay ? undefined : 'Создайте запись, чтобы она появилась в календаре.'} />
            )}
          </Section>
        </div>
      )}
    </Page>
  )
}

/* ─────────────────────────────────────── TabButton ── */
function TabButton({
  active, onClick, icon, label, badge,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  badge?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
        active
          ? 'bg-surface-1 text-text-primary shadow-sm border border-border'
          : 'text-text-muted hover:text-text-secondary'
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge && (
        <span className={cx(
          'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-semibold',
          active ? 'bg-accent/20 text-accent' : 'bg-surface-2 text-text-muted'
        )}>
          {badge}
        </span>
      )}
    </button>
  )
}

/* ─────────────────────────────────────── BookingCard ── */
function BookingCard({
  booking, onViewCenter, confirmCancelId, onRequestCancel, onConfirmCancel, onDismissCancel, cancelPending,
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
          <h3 className="text-h2 text-text-primary">{booking.serviceCenter?.name ?? 'Сервисный центр'}</h3>
          <Badge tone={bookingStatusMeta(booking.status).tone}>{bookingStatusMeta(booking.status).label}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {booking.serviceCenter && (
            <Button variant="secondary" onClick={onViewCenter}>Подробнее</Button>
          )}
          {isPending && (isConfirming ? (
            <>
              <span className="text-caption text-text-muted">Отменить запись?</span>
              <Button variant="secondary" className="text-danger" loading={cancelPending} onClick={onConfirmCancel}>Да, отменить</Button>
              <Button variant="secondary" onClick={onDismissCancel}>Нет</Button>
            </>
          ) : (
            <Button variant="secondary" className="text-danger" onClick={onRequestCancel}>
              <FaTimes /> Отменить
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="flex items-start gap-3">
          <FaCalendarAlt className="mt-0.5 shrink-0 text-text-muted" />
          <div>
            <p className="section-label">Дата и время</p>
            <p className="mt-1 text-body font-medium text-text-primary">{formatDate(booking.bookingDateTime)}</p>
          </div>
        </div>

        {booking.car && (
          <div className="flex items-start gap-3">
            <FaCar className="mt-0.5 shrink-0 text-text-muted" />
            <div>
              <p className="section-label">Автомобиль</p>
              <p className="mt-1 text-body font-medium text-text-primary">{booking.car.brand} {booking.car.model}</p>
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
              <a href={`tel:${booking.serviceCenter.phoneNumber}`}
                className="mt-1 block text-body font-medium text-accent hover:text-accent-hover transition-colors">
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
