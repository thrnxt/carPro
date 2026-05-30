import {
  FaCalendarAlt,
  FaCar,
  FaCommentDots,
  FaTachometerAlt,
  FaTools,
  FaUser,
} from 'react-icons/fa'
import OperationAttachments from './OperationAttachments'
import { cx } from './ui'

export type ServiceOperationCardData = {
  id: number
  workType: string
  description?: string
  status?: string
  serviceDate: string
  mileageAtService: number
  cost?: number | null
  car?: {
    id?: number
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
    replacedComponentId?: number | null
  }>
  replacedComponents?: Array<{
    id: number
    carComponent?: {
      id: number
      name?: string
    }
    partNumber?: string
    manufacturer?: string
    photos?: Array<{
      id: number
      fileUrl: string
      description?: string
      replacedComponentId?: number | null
    }>
  }>
}

function getStatusMeta(status?: string) {
  switch (status) {
    case 'COMPLETED':
      return { label: 'Завершено', tone: 'auto-badge-success' }
    case 'IN_PROGRESS':
      return { label: 'В работе', tone: 'auto-badge-info' }
    case 'SCHEDULED':
      return { label: 'Запланировано', tone: 'auto-badge-warning' }
    case 'CANCELLED':
      return { label: 'Отменено', tone: 'auto-badge-danger' }
    default:
      return { label: status || 'Без статуса', tone: 'auto-badge' }
  }
}

function formatOperationDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('ru-RU')
  } catch {
    return value
  }
}

function getOwnerName(operation: ServiceOperationCardData) {
  const owner = operation.car?.owner
  return `${owner?.firstName || ''} ${owner?.lastName || ''}`.trim() || 'Клиент не указан'
}

function getCarTitle(operation: ServiceOperationCardData) {
  const carTitle = `${operation.car?.brand || ''} ${operation.car?.model || ''}`.trim()
  return carTitle
    ? `${carTitle}${operation.car?.licensePlate ? ` (${operation.car.licensePlate})` : ''}`
    : 'Автомобиль не указан'
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FaUser
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 text-caption text-slate-200">
        <Icon />
      </div>
      <div className="min-w-0">
        <p className="text-caption font-medium text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-medium leading-5 text-slate-200">{value}</p>
      </div>
    </div>
  )
}

export default function ServiceOperationCard({
  operation,
  className,
}: {
  operation: ServiceOperationCardData
  className?: string
}) {
  const statusMeta = getStatusMeta(operation.status)
  const totalValue = operation.cost != null ? `${operation.cost.toLocaleString('ru-RU')} ₸` : 'Не указана'
  const generalAttachments = (operation.photos ?? []).filter((photo) => !photo.replacedComponentId)

  return (
    <div
      className={cx(
        'rounded-lg border border-border bg-surface-2 p-4 sm:p-5',
        className
      )}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem] xl:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4 lg:hidden">
            <div className="min-w-0">
              <h3 className="truncate text-2xl font-bold text-white">{operation.workType}</h3>
            </div>
            <span className={statusMeta.tone}>{statusMeta.label}</span>
          </div>

          <div className="hidden lg:block">
            <h3 className="truncate text-2xl font-bold text-white">{operation.workType}</h3>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
            <DetailRow icon={FaUser} label="Клиент" value={getOwnerName(operation)} />
            <DetailRow icon={FaCar} label="Автомобиль" value={getCarTitle(operation)} />
            <DetailRow icon={FaCalendarAlt} label="Дата" value={formatOperationDate(operation.serviceDate)} />
            <DetailRow
              icon={FaTachometerAlt}
              label="Пробег"
              value={`${operation.mileageAtService?.toLocaleString('ru-RU') || 0} км`}
            />
          </div>

          {operation.description && (
            <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/45 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <FaCommentDots className="text-text-muted" />
                Комментарий мастера
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{operation.description}</p>
            </div>
          )}

          {operation.replacedComponents && operation.replacedComponents.length > 0 && (
            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <FaTools className="text-sky-300" />
                Использованные материалы и замены
              </div>
              <div className="mt-3 space-y-3">
                {operation.replacedComponents.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-white/10 bg-slate-950/35 p-3"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
                        {item.carComponent?.name || `Компонент #${item.carComponent?.id}`}
                      </span>
                      {item.partNumber ? (
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
                          {item.partNumber}
                        </span>
                      ) : null}
                      {item.manufacturer ? (
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
                          {item.manufacturer}
                        </span>
                      ) : null}
                    </div>
                    <OperationAttachments
                      attachments={item.photos}
                      compact
                      inline
                      showLabels={false}
                      title="Фото детали"
                      className="mt-3"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-3 lg:pl-1">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-caption font-medium text-slate-500">Статус</p>
              <div className="mt-3">
                <span className={statusMeta.tone}>{statusMeta.label}</span>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-400/15 bg-emerald-400/[0.08] p-4">
              <p className="text-caption font-medium text-emerald-200/70">
                Financial total
              </p>
              <p className="mt-3 text-2xl font-semibold text-emerald-300">{totalValue}</p>
            </div>
          </div>

          <OperationAttachments
            attachments={generalAttachments}
            compact
            inline
            showLabels={false}
            title="Материалы"
            className="mt-0"
          />
        </aside>
      </div>
    </div>
  )
}
