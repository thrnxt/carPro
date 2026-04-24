import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import {
  FaCalendarAlt,
  FaClock,
  FaEdit,
  FaEnvelope,
  FaGlobe,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaPhone,
  FaStar,
  FaTimes,
} from 'react-icons/fa'
import { Page, PageHeader } from '../components/ui'

export default function ServiceCenterDetails() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingData, setBookingData] = useState({
    carId: '',
    bookingDateTime: '',
    description: '',
    contactPhone: '',
  })
  const queryClient = useQueryClient()

  const { data: serviceCenter, isLoading } = useQuery({
    queryKey: ['service-center', id],
    queryFn: async () => {
      const response = await apiClient.get(`/service-centers/${id}`)
      return response.data
    },
    enabled: !!id,
  })

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const response = await apiClient.get(`/service-centers/${id}/reviews`)
      return response.data
    },
    enabled: !!id,
  })

  const { data: cars } = useQuery({
    queryKey: ['cars'],
    queryFn: async () => {
      const response = await apiClient.get('/cars')
      return response.data
    },
    enabled: !!user,
  })

  const submitReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      const response = await apiClient.post(`/service-centers/${id}/reviews`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', id] })
      queryClient.invalidateQueries({ queryKey: ['service-center', id] })
      toast.success('Отзыв добавлен')
      setComment('')
      setRating(5)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка добавления отзыва')
    },
  })

  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/bookings', {
        carId: parseInt(data.carId),
        serviceCenterId: parseInt(id!),
        bookingDateTime: data.bookingDateTime,
        description: data.description,
        contactPhone: data.contactPhone,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Запись создана успешно')
      setShowBookingForm(false)
      setBookingData({
        carId: '',
        bookingDateTime: '',
        description: '',
        contactPhone: '',
      })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка создания записи')
    },
  })

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingData.carId || !bookingData.bookingDateTime || !bookingData.contactPhone) {
      toast.error('Заполните все обязательные поля')
      return
    }
    createBookingMutation.mutate(bookingData)
  }

  if (isLoading) {
    return (
      <Page>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <p className="mt-2 text-slate-400">Загрузка...</p>
        </div>
      </Page>
    )
  }

  if (!serviceCenter) {
    return (
      <Page>
        <div className="auto-card p-12 text-center">
          <p className="text-white text-xl">Сервисный центр не найден</p>
        </div>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Marketplace"
        title={serviceCenter.name}
        description="Карточка сервиса объединяет публичную информацию, рейтинг, отзывы и быстрый переход к записи на обслуживание."
      />

      <div className="auto-card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FaInfoCircle className="text-[#ff9b82]" />
              Информация
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <FaMapMarkerAlt className="mt-1 text-slate-400" />
                <div>
                  <p className="text-white font-medium">{serviceCenter.address}</p>
                  <p className="text-slate-400 text-sm">{serviceCenter.city}, {serviceCenter.region}</p>
                </div>
              </div>
              {serviceCenter.phoneNumber && (
                <div className="flex items-center gap-2">
                  <FaPhone className="text-slate-400" />
                  <a href={`tel:${serviceCenter.phoneNumber}`} className="text-red-400 hover:text-red-300">
                    {serviceCenter.phoneNumber}
                  </a>
                </div>
              )}
              {serviceCenter.email && (
                <div className="flex items-center gap-2">
                  <FaEnvelope className="text-slate-400" />
                  <a href={`mailto:${serviceCenter.email}`} className="text-white hover:text-red-400">
                    {serviceCenter.email}
                  </a>
                </div>
              )}
              {serviceCenter.website && (
                <div className="flex items-center gap-2">
                  <FaGlobe className="text-slate-400" />
                  <a href={serviceCenter.website} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300">
                    {serviceCenter.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FaStar className="text-yellow-500" />
              Рейтинг
            </h2>
            {serviceCenter.rating && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-4xl font-bold text-amber-400">{serviceCenter.rating.toFixed(1)}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`text-xl ${i < Math.round(serviceCenter.rating) ? 'text-yellow-500' : 'text-slate-600'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-slate-400">{serviceCenter.reviewCount || 0} отзывов</p>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <Link
                to={`/service-centers/map?center=${serviceCenter.id}`}
                className="auto-button-secondary text-center"
              >
                <FaMapMarkerAlt className="inline mr-2" />
                Показать на карте
              </Link>
              {user && cars && cars.length > 0 && (
                <button
                  onClick={() => setShowBookingForm(!showBookingForm)}
                  className="auto-button-primary"
                >
                  {showBookingForm ? (
                    <>
                      <FaTimes className="inline mr-2" />
                      Отмена
                    </>
                  ) : (
                    <>
                      <FaCalendarAlt className="inline mr-2" />
                      Записаться на обслуживание
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {serviceCenter.description && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              <FaEdit />
              Описание
            </h2>
            <p className="text-slate-300">{serviceCenter.description}</p>
          </div>
        )}
      </div>

      {/* Форма записи на обслуживание */}
      {showBookingForm && user && cars && cars.length > 0 && (
        <div className="auto-card p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <FaCalendarAlt />
            Записаться на обслуживание
          </h2>
          <form onSubmit={handleBookingSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Автомобиль *
                </label>
                <select
                  value={bookingData.carId}
                  onChange={(e) => setBookingData({ ...bookingData, carId: e.target.value })}
                  required
                  className="auto-select"
                >
                  <option value="">Выберите автомобиль</option>
                  {cars.map((car: any) => (
                    <option key={car.id} value={car.id}>
                      {car.brand} {car.model} ({car.licensePlate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Дата и время *
                </label>
                <input
                  type="datetime-local"
                  value={bookingData.bookingDateTime}
                  onChange={(e) => setBookingData({ ...bookingData, bookingDateTime: e.target.value })}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="auto-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Контактный телефон *
                </label>
                <input
                  type="tel"
                  value={bookingData.contactPhone}
                  onChange={(e) => setBookingData({ ...bookingData, contactPhone: e.target.value })}
                  required
                  placeholder="+7 (XXX) XXX-XX-XX"
                  className="auto-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Описание проблемы/работы
              </label>
              <textarea
                value={bookingData.description}
                onChange={(e) => setBookingData({ ...bookingData, description: e.target.value })}
                placeholder="Опишите проблему или необходимые работы..."
                rows={4}
                className="auto-textarea"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={createBookingMutation.isPending}
                className="auto-button-primary"
              >
                {createBookingMutation.isPending ? (
                  <>
                    <FaClock className="animate-spin" />
                    Создание...
                  </>
                ) : (
                  <>
                    <FaCalendarAlt />
                    Создать запись
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBookingForm(false)
                  setBookingData({
                    carId: '',
                    bookingDateTime: '',
                    description: '',
                    contactPhone: '',
                  })
                }}
                className="auto-button-secondary"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Отзывы */}
      <div className="auto-card p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <FaStar className="text-yellow-500" />
          Отзывы
        </h2>
        
        {/* Форма добавления отзыва */}
        {user && (
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
            <h3 className="font-semibold text-white mb-3">Оставить отзыв</h3>
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-300 mb-2">Оценка</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-3xl transition-transform hover:scale-110 ${
                      star <= rating ? 'text-amber-400' : 'text-slate-600'
                    }`}
                  >
                    <FaStar />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ваш отзыв..."
              className="auto-textarea mb-3"
              rows={4}
            />
            <button
              onClick={() => submitReviewMutation.mutate({ rating, comment })}
              disabled={submitReviewMutation.isPending}
              className="auto-button-primary"
            >
              {submitReviewMutation.isPending ? (
                <>
                  <FaClock className="animate-spin inline mr-2" />
                  Отправка...
                </>
              ) : (
                'Отправить отзыв'
              )}
            </button>
          </div>
        )}

        {/* Список отзывов */}
        <div className="space-y-4">
          {reviews && reviews.length > 0 ? (
            reviews.map((review: any) => (
              <div key={review.id} className="border-b border-slate-700 pb-4 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-white">{review.user?.firstName} {review.user?.lastName}</p>
                    <div className="flex gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`text-sm ${i < review.rating ? 'text-yellow-500' : 'text-slate-600'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-slate-400">
                    {format(new Date(review.createdAt), 'dd MMMM yyyy', { locale: ru })}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-slate-300 mt-2">{review.comment}</p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FaStar className="text-6xl text-yellow-500 mx-auto mb-4 opacity-50" />
              <p className="text-slate-400">Пока нет отзывов</p>
            </div>
          )}
        </div>
      </div>
    </Page>
  )
}
