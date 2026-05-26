import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { FaTimes, FaSave } from 'react-icons/fa'
import apiClient from '../api/client'
import { Button, cx } from './ui'

type DrivingFrequency = 'RARELY' | 'NORMAL' | 'ACTIVE'

interface Props {
  carId: number
  carLabel: string // "Toyota Camry 2019"
  onClose: () => void
  onSuccess?: () => void
}

const OPTIONS: {
  value: DrivingFrequency
  emoji: string
  title: string
  description: string
  hint: string
}[] = [
  {
    value: 'RARELY',
    emoji: '🏘️',
    title: 'Редко',
    description: 'Магазин, иногда в гости',
    hint: '~500 км в месяц',
  },
  {
    value: 'NORMAL',
    emoji: '🏙️',
    title: 'В обычном режиме',
    description: 'Работа, поездки по городу',
    hint: '~1 500 км в месяц',
  },
  {
    value: 'ACTIVE',
    emoji: '🛣️',
    title: 'Много езжу',
    description: 'Командировки, трассы, доставка',
    hint: '~3 000 км в месяц',
  },
]

export default function DrivingFrequencyModal({ carId, carLabel, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<DrivingFrequency | null>(null)

  const mutation = useMutation<unknown, AxiosError, { drivingFrequency: DrivingFrequency }>({
    mutationFn: (body) => apiClient.patch(`/cars/${carId}/driving-frequency`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] })
      queryClient.invalidateQueries({ queryKey: ['car', String(carId)] })
      toast.success('Настройки пробега сохранены')
      onSuccess?.()
      onClose()
    },
    onError: () => {
      toast.error('Не удалось сохранить. Попробуйте ещё раз.')
    },
  })

  const handleSubmit = () => {
    if (!selected) return
    mutation.mutate({ drivingFrequency: selected })
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal card — ограничиваем высоту, чтобы влезало на ноутбук */}
      <div className="auto-card w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="section-label">Новый автомобиль добавлен</p>
            <h2 className="mt-0.5 text-h2 text-text-primary">{carLabel}</h2>
            <p className="mt-1.5 text-sm text-text-secondary">
              Как вы обычно используете этот автомобиль? Это поможет точнее
              рассчитывать пробег и напоминания о&nbsp;ТО.
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

        {/* Options */}
        <div className="mt-4 flex flex-col gap-2">
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(opt.value)}
                className={cx(
                  'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                  isSelected
                    ? 'border-info bg-info/10 ring-1 ring-info'
                    : 'border-border bg-surface-3 hover:border-border hover:bg-surface-2',
                )}
              >
                {/* Emoji */}
                <span className="shrink-0 text-xl leading-none">{opt.emoji}</span>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <p className={cx('text-sm font-semibold', isSelected ? 'text-info' : 'text-text-primary')}>
                    {opt.title}
                  </p>
                  <p className="text-xs text-text-secondary">{opt.description}</p>
                </div>

                {/* Hint */}
                <span className="shrink-0 text-xs text-text-muted">{opt.hint}</span>

                {/* Check indicator */}
                <span
                  className={cx(
                    'ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    isSelected
                      ? 'border-info bg-info text-white'
                      : 'border-border bg-transparent',
                  )}
                >
                  {isSelected && (
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 12 12">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </span>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 flex gap-3">
          <Button
            variant="primary"
            className="flex-1"
            disabled={!selected}
            loading={mutation.isPending}
            onClick={handleSubmit}
          >
            <FaSave />
            Сохранить
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Пропустить
          </Button>
        </div>

        <p className="mt-2.5 text-center text-xs text-text-muted">
          Можно изменить позже в карточке автомобиля
        </p>
      </div>
    </div>
  )
}
