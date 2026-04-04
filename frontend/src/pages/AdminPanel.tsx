import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import apiClient from '../api/client'

interface AdminUser {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
}

interface PendingServiceCenter {
  id: number
  name: string
  city?: string
  region?: string
  address: string
  licenseNumber?: string
  status: string
  user?: {
    email?: string
  }
}

export default function AdminPanel() {
  const queryClient = useQueryClient()

  const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/users')
      return response.data
    },
  })

  const { data: pendingServiceCenters, isLoading: pendingLoading } = useQuery<PendingServiceCenter[]>({
    queryKey: ['admin', 'service-centers', 'pending'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/service-centers/pending')
      return response.data
    },
  })

  const moderationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'ACTIVE' | 'REJECTED' | 'SUSPENDED' }) => {
      const response = await apiClient.patch(`/admin/service-centers/${id}/status`, null, {
        params: { status },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-centers', 'pending'] })
      toast.success('Статус сервиса обновлен')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Не удалось обновить статус сервиса')
    },
  })

  if (usersLoading || pendingLoading) {
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Админ-панель</h1>
        <p className="text-slate-400">Модерация сервисных центров и контроль пользователей</p>
      </div>

      <div className="auto-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Сервисы на модерации</h2>

        {!pendingServiceCenters || pendingServiceCenters.length === 0 ? (
          <p className="text-slate-400">Нет сервисов, ожидающих проверки</p>
        ) : (
          <div className="space-y-3">
            {pendingServiceCenters.map((serviceCenter) => (
              <div key={serviceCenter.id} className="border border-slate-700 rounded-lg p-4 bg-slate-900/40">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div>
                    <p className="text-white text-lg font-semibold">{serviceCenter.name}</p>
                    <p className="text-slate-300 text-sm">
                      {serviceCenter.city || '—'}, {serviceCenter.region || '—'}
                    </p>
                    <p className="text-slate-300 text-sm">{serviceCenter.address}</p>
                    <p className="text-slate-400 text-sm">Лицензия: {serviceCenter.licenseNumber || 'не указана'}</p>
                    <p className="text-slate-400 text-sm">Аккаунт: {serviceCenter.user?.email || '—'}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="auto-button-success text-sm"
                      onClick={() => moderationMutation.mutate({ id: serviceCenter.id, status: 'ACTIVE' })}
                    >
                      Одобрить
                    </button>
                    <button
                      className="auto-button-danger text-sm"
                      onClick={() => moderationMutation.mutate({ id: serviceCenter.id, status: 'REJECTED' })}
                    >
                      Отклонить
                    </button>
                    <button
                      className="auto-button-secondary text-sm"
                      onClick={() => moderationMutation.mutate({ id: serviceCenter.id, status: 'SUSPENDED' })}
                    >
                      Приостановить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="auto-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Пользователи</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Имя</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Роль</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Статус</th>
              </tr>
            </thead>
            <tbody className="bg-slate-800/50 divide-y divide-slate-700">
              {(users || []).map((user) => (
                <tr key={user.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`auto-badge ${
                        user.role === 'ADMIN'
                          ? 'auto-badge-danger'
                          : user.role === 'SERVICE_CENTER'
                            ? 'auto-badge-info'
                            : 'auto-badge'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`auto-badge ${
                        user.status === 'ACTIVE'
                          ? 'auto-badge-success'
                          : user.status === 'BLOCKED'
                            ? 'auto-badge-danger'
                            : 'auto-badge-warning'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
