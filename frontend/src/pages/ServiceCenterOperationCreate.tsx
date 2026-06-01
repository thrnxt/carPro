import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCamera,
  FaCar,
  FaChevronDown,
  FaPhoneAlt,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTools,
  FaUser,
} from 'react-icons/fa'
import apiClient from '../api/client'
import { EmptyState, Page, PageHeader, Section, cx } from '../components/ui'

interface ServiceCenterProfile {
  id: number
  name: string
}

interface Booking {
  id: number
  status: string
  bookingDateTime: string
  createdAt?: string
  description?: string
  contactPhone?: string
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
      phoneNumber?: string
    }
  }
}

interface ExistingOperationSummary {
  id: number
  booking?: {
    id?: number
  }
}

interface ComponentSummary {
  id: number
  name: string
  status: string
  wearLevel: number
}

interface ReplacedPartFormRow {
  componentId: string
  partNumber: string
  manufacturer: string
  files: File[]
}

interface CreateOperationPayload {
  bookingId: number
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
    files: File[]
  }>
}

interface UploadedOperationPhoto {
  fileUrl: string
  description: string
}

const OPERATION_SOURCE_STATUSES = new Set(['COMPLETED'])

function formatBookingDateTime(value: string) {
  try {
    return new Date(value).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function getBookingSortTime(booking: Booking) {
  const primaryDate = booking.createdAt || booking.bookingDateTime
  const parsed = new Date(primaryDate).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function getBookingClientName(booking: Booking) {
  return `${booking.car?.owner?.firstName || ''} ${booking.car?.owner?.lastName || ''}`.trim() || 'Клиент не указан'
}

function getBookingCarTitle(booking: Booking) {
  const carTitle = `${booking.car?.brand || ''} ${booking.car?.model || ''}`.trim()
  return carTitle
    ? `${carTitle}${booking.car?.licensePlate ? ` (${booking.car.licensePlate})` : ''}`
    : 'Автомобиль не указан'
}

function getBookingPhone(booking: Booking) {
  return booking.contactPhone?.trim() || booking.car?.owner?.phoneNumber?.trim() || 'Не указан'
}

const COMPONENT_STATUS_LABELS: Record<string, string> = {
  NORMAL: 'Норма',
  WARNING: 'Требует внимания',
  CRITICAL: 'Критический износ',
}

function componentStatusLabel(status?: string) {
  return (status && COMPONENT_STATUS_LABELS[status]) || status || '—'
}

// Поисковый селектор компонента: фильтрует список деталей авто по названию/категории/статусу.
function ComponentPicker({
  components,
  value,
  onChange,
  disabledIds,
}: {
  components: ComponentSummary[]
  value: string
  onChange: (componentId: string) => void
  disabledIds?: Set<string>
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = components.find((component) => String(component.id) === value) || null

  useEffect(() => {
    if (!open) {
      return
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const normalizedQuery = query.trim().toLowerCase()
  const filtered = normalizedQuery
    ? components.filter((component) =>
        `${component.name} ${componentStatusLabel(component.status)} ${component.status}`
          .toLowerCase()
          .includes(normalizedQuery)
      )
    : components

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="auto-select flex w-full items-center justify-between gap-2 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cx('truncate', !selected && 'text-text-muted')}>
          {selected ? `${selected.name} · износ ${selected.wearLevel}%` : 'Выберите компонент'}
        </span>
        <FaChevronDown className={cx('shrink-0 text-xs text-text-muted transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-border bg-surface-2 shadow-xl">
          <div className="border-b border-border p-2">
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск: масло АКПП, колодки…"
                className="auto-input h-9 w-full py-0 pl-9"
                aria-label="Поиск компонента"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-text-muted">Ничего не найдено</p>
            ) : (
              filtered.map((component) => {
                const id = String(component.id)
                const isSelected = id === value
                const isDisabled = !isSelected && Boolean(disabledIds?.has(id))

                return (
                  <button
                    key={component.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={isDisabled}
                    onClick={() => {
                      onChange(id)
                      setOpen(false)
                      setQuery('')
                    }}
                    className={cx(
                      'flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors',
                      isSelected
                        ? 'bg-surface-3'
                        : 'hover:bg-surface-3',
                      isDisabled && 'cursor-not-allowed opacity-40'
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-text-primary">{component.name}</span>
                      <span className="block truncate text-xs text-text-muted">
                        {componentStatusLabel(component.status)} · износ {component.wearLevel}%
                      </span>
                    </span>
                    {isDisabled ? (
                      <span className="shrink-0 text-xs text-text-muted">уже добавлен</span>
                    ) : null}
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function ServiceCenterOperationCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const preselectedBookingAppliedRef = useRef(false)
  const requestedBookingId = searchParams.get('bookingId')?.trim() || ''
  const [formData, setFormData] = useState({
    bookingId: '',
    carId: '',
    workType: '',
    description: '',
    serviceDate: new Date().toISOString().slice(0, 10),
    mileageAtService: '',
    cost: '',
  })
  const [replacedParts, setReplacedParts] = useState<ReplacedPartFormRow[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const { data: serviceCenter, isLoading: serviceCenterLoading } = useQuery<ServiceCenterProfile>({
    queryKey: ['service-center', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/service-centers/my')
      return response.data
    },
  })

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['service-center-bookings', serviceCenter?.id],
    queryFn: async () => {
      const response = await apiClient.get(`/bookings/service-center/${serviceCenter?.id}`)
      return response.data
    },
    enabled: !!serviceCenter?.id,
  })

  const { data: operations = [], isLoading: operationsLoading } = useQuery<ExistingOperationSummary[]>({
    queryKey: ['service-center-operations', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/maintenance-records/service-center/my')
      return response.data
    },
    enabled: !!serviceCenter?.id,
  })

  const usedBookingIds = useMemo(
    () =>
      new Set(
        operations
          .map((operation) => operation.booking?.id)
          .filter((bookingId): bookingId is number => typeof bookingId === 'number')
      ),
    [operations]
  )

  const availableBookings = useMemo(
    () =>
      bookings
        .filter((booking) => OPERATION_SOURCE_STATUSES.has(booking.status) && !usedBookingIds.has(booking.id))
        .sort((left, right) => getBookingSortTime(right) - getBookingSortTime(left)),
    [bookings, usedBookingIds]
  )

  const selectedBooking = useMemo(
    () => availableBookings.find((booking) => String(booking.id) === formData.bookingId) || null,
    [availableBookings, formData.bookingId]
  )

  const selectedCarId = formData.carId ? Number(formData.carId) : null

  const { data: carComponents } = useQuery<ComponentSummary[]>({
    queryKey: ['service-center-booking-car-components', selectedBooking?.car?.owner?.id, selectedCarId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/service-center-clients/${selectedBooking?.car?.owner?.id}/cars/${selectedCarId}/components`
      )
      return response.data
    },
    enabled: !!selectedCarId && !!selectedBooking?.car?.owner?.id,
  })

  const applyBookingSelection = (bookingId: string) => {
    const nextBooking = availableBookings.find((booking) => String(booking.id) === bookingId) || null

    setFormData((currentValue) => ({
      ...currentValue,
      bookingId,
      carId: nextBooking?.car?.id ? String(nextBooking.car.id) : '',
      description: nextBooking?.description || '',
      serviceDate: nextBooking?.bookingDateTime?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      mileageAtService: nextBooking?.car?.mileage != null ? String(nextBooking.car.mileage) : '',
      workType: '',
      cost: '',
    }))
    setReplacedParts([])
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (!requestedBookingId || !availableBookings.length || preselectedBookingAppliedRef.current) {
      return
    }

    const hasRequestedBooking = availableBookings.some(
      (booking) => String(booking.id) === requestedBookingId
    )

    if (!hasRequestedBooking) {
      return
    }

    applyBookingSelection(requestedBookingId)
    preselectedBookingAppliedRef.current = true
  }, [availableBookings, requestedBookingId])

  const addReplacedPartRow = () => {
    setReplacedParts((currentValue) => [
      ...currentValue,
      { componentId: '', partNumber: '', manufacturer: '', files: [] },
    ])
  }

  const removeReplacedPartRow = (index: number) => {
    setReplacedParts((currentValue) => currentValue.filter((_, rowIndex) => rowIndex !== index))
  }

  const updateReplacedPartRow = (
    index: number,
    field: Exclude<keyof ReplacedPartFormRow, 'files'>,
    value: string
  ) => {
    setReplacedParts((currentValue) =>
      currentValue.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
    )
  }

  const updateReplacedPartFiles = (index: number, files: File[]) => {
    setReplacedParts((currentValue) =>
      currentValue.map((row, rowIndex) => (rowIndex === index ? { ...row, files } : row))
    )
  }

  const uploadOperationFile = async (file: File) => {
    const uploadData = new FormData()
    uploadData.append('file', file)
    uploadData.append('subdirectory', 'maintenance')
    const uploadResponse = await apiClient.post('/files/upload', uploadData)

    return {
      fileUrl: uploadResponse.data.url,
      description: file.name,
    }
  }

  const createOperationMutation = useMutation({
    mutationFn: async (payload: CreateOperationPayload) => {
      const uploadedPhotos: UploadedOperationPhoto[] = []

      for (const file of selectedFiles) {
        uploadedPhotos.push(await uploadOperationFile(file))
      }

      const { replacedParts, ...operationPayload } = payload
      const uploadedReplacedParts: Array<{
        componentId: number
        partNumber: string | null
        manufacturer: string | null
        photos: UploadedOperationPhoto[]
      }> = []

      for (const part of replacedParts) {
        const partPhotos: UploadedOperationPhoto[] = []

        for (const file of part.files) {
          partPhotos.push(await uploadOperationFile(file))
        }

        uploadedReplacedParts.push({
          componentId: part.componentId,
          partNumber: part.partNumber,
          manufacturer: part.manufacturer,
          photos: partPhotos,
        })
      }

      const response = await apiClient.post('/maintenance-records/service-center', {
        ...operationPayload,
        replacedParts: uploadedReplacedParts,
        photos: uploadedPhotos,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-center-operations'] })
      queryClient.invalidateQueries({ queryKey: ['service-center-clients', 'my'] })
      queryClient.invalidateQueries({ queryKey: ['service-center-bookings', serviceCenter?.id] })
      toast.success('Операция добавлена')
      navigate('/service-center/operations')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Не удалось сохранить операцию')
    },
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.bookingId) {
      toast.error('Выберите завершенную запись')
      return
    }

    if (!formData.carId || !formData.workType || !formData.mileageAtService) {
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
        files: row.files,
      }))
      .filter((row) => row.componentId || row.partNumber || row.manufacturer || row.files.length > 0)

    if (preparedReplacedParts.some((row) => !row.componentId)) {
      toast.error('Укажите компонент для каждой добавленной замененной детали')
      return
    }

    if (preparedReplacedParts.some((row) => !/^\d+$/.test(row.componentId))) {
      toast.error('Компонент должен быть выбран из списка')
      return
    }

    const componentIds = preparedReplacedParts.map((row) => Number(row.componentId))
    if (new Set(componentIds).size !== componentIds.length) {
      toast.error('Один и тот же компонент нельзя добавить несколько раз в одной операции')
      return
    }

    createOperationMutation.mutate({
      bookingId: Number(formData.bookingId),
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
        files: row.files,
      })),
    })
  }

  const isSourceLoading = serviceCenterLoading || bookingsLoading || operationsLoading

  return (
    <Page>
      <PageHeader
        eyebrow="Service operations"
        title="Создание операции"
        description="Операция создается из завершенной записи, чтобы обслуживание, замены и счет жили в одной цепочке."
        actions={
          <Link to="/service-center/operations" className="btn-secondary">
            <FaArrowLeft />
            К журналу операций
          </Link>
        }
      />

      <Section
        title="Новая операция"
        description="Сначала выберите завершенную запись, затем зафиксируйте выполненные работы, замененные детали и стоимость."
      >
        {isSourceLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-info" />
            <p className="mt-2 text-slate-400">Подготавливаем завершенные записи...</p>
          </div>
        ) : availableBookings.length === 0 ? (
          <EmptyState
            icon={FaCalendarAlt}
            title="Нет завершенных записей"
            description="Сначала завершите запись в потоке сервиса. После этого она появится как источник для новой операции."
            action={
              <Link to="/service-center/bookings" className="btn-primary">
                Открыть записи
              </Link>
            }
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <label className="mb-2 block text-sm text-slate-300">Завершенная запись *</label>
              <select
                value={formData.bookingId}
                onChange={(event) => applyBookingSelection(event.target.value)}
                className="auto-select"
                required
              >
                <option value="">Выберите запись</option>
                {availableBookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    #{booking.id} • {formatBookingDateTime(booking.bookingDateTime)} • {getBookingClientName(booking)} • {getBookingCarTitle(booking)}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                В списке только завершенные записи без уже созданной операции.
              </p>
              {requestedBookingId && !selectedBooking ? (
                <p className="mt-2 text-xs text-amber-300">
                  Запись из ссылки недоступна: возможно, она еще не завершена или по ней уже создана операция.
                </p>
              ) : null}
            </div>

            {selectedBooking ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <FaUser className="text-text-muted" />
                    Клиент и запись
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <p>{getBookingClientName(selectedBooking)}</p>
                    <p>{formatBookingDateTime(selectedBooking.bookingDateTime)}</p>
                    <p className="inline-flex items-center gap-2 text-slate-400">
                      <FaPhoneAlt className="text-caption" />
                      <span>{getBookingPhone(selectedBooking)}</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <FaCar className="text-text-muted" />
                    Автомобиль
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <p>{getBookingCarTitle(selectedBooking)}</p>
                    <p>
                      Текущий пробег:{' '}
                      {selectedBooking.car?.mileage != null
                        ? `${selectedBooking.car.mileage.toLocaleString('ru-RU')} км`
                        : 'Не указан'}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Тип работы *</label>
                <input
                  value={formData.workType}
                  onChange={(event) => setFormData((currentValue) => ({ ...currentValue, workType: event.target.value }))}
                  className="auto-input"
                  placeholder="Например: Замена масла и фильтра"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Дата операции *</label>
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
                <label className="mb-2 block text-sm text-slate-300">Стоимость операции, ₸</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.cost}
                  onChange={(event) => setFormData((currentValue) => ({ ...currentValue, cost: event.target.value }))}
                  className="auto-input"
                  placeholder="Например: 89999.95"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Эта сумма будет использована как базовая стоимость при создании счета.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-slate-300">Описание работ</label>
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
                  <FaTools className="text-text-muted" />
                  Замененные детали
                </h3>
                <button type="button" className="btn-secondary text-sm" onClick={addReplacedPartRow}>
                  <FaPlus />
                  Добавить деталь
                </button>
              </div>

              {replacedParts.length === 0 ? (
                <p className="text-sm text-slate-400">Детали не добавлены</p>
              ) : (
                <div className="space-y-3">
                  {replacedParts.map((row, index) => (
                    <div
                      key={`replaced-part-${index}`}
                      className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                    >
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
                        <div>
                          <label className="mb-1 block text-xs text-slate-400">Компонент</label>
                          {carComponents && carComponents.length > 0 ? (
                            <ComponentPicker
                              components={carComponents}
                              value={row.componentId}
                              onChange={(componentId) => updateReplacedPartRow(index, 'componentId', componentId)}
                              disabledIds={
                                new Set(
                                  replacedParts
                                    .filter((_, rowIndex) => rowIndex !== index)
                                    .map((other) => other.componentId)
                                    .filter(Boolean)
                                )
                              }
                            />
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
                          <label className="btn-secondary cursor-pointer whitespace-nowrap text-sm">
                            <FaCamera />
                            {row.files.length > 0 ? `Фото: ${row.files.length}` : 'Фото детали'}
                            <input
                              type="file"
                              multiple
                              accept="image/jpeg,image/png,image/webp"
                              onClick={(event) => {
                                event.currentTarget.value = ''
                              }}
                              onChange={(event) => updateReplacedPartFiles(index, Array.from(event.target.files || []))}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            className="btn-secondary text-danger text-sm"
                            onClick={() => removeReplacedPartRow(index)}
                          >
                            <FaTimes />
                            Удалить
                          </button>
                        </div>
                      </div>

                      {row.files.length > 0 ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {row.files.map((file) => (
                            <span
                              key={`${file.name}-${file.size}-${file.lastModified}`}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300"
                            >
                              {file.name}
                            </span>
                          ))}
                          <button
                            type="button"
                            className="text-xs font-medium text-slate-400 transition-colors hover:text-white"
                            onClick={() => updateReplacedPartFiles(index, [])}
                          >
                            Очистить
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
                <FaCamera className="text-text-muted" />
                Общие фото и документы
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
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary">
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
              <p className="text-sm text-slate-500">
                После сохранения операция привяжется к записи и станет доступной для выставления счета.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/service-center/operations" className="btn-secondary">
                  Отмена
                </Link>
                <button
                  type="submit"
                  disabled={createOperationMutation.isPending}
                  className="btn-primary"
                >
                  {createOperationMutation.isPending ? 'Сохранение...' : 'Сохранить операцию'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Section>
    </Page>
  )
}
