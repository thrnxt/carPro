import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
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
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import apiClient from '../api/client'
import { normalizeCollectionResponse } from '../utils/normalizeCollectionResponse'
import { bookingStatusMeta } from '../utils/statusMeta'
import { Badge, EmptyState, Section, cx } from '../components/ui'

interface Booking {
  id: number
  bookingDateTime: string
  serviceCenter?: { id: number; name: string }
  car?: { id: number; brand: string; model: string }
  status: string
  description?: string
}

interface MaintenanceRecord {
  id: number
  serviceDate: string
  workType: string
  description?: string
  car?: { id: number; brand: string; model: string }
}

type EventType = 'booking' | 'maintenance'

type CalEvent = {
  id: string
  type: EventType
  date: Date
  title: string
  subtitle?: string
  status?: string
  to: string
}

const EVENT_DOT: Record<EventType, string> = {
  booking: 'bg-info',
  maintenance: 'bg-success',
}

const LEGEND: Array<{ type: EventType; label: string }> = [
  { type: 'booking', label: 'Записи' },
  { type: 'maintenance', label: 'Обслуживание' },
]

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function CarCalendar() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const { data: bookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => (await apiClient.get('/bookings/my')).data,
  })

  const { data: maintenanceRecords } = useQuery({
    queryKey: ['maintenance-records', 'car', id],
    queryFn: async () =>
      normalizeCollectionResponse<MaintenanceRecord>(
        (await apiClient.get(`/maintenance-records/car/${id}`)).data
      ),
    enabled: !!id,
  })

  const events = useMemo<CalEvent[]>(() => {
    const list: CalEvent[] = []

    ;(bookings ?? [])
      .filter((booking: Booking) => String(booking.car?.id) === String(id))
      .forEach((booking: Booking) => {
        list.push({
          id: `b-${booking.id}`,
          type: 'booking',
          date: new Date(booking.bookingDateTime),
          title: booking.serviceCenter?.name || 'Запись',
          subtitle: booking.description,
          status: booking.status,
          to: '/bookings',
        })
      })

    ;(maintenanceRecords ?? []).forEach((record: MaintenanceRecord) => {
      list.push({
        id: `m-${record.id}`,
        type: 'maintenance',
        date: new Date(record.serviceDate),
        title: record.workType || 'Обслуживание',
        subtitle: record.description,
        to: `/cars/${id}/history`,
      })
    })

    return list
  }, [bookings, maintenanceRecords, id])

  const calendarDays = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const gridEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [currentDate])

  const eventsForDay = (day: Date) => events.filter((event) => isSameDay(event.date, day))

  const upcomingEvents = useMemo(() => {
    const from = startOfDay(new Date())
    return events
      .filter((event) => event.date >= from)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 6)
  }, [events])

  const panelEvents = selectedDay ? eventsForDay(selectedDay) : upcomingEvents

  const handleEventClick = (event: CalEvent) => navigate(event.to)

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      {/* ── Calendar ── */}
      <section className="auto-card p-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-h3 capitalize text-text-primary">
            {format(currentDate, 'LLLL yyyy', { locale: ru })}
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCurrentDate(new Date())
                setSelectedDay(null)
              }}
              className="btn-secondary h-9 px-3 text-sm"
            >
              Сегодня
            </button>
            <button
              type="button"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="btn-secondary h-9 w-9 p-0"
              aria-label="Предыдущий месяц"
            >
              <FaChevronLeft className="text-xs" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="btn-secondary h-9 w-9 p-0"
              aria-label="Следующий месяц"
            >
              <FaChevronRight className="text-xs" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day) => (
            <div key={day} className="pb-1 text-center text-caption text-text-muted">
              {day}
            </div>
          ))}

          {calendarDays.map((day) => {
            const dayEvents = eventsForDay(day)
            const isCurrentDay = isToday(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false

            return (
              <button
                type="button"
                key={day.toISOString()}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={cx(
                  'flex min-h-[52px] flex-col items-center gap-1 rounded-md border p-1 transition-colors',
                  isSelected
                    ? 'border-accent bg-surface-3'
                    : isCurrentMonth
                      ? 'border-border bg-surface-2 hover:bg-surface-3'
                      : 'border-transparent hover:bg-surface-2'
                )}
              >
                <span
                  className={cx(
                    'flex h-6 w-6 items-center justify-center rounded-full text-caption',
                    isCurrentDay
                      ? 'bg-accent font-semibold text-white'
                      : isCurrentMonth
                        ? 'text-text-primary'
                        : 'text-text-muted'
                  )}
                >
                  {format(day, 'd')}
                </span>

                {dayEvents.length > 0 ? (
                  <span className="flex items-center gap-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span
                        key={event.id}
                        className={cx('h-1.5 w-1.5 rounded-full', EVENT_DOT[event.type])}
                      />
                    ))}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4">
          {LEGEND.map((item) => (
            <div key={item.type} className="flex items-center gap-2 text-caption text-text-secondary">
              <span className={cx('h-2 w-2 rounded-full', EVENT_DOT[item.type])} />
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Agenda ── */}
      <Section
        title={selectedDay ? format(selectedDay, 'd MMMM', { locale: ru }) : 'Ближайшие события'}
        actions={
          selectedDay ? (
            <button type="button" onClick={() => setSelectedDay(null)} className="btn-ghost text-sm">
              Сбросить
            </button>
          ) : undefined
        }
      >
        {panelEvents.length > 0 ? (
          <div className="space-y-2">
            {panelEvents.map((event) => {
              const status = event.type === 'booking' && event.status ? bookingStatusMeta(event.status) : null

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => handleEventClick(event)}
                  className="flex w-full items-start gap-3 rounded-md border border-border bg-surface-3 p-3 text-left transition-colors hover:bg-surface-2"
                >
                  <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', EVENT_DOT[event.type])} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-medium text-text-primary">{event.title}</p>
                    {event.subtitle ? (
                      <p className="mt-0.5 truncate text-caption text-text-secondary">{event.subtitle}</p>
                    ) : null}
                    {status ? (
                      <span className="mt-2 inline-block">
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </span>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-caption text-text-muted">
                    {event.type === 'booking'
                      ? format(event.date, 'dd MMM, HH:mm', { locale: ru })
                      : format(event.date, 'dd MMM', { locale: ru })}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={FaCalendarAlt}
            title={selectedDay ? 'В этот день событий нет' : 'Нет ближайших событий'}
            description={
              selectedDay ? undefined : 'Запланируйте визит в сервис, чтобы он появился здесь.'
            }
          />
        )}
      </Section>
    </div>
  )
}
