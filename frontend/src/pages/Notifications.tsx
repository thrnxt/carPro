import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { FaBell, FaCheck, FaClock, FaCar } from 'react-icons/fa'
import { Button, EmptyState, Page, PageHeader } from '../components/ui'

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

export function NotificationItem({ notification }: { notification: NotificationRecord }) {
  const isRead = notification.isRead

  return (
    <article className={`notification-item ${isRead ? 'notification-item-read' : 'notification-item-unread'}`}>
      <div className="flex items-start gap-3">
        {!isRead ? <span className="notification-dot mt-2" aria-hidden="true" /> : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className={`text-h3 ${isRead ? 'text-text-secondary' : 'text-text-primary'}`}>
              {notification.title}
            </h3>
          </div>
          <p className="mt-2 text-body text-text-secondary">{notification.message}</p>
          {notification.car ? (
            <p className="mt-3 flex items-center gap-2 text-caption text-text-muted">
              <FaCar />
              {notification.car.brand} {notification.car.model}
            </p>
          ) : null}
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

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications')
      return response.data
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

  if (isLoading) {
    return (
      <Page>
        <div className="auto-card p-card text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-info"></div>
          <p className="mt-2 text-body text-text-secondary">Загрузка...</p>
        </div>
      </Page>
    )
  }

  const unreadCount = notifications?.filter((n: NotificationRecord) => !n.isRead).length || 0

  return (
    <Page>
      <PageHeader
        title="Уведомления"
        description={unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все уведомления прочитаны'}
        actions={
          unreadCount > 0 ? (
            <Button
              variant="ghost"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <>
                  <FaClock className="animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  <FaCheck />
                  Отметить все прочитанными
                </>
              )}
            </Button>
          ) : null
        }
      />

      <div className="notification-list">
        {notifications && notifications.length > 0 ? (
          notifications.map((notification: NotificationRecord) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        ) : (
          <EmptyState icon={FaBell} title="У вас нет уведомлений" />
        )}
      </div>
    </Page>
  )
}
