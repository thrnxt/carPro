import type { AxiosError } from 'axios'
import { useDeferredValue, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { FaPlus, FaTimes, FaSave, FaEdit, FaTrash, FaCarSide, FaArrowRight } from 'react-icons/fa'

type Car = {
  id: number
  brand: string
  model: string
  year: number
  vin?: string | null
  licensePlate?: string | null
  color?: string | null
  mileage: number
  lastServiceDate?: string | null
}

type CarFormData = {
  brand: string
  model: string
  year: number
  vin: string
  licensePlate: string
  color: string
  mileage: number
}

type CatalogCar = {
  vin: string
  brand: string
  model: string
  year: number
  color?: string | null
  licensePlate: string
  mileage: number
}

type ApiErrorResponse = {
  message?: string
}

const createEmptyFormData = (): CarFormData => ({
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  vin: '',
  licensePlate: '',
  color: '',
  mileage: 0,
})

const sanitizeVin = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17)

export default function Garage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<CarFormData>(createEmptyFormData)
  const [vinInput, setVinInput] = useState('')
  const queryClient = useQueryClient()
  const currentVin = sanitizeVin(vinInput)
  const isCurrentVinComplete = currentVin.length === 17
  const deferredVin = useDeferredValue(vinInput)
  const normalizedVin = sanitizeVin(deferredVin)
  const isVinLookupReady = normalizedVin.length === 17

  const { data: cars, isLoading } = useQuery<Car[]>({
    queryKey: ['cars'],
    queryFn: async () => {
      const response = await apiClient.get('/cars')
      return response.data as Car[]
    },
  })

  const [editingCar, setEditingCar] = useState<Car | null>(null)

  const lookupCarQuery = useQuery<CatalogCar, AxiosError<ApiErrorResponse>>({
    queryKey: ['vehicle-catalog', normalizedVin],
    queryFn: async () => {
      const response = await apiClient.get(`/cars/lookup/${normalizedVin}`)
      return response.data as CatalogCar
    },
    enabled: showAddForm && !editingCar && isVinLookupReady,
    retry: false,
  })
  const catalogCar = lookupCarQuery.data?.vin === currentVin ? lookupCarQuery.data : null

  const addCarMutation = useMutation<Car, AxiosError<ApiErrorResponse>, string>({
    mutationFn: async (vin: string) => {
      const response = await apiClient.post('/cars/by-vin', { vin })
      return response.data as Car
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] })
      toast.success('Автомобиль добавлен')
      setShowAddForm(false)
      setVinInput('')
      setFormData(createEmptyFormData())
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Ошибка добавления автомобиля')
    },
  })

  const updateCarMutation = useMutation<Car, AxiosError<ApiErrorResponse>, { id: number; data: CarFormData }>({
    mutationFn: async ({ id, data }: { id: number; data: CarFormData }) => {
      const response = await apiClient.put(`/cars/${id}`, data)
      return response.data as Car
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] })
      toast.success('Автомобиль обновлен')
      setEditingCar(null)
      setShowAddForm(false)
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Ошибка обновления автомобиля')
    },
  })

  const deleteCarMutation = useMutation<void, AxiosError<ApiErrorResponse>, number>({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/cars/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] })
      toast.success('Автомобиль удален')
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления автомобиля')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCar) {
      updateCarMutation.mutate({ id: editingCar.id, data: formData })
    } else {
      const vin = currentVin
      if (vin.length !== 17) {
        toast.error('Введите корректный 17-значный VIN')
        return
      }

      if (!catalogCar || catalogCar.vin !== vin) {
        toast.error('Автомобиль по этому VIN не найден')
        return
      }

      addCarMutation.mutate(vin)
    }
  }

  const handleEdit = (car: Car) => {
    setEditingCar(car)
    setFormData({
      brand: car.brand,
      model: car.model,
      year: car.year,
      vin: car.vin || '',
      licensePlate: car.licensePlate || '',
      color: car.color || '',
      mileage: car.mileage,
    })
    setVinInput('')
    setShowAddForm(true)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот автомобиль?')) {
      deleteCarMutation.mutate(id)
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingCar(null)
    setVinInput('')
    setFormData(createEmptyFormData())
  }

  const openAddForm = () => {
    setEditingCar(null)
    setShowAddForm(true)
    setVinInput('')
    setFormData(createEmptyFormData())
  }

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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Мой гараж</h1>
          <p className="text-slate-400">Управление вашими автомобилями</p>
        </div>
        <button
          onClick={() => {
            if (!showAddForm) {
              openAddForm()
            } else {
              handleCancel()
            }
          }}
          className="auto-button-primary flex items-center gap-2"
        >
          {showAddForm ? (
            <>
              <FaTimes />
              Отмена
            </>
          ) : (
            <>
              <FaPlus />
              Добавить автомобиль
            </>
          )}
        </button>
      </div>

      {showAddForm && (
        <div className="auto-card p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            {editingCar ? (
              <>
                <FaEdit />
                Редактировать автомобиль
              </>
            ) : (
              <>
                <FaPlus />
                Добавить новый автомобиль
              </>
            )}
          </h2>
          {editingCar ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Марка *</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="auto-input"
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Модель *</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="auto-input"
                    placeholder="Camry"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Год выпуска *</label>
                  <input
                    type="number"
                    required
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) || new Date().getFullYear() })}
                    className="auto-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Гос. номер *</label>
                  <input
                    type="text"
                    required
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                    className="auto-input font-mono"
                    placeholder="01ABC123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">VIN номер</label>
                  <input
                    type="text"
                    value={formData.vin}
                    onChange={(e) => setFormData({ ...formData, vin: sanitizeVin(e.target.value) })}
                    className="auto-input font-mono"
                    placeholder="17-значный номер"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Цвет</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="auto-input"
                    placeholder="Черный"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Пробег (км) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value, 10) || 0 })}
                    className="auto-input"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="auto-button-primary flex items-center gap-2"
                  disabled={updateCarMutation.isPending}
                >
                  <FaSave />
                  Сохранить изменения
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="auto-button-secondary"
                >
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">VIN номер *</label>
                <input
                  type="text"
                  required
                  value={vinInput}
                  onChange={(e) => setVinInput(sanitizeVin(e.target.value))}
                  className="auto-input font-mono"
                  placeholder="Введите 17-значный VIN"
                />
                <p className="text-sm text-slate-400 mt-2">
                  Введите VIN из каталога, остальные данные автомобиля подтянутся автоматически.
                </p>
              </div>

              {vinInput.length > 0 && currentVin.length < 17 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  VIN должен содержать 17 символов.
                </div>
              )}

              {isCurrentVinComplete && lookupCarQuery.isFetching && (
                <div className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
                  Поиск автомобиля по VIN...
                </div>
              )}

              {isCurrentVinComplete && lookupCarQuery.error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {lookupCarQuery.error.response?.data?.message || 'Автомобиль по этому VIN не найден'}
                </div>
              )}

              {catalogCar && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm text-emerald-300 mb-1">Автомобиль найден</p>
                      <h3 className="text-2xl font-bold text-white">
                        {catalogCar.brand} {catalogCar.model}
                      </h3>
                    </div>
                    <FaCarSide className="text-4xl text-emerald-400" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="rounded-xl bg-slate-900/60 px-4 py-3">
                      <p className="text-slate-400 mb-1">VIN</p>
                      <p className="text-white font-mono">{catalogCar.vin}</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/60 px-4 py-3">
                      <p className="text-slate-400 mb-1">Год выпуска</p>
                      <p className="text-white">{catalogCar.year}</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/60 px-4 py-3">
                      <p className="text-slate-400 mb-1">Цвет</p>
                      <p className="text-white">{catalogCar.color || 'Не указан'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/60 px-4 py-3">
                      <p className="text-slate-400 mb-1">Гос. номер</p>
                      <p className="text-white font-mono">{catalogCar.licensePlate}</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/60 px-4 py-3 md:col-span-2">
                      <p className="text-slate-400 mb-1">Пробег</p>
                      <p className="text-white">{catalogCar.mileage.toLocaleString('ru-RU')} км</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="auto-button-primary flex items-center gap-2"
                  disabled={!catalogCar || lookupCarQuery.isFetching || addCarMutation.isPending}
                >
                  <FaPlus />
                  Добавить автомобиль
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="auto-button-secondary"
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {cars && cars.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <div key={car.id} className="auto-card p-6 relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleEdit(car)
                  }}
                  className="p-2 bg-slate-700 hover:bg-blue-600 rounded-lg text-white transition-colors"
                  title="Редактировать"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete(car.id)
                  }}
                  className="p-2 bg-slate-700 hover:bg-red-600 rounded-lg text-white transition-colors"
                  title="Удалить"
                >
                  <FaTrash />
                </button>
              </div>
              <Link to={`/cars/${car.id}`} className="block">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-slate-400 text-sm">{car.year} год выпуска</p>
                  </div>
                  <FaCarSide className="text-4xl text-red-500" />
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Пробег:</span>
                    <span className="text-white font-semibold">{car.mileage?.toLocaleString()} км</span>
                  </div>
                  {car.licensePlate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Гос. номер:</span>
                      <span className="text-red-400 font-mono font-bold">{car.licensePlate}</span>
                    </div>
                  )}
                  {car.color && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Цвет:</span>
                      <span className="text-white">{car.color}</span>
                    </div>
                  )}
                  {car.lastServiceDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Последнее ТО:</span>
                      <span className="text-emerald-400">
                        {new Date(car.lastServiceDate).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <span className="text-red-400 text-sm font-medium flex items-center gap-2">
                    Подробнее
                    <FaArrowRight />
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="auto-card p-12 text-center">
          <FaCarSide className="text-8xl text-red-500 mx-auto mb-6 opacity-50" />
          <h3 className="text-2xl font-bold text-white mb-4">Гараж пуст</h3>
          <p className="text-slate-400 mb-6">Добавьте свой первый автомобиль для начала работы</p>
          <button
            onClick={openAddForm}
            className="auto-button-primary flex items-center gap-2 mx-auto"
          >
            <FaPlus />
            Добавить автомобиль
          </button>
        </div>
      )}
    </div>
  )
}
