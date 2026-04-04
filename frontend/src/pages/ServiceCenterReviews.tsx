import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import { FaStar } from 'react-icons/fa'

interface ServiceCenter {
  id: number
  name: string
  rating?: number
  reviewCount?: number
}

interface Review {
  id: number
  rating: number
  comment?: string
  createdAt: string
  user?: {
    firstName?: string
    lastName?: string
  }
}

export default function ServiceCenterReviews() {
  const { data: serviceCenter } = useQuery<ServiceCenter>({
    queryKey: ['service-center', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/service-centers/my')
      return response.data
    },
  })

  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['service-center-reviews', serviceCenter?.id],
    queryFn: async () => {
      const response = await apiClient.get(`/service-centers/${serviceCenter?.id}/reviews`)
      return response.data
    },
    enabled: !!serviceCenter?.id,
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <p className="mt-2 text-slate-400">Загрузка отзывов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Отзывы</h1>
        <p className="text-slate-400">Отзывы клиентов о вашем сервисном центре</p>
      </div>

      <div className="auto-card p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">{serviceCenter?.name || 'Сервисный центр'}</h2>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-amber-400">
            {serviceCenter?.rating ? serviceCenter.rating.toFixed(1) : '0.0'}
          </div>
          <div className="text-slate-400">
            {serviceCenter?.reviewCount || 0} отзывов
          </div>
        </div>
      </div>

      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((review) => (
              <div key={review.id} className="auto-card p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-white font-semibold">
                      {review.user?.firstName} {review.user?.lastName}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {new Date(review.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    <FaStar />
                    <span className="font-bold">{review.rating}</span>
                  </div>
                </div>
                <p className="text-slate-300">{review.comment || 'Без комментария'}</p>
              </div>
            ))}
        </div>
      ) : (
        <div className="auto-card p-10 text-center">
          <FaStar className="text-6xl text-red-500 mx-auto mb-4 opacity-50" />
          <p className="text-slate-300 text-lg">Пока нет отзывов</p>
        </div>
      )}
    </div>
  )
}
