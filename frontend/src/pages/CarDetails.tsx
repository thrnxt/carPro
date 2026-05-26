import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaClipboardList,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTachometerAlt,
  FaTimesCircle,
  FaWrench,
} from 'react-icons/fa'
import apiClient from '../api/client'
import { Button, KeyValue, Page, PageHeader, Section, StatCard } from '../components/ui'
import DrivingFrequencyModal from '../components/DrivingFrequencyModal'
import MileageConfirmModal from '../components/MileageConfirmModal'

const FREQUENCY_LABELS: Record<string, string> = {
  RARELY: '🏘️ Редко (~500 км/мес)',
  NORMAL: '🏙️ Обычный режим (~1 500 км/мес)',
  ACTIVE: '🛣️ Много езжу (~3 000 км/мес)',
}

function daysSince(dateStr?: string | null): number | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function formatDaysSince(n: number | null): string {
  if (n === null) return '—'
  if (n === 0) return 'сегодня'
  if (n === 1) return 'вчера'
  return `${n} дн. назад`
}

export default function CarDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showFrequencyModal, setShowFrequencyModal] = useState(false)
  const [showMileageModal, setShowMileageModal] = useState(false)

  const { data: car, isLoading } = useQuery({
    queryKey: ['car', id],
    queryFn: async () => {
      const res = await apiClient.get(`/cars/${id}`)
      return res.data
    },
  })

  const { data: components = [] } = useQuery<any[]>({
    queryKey: ['car-components', id],
    queryFn: async () => {
      const res = await apiClient.get(`/cars/${id}/components`)
      return res.data
    },
    enabled: !!id,
  })

  /* ── Loading ── */
  if (isLoading) {
    return (
      <Page>
        <PageHeader
          eyebrow={
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors">
              <FaArrowLeft className="text-xs" /> Назад
            </button>
          }
          title="Загрузка…"
        />
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-b-transparent" />
        </div>
      </Page>
    )
  }

  /* ── Not found ── */
  if (!car) {
    return (
      <Page>
        <PageHeader
          eyebrow={
            <Link to="/garage" className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors">
              <FaArrowLeft className="text-xs" /> Гараж
            </Link>
          }
          title="Автомобиль не найден"
        />
      </Page>
    )
  }

  const days = daysSince(car.confirmedMileageAt)
  const critical = components.filter((c: any) => c.wearLevel >= 90).length
  const warning = components.filter((c: any) => c.wearLevel >= 70 && c.wearLevel < 90).length
  const good = components.filter((c: any) => c.wearLevel < 70).length

  return (
    <Page>
      {/* ── Header ── */}
      <PageHeader
        eyebrow={
          <Link
            to="/garage"
            className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors"
          >
            <FaArrowLeft className="text-xs" />
            Гараж
          </Link>
        }
        title={`${car.brand} ${car.model} ${car.year}`}
        description={[car.licensePlate, car.color].filter(Boolean).join(' · ')}
        actions={
          <>
            <Link to={`/cars/${id}/components`} className="btn-secondary flex items-center gap-2">
              <FaWrench />
              Детали
            </Link>
            <Link to={`/cars/${id}/history`} className="btn-secondary flex items-center gap-2">
              <FaClipboardList />
              История ТО
            </Link>
            <Link to="/maintenance-calendar" className="btn-secondary flex items-center gap-2">
              <FaCalendarAlt />
              Календарь
            </Link>
          </>
        }
      />

      {/* ── Stat strip ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={FaTimesCircle}
          label="Критических"
          value={critical}
          tone={critical > 0 ? 'danger' : undefined}
          meta={critical > 0 ? 'Требуют замены' : 'Нет проблем'}
        />
        <StatCard
          icon={FaExclamationTriangle}
          label="Требуют внимания"
          value={warning}
          tone={warning > 0 ? 'warning' : undefined}
          meta={warning > 0 ? 'Скоро менять' : 'В норме'}
        />
        <StatCard
          icon={FaCheckCircle}
          label="В хорошем состоянии"
          value={good}
          tone="success"
          meta="Детали в норме"
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Информация */}
        <Section
          eyebrow="Информация"
          title="Данные автомобиля"
          actions={
            <div className="metric-icon shrink-0">
              <FaInfoCircle />
            </div>
          }
        >
          <div className="space-y-3">
            {car.licensePlate && (
              <KeyValue
                label="Гос. номер"
                value={<span className="font-mono text-info">{car.licensePlate}</span>}
              />
            )}
            {car.vin && (
              <KeyValue
                label="VIN"
                value={<span className="font-mono text-caption">{car.vin}</span>}
              />
            )}
            {car.color && <KeyValue label="Цвет" value={car.color} />}
            <KeyValue
              label="Стиль вождения"
              value={
                car.drivingStyle === 'CALM' ? 'Спокойный'
                : car.drivingStyle === 'MODERATE' ? 'Умеренный'
                : 'Агрессивный'
              }
            />
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
        </Section>

        {/* Пробег */}
        <Section
          eyebrow="Пробег и использование"
          title="Трекинг пробега"
          actions={
            <div className="metric-icon shrink-0">
              <FaTachometerAlt />
            </div>
          }
        >
          {/* Большое число пробега */}
          <div className="rounded-xl border border-border bg-surface-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-text-muted mb-1 flex items-center gap-2">
                  Текущий пробег
                  {car.mileageIsEstimated && (
                    <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                      расчётный
                    </span>
                  )}
                </p>
                <p className="text-3xl font-bold text-text-primary">
                  {car.mileageIsEstimated ? '~' : ''}
                  {(car.displayMileage ?? car.mileage)?.toLocaleString('ru-RU')}
                  <span className="ml-1 text-base font-normal text-text-muted">км</span>
                </p>
                {days !== null && (
                  <p className="mt-1 text-xs text-text-muted">
                    {car.mileageIsEstimated
                      ? `Последнее подтверждение: ${formatDaysSince(days)}`
                      : `Подтверждено ${formatDaysSince(days)}`}
                  </p>
                )}
              </div>
              <Button
                variant="secondary"
                className="shrink-0 text-xs"
                onClick={() => setShowMileageModal(true)}
              >
                Уточнить
              </Button>
            </div>

            {/* Частота использования */}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="text-xs text-text-muted">Частота использования</p>
                <p className="mt-0.5 text-sm text-text-primary">
                  {car.drivingFrequency
                    ? FREQUENCY_LABELS[car.drivingFrequency]
                    : <span className="text-text-muted">Не задана</span>}
                </p>
              </div>
              <Button
                variant="secondary"
                className="shrink-0 text-xs"
                onClick={() => setShowFrequencyModal(true)}
              >
                Изменить
              </Button>
            </div>
          </div>
        </Section>
      </div>

      {/* ── Quick links ── */}
      <Section eyebrow="Быстрые действия" title="Что дальше?">
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            to={`/cars/${id}/components`}
            className="auto-card p-4 flex items-center gap-3 hover:border-accent transition-colors group"
          >
            <div className="metric-icon shrink-0">
              <FaWrench />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">Состояние деталей</p>
              <p className="text-xs text-text-muted mt-0.5">Износ узлов и компонентов</p>
            </div>
          </Link>
          <Link
            to={`/cars/${id}/history`}
            className="auto-card p-4 flex items-center gap-3 hover:border-accent transition-colors group"
          >
            <div className="metric-icon shrink-0">
              <FaClipboardList />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">История ТО</p>
              <p className="text-xs text-text-muted mt-0.5">Все записи обслуживания</p>
            </div>
          </Link>
          <Link
            to="/maintenance-calendar"
            className="auto-card p-4 flex items-center gap-3 hover:border-accent transition-colors group"
          >
            <div className="metric-icon shrink-0">
              <FaCalendarAlt />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">Календарь ТО</p>
              <p className="text-xs text-text-muted mt-0.5">Плановые работы</p>
            </div>
          </Link>
        </div>
      </Section>

      {/* ── Modals ── */}
      {showFrequencyModal && (
        <DrivingFrequencyModal
          carId={car.id}
          carLabel={`${car.brand} ${car.model} ${car.year}`}
          onClose={() => setShowFrequencyModal(false)}
        />
      )}
      {showMileageModal && (
        <MileageConfirmModal
          carId={car.id}
          carLabel={`${car.brand} ${car.model} ${car.year}`}
          estimatedMileage={car.displayMileage ?? car.mileage}
          onClose={() => setShowMileageModal(false)}
        />
      )}
    </Page>
  )
}
