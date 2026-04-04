import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FaCamera,
  FaCar,
  FaClipboardList,
  FaPlus,
  FaTimes,
  FaTools,
  FaUser,
} from 'react-icons/fa'
import apiClient from '../api/client'
import { resolveFileUrl } from '../utils/resolveFileUrl'

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

interface MaintenanceOperation {
  id: number
  workType: string
  description?: string
  serviceDate: string
  mileageAtService: number
  cost?: number
  car?: {
    id: number
    brand?: string
    model?: string
    licensePlate?: string
    owner?: {
      id?: number
      firstName?: string
      lastName?: string
    }
  }
  photos?: Array<{
    id: number
    fileUrl: string
    description?: string
  }>
  replacedComponents?: Array<{
    id: number
    carComponent?: {
      id: number
      name?: string
    }
    partNumber?: string
    manufacturer?: string
  }>
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

export default function ServiceCenterOperations() {
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
      if (!owner?.id) {
        continue
      }
      if (!merged.has(owner.id)) {
        merged.set(owner.id, {
          id: owner.id,
          fullName: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || `Клиент #${owner.id}`,
          source: 'booking',
        })
      }
    }

    return Array.from(merged.values()).sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'))
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
    const list = new Map<number, CandidateCar>()

    for (const car of servicedCars || []) {
      list.set(car.id, {
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
      if (!selectedClientId || !ownerId || ownerId !== selectedClientId || !carId) {
        continue
      }
      if (!list.has(carId)) {
        list.set(carId, {
          id: carId,
          title: `${booking.car?.brand || ''} ${booking.car?.model || ''}${
            booking.car?.licensePlate ? ` (${booking.car.licensePlate})` : ''
          }`.trim(),
          mileage: booking.car?.mileage,
        })
      }
    }

    return Array.from(list.values())
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

  const { data: operations, isLoading } = useQuery<MaintenanceOperation[]>({
    queryKey: ['service-center-operations', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/maintenance-records/service-center/my')
      return response.data
    },
  })

  const addReplacedPartRow = () => {
    setReplacedParts((prev) => [...prev, { componentId: '', partNumber: '', manufacturer: '' }])
  }

  const removeReplacedPartRow = (index: number) => {
    setReplacedParts((prev) => prev.filter((_, rowIndex) => rowIndex !== index))
  }

  const updateReplacedPartRow = (
    index: number,
    field: keyof ReplacedPartFormRow,
    value: string
  ) => {
    setReplacedParts((prev) =>
      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
    )
  }

  const resetForm = () => {
    setFormData({
      clientId: '',
      carId: '',
      workType: '',
      description: '',
      serviceDate: new Date().toISOString().slice(0, 10),
      mileageAtService: '',
      cost: '',
    })
    setReplacedParts([])
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const createOperationMutation = useMutation({
    mutationFn: async (payload: CreateOperationPayload) => {
      const uploadedPhotos = [] as Array<{ fileUrl: string; description: string }>

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
      queryClient.invalidateQueries({ queryKey: ['service-center-operations', 'my'] })
      queryClient.invalidateQueries({ queryKey: ['service-center-clients', 'my'] })
      queryClient.invalidateQueries({ queryKey: ['service-center-client-car-components'] })
      toast.success('Операция добавлена')
      resetForm()
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

  const sortedOperations = useMemo(
    () =>
      (operations || [])
        .slice()
        .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()),
    [operations]
  )

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <p className="mt-2 text-slate-400">Загрузка операций...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Операции</h1>
        <p className="text-slate-400">
          Добавление выполненных работ, замен деталей и подтверждающих фото
        </p>
      </div>

      <form onSubmit={handleSubmit} className="auto-card p-6 space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FaPlus className="text-red-500" />
          Новая операция
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Клиент *</label>
            <select
              value={formData.clientId}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, clientId: event.target.value, carId: '' }))
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
            <label className="block text-sm text-slate-300 mb-2">Автомобиль *</label>
            <select
              value={formData.carId}
              onChange={(event) => setFormData((prev) => ({ ...prev, carId: event.target.value }))}
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
            <label className="block text-sm text-slate-300 mb-2">Тип работы *</label>
            <input
              value={formData.workType}
              onChange={(event) => setFormData((prev) => ({ ...prev, workType: event.target.value }))}
              className="auto-input"
              placeholder="Например: Замена масла"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Дата *</label>
            <input
              type="date"
              value={formData.serviceDate}
              onChange={(event) => setFormData((prev) => ({ ...prev, serviceDate: event.target.value }))}
              className="auto-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Пробег, км *</label>
            <input
              type="number"
              min="0"
              value={formData.mileageAtService}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, mileageAtService: event.target.value }))
              }
              className="auto-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Стоимость, ₸</label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.cost}
              onChange={(event) => setFormData((prev) => ({ ...prev, cost: event.target.value }))}
              className="auto-input"
              placeholder="Например: 89999.95"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-slate-300 mb-2">Описание</label>
            <textarea
              value={formData.description}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              className="auto-textarea"
              rows={3}
              placeholder="Что было сделано"
            />
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg text-white font-semibold flex items-center gap-2">
              <FaTools className="text-red-500" />
              Замененные детали
            </h3>
            <button type="button" className="auto-button-secondary text-sm" onClick={addReplacedPartRow}>
              <FaPlus className="inline mr-1" />
              Добавить деталь
            </button>
          </div>

          {replacedParts.length === 0 ? (
            <p className="text-slate-400 text-sm">Детали не добавлены</p>
          ) : (
            <div className="space-y-3">
              {replacedParts.map((row, index) => (
                <div key={`replaced-part-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Компонент</label>
                    {carComponents && carComponents.length > 0 ? (
                      <select
                        value={row.componentId}
                        onChange={(event) =>
                          updateReplacedPartRow(index, 'componentId', event.target.value)
                        }
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
                        onChange={(event) =>
                          updateReplacedPartRow(index, 'componentId', event.target.value)
                        }
                        className="auto-input"
                        placeholder="ID компонента"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Номер детали</label>
                    <input
                      value={row.partNumber}
                      onChange={(event) => updateReplacedPartRow(index, 'partNumber', event.target.value)}
                      className="auto-input"
                      placeholder="Part number"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Производитель</label>
                    <input
                      value={row.manufacturer}
                      onChange={(event) =>
                        updateReplacedPartRow(index, 'manufacturer', event.target.value)
                      }
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
                      <FaTimes className="inline mr-1" />
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-700 pt-4">
          <h3 className="text-lg text-white font-semibold flex items-center gap-2 mb-2">
            <FaCamera className="text-red-500" />
            Подтверждающие фото/документы
          </h3>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
            className="auto-input"
          />
          <p className="mt-2 text-xs text-slate-400">
            Поддерживаются JPG, PNG, WEBP и PDF до 10 МБ
          </p>
          {selectedFiles.length > 0 && (
            <ul className="mt-2 text-sm text-slate-300 space-y-1">
              {selectedFiles.map((file) => (
                <li key={`${file.name}-${file.size}`}>{file.name}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="pt-2">
          <button type="submit" disabled={createOperationMutation.isPending} className="auto-button-primary">
            {createOperationMutation.isPending ? 'Сохранение...' : 'Сохранить операцию'}
          </button>
        </div>
      </form>

      <div className="auto-card p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <FaClipboardList className="text-red-500" />
          Последние операции
        </h2>

        {sortedOperations.length === 0 ? (
          <p className="text-slate-400">Операций пока нет</p>
        ) : (
          <div className="space-y-4">
            {sortedOperations.map((operation) => (
              <div key={operation.id} className="border border-slate-700 rounded-lg p-4 bg-slate-900/40">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                  <div>
                    <p className="text-white font-semibold text-lg">{operation.workType}</p>
                    <p className="text-slate-300 text-sm mt-1">
                      <FaUser className="inline mr-1" />
                      {operation.car?.owner?.firstName} {operation.car?.owner?.lastName}
                    </p>
                    <p className="text-slate-300 text-sm">
                      <FaCar className="inline mr-1" />
                      {operation.car?.brand} {operation.car?.model}
                      {operation.car?.licensePlate ? ` (${operation.car.licensePlate})` : ''}
                    </p>
                    <p className="text-slate-400 text-sm">Дата: {operation.serviceDate}</p>
                    <p className="text-slate-400 text-sm">
                      Пробег: {operation.mileageAtService?.toLocaleString('ru-RU')} км
                    </p>
                    {operation.cost != null && (
                      <p className="text-emerald-400 text-sm">Сумма: {operation.cost.toLocaleString('ru-RU')} ₸</p>
                    )}
                    {operation.description && <p className="text-slate-300 mt-2">{operation.description}</p>}
                  </div>

                  <div className="text-sm text-slate-400">
                    {operation.replacedComponents && operation.replacedComponents.length > 0 && (
                      <div className="mb-2">
                        <p className="text-slate-300 font-medium">Заменено:</p>
                        <ul className="list-disc pl-5">
                          {operation.replacedComponents.map((item) => (
                            <li key={item.id}>
                              {item.carComponent?.name || `Компонент #${item.carComponent?.id}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {operation.photos && operation.photos.length > 0 && (
                      <div>
                        <p className="text-slate-300 font-medium">Файлы:</p>
                        <ul className="space-y-1">
                          {operation.photos.map((photo) => (
                            <li key={photo.id}>
                              <a
                                href={resolveFileUrl(photo.fileUrl) || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="text-red-400 hover:text-red-300"
                              >
                                {photo.description || 'Открыть файл'}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
