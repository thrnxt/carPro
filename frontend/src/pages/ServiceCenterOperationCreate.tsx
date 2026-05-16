import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FaArrowLeft, FaCamera, FaPlus, FaTimes, FaTools } from 'react-icons/fa'
import apiClient from '../api/client'
import { Page, PageHeader, Section } from '../components/ui'

interface ServiceCenterProfile {
  id: number
  name: string
}

interface ServiceCenterClient {
  clientId: number
  firstName: string
  lastName: string
  status: 'NEW' | 'REGULAR' | 'VIP' | 'BLOCKED'
}

interface Booking {
  id: number
  status: string
  car?: {
    id: number
    brand?: string
    model?: string
    licensePlate?: string
    mileage?: number
    owner?: {
      id?: number
      firstName?: string
      lastName?: string
    }
  }
}

interface CarSummary {
  id: number
  brand: string
  model: string
  licensePlate?: string
  mileage?: number
}

interface ComponentSummary {
  id: number
  name: string
  status: string
  wearLevel: number
}

interface CandidateClient {
  id: number
  fullName: string
  source: 'serviced' | 'booking'
}

interface CandidateCar {
  id: number
  title: string
  mileage?: number
}

interface ReplacedPartFormRow {
  componentId: string
  partNumber: string
  manufacturer: string
}

interface CreateOperationPayload {
  carId: number
  workType: string
  description: string | null
  serviceDate: string
  mileageAtService: number
  cost: number | null
  replacedParts: Array<{
    componentId: number
    partNumber: string | null
    manufacturer: string | null
  }>
}

const CLIENT_STATUS_LABELS: Record<ServiceCenterClient['status'], string> = {
  NEW: 'Новый',
  REGULAR: 'Постоянный',
  VIP: 'VIP',
  BLOCKED: 'Заблокирован',
}

const BOOKING_READY_STATUSES = new Set(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'])

export default function ServiceCenterOperationCreate() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [formData, setFormData] = useState({
    clientId: '',
    carId: '',
    workType: '',
    description: '',
    serviceDate: new Date().toISOString().slice(0, 10),
    mileageAtService: '',
    cost: '',
  })
  const [replacedParts, setReplacedParts] = useState<ReplacedPartFormRow[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const { data: serviceCenter } = useQuery<ServiceCenterProfile>({
    queryKey: ['service-center', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/service-centers/my')
      return response.data
    },
  })

  const { data: clients } = useQuery<ServiceCenterClient[]>({
    queryKey: ['service-center-clients', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/service-center-clients/my')
      return response.data
    },
  })

  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ['service-center-bookings', serviceCenter?.id],
    queryFn: async () => {
      const response = await apiClient.get(`/bookings/service-center/${serviceCenter?.id}`)
      return response.data
    },
    enabled: !!serviceCenter?.id,
  })

  const availableClients = useMemo<CandidateClient[]>(() => {
    const merged = new Map<number, CandidateClient>()

    for (const client of clients || []) {
      merged.set(client.clientId, {
        id: client.clientId,
        fullName: `${client.firstName} ${client.lastName}`.trim(),
        source: 'serviced',
      })
    }

    for (const booking of bookings || []) {
      if (!BOOKING_READY_STATUSES.has(booking.status)) {
        continue
      }

      const owner = booking.car?.owner
      if (!owner?.id || merged.has(owner.id)) {
        continue
      }

      merged.set(owner.id, {
        id: owner.id,
        fullName: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || `Клиент #${owner.id}`,
        source: 'booking',
      })
    }

    return Array.from(merged.values()).sort((left, right) => left.fullName.localeCompare(right.fullName, 'ru'))
  }, [bookings, clients])

  const selectedClientId = formData.clientId ? Number(formData.clientId) : null

  const { data: servicedCars } = useQuery<CarSummary[]>({
    queryKey: ['service-center-client-cars', selectedClientId],
    queryFn: async () => {
      const response = await apiClient.get(`/service-center-clients/${selectedClientId}/cars`)
      return response.data
    },
    enabled: !!selectedClientId,
  })

  const candidateCars = useMemo<CandidateCar[]>(() => {
    const cars = new Map<number, CandidateCar>()

    for (const car of servicedCars || []) {
      cars.set(car.id, {
        id: car.id,
        title: `${car.brand} ${car.model}${car.licensePlate ? ` (${car.licensePlate})` : ''}`,
        mileage: car.mileage,
      })
    }

    for (const booking of bookings || []) {
      if (!BOOKING_READY_STATUSES.has(booking.status)) {
        continue
      }

      const ownerId = booking.car?.owner?.id
      const carId = booking.car?.id
      if (!selectedClientId || !ownerId || ownerId !== selectedClientId || !carId || cars.has(carId)) {
        continue
      }

      cars.set(carId, {
        id: carId,
        title: `${booking.car?.brand || ''} ${booking.car?.model || ''}${
          booking.car?.licensePlate ? ` (${booking.car.licensePlate})` : ''
        }`.trim(),
        mileage: booking.car?.mileage,
      })
    }

    return Array.from(cars.values())
  }, [bookings, servicedCars, selectedClientId])

  const selectedCarId = formData.carId ? Number(formData.carId) : null

  const { data: carComponents } = useQuery<ComponentSummary[]>({
    queryKey: ['service-center-client-car-components', selectedClientId, selectedCarId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/service-center-clients/${selectedClientId}/cars/${selectedCarId}/components`
      )
      return response.data
    },
    enabled: !!selectedClientId && !!selectedCarId,
  })

  const addReplacedPartRow = () => {
    setReplacedParts((currentValue) => [...currentValue, { componentId: '', partNumber: '', manufacturer: '' }])
  }

  const removeReplacedPartRow = (index: number) => {
    setReplacedParts((currentValue) => currentValue.filter((_, rowIndex) => rowIndex !== index))
  }

  const updateReplacedPartRow = (index: number, field: keyof ReplacedPartFormRow, value: string) => {
    setReplacedParts((currentValue) =>
      currentValue.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
    )
  }

  const createOperationMutation = useMutation({
    mutationFn: async (payload: CreateOperationPayload) => {
      const uploadedPhotos: Array<{ fileUrl: string; description: string }> = []

      for (const file of selectedFiles) {
        const uploadData = new FormData()
        uploadData.append('file', file)
        uploadData.append('subdirectory', 'maintenance')
        const uploadResponse = await apiClient.post('/files/upload', uploadData)
        uploadedPhotos.push({
          fileUrl: uploadResponse.data.url,
          description: file.name,
        })
      }

      const response = await apiClient.post('/maintenance-records/service-center', {
        ...payload,
        photos: uploadedPhotos,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-center-operations'] })
      queryClient.invalidateQueries({ queryKey: ['service-center-clients', 'my'] })
      queryClient.invalidateQueries({ queryKey: ['service-center-client-car-components'] })
      toast.success('Операция добавлена')
      navigate('/service-center/operations')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Не удалось сохранить операцию')
    },
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.clientId || !formData.carId || !formData.workType || !formData.mileageAtService) {
      toast.error('Заполните обязательные поля')
      return
    }

    const normalizedCost = formData.cost.replace(/\s+/g, '').replace(',', '.')
    if (normalizedCost && !/^\d+(\.\d{1,2})?$/.test(normalizedCost)) {
      toast.error('Стоимость должна быть числом. Можно использовать точку или запятую')
      return
    }

    const preparedReplacedParts = replacedParts
      .map((row) => ({
        componentId: row.componentId.trim(),
        partNumber: row.partNumber.trim(),
        manufacturer: row.manufacturer.trim(),
      }))
      .filter((row) => row.componentId || row.partNumber || row.manufacturer)

    if (preparedReplacedParts.some((row) => !row.componentId)) {
      toast.error('Укажите компонент для каждой добавленной заменённой детали')
      return
    }

    if (preparedReplacedParts.some((row) => !/^\d+$/.test(row.componentId))) {
      toast.error('Компонент должен быть выбран из списка или указан числовым ID')
      return
    }

    const componentIds = preparedReplacedParts.map((row) => Number(row.componentId))
    if (new Set(componentIds).size !== componentIds.length) {
      toast.error('Один и тот же компонент нельзя добавить несколько раз в одной операции')
      return
    }

    createOperationMutation.mutate({
      carId: Number(formData.carId),
      workType: formData.workType.trim(),
      description: formData.description.trim() || null,
      serviceDate: formData.serviceDate,
      mileageAtService: Number(formData.mileageAtService),
      cost: normalizedCost ? Number(normalizedCost) : null,
      replacedParts: preparedReplacedParts.map((row) => ({
        componentId: Number(row.componentId),
        partNumber: row.partNumber || null,
        manufacturer: row.manufacturer || null,
      })),
    })
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Service operations"
        title="Создание операции"
        description="Фиксируйте выполненные работы отдельно от журнала, чтобы история оставалась чистой и сканируемой."
        actions={
          <Link to="/service-center/operations" className="auto-button-secondary">
            <FaArrowLeft />
            К журналу операций
          </Link>
        }
      />

      <Section title="Новая операция" description="Оформление работы, замен деталей и подтверждающих материалов в отдельном рабочем потоке.">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Клиент *</label>
              <select
                value={formData.clientId}
                onChange={(event) =>
                  setFormData((currentValue) => ({ ...currentValue, clientId: event.target.value, carId: '' }))
                }
                className="auto-select"
                required
              >
                <option value="">Выберите клиента</option>
                {availableClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullName}
                    {client.source === 'booking' ? ' (из записи)' : ''}
                    {client.source === 'serviced'
                      ? `, статус: ${CLIENT_STATUS_LABELS[(clients || []).find((item) => item.clientId === client.id)?.status || 'NEW']}`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Автомобиль *</label>
              <select
                value={formData.carId}
                onChange={(event) => setFormData((currentValue) => ({ ...currentValue, carId: event.target.value }))}
                className="auto-select"
                required
                disabled={!formData.clientId}
              >
                <option value="">Выберите автомобиль</option>
                {candidateCars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Тип работы *</label>
              <input
                value={formData.workType}
                onChange={(event) => setFormData((currentValue) => ({ ...currentValue, workType: event.target.value }))}
                className="auto-input"
                placeholder="Например: Замена масла"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Дата *</label>
              <input
                type="date"
                value={formData.serviceDate}
                onChange={(event) =>
                  setFormData((currentValue) => ({ ...currentValue, serviceDate: event.target.value }))
                }
                className="auto-input"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Пробег, км *</label>
              <input
                type="number"
                min="0"
                value={formData.mileageAtService}
                onChange={(event) =>
                  setFormData((currentValue) => ({ ...currentValue, mileageAtService: event.target.value }))
                }
                className="auto-input"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Стоимость, ₸</label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.cost}
                onChange={(event) => setFormData((currentValue) => ({ ...currentValue, cost: event.target.value }))}
                className="auto-input"
                placeholder="Например: 89999.95"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-slate-300">Описание</label>
              <textarea
                value={formData.description}
                onChange={(event) =>
                  setFormData((currentValue) => ({ ...currentValue, description: event.target.value }))
                }
                className="auto-textarea"
                rows={4}
                placeholder="Что было сделано и какие замечания оставил мастер"
              />
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <FaTools className="text-[#ff9b82]" />
                Замененные детали
              </h3>
              <button type="button" className="auto-button-secondary text-sm" onClick={addReplacedPartRow}>
                <FaPlus />
                Добавить деталь
              </button>
            </div>

            {replacedParts.length === 0 ? (
              <p className="text-sm text-slate-400">Детали не добавлены</p>
            ) : (
              <div className="space-y-3">
                {replacedParts.map((row, index) => (
                  <div key={`replaced-part-${index}`} className="grid gap-3 md:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Компонент</label>
                      {carComponents && carComponents.length > 0 ? (
                        <select
                          value={row.componentId}
                          onChange={(event) => updateReplacedPartRow(index, 'componentId', event.target.value)}
                          className="auto-select"
                        >
                          <option value="">Выберите компонент</option>
                          {carComponents.map((component) => (
                            <option key={component.id} value={component.id}>
                              {component.name} ({component.status}, {component.wearLevel}%)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          value={row.componentId}
                          onChange={(event) => updateReplacedPartRow(index, 'componentId', event.target.value)}
                          className="auto-input"
                          placeholder="ID компонента"
                        />
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Номер детали</label>
                      <input
                        value={row.partNumber}
                        onChange={(event) => updateReplacedPartRow(index, 'partNumber', event.target.value)}
                        className="auto-input"
                        placeholder="Part number"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Производитель</label>
                      <input
                        value={row.manufacturer}
                        onChange={(event) => updateReplacedPartRow(index, 'manufacturer', event.target.value)}
                        className="auto-input"
                        placeholder="OEM"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        className="auto-button-danger text-sm"
                        onClick={() => removeReplacedPartRow(index)}
                      >
                        <FaTimes />
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
              <FaCamera className="text-[#ff9b82]" />
              Подтверждающие фото и документы
            </h3>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
              className="hidden"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="auto-button-secondary">
                <FaCamera />
                Добавить файлы
              </button>
              {selectedFiles.length > 0 ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                  Выбрано: {selectedFiles.length}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-slate-400">Поддерживаются JPG, PNG, WEBP и PDF до 10 МБ</p>
            {selectedFiles.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm text-slate-300">
                {selectedFiles.map((file) => (
                  <li key={`${file.name}-${file.size}`}>{file.name}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
            <p className="text-sm text-slate-500">После сохранения операция вернется в журнал и появится в истории сервиса.</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/service-center/operations" className="auto-button-secondary">
                Отмена
              </Link>
              <button
                type="submit"
                disabled={createOperationMutation.isPending}
                className="auto-button-primary"
              >
                {createOperationMutation.isPending ? 'Сохранение...' : 'Сохранить операцию'}
              </button>
            </div>
          </div>
        </form>
      </Section>
    </Page>
  )
}
