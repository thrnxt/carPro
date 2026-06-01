import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  FaBan,
  FaBookOpen,
  FaChartBar,
  FaCheckCircle,
  FaEdit,
  FaExternalLinkAlt,
  FaFileCsv,
  FaPauseCircle,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaSyncAlt,
  FaTrash,
  FaUsers,
  FaWrench,
} from 'react-icons/fa'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import {
  Badge,
  Button,
  EmptyState,
  FilterBar,
  LoadingState,
  Page,
  PageHeader,
  Section,
  SectionGrid,
  SegmentedControl,
  StatCard,
  cx,
} from '../components/ui'

type AdminTab = 'users' | 'service-centers' | 'content' | 'analytics'
type UserRole = 'USER' | 'SERVICE_CENTER' | 'ADMIN' | 'SUPPORT'
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING_VERIFICATION'
type ServiceCenterStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'
type ContentType = 'ARTICLE' | 'VIDEO' | 'CHECKLIST'
type ContentStatus = 'DRAFT' | 'PUBLISHED'
type AdminReportType = 'USER_ACTIVITY' | 'SERVICE_ACTIVITY'

type AdminUser = {
  id: number
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  createdAt: string
  hasServiceCenterProfile: boolean
}

type AdminServiceCenter = {
  id: number
  name: string
  city?: string | null
  region?: string | null
  address: string
  phoneNumber?: string | null
  email?: string | null
  website?: string | null
  description?: string | null
  licenseNumber?: string | null
  licenseDocumentUrl?: string | null
  status: ServiceCenterStatus
  createdAt: string
  updatedAt?: string | null
  accountEmail?: string | null
  accountStatus?: UserStatus | null
}

type AdminContent = {
  id: number
  title: string
  content: string
  type: ContentType
  videoUrl?: string | null
  imageUrl?: string | null
  category: string
  provider?: string | null
  difficulty?: string | null
  durationMinutes?: number | null
  sortOrder?: number | null
  status: ContentStatus
  createdAt: string
  updatedAt?: string | null
}

type AdminNamedMetric = {
  label: string
  secondaryLabel?: string | null
  count: number
}

type AdminKeyCount = {
  key: string
  count: number
}

type AdminAnalyticsSummary = {
  totalUsers: number
  newUsersInPeriod: number
  activeUsersInPeriod: number
  totalServiceCenters: number
  bookingsInPeriod: number
  completedWorksInPeriod: number
}

type AdminUserActivityReportRow = {
  id: number
  fullName: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
  carsCount: number
  bookingsCount: number
  maintenanceRecordsCount: number
  lastBookingAt?: string | null
  lastMaintenanceDate?: string | null
}

type AdminServiceActivityReportRow = {
  id: number
  name: string
  accountEmail?: string | null
  region?: string | null
  status: ServiceCenterStatus
  createdAt: string
  bookingsCount: number
  completedWorksCount: number
  lastBookingAt?: string | null
  lastCompletedServiceDate?: string | null
}

type AdminAnalyticsResponse = {
  dateFrom?: string | null
  dateTo?: string | null
  summary: AdminAnalyticsSummary
  topReplacedComponents: AdminNamedMetric[]
  topCarBrands: AdminNamedMetric[]
  regionActivity: AdminNamedMetric[]
  userRoleDistribution: AdminKeyCount[]
  userStatusDistribution: AdminKeyCount[]
  serviceStatusDistribution: AdminKeyCount[]
  userActivityReport: AdminUserActivityReportRow[]
  serviceActivityReport: AdminServiceActivityReportRow[]
}

type ContentFormValues = {
  title: string
  content: string
  type: ContentType
  videoUrl: string
  imageUrl: string
  category: string
  provider: string
  difficulty: string
  durationMinutes: string
  sortOrder: string
  status: ContentStatus
}

const TAB_OPTIONS: Array<{ value: AdminTab; label: string }> = [
  { value: 'users', label: 'Пользователи' },
  { value: 'service-centers', label: 'Сервисы' },
  { value: 'content', label: 'Контент' },
  { value: 'analytics', label: 'Аналитика' },
]

const ROLE_OPTIONS: UserRole[] = ['USER', 'SERVICE_CENTER', 'ADMIN', 'SUPPORT']
const USER_STATUS_OPTIONS: UserStatus[] = ['ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING_VERIFICATION']
const SERVICE_STATUS_OPTIONS: ServiceCenterStatus[] = ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'REJECTED']
const CONTENT_TYPE_OPTIONS: ContentType[] = ['ARTICLE', 'VIDEO', 'CHECKLIST']
const CONTENT_STATUS_OPTIONS: ContentStatus[] = ['DRAFT', 'PUBLISHED']

const ROLE_LABELS: Record<UserRole, string> = {
  USER: 'Клиент',
  SERVICE_CENTER: 'Сервис',
  ADMIN: 'Админ',
  SUPPORT: 'Поддержка',
}

const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Активен',
  INACTIVE: 'Неактивен',
  BLOCKED: 'Заблокирован',
  PENDING_VERIFICATION: 'На проверке',
}

const SERVICE_STATUS_LABELS: Record<ServiceCenterStatus, string> = {
  PENDING_VERIFICATION: 'На проверке',
  ACTIVE: 'Активен',
  SUSPENDED: 'Приостановлен',
  REJECTED: 'Отклонён',
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  ARTICLE: 'Статья',
  VIDEO: 'Видео',
  CHECKLIST: 'Чек-лист',
}

const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликовано',
}

const CHART_COLORS = ['#E8541A', '#378ADD', '#1D9E75', '#EF9F27', '#E24B4A', '#7C8798', '#5AA0F2', '#6DD3A0']

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const DATE_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
})

function getErrorMessage(error: any) {
  return error?.response?.data?.message || 'Не удалось выполнить запрос'
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '—'
  }
  return DATE_TIME_FORMATTER.format(new Date(value))
}

function formatDate(value?: string | null) {
  if (!value) {
    return '—'
  }
  return DATE_FORMATTER.format(new Date(value))
}

function truncateText(value: string, limit = 180) {
  if (value.length <= limit) {
    return value
  }
  return `${value.slice(0, limit).trim()}...`
}

function roleBadgeTone(role: UserRole) {
  switch (role) {
    case 'ADMIN':
      return 'auto-badge-danger'
    case 'SERVICE_CENTER':
      return 'auto-badge-info'
    case 'SUPPORT':
      return 'auto-badge-warning'
    default:
      return 'auto-badge'
  }
}

function userStatusBadgeTone(status: UserStatus) {
  switch (status) {
    case 'ACTIVE':
      return 'auto-badge-success'
    case 'BLOCKED':
      return 'auto-badge-danger'
    case 'INACTIVE':
      return 'auto-badge-warning'
    default:
      return 'auto-badge-info'
  }
}

function serviceStatusBadgeTone(status: ServiceCenterStatus) {
  switch (status) {
    case 'ACTIVE':
      return 'auto-badge-success'
    case 'SUSPENDED':
      return 'auto-badge-warning'
    case 'REJECTED':
      return 'auto-badge-danger'
    default:
      return 'auto-badge-info'
  }
}

function contentStatusBadgeTone(status: ContentStatus) {
  return status === 'PUBLISHED' ? 'auto-badge-success' : 'auto-badge-warning'
}

function contentTypeBadgeTone(type: ContentType) {
  switch (type) {
    case 'VIDEO':
      return 'auto-badge-info'
    case 'CHECKLIST':
      return 'auto-badge-success'
    default:
      return 'auto-badge'
  }
}

function blankToUndefined(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function toContentFormValues(content?: AdminContent | null): ContentFormValues {
  return {
    title: content?.title ?? '',
    content: content?.content ?? '',
    type: content?.type ?? 'ARTICLE',
    videoUrl: content?.videoUrl ?? '',
    imageUrl: content?.imageUrl ?? '',
    category: content?.category ?? '',
    provider: content?.provider ?? '',
    difficulty: content?.difficulty ?? '',
    durationMinutes: content?.durationMinutes != null ? String(content.durationMinutes) : '',
    sortOrder: content?.sortOrder != null ? String(content.sortOrder) : '0',
    status: content?.status ?? 'DRAFT',
  }
}

function toContentRequest(values: ContentFormValues) {
  return {
    title: values.title.trim(),
    content: values.content.trim(),
    type: values.type,
    videoUrl: blankToUndefined(values.videoUrl),
    imageUrl: blankToUndefined(values.imageUrl),
    category: values.category.trim(),
    provider: blankToUndefined(values.provider),
    difficulty: blankToUndefined(values.difficulty),
    durationMinutes: values.durationMinutes.trim() ? Number(values.durationMinutes) : undefined,
    sortOrder: values.sortOrder.trim() ? Number(values.sortOrder) : 0,
    status: values.status,
  }
}

function isRoleChangeDisabled(user: AdminUser, nextRole: UserRole) {
  if (nextRole === 'SERVICE_CENTER' && !user.hasServiceCenterProfile) {
    return true
  }
  if (user.role === 'SERVICE_CENTER' && user.hasServiceCenterProfile && nextRole !== 'SERVICE_CENTER') {
    return true
  }
  return false
}

function getActionableServiceStatuses(status: ServiceCenterStatus) {
  switch (status) {
    case 'PENDING_VERIFICATION':
      return ['ACTIVE', 'REJECTED'] as ServiceCenterStatus[]
    case 'ACTIVE':
      return ['SUSPENDED'] as ServiceCenterStatus[]
    case 'SUSPENDED':
    case 'REJECTED':
      return ['ACTIVE'] as ServiceCenterStatus[]
    default:
      return [] as ServiceCenterStatus[]
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

function parseFilename(dispositionHeader?: string, fallback = 'report.csv') {
  if (!dispositionHeader) {
    return fallback
  }

  const utf8Match = dispositionHeader.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const plainMatch = dispositionHeader.match(/filename="?([^"]+)"?/i)
  return plainMatch?.[1] || fallback
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-4">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      </div>
      {children}
    </div>
  )
}

function AnalyticsBarCard({
  title,
  description,
  data,
  valueLabel = 'Количество',
}: {
  title: string
  description?: string
  data: AdminNamedMetric[]
  valueLabel?: string
}) {
  return (
    <ChartCard title={title} description={description}>
      {data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">Нет данных за выбранный период</div>
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#A1A6B5', fontSize: 12 }}
                tickFormatter={(value) => (String(value).length > 14 ? `${String(value).slice(0, 14)}...` : String(value))}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: '#A1A6B5', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{
                  background: '#181B24',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  color: '#F0F0F0',
                }}
                formatter={(value: number) => [value, valueLabel]}
                labelFormatter={(label) => String(label)}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`${entry.label}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  )
}

function DistributionCard({
  title,
  description,
  data,
  labelMap,
}: {
  title: string
  description?: string
  data: AdminKeyCount[]
  labelMap: Record<string, string>
}) {
  return (
    <ChartCard title={title} description={description}>
      {data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">Нет данных</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="count" nameKey="key" innerRadius={58} outerRadius={92} paddingAngle={2}>
                  {data.map((entry, index) => (
                    <Cell key={`${entry.key}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#181B24',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    color: '#F0F0F0',
                  }}
                  formatter={(value: number, name: string) => [value, labelMap[name] ?? name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={item.key} className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-1 px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-slate-200">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    aria-hidden="true"
                  />
                  <span>{labelMap[item.key] ?? item.key}</span>
                </div>
                <span className="text-sm font-semibold text-white">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  )
}

function ContentEditorModal({
  open,
  content,
  categories,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  open: boolean
  content?: AdminContent | null
  categories: string[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: ContentFormValues) => void
}) {
  const [values, setValues] = useState<ContentFormValues>(() => toContentFormValues(content))

  useEffect(() => {
    if (open) {
      setValues(toContentFormValues(content))
    }
  }, [content, open])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl rounded-md border border-border bg-surface-2 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {content ? 'Редактирование материала' : 'Новый материал'}
            </h2>
            <p className="mt-1 text-sm text-slate-400">Управление статьями, видео и обучающими чек-листами.</p>
          </div>
          <Button variant="ghost" className="shrink-0" onClick={onClose}>
            Закрыть
          </Button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="section-label">Заголовок</label>
              <input
                className="auto-input mt-1"
                value={values.title}
                onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
                placeholder="Например: Как подготовить автомобиль к поездке"
              />
            </div>

            <div>
              <label className="section-label">Тип</label>
              <select
                className="auto-select mt-1"
                value={values.type}
                onChange={(event) => setValues((current) => ({ ...current, type: event.target.value as ContentType }))}
              >
                {CONTENT_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {CONTENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="section-label">Статус</label>
              <select
                className="auto-select mt-1"
                value={values.status}
                onChange={(event) => setValues((current) => ({ ...current, status: event.target.value as ContentStatus }))}
              >
                {CONTENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {CONTENT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="section-label">Категория</label>
              <input
                className="auto-input mt-1"
                list="admin-content-categories"
                value={values.category}
                onChange={(event) => setValues((current) => ({ ...current, category: event.target.value }))}
                placeholder="Базовое обслуживание"
              />
              <datalist id="admin-content-categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="section-label">Источник</label>
              <input
                className="auto-input mt-1"
                value={values.provider}
                onChange={(event) => setValues((current) => ({ ...current, provider: event.target.value }))}
                placeholder="CarPro или внешний провайдер"
              />
            </div>

            <div>
              <label className="section-label">Сложность</label>
              <input
                className="auto-input mt-1"
                value={values.difficulty}
                onChange={(event) => setValues((current) => ({ ...current, difficulty: event.target.value }))}
                placeholder="Начальный / Средний / Продвинутый"
              />
            </div>

            <div>
              <label className="section-label">Длительность, минут</label>
              <input
                className="auto-input mt-1"
                type="number"
                min="0"
                value={values.durationMinutes}
                onChange={(event) => setValues((current) => ({ ...current, durationMinutes: event.target.value }))}
                placeholder="15"
              />
            </div>

            <div>
              <label className="section-label">Порядок сортировки</label>
              <input
                className="auto-input mt-1"
                type="number"
                min="0"
                value={values.sortOrder}
                onChange={(event) => setValues((current) => ({ ...current, sortOrder: event.target.value }))}
                placeholder="0"
              />
            </div>

            <div>
              <label className="section-label">Ссылка на видео</label>
              <input
                className="auto-input mt-1"
                value={values.videoUrl}
                onChange={(event) => setValues((current) => ({ ...current, videoUrl: event.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="section-label">Ссылка на изображение</label>
              <input
                className="auto-input mt-1"
                value={values.imageUrl}
                onChange={(event) => setValues((current) => ({ ...current, imageUrl: event.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="section-label">Описание / содержание</label>
              <textarea
                className="auto-textarea mt-1 min-h-[180px]"
                value={values.content}
                onChange={(event) => setValues((current) => ({ ...current, content: event.target.value }))}
                placeholder="Краткое, но содержательное описание материала"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button
            variant="primary"
            loading={isSubmitting}
            onClick={() => {
              if (!values.title.trim() || !values.content.trim() || !values.category.trim()) {
                toast.error('Заполните заголовок, описание и категорию')
                return
              }
              onSubmit(values)
            }}
          >
            {content ? 'Сохранить изменения' : 'Создать материал'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()

  const [activeTab, setActiveTab] = useState<AdminTab>('users')
  const [isContentEditorOpen, setIsContentEditorOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<AdminContent | null>(null)
  const [exportingReport, setExportingReport] = useState<AdminReportType | null>(null)

  const [userFilters, setUserFilters] = useState({
    query: '',
    role: '' as UserRole | '',
    status: '' as UserStatus | '',
  })
  const [serviceCenterFilters, setServiceCenterFilters] = useState({
    query: '',
    status: '' as ServiceCenterStatus | '',
  })
  const [contentFilters, setContentFilters] = useState({
    query: '',
    type: '' as ContentType | '',
    status: '' as ContentStatus | '',
    category: '',
  })
  const [analyticsFilters, setAnalyticsFilters] = useState({
    dateFrom: '',
    dateTo: '',
  })

  const usersQuery = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users', userFilters],
    enabled: activeTab === 'users',
    queryFn: async () => {
      const response = await apiClient.get('/admin/users', {
        params: {
          query: userFilters.query || undefined,
          role: userFilters.role || undefined,
          status: userFilters.status || undefined,
        },
      })
      return response.data
    },
  })

  const serviceCentersQuery = useQuery<AdminServiceCenter[]>({
    queryKey: ['admin', 'service-centers', serviceCenterFilters],
    enabled: activeTab === 'service-centers',
    queryFn: async () => {
      const response = await apiClient.get('/admin/service-centers', {
        params: {
          query: serviceCenterFilters.query || undefined,
          status: serviceCenterFilters.status || undefined,
        },
      })
      return response.data
    },
  })

  const contentQuery = useQuery<AdminContent[]>({
    queryKey: ['admin', 'content', contentFilters],
    enabled: activeTab === 'content',
    queryFn: async () => {
      const response = await apiClient.get('/admin/educational-content', {
        params: {
          query: contentFilters.query || undefined,
          type: contentFilters.type || undefined,
          status: contentFilters.status || undefined,
          category: contentFilters.category || undefined,
        },
      })
      return response.data
    },
  })

  const analyticsQuery = useQuery<AdminAnalyticsResponse>({
    queryKey: ['admin', 'analytics', analyticsFilters],
    enabled: activeTab === 'analytics',
    queryFn: async () => {
      const response = await apiClient.get('/admin/analytics', {
        params: {
          dateFrom: analyticsFilters.dateFrom || undefined,
          dateTo: analyticsFilters.dateTo || undefined,
        },
      })
      return response.data
    },
  })

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: UserStatus }) => {
      const response = await apiClient.patch(`/admin/users/${id}/status`, null, { params: { status } })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Статус пользователя обновлён')
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error))
    },
  })

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: UserRole }) => {
      const response = await apiClient.patch(`/admin/users/${id}/role`, null, { params: { role } })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Роль пользователя обновлена')
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error))
    },
  })

  const updateServiceCenterStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: ServiceCenterStatus }) => {
      const response = await apiClient.patch(`/admin/service-centers/${id}/status`, null, { params: { status } })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-centers'] })
      toast.success('Статус сервисного центра обновлён')
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error))
    },
  })

  const saveContentMutation = useMutation({
    mutationFn: async ({ id, payload }: { id?: number; payload: ReturnType<typeof toContentRequest> }) => {
      if (id) {
        const response = await apiClient.put(`/admin/educational-content/${id}`, payload)
        return response.data
      }
      const response = await apiClient.post('/admin/educational-content', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] })
      queryClient.invalidateQueries({ queryKey: ['educational-content'] })
      toast.success('Материал сохранён')
      setIsContentEditorOpen(false)
      setEditingContent(null)
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error))
    },
  })

  const deleteContentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/educational-content/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] })
      queryClient.invalidateQueries({ queryKey: ['educational-content'] })
      toast.success('Материал удалён')
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error))
    },
  })

  const toggleContentStatusMutation = useMutation({
    mutationFn: async (content: AdminContent) => {
      const nextStatus: ContentStatus = content.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
      const response = await apiClient.put(`/admin/educational-content/${content.id}`, {
        ...toContentRequest(toContentFormValues(content)),
        status: nextStatus,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] })
      queryClient.invalidateQueries({ queryKey: ['educational-content'] })
      toast.success('Статус публикации обновлён')
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error))
    },
  })

  const contentCategories = useMemo(() => {
    const categories = new Set<string>()
    ;(contentQuery.data || []).forEach((item) => {
      if (item.category) {
        categories.add(item.category)
      }
    })
    if (contentFilters.category.trim()) {
      categories.add(contentFilters.category.trim())
    }
    if (editingContent?.category) {
      categories.add(editingContent.category)
    }
    return Array.from(categories).sort((left, right) => left.localeCompare(right, 'ru'))
  }, [contentFilters.category, contentQuery.data, editingContent?.category])

  const users = usersQuery.data ?? []
  const serviceCenters = serviceCentersQuery.data ?? []
  const contentItems = contentQuery.data ?? []
  const analytics = analyticsQuery.data

  const userSummary = useMemo(() => {
    const blocked = users.filter((item) => item.status === 'BLOCKED').length
    const clients = users.filter((item) => item.role === 'USER').length
    const serviceAccounts = users.filter((item) => item.role === 'SERVICE_CENTER').length
    return {
      total: users.length,
      blocked,
      clients,
      serviceAccounts,
    }
  }, [users])

  const serviceSummary = useMemo(() => {
    return {
      total: serviceCenters.length,
      pending: serviceCenters.filter((item) => item.status === 'PENDING_VERIFICATION').length,
      active: serviceCenters.filter((item) => item.status === 'ACTIVE').length,
      suspended: serviceCenters.filter((item) => item.status === 'SUSPENDED').length,
      rejected: serviceCenters.filter((item) => item.status === 'REJECTED').length,
    }
  }, [serviceCenters])

  const contentSummary = useMemo(() => {
    return {
      total: contentItems.length,
      drafts: contentItems.filter((item) => item.status === 'DRAFT').length,
      published: contentItems.filter((item) => item.status === 'PUBLISHED').length,
      videos: contentItems.filter((item) => item.type === 'VIDEO').length,
    }
  }, [contentItems])

  const handleExportReport = async (type: AdminReportType) => {
    try {
      setExportingReport(type)
      const response = await apiClient.get('/admin/reports/export', {
        params: {
          type,
          dateFrom: analyticsFilters.dateFrom || undefined,
          dateTo: analyticsFilters.dateTo || undefined,
        },
        responseType: 'blob',
      })

      const filename = parseFilename(response.headers['content-disposition'], `${type.toLowerCase()}.csv`)
      downloadBlob(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }), filename)
    } catch (error: any) {
      toast.error(getErrorMessage(error))
    } finally {
      setExportingReport(null)
    }
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Контроль"
        title="Админ-панель"
        description="Управление пользователями, модерация сервисных центров, контент и аналитика по эксплуатации платформы."
      />

      <FilterBar className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl value={activeTab} options={TAB_OPTIONS} onChange={setActiveTab} />
          {activeTab === 'content' ? (
            <Button
              variant="primary"
              onClick={() => {
                setEditingContent(null)
                setIsContentEditorOpen(true)
              }}
            >
              <FaPlus />
              Добавить материал
            </Button>
          ) : null}
        </div>
      </FilterBar>

      {activeTab === 'users' ? (
        <Section title="Пользователи" description="Поиск, фильтрация, смена ролей и статусов аккаунтов.">
          <div className="space-y-6">
            <FilterBar className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_220px_220px_auto]">
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="auto-input pl-11"
                  placeholder="Поиск по имени или email"
                  value={userFilters.query}
                  onChange={(event) => setUserFilters((current) => ({ ...current, query: event.target.value }))}
                />
              </div>
              <select
                className="auto-select"
                value={userFilters.role}
                onChange={(event) => setUserFilters((current) => ({ ...current, role: event.target.value as UserRole | '' }))}
              >
                <option value="">Все роли</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
              <select
                className="auto-select"
                value={userFilters.status}
                onChange={(event) => setUserFilters((current) => ({ ...current, status: event.target.value as UserStatus | '' }))}
              >
                <option value="">Все статусы</option>
                {USER_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {USER_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                onClick={() => setUserFilters({ query: '', role: '', status: '' })}
              >
                Сбросить
              </Button>
            </FilterBar>

            <SectionGrid className="xl:grid-cols-4">
              <StatCard icon={FaUsers} label="Всего пользователей" value={userSummary.total} />
              <StatCard icon={FaShieldAlt} label="Клиенты" value={userSummary.clients} />
              <StatCard icon={FaWrench} label="Сервисные аккаунты" value={userSummary.serviceAccounts} />
              <StatCard icon={FaBan} label="Заблокированы" value={userSummary.blocked} tone="danger" />
            </SectionGrid>

            {usersQuery.isLoading ? (
              <LoadingState label="Загрузка пользователей..." />
            ) : usersQuery.isError ? (
              <EmptyState title="Не удалось загрузить пользователей" description={getErrorMessage(usersQuery.error)} />
            ) : users.length === 0 ? (
              <EmptyState title="Пользователи не найдены" description="Измените фильтры или попробуйте другой запрос." />
            ) : (
              <div className="overflow-hidden rounded-md border border-border bg-surface-2">
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3">Пользователь</th>
                        <th className="px-4 py-3">Роль</th>
                        <th className="px-4 py-3">Статус</th>
                        <th className="px-4 py-3">Регистрация</th>
                        <th className="px-4 py-3">Профиль сервиса</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((item) => {
                        const isCurrentUser = currentUser?.id === item.id
                        const isRolePending = updateUserRoleMutation.isPending && updateUserRoleMutation.variables?.id === item.id
                        const isStatusPending = updateUserStatusMutation.isPending && updateUserStatusMutation.variables?.id === item.id
                        return (
                          <tr key={item.id} className="border-b border-border/80 align-top last:border-b-0">
                            <td className="px-4 py-4">
                              <div>
                                <div className="font-semibold text-white">
                                  {item.firstName} {item.lastName}
                                </div>
                                <div className="mt-1 text-sm text-slate-400">{item.email}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Badge tone={roleBadgeTone(item.role)}>{ROLE_LABELS[item.role]}</Badge>
                                  {isCurrentUser ? <Badge>Текущий аккаунт</Badge> : null}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <select
                                className="auto-select min-w-[180px]"
                                value={item.role}
                                disabled={isCurrentUser || isRolePending}
                                onChange={(event) =>
                                  updateUserRoleMutation.mutate({ id: item.id, role: event.target.value as UserRole })
                                }
                              >
                                {ROLE_OPTIONS.map((role) => (
                                  <option key={role} value={role} disabled={isRoleChangeDisabled(item, role)}>
                                    {ROLE_LABELS[role]}
                                  </option>
                                ))}
                              </select>
                              {!item.hasServiceCenterProfile && item.role !== 'SERVICE_CENTER' ? (
                                <p className="mt-2 text-xs text-slate-500">Роль сервиса доступна только при наличии профиля сервисного центра.</p>
                              ) : null}
                            </td>
                            <td className="px-4 py-4">
                              <select
                                className="auto-select min-w-[180px]"
                                value={item.status}
                                disabled={isCurrentUser || isStatusPending}
                                onChange={(event) =>
                                  updateUserStatusMutation.mutate({ id: item.id, status: event.target.value as UserStatus })
                                }
                              >
                                {USER_STATUS_OPTIONS.map((status) => (
                                  <option key={status} value={status}>
                                    {USER_STATUS_LABELS[status]}
                                  </option>
                                ))}
                              </select>
                              <div className="mt-2">
                                <Badge tone={userStatusBadgeTone(item.status)}>{USER_STATUS_LABELS[item.status]}</Badge>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-300">{formatDateTime(item.createdAt)}</td>
                            <td className="px-4 py-4 text-sm">
                              <Badge tone={item.hasServiceCenterProfile ? 'auto-badge-success' : 'auto-badge'}>
                                {item.hasServiceCenterProfile ? 'Есть' : 'Нет'}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Section>
      ) : null}

      {activeTab === 'service-centers' ? (
        <Section title="Сервисные центры" description="Модерация аккаунтов и проверка лицензионных данных.">
          <div className="space-y-6">
            <FilterBar className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_240px_auto]">
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="auto-input pl-11"
                  placeholder="Поиск по названию, email, региону или лицензии"
                  value={serviceCenterFilters.query}
                  onChange={(event) => setServiceCenterFilters((current) => ({ ...current, query: event.target.value }))}
                />
              </div>
              <select
                className="auto-select"
                value={serviceCenterFilters.status}
                onChange={(event) =>
                  setServiceCenterFilters((current) => ({ ...current, status: event.target.value as ServiceCenterStatus | '' }))
                }
              >
                <option value="">Все статусы</option>
                {SERVICE_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {SERVICE_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                onClick={() => setServiceCenterFilters({ query: '', status: '' })}
              >
                Сбросить
              </Button>
            </FilterBar>

            <SectionGrid className="xl:grid-cols-5">
              <StatCard icon={FaWrench} label="Всего сервисов" value={serviceSummary.total} />
              <StatCard icon={FaShieldAlt} label="На проверке" value={serviceSummary.pending} tone="info" />
              <StatCard icon={FaCheckCircle} label="Активны" value={serviceSummary.active} tone="success" />
              <StatCard icon={FaPauseCircle} label="Приостановлены" value={serviceSummary.suspended} tone="warning" />
              <StatCard icon={FaBan} label="Отклонены" value={serviceSummary.rejected} tone="danger" />
            </SectionGrid>

            {serviceCentersQuery.isLoading ? (
              <LoadingState label="Загрузка сервисных центров..." />
            ) : serviceCentersQuery.isError ? (
              <EmptyState title="Не удалось загрузить сервисные центры" description={getErrorMessage(serviceCentersQuery.error)} />
            ) : serviceCenters.length === 0 ? (
              <EmptyState title="Сервисные центры не найдены" description="Измените фильтры и повторите поиск." />
            ) : (
              <div className="space-y-3">
                {serviceCenters.map((item) => {
                  const allowedTransitions = getActionableServiceStatuses(item.status)
                  const isPending = updateServiceCenterStatusMutation.isPending && updateServiceCenterStatusMutation.variables?.id === item.id

                  return (
                    <div key={item.id} className="rounded-md border border-border bg-surface-2 p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                            <Badge tone={serviceStatusBadgeTone(item.status)}>{SERVICE_STATUS_LABELS[item.status]}</Badge>
                            {item.accountStatus ? (
                              <Badge tone={userStatusBadgeTone(item.accountStatus)}>{USER_STATUS_LABELS[item.accountStatus]}</Badge>
                            ) : null}
                          </div>

                          <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <div className="text-xs uppercase tracking-wide text-slate-500">Аккаунт</div>
                              <div className="mt-1">{item.accountEmail || '—'}</div>
                            </div>
                            <div>
                              <div className="text-xs uppercase tracking-wide text-slate-500">Лицензия</div>
                              <div className="mt-1">{item.licenseNumber || 'Не указана'}</div>
                            </div>
                            <div>
                              <div className="text-xs uppercase tracking-wide text-slate-500">Регион</div>
                              <div className="mt-1">{item.region || item.city || 'Не указан'}</div>
                            </div>
                            <div>
                              <div className="text-xs uppercase tracking-wide text-slate-500">Создан</div>
                              <div className="mt-1">{formatDateTime(item.createdAt)}</div>
                            </div>
                          </div>

                          <div className="space-y-1 text-sm text-slate-400">
                            <p>{item.address}</p>
                            {item.phoneNumber ? <p>Телефон: {item.phoneNumber}</p> : null}
                            {item.website ? (
                              <a
                                href={item.website}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-info hover:text-sky-300"
                              >
                                <FaExternalLinkAlt />
                                Открыть сайт
                              </a>
                            ) : null}
                            {item.licenseDocumentUrl ? (
                              <div>
                                <a
                                  href={item.licenseDocumentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-info hover:text-sky-300"
                                >
                                  <FaExternalLinkAlt />
                                  Открыть документ лицензии
                                </a>
                              </div>
                            ) : (
                              <p>Документ лицензии не загружен</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 xl:w-[280px] xl:justify-end">
                          {allowedTransitions.map((nextStatus) => (
                            <Button
                              key={nextStatus}
                              variant="secondary"
                              className={cx(nextStatus === 'REJECTED' ? 'text-danger' : '')}
                              loading={isPending && updateServiceCenterStatusMutation.variables?.status === nextStatus}
                              onClick={() => updateServiceCenterStatusMutation.mutate({ id: item.id, status: nextStatus })}
                            >
                              {nextStatus === 'ACTIVE'
                                ? item.status === 'PENDING_VERIFICATION'
                                  ? 'Одобрить'
                                  : 'Активировать'
                                : nextStatus === 'SUSPENDED'
                                  ? 'Приостановить'
                                  : 'Отклонить'}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Section>
      ) : null}

      {activeTab === 'content' ? (
        <Section title="Контент" description="Управление статьями, видео и обучающими материалами.">
          <div className="space-y-6">
            <FilterBar className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_200px_200px_220px_auto]">
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="auto-input pl-11"
                  placeholder="Поиск по названию, категории или источнику"
                  value={contentFilters.query}
                  onChange={(event) => setContentFilters((current) => ({ ...current, query: event.target.value }))}
                />
              </div>
              <select
                className="auto-select"
                value={contentFilters.type}
                onChange={(event) => setContentFilters((current) => ({ ...current, type: event.target.value as ContentType | '' }))}
              >
                <option value="">Все типы</option>
                {CONTENT_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {CONTENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              <select
                className="auto-select"
                value={contentFilters.status}
                onChange={(event) => setContentFilters((current) => ({ ...current, status: event.target.value as ContentStatus | '' }))}
              >
                <option value="">Все статусы</option>
                {CONTENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {CONTENT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <input
                className="auto-input"
                list="content-filter-categories"
                placeholder="Фильтр по категории"
                value={contentFilters.category}
                onChange={(event) => setContentFilters((current) => ({ ...current, category: event.target.value }))}
              />
              <datalist id="content-filter-categories">
                {contentCategories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              <Button
                variant="secondary"
                onClick={() => setContentFilters({ query: '', type: '', status: '', category: '' })}
              >
                Сбросить
              </Button>
            </FilterBar>

            <SectionGrid className="xl:grid-cols-4">
              <StatCard icon={FaBookOpen} label="Всего материалов" value={contentSummary.total} />
              <StatCard icon={FaEdit} label="Черновики" value={contentSummary.drafts} tone="warning" />
              <StatCard icon={FaCheckCircle} label="Опубликованы" value={contentSummary.published} tone="success" />
              <StatCard icon={FaChartBar} label="Видео" value={contentSummary.videos} tone="info" />
            </SectionGrid>

            {contentQuery.isLoading ? (
              <LoadingState label="Загрузка контента..." />
            ) : contentQuery.isError ? (
              <EmptyState title="Не удалось загрузить контент" description={getErrorMessage(contentQuery.error)} />
            ) : contentItems.length === 0 ? (
              <EmptyState title="Материалы не найдены" description="Смените фильтры или создайте новый материал." />
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {contentItems.map((item) => {
                  const isToggling = toggleContentStatusMutation.isPending && toggleContentStatusMutation.variables?.id === item.id
                  const isDeleting = deleteContentMutation.isPending && deleteContentMutation.variables === item.id
                  return (
                    <article key={item.id} className="rounded-md border border-border bg-surface-2 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge tone={contentTypeBadgeTone(item.type)}>{CONTENT_TYPE_LABELS[item.type]}</Badge>
                            <Badge tone={contentStatusBadgeTone(item.status)}>{CONTENT_STATUS_LABELS[item.status]}</Badge>
                            <Badge>{item.category}</Badge>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-300">{truncateText(item.content)}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditingContent(item)
                              setIsContentEditorOpen(true)
                            }}
                          >
                            <FaEdit />
                            Редактировать
                          </Button>
                          <Button
                            variant="secondary"
                            loading={isToggling}
                            onClick={() => toggleContentStatusMutation.mutate(item)}
                          >
                            {item.status === 'PUBLISHED' ? 'Снять с публикации' : 'Опубликовать'}
                          </Button>
                          <Button
                            variant="secondary"
                            className="text-danger"
                            loading={isDeleting}
                            onClick={() => {
                              if (window.confirm(`Удалить материал "${item.title}"?`)) {
                                deleteContentMutation.mutate(item.id)
                              }
                            }}
                          >
                            <FaTrash />
                            Удалить
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-slate-400 md:grid-cols-2">
                        <div>
                          <span className="text-slate-500">Источник:</span> {item.provider || '—'}
                        </div>
                        <div>
                          <span className="text-slate-500">Сложность:</span> {item.difficulty || '—'}
                        </div>
                        <div>
                          <span className="text-slate-500">Длительность:</span> {item.durationMinutes ?? '—'} мин
                        </div>
                        <div>
                          <span className="text-slate-500">Сортировка:</span> {item.sortOrder ?? 0}
                        </div>
                        <div>
                          <span className="text-slate-500">Создан:</span> {formatDateTime(item.createdAt)}
                        </div>
                        <div>
                          <span className="text-slate-500">Обновлён:</span> {formatDateTime(item.updatedAt)}
                        </div>
                      </div>

                      {(item.videoUrl || item.imageUrl) ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          {item.videoUrl ? (
                            <a
                              href={item.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-info hover:text-sky-300"
                            >
                              <FaExternalLinkAlt />
                              Открыть видео
                            </a>
                          ) : null}
                          {item.imageUrl ? (
                            <a
                              href={item.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-info hover:text-sky-300"
                            >
                              <FaExternalLinkAlt />
                              Открыть изображение
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </Section>
      ) : null}

      {activeTab === 'analytics' ? (
        <Section title="Аналитика и отчёты" description="Статистика по деталям, автомобилям, регионам и активности платформы.">
          <div className="space-y-6">
            <FilterBar className="grid gap-3 lg:grid-cols-[220px_220px_auto_auto]">
              <input
                className="auto-input"
                type="date"
                value={analyticsFilters.dateFrom}
                onChange={(event) => setAnalyticsFilters((current) => ({ ...current, dateFrom: event.target.value }))}
              />
              <input
                className="auto-input"
                type="date"
                value={analyticsFilters.dateTo}
                onChange={(event) => setAnalyticsFilters((current) => ({ ...current, dateTo: event.target.value }))}
              />
              <Button
                variant="secondary"
                onClick={() => analyticsQuery.refetch()}
                disabled={analyticsQuery.isFetching}
              >
                <FaSyncAlt />
                Обновить
              </Button>
              <Button
                variant="secondary"
                onClick={() => setAnalyticsFilters({ dateFrom: '', dateTo: '' })}
              >
                Сбросить период
              </Button>
            </FilterBar>

            {analyticsQuery.isLoading ? (
              <LoadingState label="Загрузка аналитики..." />
            ) : analyticsQuery.isError ? (
              <EmptyState title="Не удалось загрузить аналитику" description={getErrorMessage(analyticsQuery.error)} />
            ) : !analytics ? (
              <EmptyState title="Нет данных аналитики" description="Попробуйте обновить страницу." />
            ) : (
              <>
                <SectionGrid className="xl:grid-cols-6">
                  <StatCard icon={FaUsers} label="Всего пользователей" value={analytics.summary.totalUsers} />
                  <StatCard icon={FaShieldAlt} label="Новые за период" value={analytics.summary.newUsersInPeriod} tone="info" />
                  <StatCard icon={FaCheckCircle} label="Активные за период" value={analytics.summary.activeUsersInPeriod} tone="success" />
                  <StatCard icon={FaWrench} label="Сервисные центры" value={analytics.summary.totalServiceCenters} />
                  <StatCard icon={FaChartBar} label="Записи за период" value={analytics.summary.bookingsInPeriod} tone="info" />
                  <StatCard icon={FaBookOpen} label="Выполненные работы" value={analytics.summary.completedWorksInPeriod} tone="warning" />
                </SectionGrid>

                <div className="grid gap-4 xl:grid-cols-2">
                  <AnalyticsBarCard
                    title="Чаще всего заменяемые детали"
                    description="Агрегация по заменённым компонентам из завершённых работ."
                    data={analytics.topReplacedComponents.map((item) => ({
                      ...item,
                      label: item.secondaryLabel ? `${item.label}` : item.label,
                    }))}
                    valueLabel="Замены"
                  />
                  <AnalyticsBarCard
                    title="Чаще обслуживаемые марки"
                    description="Топ марок по завершённым maintenance records."
                    data={analytics.topCarBrands}
                    valueLabel="Работы"
                  />
                  <AnalyticsBarCard
                    title="Активность по регионам"
                    description="Количество завершённых работ по регионам сервисных центров."
                    data={analytics.regionActivity}
                    valueLabel="Работы"
                  />
                  <DistributionCard
                    title="Роли пользователей"
                    description="Текущее распределение аккаунтов по ролям."
                    data={analytics.userRoleDistribution}
                    labelMap={ROLE_LABELS}
                  />
                  <DistributionCard
                    title="Статусы пользователей"
                    description="Распределение аккаунтов по статусам."
                    data={analytics.userStatusDistribution}
                    labelMap={USER_STATUS_LABELS}
                  />
                  <DistributionCard
                    title="Статусы сервисных центров"
                    description="Общее распределение сервисных профилей."
                    data={analytics.serviceStatusDistribution}
                    labelMap={SERVICE_STATUS_LABELS}
                  />
                </div>

                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Отчёт по активности пользователей</h3>
                      <p className="mt-1 text-sm text-slate-400">Записи и completed maintenance по каждому аккаунту.</p>
                    </div>
                    <Button
                      variant="secondary"
                      loading={exportingReport === 'USER_ACTIVITY'}
                      onClick={() => handleExportReport('USER_ACTIVITY')}
                    >
                      <FaFileCsv />
                      Экспорт CSV
                    </Button>
                  </div>

                  <div className="overflow-hidden rounded-md border border-border bg-surface-2">
                    <div className="overflow-x-auto">
                      <table>
                        <thead>
                          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-slate-500">
                            <th className="px-4 py-3">Пользователь</th>
                            <th className="px-4 py-3">Роль</th>
                            <th className="px-4 py-3">Статус</th>
                            <th className="px-4 py-3">Авто</th>
                            <th className="px-4 py-3">Записи</th>
                            <th className="px-4 py-3">Работы</th>
                            <th className="px-4 py-3">Последняя активность</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.userActivityReport.map((row) => (
                            <tr key={row.id} className="border-b border-border/80 last:border-b-0">
                              <td className="px-4 py-4">
                                <div className="font-semibold text-white">{row.fullName}</div>
                                <div className="mt-1 text-sm text-slate-400">{row.email}</div>
                              </td>
                              <td className="px-4 py-4">
                                <Badge tone={roleBadgeTone(row.role)}>{ROLE_LABELS[row.role]}</Badge>
                              </td>
                              <td className="px-4 py-4">
                                <Badge tone={userStatusBadgeTone(row.status)}>{USER_STATUS_LABELS[row.status]}</Badge>
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-200">{row.carsCount}</td>
                              <td className="px-4 py-4 text-sm text-slate-200">{row.bookingsCount}</td>
                              <td className="px-4 py-4 text-sm text-slate-200">{row.maintenanceRecordsCount}</td>
                              <td className="px-4 py-4 text-sm text-slate-300">
                                <div>Запись: {formatDateTime(row.lastBookingAt)}</div>
                                <div className="mt-1">Работа: {formatDate(row.lastMaintenanceDate)}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Отчёт по активности сервисов</h3>
                      <p className="mt-1 text-sm text-slate-400">Записи клиентов и выполненные работы по каждому центру.</p>
                    </div>
                    <Button
                      variant="secondary"
                      loading={exportingReport === 'SERVICE_ACTIVITY'}
                      onClick={() => handleExportReport('SERVICE_ACTIVITY')}
                    >
                      <FaFileCsv />
                      Экспорт CSV
                    </Button>
                  </div>

                  <div className="overflow-hidden rounded-md border border-border bg-surface-2">
                    <div className="overflow-x-auto">
                      <table>
                        <thead>
                          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-slate-500">
                            <th className="px-4 py-3">Сервисный центр</th>
                            <th className="px-4 py-3">Статус</th>
                            <th className="px-4 py-3">Регион</th>
                            <th className="px-4 py-3">Записи</th>
                            <th className="px-4 py-3">Выполненные работы</th>
                            <th className="px-4 py-3">Последняя активность</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.serviceActivityReport.map((row) => (
                            <tr key={row.id} className="border-b border-border/80 last:border-b-0">
                              <td className="px-4 py-4">
                                <div className="font-semibold text-white">{row.name}</div>
                                <div className="mt-1 text-sm text-slate-400">{row.accountEmail || '—'}</div>
                              </td>
                              <td className="px-4 py-4">
                                <Badge tone={serviceStatusBadgeTone(row.status)}>{SERVICE_STATUS_LABELS[row.status]}</Badge>
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-300">{row.region || 'Не указан'}</td>
                              <td className="px-4 py-4 text-sm text-slate-200">{row.bookingsCount}</td>
                              <td className="px-4 py-4 text-sm text-slate-200">{row.completedWorksCount}</td>
                              <td className="px-4 py-4 text-sm text-slate-300">
                                <div>Запись: {formatDateTime(row.lastBookingAt)}</div>
                                <div className="mt-1">Работа: {formatDate(row.lastCompletedServiceDate)}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Section>
      ) : null}

      <ContentEditorModal
        open={isContentEditorOpen}
        content={editingContent}
        categories={contentCategories}
        isSubmitting={saveContentMutation.isPending}
        onClose={() => {
          setIsContentEditorOpen(false)
          setEditingContent(null)
        }}
        onSubmit={(values) => saveContentMutation.mutate({ id: editingContent?.id, payload: toContentRequest(values) })}
      />
    </Page>
  )
}
