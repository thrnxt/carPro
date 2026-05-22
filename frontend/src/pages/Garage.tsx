import type { AxiosError } from 'axios'
import { useDeferredValue, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FaArrowRight,
  FaCarSide,
  FaEdit,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
} from 'react-icons/fa'
import apiClient from '../api/client'
import {
  Button,
  EmptyState,
  Input,
  KeyValue,
  Page,
  PageHeader,
  Section,
  SkeletonCard,
} from '../components/ui'

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

type ApiErrorResponse = { message?: string }

const createEmptyFormData = (): CarFormData => ({
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  vin: '',
  licensePlate: '',
  color: '',
  mileage: 0,
})

const sanitizeVin = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17)

export default function Garage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [vinInput, setVinInput] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const currentVin = sanitizeVin(vinInput)
  const isCurrentVinComplete = currentVin.length === 17
  const deferredVin = useDeferredValue(vinInput)
  const normalizedVin = sanitizeVin(deferredVin)
  const isVinLookupReady = normalizedVin.length === 17

  const { data: cars = [], isLoading } = useQuery<Car[]>({
    queryKey: ['cars'],
    queryFn: async () => {
      const response = await apiClient.get('/cars')
      return response.data as Car[]
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CarFormData>({ mode: 'onTouched' })

  useEffect(() => {
    if (editingCar) {
      reset({
        brand: editingCar.brand,
        model: editingCar.model,
        year: editingCar.year,
        vin: editingCar.vin ?? '',
        licensePlate: editingCar.licensePlate ?? '',
        color: editingCar.color ?? '',
        mileage: editingCar.mileage,
      })
    } else {
      reset(createEmptyFormData())
    }
  }, [editingCar, reset])

  const lookupCarQuery = useQuery<CatalogCar, AxiosError<ApiErrorResponse>>({
    queryKey: ['vehicle-catalog', normalizedVin],
    queryFn: async () => {
      const response = await apiClient.get(`/cars/lookup/${normalizedVin}`)
      return response.data as CatalogCar
    },
    enabled: showForm && !editingCar && isVinLookupReady,
    retry: false,
  })
  const catalogCar = lookupCarQuery.data?.vin === currentVin ? lookupCarQuery.data : null

  const addCarMutation = useMutation<Car, AxiosError<ApiErrorResponse>, string>({
    mutationFn: async (vin) => {
      const response = await apiClient.post('/cars/by-vin', { vin })
      return response.data as Car
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] })
      toast.success('Автомобиль добавлен')
      handleCancel()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка добавления автомобиля')
    },
  })

  const updateCarMutation = useMutation<Car, AxiosError<ApiErrorResponse>, { id: number; data: CarFormData }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put(`/cars/${id}`, data)
      return response.data as Car
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] })
      toast.success('Автомобиль обновлён')
      handleCancel()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка обновления автомобиля')
    },
  })

  const deleteCarMutation = useMutation<void, AxiosError<ApiErrorResponse>, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/cars/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] })
      toast.success('Автомобиль удалён')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления автомобиля')
    },
  })

  const onEditSubmit = async (data: CarFormData) => {
    if (!editingCar) return
    try {
      await updateCarMutation.mutateAsync({ id: editingCar.id, data })
    } catch {
      // handled by mutation onError
    }
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!catalogCar || catalogCar.vin !== currentVin) return
    addCarMutation.mutate(currentVin)
  }

  const handleEdit = (car: Car) => {
    setEditingCar(car)
    setShowForm(true)
    setVinInput('')
    setConfirmDeleteId(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCar(null)
    setVinInput('')
    reset(createEmptyFormData())
  }

  const openAddForm = () => {
    setEditingCar(null)
    setShowForm(true)
    setVinInput('')
    setConfirmDeleteId(null)
    reset(createEmptyFormData())
  }

  if (isLoading) {
    return (
      <Page>
        <PageHeader eyebrow="Гараж" title="Мой гараж" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={4} />)}
        </div>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Гараж"
        title="Мой гараж"
        description="Управление автомобилями и VIN-паспортами."
        actions={
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            onClick={showForm ? handleCancel : openAddForm}
          >
            {showForm ? <><FaTimes /> Отмена</> : <><FaPlus /> Добавить автомобиль</>}
          </Button>
        }
      />

      {showForm && (
        <Section title={editingCar ? 'Редактировать автомобиль' : 'Добавить автомобиль'}>
          {editingCar ? (
            <form onSubmit={handleSubmit(onEditSubmit)} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Марка"
                  placeholder="Toyota"
                  required
                  error={errors.brand?.message}
                  {...register('brand', { required: 'Укажите марку' })}
                />
                <Input
                  label="Модель"
                  placeholder="Camry"
                  required
                  error={errors.model?.message}
                  {...register('model', { required: 'Укажите модель' })}
                />
                <Input
                  label="Год выпуска"
                  type="number"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  required
                  error={errors.year?.message}
                  {...register('year', {
                    required: 'Укажите год',
                    valueAsNumber: true,
                    min: { value: 1900, message: 'Год не может быть раньше 1900' },
                    max: {
                      value: new Date().getFullYear() + 1,
                      message: 'Некорректный год',
                    },
                  })}
                />
                <Input
                  label="Гос. номер"
                  placeholder="01ABC123"
                  required
                  className="font-mono uppercase"
                  error={errors.licensePlate?.message}
                  {...register('licensePlate', { required: 'Укажите гос. номер' })}
                />
                <Input
                  label="VIN номер"
                  placeholder="17-значный VIN"
                  className="font-mono"
                  hint="Необязательно"
                  {...register('vin')}
                />
                <Input
                  label="Цвет"
                  placeholder="Чёрный"
                  hint="Необязательно"
                  {...register('color')}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Пробег (км)"
                    type="number"
                    min={0}
                    required
                    error={errors.mileage?.message}
                    {...register('mileage', {
                      required: 'Укажите пробег',
                      valueAsNumber: true,
                      min: { value: 0, message: 'Пробег не может быть отрицательным' },
                    })}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  loading={updateCarMutation.isPending}
                >
                  <FaSave />
                  Сохранить изменения
                </Button>
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Отмена
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddSubmit}>
              <Input
                label="VIN номер"
                className="font-mono"
                placeholder="Введите 17-значный VIN"
                value={vinInput}
                onChange={(e) => setVinInput(sanitizeVin(e.target.value))}
                hint={
                  vinInput.length === 0
                    ? 'Введите VIN — остальные данные подтянутся автоматически'
                    : `${currentVin.length} / 17 символов`
                }
                error={
                  isCurrentVinComplete && lookupCarQuery.error
                    ? (lookupCarQuery.error.response?.data?.message ?? 'Автомобиль по этому VIN не найден')
                    : undefined
                }
              />

              {isCurrentVinComplete && lookupCarQuery.isFetching && (
                <p className="mt-3 text-body text-text-secondary">Поиск в базе данных…</p>
              )}

              {catalogCar && (
                <div className="mt-4 glass-panel p-5 border border-success/20">
                  <p className="section-label mb-4 text-success">Автомобиль найден</p>
                  <div className="grid gap-2 rounded-md border border-border bg-surface-3 p-4 md:grid-cols-2">
                    <KeyValue
                      label="Марка и модель"
                      value={`${catalogCar.brand} ${catalogCar.model}`}
                    />
                    <KeyValue label="Год" value={catalogCar.year} />
                    <KeyValue
                      label="VIN"
                      value={<span className="font-mono text-caption">{catalogCar.vin}</span>}
                    />
                    <KeyValue
                      label="Гос. номер"
                      value={
                        <span className="font-mono text-info">{catalogCar.licensePlate}</span>
                      }
                    />
                    <KeyValue label="Цвет" value={catalogCar.color ?? '—'} />
                    <KeyValue
                      label="Пробег"
                      value={`${catalogCar.mileage.toLocaleString('ru-RU')} км`}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  loading={addCarMutation.isPending}
                  disabled={!catalogCar || lookupCarQuery.isFetching}
                >
                  <FaPlus />
                  Добавить автомобиль
                </Button>
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Отмена
                </Button>
              </div>
            </form>
          )}
        </Section>
      )}

      {cars.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cars.map((car) => (
            <div key={car.id} className="auto-card p-card flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="section-label">Автомобиль</p>
                  <h3 className="mt-1 truncate text-h2 text-text-primary">
                    {car.brand} {car.model}
                  </h3>
                  <p className="mt-0.5 text-body text-text-secondary">{car.year} г.в.</p>
                </div>
                <div className="metric-icon shrink-0">
                  <FaCarSide />
                </div>
              </div>

              <div className="grid gap-2 rounded-md border border-border bg-surface-3 p-4 text-body">
                <KeyValue
                  label="Пробег"
                  value={`${car.mileage?.toLocaleString('ru-RU') ?? 0} км`}
                />
                <KeyValue
                  label="Гос. номер"
                  value={
                    car.licensePlate ? (
                      <span className="font-mono text-info">{car.licensePlate}</span>
                    ) : '—'
                  }
                />
                {car.color && <KeyValue label="Цвет" value={car.color} />}
                {car.lastServiceDate && (
                  <KeyValue
                    label="Последнее ТО"
                    value={
                      <span className="text-success">
                        {new Date(car.lastServiceDate).toLocaleDateString('ru-RU')}
                      </span>
                    }
                  />
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <Link
                  to={`/cars/${car.id}`}
                  className="flex items-center gap-2 text-body font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  Открыть карточку
                  <FaArrowRight className="text-xs" />
                </Link>

                <div className="flex items-center gap-2">
                  {confirmDeleteId === car.id ? (
                    <>
                      <span className="text-caption text-text-muted">Удалить?</span>
                      <Button
                        variant="secondary"
                        className="h-8 px-3 text-sm text-danger"
                        loading={deleteCarMutation.isPending}
                        onClick={() => {
                          deleteCarMutation.mutate(car.id)
                          setConfirmDeleteId(null)
                        }}
                      >
                        Да
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-8 px-3 text-sm"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Нет
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        title="Редактировать"
                        onClick={() => handleEdit(car)}
                      >
                        <FaEdit className="text-xs" />
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-8 w-8 p-0 text-danger"
                        title="Удалить"
                        onClick={() => setConfirmDeleteId(car.id)}
                      >
                        <FaTrash className="text-xs" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !showForm ? (
        <EmptyState
          icon={FaCarSide}
          title="Гараж пуст"
          description="Добавьте первый автомобиль по VIN, чтобы открыть историю обслуживания, записи и документы."
          action={
            <Button variant="primary" onClick={openAddForm}>
              <FaPlus />
              Добавить автомобиль
            </Button>
          }
        />
      ) : null}
    </Page>
  )
}
