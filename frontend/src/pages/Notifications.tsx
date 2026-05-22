import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { FaBell, FaCheck, FaCar } from 'react-icons/fa'
import {
  Button,
  EmptyState,
  Page,
  PageHeader,
  SegmentedControl,
  Skeleton,
} from '../components/ui'

type NotificationRecord = {
  id: number
  title: string
  message: string
  isRead: boolean
  createdAt: string
  car?: {
    brand?: string
    model?: string
  } | null
}

type Filter = 'all' | 'unread'

function NotificationSkeleton() {
  return (
    <div className="notification-item notification-item-read">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  )
}

export function NotificationItem({ notification }: { notification: NotificationRecord }) {
  const isRead = notification.isRead

  return (
    <article className={`notification-item ${isRead ? 'notification-item-read' : 'notification-item-unread'}`}>
      <div className="flex items-start gap-3">
        {!isRead && <span className="notification-dot mt-2" aria-hidden="true" />}
        <div className="min-w-0 flex-1">
          <h3 className={`text-h3 ${isRead ? 'text-text-secondary' : 'text-text-primary'}`}>
            {notification.title}
          </h3>
          <p className="mt-2 text-body text-text-secondary">{notification.message}</p>
          {notification.car && (
            <p className="mt-3 flex items-center gap-2 text-caption text-text-muted">
              <FaCar />
              {notification.car.brand} {notification.car.model}
            </p>
          )}
          <p className="mt-2 text-caption text-text-muted">
            {format(new Date(notification.createdAt), 'dd MMMM yyyy, HH:mm', { locale: ru })}
          </p>
        </div>
      </div>
    </article>
  )
}

export default function Notifications() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<Filter>('all')

  const { data: notifications = [], isLoading } = useQuery<NotificationRecord[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications')
      return response.data as NotificationRecord[]
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Все уведомления прочитаны')
    },
  })

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  )

  const sorted = useMemo(
    () => [...notifications].sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }),
    [notifications]
  )

  const visible = filter === 'unread' ? sorted.filter((n) => !n.isRead) : sorted

  if (isLoading) {
    return (
      <Page>
        <PageHeader eyebrow="Центр уведомлений" title="Уведомления" />
        <div className="notification-list">
          {Array.from({ length: 4 }).map((_, i) => <NotificationSkeleton key={i} />)}
        </div>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Центр уведомлений"
        title="Уведомления"
        description={
          unreadCount > 0
            ? `${unreadCount} непрочитанн${unreadCount === 1 ? 'ое' : unreadCount < 5 ? 'ых' : 'ых'}`
            : 'Все уведомления прочитаны'
        }
        actions={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              loading={markAllAsReadMutation.isPending}
              onClick={() => markAllAsReadMutation.mutate()}
            >
              <FaCheck />
              Отметить все прочитанными
            </Button>
          ) : null
        }
      />

      <div className="flex items-center gap-4">
        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Все' },
            {
              value: 'unread',
              label: unreadCount > 0 ? `Непрочитанные · ${unreadCount}` : 'Непрочитанные',
            },
          ]}
        />
      </div>

      <div className="notification-list">
        {visible.length > 0 ? (
          visible.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        ) : (
          <EmptyState
            icon={FaBell}
            title={filter === 'unread' ? 'Нет непрочитанных уведомлений' : 'У вас нет уведомлений'}
            description={
              filter === 'unread'
                ? 'Все уведомления прочитаны. Переключитесь на «Все», чтобы увидеть историю.'
                : undefined
            }
          />
        )}
      </div>
    </Page>
  )
}
