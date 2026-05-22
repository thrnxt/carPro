export type StatusMeta = { label: string; tone: string }

const FALLBACK_TONE = 'auto-badge'

function resolve(map: Record<string, StatusMeta>, status?: string | null): StatusMeta {
  if (status && map[status]) {
    return map[status]
  }
  return { label: status || 'Без статуса', tone: FALLBACK_TONE }
}

// Запись на обслуживание (женский род)
const BOOKING_STATUS_META: Record<string, StatusMeta> = {
  PENDING: { label: 'Ожидает', tone: 'auto-badge-warning' },
  CONFIRMED: { label: 'Подтверждена', tone: 'auto-badge-success' },
  IN_PROGRESS: { label: 'В работе', tone: 'auto-badge-info' },
  COMPLETED: { label: 'Завершена', tone: 'auto-badge-success' },
  CANCELLED: { label: 'Отменена', tone: 'auto-badge-danger' },
}

// Сервисная операция / работа (средний род)
const OPERATION_STATUS_META: Record<string, StatusMeta> = {
  SCHEDULED: { label: 'Запланировано', tone: 'auto-badge-warning' },
  IN_PROGRESS: { label: 'В работе', tone: 'auto-badge-info' },
  COMPLETED: { label: 'Завершено', tone: 'auto-badge-success' },
  CANCELLED: { label: 'Отменено', tone: 'auto-badge-danger' },
}

// Счёт (мужской род)
const INVOICE_STATUS_META: Record<string, StatusMeta> = {
  CREATED: { label: 'Создан', tone: 'auto-badge-warning' },
  PAID: { label: 'Оплачен', tone: 'auto-badge-success' },
  CANCELLED: { label: 'Отменён', tone: 'auto-badge-danger' },
}

export function bookingStatusMeta(status?: string | null): StatusMeta {
  return resolve(BOOKING_STATUS_META, status)
}

export function operationStatusMeta(status?: string | null): StatusMeta {
  return resolve(OPERATION_STATUS_META, status)
}

export function invoiceStatusMeta(status?: string | null): StatusMeta {
  return resolve(INVOICE_STATUS_META, status)
}
