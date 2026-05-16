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
    <div className="flex items-start gap-3 rounded-[1rem] border border-white/10 bg-white/[0.03] px-3.5 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[13px] text-slate-200">
        <Icon />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
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

  return (
    <div
      className={cx(
        'rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.02))] p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.8)] sm:p-5',
        className
      )}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem] xl:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4 lg:hidden">
            <div className="min-w-0">
              <h3 className="truncate text-2xl font-bold tracking-[-0.04em] text-white">{operation.workType}</h3>
            </div>
            <span className={statusMeta.tone}>{statusMeta.label}</span>
          </div>

          <div className="hidden lg:block">
            <h3 className="truncate text-2xl font-bold tracking-[-0.04em] text-white">{operation.workType}</h3>
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
            <div className="mt-4 rounded-[1.1rem] border border-white/10 bg-slate-950/45 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <FaCommentDots className="text-[#ff9b82]" />
                Комментарий мастера
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{operation.description}</p>
            </div>
          )}

          {operation.replacedComponents && operation.replacedComponents.length > 0 && (
            <div className="mt-4 rounded-[1.1rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <FaTools className="text-sky-300" />
                Использованные материалы и замены
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {operation.replacedComponents.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300"
                  >
                    {item.carComponent?.name || `Компонент #${item.carComponent?.id}`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-3 lg:pl-1">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Статус</p>
              <div className="mt-3">
                <span className={statusMeta.tone}>{statusMeta.label}</span>
              </div>
            </div>

            <div className="rounded-[1.1rem] border border-emerald-400/15 bg-emerald-400/[0.08] p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-200/70">
                Financial total
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-emerald-300">{totalValue}</p>
            </div>
          </div>

          <OperationAttachments
            attachments={operation.photos}
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
