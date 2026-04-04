import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { FaBell, FaCheck, FaClock, FaCar } from 'react-icons/fa'

export default function Notifications() {
  const queryClient = useQueryClient()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications')
      return response.data
    },
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.patch(`/notifications/${id}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
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
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <p className="mt-2 text-slate-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Уведомления</h1>
          <p className="text-slate-400">
            {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все уведомления прочитаны'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            className="auto-button-secondary flex items-center gap-2"
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
                Отметить все как прочитанные
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications && notifications.length > 0 ? (
          notifications.map((notification: any) => (
            <div
              key={notification.id}
              className={`auto-card p-6 ${
                !notification.isRead ? 'border-l-4 border-red-500' : 'opacity-75'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-white">{notification.title}</h3>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-slate-300 mb-3">{notification.message}</p>
                  {notification.car && (
                    <p className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                      <FaCar />
                      {notification.car.brand} {notification.car.model}
                    </p>
                  )}
                  <p className="text-sm text-slate-500">
                    {format(new Date(notification.createdAt), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                  </p>
                </div>
                {!notification.isRead && (
                  <button
                    onClick={() => markAsReadMutation.mutate(notification.id)}
                    className="auto-button-secondary text-sm ml-4"
                    disabled={markAsReadMutation.isPending}
                  >
                    Прочитано
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="auto-card p-12 text-center">
            <FaBell className="text-6xl text-red-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 text-lg">У вас нет уведомлений</p>
          </div>
        )}
      </div>
    </div>
  )
}
