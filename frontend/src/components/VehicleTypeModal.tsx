import { useState } from 'react'
import { FaTimes, FaCheck } from 'react-icons/fa'
import { Button, cx } from './ui'

export type PowertrainType = 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC'
export type TransmissionType = 'MANUAL' | 'AUTOMATIC'
export type DrivetrainType = 'FWD' | 'RWD' | 'AWD'

export type VehicleType = {
  powertrainType: PowertrainType
  transmissionType: TransmissionType
  drivetrainType: DrivetrainType
}

interface Props {
  carLabel: string // "Toyota Camry 2019"
  loading?: boolean
  onConfirm: (value: VehicleType) => void
  onClose: () => void
}

const POWERTRAINS: { value: PowertrainType; emoji: string; label: string }[] = [
  { value: 'PETROL', emoji: '⛽', label: 'Бензин' },
  { value: 'DIESEL', emoji: '🛢️', label: 'Дизель' },
  { value: 'HYBRID', emoji: '🔋', label: 'Гибрид' },
  { value: 'ELECTRIC', emoji: '⚡', label: 'Электро' },
]

const TRANSMISSIONS: { value: TransmissionType; label: string }[] = [
  { value: 'MANUAL', label: 'Механика' },
  { value: 'AUTOMATIC', label: 'Автомат' },
]

const DRIVETRAINS: { value: DrivetrainType; label: string }[] = [
  { value: 'FWD', label: 'Передний' },
  { value: 'RWD', label: 'Задний' },
  { value: 'AWD', label: 'Полный' },
]

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; emoji?: string; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map((opt) => {
        const isSelected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cx(
              'flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all',
              isSelected
                ? 'border-info bg-info/10 text-info ring-1 ring-info'
                : 'border-border bg-surface-3 text-text-primary hover:bg-surface-2'
            )}
          >
            {opt.emoji ? <span className="leading-none">{opt.emoji}</span> : null}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export default function VehicleTypeModal({ carLabel, loading, onConfirm, onClose }: Props) {
  const [powertrainType, setPowertrainType] = useState<PowertrainType>('PETROL')
  const [transmissionType, setTransmissionType] = useState<TransmissionType>('AUTOMATIC')
  const [drivetrainType, setDrivetrainType] = useState<DrivetrainType>('FWD')

  // У электромобиля нет привычной КПП — выбор скрываем (на бэке используется редуктор)
  const isElectric = powertrainType === 'ELECTRIC'

  const handleSubmit = () => {
    onConfirm({ powertrainType, transmissionType, drivetrainType })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="auto-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="section-label">Параметры автомобиля</p>
            <h2 className="mt-0.5 text-h2 text-text-primary">{carLabel}</h2>
            <p className="mt-1.5 text-sm text-text-secondary">
              От типа авто зависит, какие детали мы будем отслеживать. Укажите параметры —
              изменить можно позже.
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:text-text-primary"
            aria-label="Закрыть"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Двигатель</p>
            <Segmented options={POWERTRAINS} value={powertrainType} onChange={setPowertrainType} />
          </div>

          {!isElectric ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Коробка передач</p>
              <Segmented options={TRANSMISSIONS} value={transmissionType} onChange={setTransmissionType} />
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Привод</p>
            <Segmented options={DRIVETRAINS} value={drivetrainType} onChange={setDrivetrainType} />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="primary" className="flex-1" loading={loading} onClick={handleSubmit}>
            <FaCheck />
            Добавить автомобиль
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </div>
    </div>
  )
}
