import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { FaTimes, FaCheck, FaTachometerAlt } from 'react-icons/fa'
import apiClient from '../api/client'
import { Button } from './ui'

interface Props {
  carId: number
  carLabel: string           // "Toyota Camry 2019"
  estimatedMileage?: number  // текущий расчётный пробег (подсказка)
  onClose: () => void
  onSuccess?: () => void
}

export default function MileageConfirmModal({
  carId,
  carLabel,
  estimatedMileage,
  onClose,
  onSuccess,
}: Props) {
  const queryClient = useQueryClient()
  const [value, setValue] = useState(estimatedMileage?.toString() ?? '')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation<unknown, AxiosError, { currentMileage: number }>({
    mutationFn: (body) => apiClient.patch(`/cars/${carId}/mileage/confirm`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] })
      queryClient.invalidateQueries({ queryKey: ['car', String(carId)] })
      toast.success('Пробег обновлён')
      onSuccess?.()
      onClose()
    },
    onError: () => {
      toast.error('Не удалось обновить пробег. Попробуйте ещё раз.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseInt(value.replace(/\s/g, ''), 10)
    if (isNaN(parsed) || parsed < 0) {
      setError('Введите корректный пробег')
      return
    }
    setError(null)
    mutation.mutate({ currentMileage: parsed })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Разрешаем только цифры и пробелы (для форматирования)
    const raw = e.target.value.replace(/[^\d]/g, '')
    setValue(raw)
    if (error) setError(null)
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal card */}
      <div className="auto-card w-full max-w-sm p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="metric-icon shrink-0">
              <FaTachometerAlt />
            </div>
            <div className="min-w-0">
              <p className="section-label">Уточнение пробега</p>
              <h2 className="mt-0.5 text-h2 text-text-primary">{carLabel}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:text-text-primary"
            aria-label="Закрыть"
          >
            <FaTimes />
          </button>
        </div>

        {/* Context hint */}
        {estimatedMileage != null && (
          <div className="mt-5 rounded-xl border border-border bg-surface-3 px-4 py-3">
            <p className="text-caption text-text-muted">Расчётный пробег сейчас</p>
            <p className="mt-1 text-h2 text-text-primary">
              ~{estimatedMileage.toLocaleString('ru-RU')}{' '}
              <span className="text-body font-normal text-text-secondary">км</span>
            </p>
            <p className="mt-1 text-caption text-text-muted">
              Введите реальное значение с одометра
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5">
          <label className="block">
            <span className="section-label">Текущий пробег (км)</span>
            <div className="relative mt-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={value}
                onChange={handleChange}
                placeholder="например, 87 500"
                autoFocus
                className={[
                  'w-full rounded-xl border bg-surface-3 px-4 py-3 pr-12',
                  'text-body text-text-primary placeholder:text-text-muted',
                  'transition-colors outline-none',
                  'focus:border-info focus:ring-1 focus:ring-info',
                  error ? 'border-danger' : 'border-border',
                ].join(' ')}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-caption text-text-muted">
                км
              </span>
            </div>
            {error && (
              <p className="mt-1.5 text-caption text-danger">{error}</p>
            )}
          </label>

          <div className="mt-5 flex gap-3">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={mutation.isPending}
              disabled={!value}
            >
              <FaCheck />
              Подтвердить
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Отмена
            </Button>
          </div>
        </form>

        <p className="mt-3 text-center text-caption text-text-muted">
          После подтверждения расчёт начнётся заново с этого значения
        </p>
      </div>
    </div>
  )
}
