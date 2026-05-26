import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import toast from 'react-hot-toast'
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns'
import ru from 'date-fns/locale/ru'
import {
  FaBell,
  FaCheck,
  FaCar,
  FaWrench,
  FaExclamationTriangle,
  FaTachometerAlt,
  FaCheckCircle,
} from 'react-icons/fa'
import {
  Button,
  EmptyState,
  Page,
  PageHeader,
  Pagination,
  SegmentedControl,
  Skeleton,
  cx,
} from '../components/ui'

const PAGE_SIZE = 8

/* ─── Types ── */
type NotificationType = 'MAINTENANCE_DUE' | 'COMPONENT_WEAR' | 'MILEAGE_REMINDER' | 'MAINTENANCE_COMPLETED' | string

type NotificationRecord = {
  id: number
  title: string
  message: string
  type?: NotificationType
  isRead: boolean
  createdAt: string
  car?: { brand?: string; model?: string } | null
}

type Filter = 'all' | 'unread'

/* ─── Notification type meta ── */
type TypeMeta = {
  icon: typeof FaBell
  bg: string
  text: string
  label: string
}

const TYPE_META: Record<string, TypeMeta> = {
  MAINTENANCE_DUE: {
    icon: FaWrench,
    bg: 'bg-warning/15',
    text: 'text-warning',
    label: 'ТО',
  },
  COMPONENT_WEAR: {
    icon: FaExclamationTriangle,
    bg: 'bg-danger/15',
    text: 'text-danger',
    label: 'Износ',
  },
  MILEAGE_REMINDER: {
    icon: FaTachometerAlt,
    bg: 'bg-info/15',
    text: 'text-info',
    label: 'Пробег',
  },
  MAINTENANCE_COMPLETED: {
    icon: FaCheckCircle,
    bg: 'bg-success/15',
    text: 'text-success',
    label: 'Выполнено',
  },
}

const DEFAULT_META: TypeMeta = {
  icon: FaBell,
  bg: 'bg-surface-3',
  text: 'text-text-muted',
  label: 'Системное',
}

function getTypeMeta(type?: string): TypeMeta {
  return type ? (TYPE_META[type] ?? DEFAULT_META) : DEFAULT_META
}

/* ─── Date grouping ── */
function getGroupLabel(date: Date): string {
  if (isToday(date)) return 'Сегодня'
  if (isYesterday(date)) return 'Вчера'
  if (isThisWeek(date, { weekStartsOn: 1 })) return 'На этой неделе'
  return format(date, 'LLLL yyyy', { locale: ru })
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) {
    return format(date, 'HH:mm')
  }
  if (isYesterday(date) || isThisWeek(date, { weekStartsOn: 1 })) {
    return format(date, 'dd MMM', { locale: ru })
  }
  return format(date, 'dd.MM.yy')
}

function formatRelative(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { locale: ru, addSuffix: true })
  } catch {
    return ''
  }
}

/* ─── Skeleton ── */
function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-0">
      <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-3 w-12 shrink-0" />
    </div>
  )
}

/* ─── Single notification row ── */
export function NotificationItem({ notification }: { notification: NotificationRecord }) {
  const meta = getTypeMeta(notification.type)
  const Icon = meta.icon
  const isRead = notification.isRead

  return (
    <article
      className={cx(
        'group flex items-start gap-3 border-b border-border px-4 py-3 last:border-0 transition-colors',
        isRead ? 'hover:bg-surface-3' : 'bg-accent/[0.03] hover:bg-accent/[0.06]'
      )}
    >
      {/* Type icon */}
      <div className={cx('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', meta.bg)}>
        <Icon className={cx('text-xs', meta.text)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          {!isRead && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent translate-y-[-1px]" aria-hidden="true" />
          )}
          <p className={cx(
            'truncate text-sm font-semibold leading-snug',
            isRead ? 'text-text-secondary' : 'text-text-primary'
          )}>
            {notification.title}
          </p>
        </div>

        <p className={cx(
          'mt-0.5 line-clamp-2 text-xs leading-relaxed',
          isRead ? 'text-text-muted' : 'text-text-secondary'
        )}>
          {notification.message}
        </p>

        {notification.car && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
            <FaCar className="shrink-0" />
            {notification.car.brand} {notification.car.model}
          </p>
        )}
      </div>

      {/* Time */}
      <div className="shrink-0 text-right">
        <p className="text-xs text-text-muted" title={formatRelative(notification.createdAt)}>
          {formatTime(notification.createdAt)}
        </p>
        {notification.type && (
          <span className={cx('mt-1 inline-block text-[10px] font-medium', meta.text)}>
            {meta.label}
          </span>
        )}
      </div>
    </article>
  )
}

/* ══════════════════════════════════════════════════════════════ */
export default function Notifications() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(0)

  const { data: notifications = [], isLoading } = useQuery<NotificationRecord[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications')
      return response.data as NotificationRecord[]
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => { await apiClient.patch('/notifications/read-all') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      toast.success('Все уведомления прочитаны')
    },
  })

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.isRead).length,
    [notifications]
  )

  const sorted = useMemo(
    () => [...notifications].sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }),
    [notifications]
  )

  const filtered = filter === 'unread' ? sorted.filter(n => !n.isRead) : sorted
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  /* Группируем по дате */
  const groups = useMemo(() => {
    const map = new Map<string, NotificationRecord[]>()
    for (const n of paginated) {
      const label = getGroupLabel(new Date(n.createdAt))
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(n)
    }
    return Array.from(map.entries())
  }, [paginated])

  /* ── Loading ── */
  if (isLoading) {
    return (
      <Page>
        <PageHeader eyebrow="Уведомления" title="Уведомления" />
        <div className="auto-card overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => <NotificationSkeleton key={i} />)}
        </div>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Уведомления"
        title="Уведомления"
        description={
          unreadCount > 0
            ? `${unreadCount} непрочитанн${unreadCount === 1 ? 'ое' : 'ых'} · всего ${notifications.length}`
            : `Всего ${notifications.length} уведомлений`
        }
        actions={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              loading={markAllAsReadMutation.isPending}
              onClick={() => markAllAsReadMutation.mutate()}
            >
              <FaCheck />
              Прочитать все
            </Button>
          ) : null
        }
      />

      {/* Filter */}
      <div className="flex items-center gap-4">
        <SegmentedControl<Filter>
          value={filter}
          onChange={v => { setFilter(v); setPage(0) }}
          options={[
            { value: 'all', label: 'Все' },
            {
              value: 'unread',
              label: unreadCount > 0 ? `Непрочитанные · ${unreadCount}` : 'Непрочитанные',
            },
          ]}
        />
      </div>

      {/* Feed */}
      {groups.length > 0 ? (
        <div className="auto-card overflow-hidden">
          {groups.map(([label, items], groupIdx) => (
            <div key={label}>
              {/* Date group header */}
              <div className={cx(
                'flex items-center gap-3 px-4 py-2',
                groupIdx > 0 ? 'border-t border-border' : '',
                'bg-surface-3'
              )}>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {label}
                </span>
                <span className="text-xs text-text-muted">{items.length}</span>
              </div>

              {/* Items */}
              {items.map(n => (
                <NotificationItem key={n.id} notification={n} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FaBell}
          title={filter === 'unread' ? 'Нет непрочитанных' : 'Уведомлений пока нет'}
          description={
            filter === 'unread'
              ? 'Все прочитаны. Переключитесь на «Все» для просмотра истории.'
              : 'Напоминания о ТО, износе деталей и пробеге будут появляться здесь.'
          }
        />
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
      />
    </Page>
  )
}
