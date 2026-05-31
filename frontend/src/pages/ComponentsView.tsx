import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  FaBolt,
  FaCar,
  FaCarSide,
  FaCheckCircle,
  FaChevronDown,
  FaChevronRight,
  FaCircle,
  FaCog,
  FaExclamationTriangle,
  FaPlug,
  FaStopCircle,
  FaWrench,
} from 'react-icons/fa'
import apiClient from '../api/client'
import {
  Badge,
  Button,
  EmptyState,
  KeyValue,
  LoadingState,
  cx,
} from '../components/ui'

interface Component {
  id: number
  name: string
  category: string
  subcategory?: string
  icon?: string
  wearLevel: number
  status: string
  maxMileage: number
  currentMileage?: number
  lastReplacementDate?: string
}

type StatusFilter = 'CRITICAL' | 'WARNING' | 'NORMAL' | 'EXCELLENT'

type Tone = 'danger' | 'warning' | 'info' | 'success'

const STATUS_META: Record<StatusFilter, { label: string; tone: Tone }> = {
  CRITICAL: { label: 'Критический износ', tone: 'danger' },
  WARNING: { label: 'Требует внимания', tone: 'warning' },
  NORMAL: { label: 'Норма', tone: 'info' },
  EXCELLENT: { label: 'Отлично', tone: 'success' },
}

const TONE_TEXT: Record<Tone, string> = {
  danger: 'text-danger',
  warning: 'text-warning',
  info: 'text-info',
  success: 'text-success',
}

const TONE_BORDER: Record<Tone, string> = {
  danger: 'border-danger',
  warning: 'border-warning',
  info: 'border-info',
  success: 'border-success',
}

const TONE_BG: Record<Tone, string> = {
  danger: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
  success: 'bg-success',
}

const TONE_BADGE: Record<Tone, string> = {
  danger: 'auto-badge-danger',
  warning: 'auto-badge-warning',
  info: 'auto-badge-info',
  success: 'auto-badge-success',
}

const categoryIcons: Record<string, typeof FaWrench> = {
  'Двигатель': FaWrench,
  'Тормоза': FaStopCircle,
  'Подвеска': FaCog,
  'Рулевое управление': FaCar,
  'Трансмиссия': FaBolt,
  'Электрика': FaPlug,
  'Электропривод': FaBolt,
  'Салон': FaCarSide,
  'Кузов': FaCarSide,
  'Колеса': FaCircle,
}

function getStatusKey(wearLevel: number): StatusFilter {
  if (wearLevel >= 90) return 'CRITICAL'
  if (wearLevel >= 70) return 'WARNING'
  if (wearLevel >= 50) return 'NORMAL'
  return 'EXCELLENT'
}

export default function ComponentsView() {
  const { id } = useParams()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilter | null>(null)

  const { data: components, isLoading, error } = useQuery({
    queryKey: ['car-components', id],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/cars/${id}/components`)
        return response.data
      } catch (err: any) {
        console.error('Error fetching components:', err)
        if (err.response?.status === 403) {
          throw new Error('Нет доступа к этой информации. Пожалуйста, войдите в систему.')
        }
        throw err
      }
    },
    enabled: !!id,
  })

  const matchesStatusFilter = (component: Component, filter: StatusFilter | null) => {
    if (!filter) return true
    return getStatusKey(component.wearLevel) === filter
  }

  const groupedComponents: Record<string, Record<string, Component[]>> = (
    (components as Component[] | undefined) ?? []
  ).reduce(
    (acc: Record<string, Record<string, Component[]>>, comp: Component) => {
      if (!acc[comp.category]) {
        acc[comp.category] = {}
      }
      const subcat = comp.subcategory || 'Без подкатегории'
      if (!acc[comp.category][subcat]) {
        acc[comp.category][subcat] = []
      }
      acc[comp.category][subcat].push(comp)
      return acc
    },
    {}
  )

  const filteredGroupedComponents = Object.entries(groupedComponents).reduce(
    (acc: Record<string, Record<string, Component[]>>, [category, subcategories]) => {
      const filteredSubcategories = Object.entries(subcategories).reduce(
        (subAcc: Record<string, Component[]>, [subcategory, subComponents]) => {
          const filteredComponents = subComponents.filter((component) =>
            matchesStatusFilter(component, activeStatusFilter)
          )

          if (filteredComponents.length > 0) {
            subAcc[subcategory] = filteredComponents
          }

          return subAcc
        },
        {}
      )

      if (Object.keys(filteredSubcategories).length > 0) {
        acc[category] = filteredSubcategories
      }

      return acc
    },
    {}
  )

  const categories = Object.keys(filteredGroupedComponents)

  useEffect(() => {
    if (selectedCategory && !categories.includes(selectedCategory)) {
      setSelectedCategory(null)
      setSelectedSubcategory(null)
    }
  }, [categories, selectedCategory])

  useEffect(() => {
    if (!selectedCategory || !selectedSubcategory) {
      return
    }

    const availableSubcategories = Object.keys(filteredGroupedComponents[selectedCategory] || {})
    if (!availableSubcategories.includes(selectedSubcategory)) {
      setSelectedSubcategory(null)
    }
  }, [filteredGroupedComponents, selectedCategory, selectedSubcategory])

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <EmptyState
        icon={FaExclamationTriangle}
        title="Не удалось загрузить детали"
        description={
          error instanceof Error
            ? error.message
            : 'Убедитесь, что вы авторизованы и имеете доступ к этому автомобилю.'
        }
      />
    )
  }

  const statusCards = (Object.keys(STATUS_META) as StatusFilter[]).map((key) => ({
    key,
    label: STATUS_META[key].label,
    tone: STATUS_META[key].tone,
    count:
      components?.filter((component: Component) => getStatusKey(component.wearLevel) === key).length || 0,
  }))

  const handleStatusCardClick = (status: StatusFilter) => {
    setActiveStatusFilter((currentStatus) => (currentStatus === status ? null : status))
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statusCards.map((card) => {
          const isActive = activeStatusFilter === card.key

          return (
            <button
              key={card.key}
              type="button"
              onClick={() => handleStatusCardClick(card.key)}
              aria-pressed={isActive}
              className={cx(
                'rounded-md border p-card text-left transition-colors',
                isActive
                  ? `${TONE_BORDER[card.tone]} bg-surface-3`
                  : 'border-border bg-surface-2 hover:bg-surface-3'
              )}
            >
              <p className={cx('text-h1 font-semibold', TONE_TEXT[card.tone])}>{card.count}</p>
              <p className="mt-1 text-body text-text-secondary">{card.label}</p>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-2 p-4">
        <p className="text-body text-text-secondary">
          Показаны:{' '}
          <span className="font-semibold text-text-primary">
            {activeStatusFilter ? STATUS_META[activeStatusFilter].label : 'Все детали'}
          </span>
        </p>
        {activeStatusFilter ? (
          <Button variant="secondary" onClick={() => setActiveStatusFilter(null)}>
            Сбросить фильтр
          </Button>
        ) : null}
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={FaWrench}
          title="Под выбранный статус детали не найдены"
          description="Попробуйте выбрать другой статус или сбросить текущий фильтр."
          action={
            activeStatusFilter ? (
              <Button variant="primary" onClick={() => setActiveStatusFilter(null)}>
                Показать все детали
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {categories.map((category) => {
            const CategoryIcon = categoryIcons[category] || FaWrench
            const categoryCount = Object.values(filteredGroupedComponents[category]).flat().length
            const isCategoryOpen = selectedCategory === category

            return (
              <div key={category} className="auto-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(isCategoryOpen ? null : category)
                    setSelectedSubcategory(null)
                  }}
                  aria-expanded={isCategoryOpen}
                  className="flex w-full items-center justify-between gap-3 p-card text-left transition-colors hover:bg-surface-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <CategoryIcon className="shrink-0 text-xl text-text-secondary" />
                    <h2 className="truncate text-h3 text-text-primary">{category}</h2>
                    <span className="shrink-0 text-caption text-text-muted">{categoryCount} дет.</span>
                  </div>
                  <span className="shrink-0 text-text-muted">
                    {isCategoryOpen ? <FaChevronDown /> : <FaChevronRight />}
                  </span>
                </button>

                {isCategoryOpen ? (
                  <div className="border-t border-border">
                    {Object.entries(filteredGroupedComponents[category]).map(
                      ([subcategory, subComponents]) => {
                        const isSubOpen = selectedSubcategory === subcategory

                        return (
                          <div key={subcategory}>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedSubcategory(isSubOpen ? null : subcategory)
                              }
                              aria-expanded={isSubOpen}
                              className="flex w-full items-center justify-between gap-2 border-b border-border p-3 text-left transition-colors last:border-b-0 hover:bg-surface-3"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-text-primary">{subcategory}</span>
                                <span className="text-caption text-text-muted">
                                  {subComponents.length}
                                </span>
                              </div>
                              <span className="text-sm text-text-muted">
                                {isSubOpen ? <FaChevronDown /> : <FaChevronRight />}
                              </span>
                            </button>

                            {isSubOpen ? (
                              <div className="space-y-3 p-4">
                                {subComponents.map((component) => {
                                  const tone = STATUS_META[getStatusKey(component.wearLevel)].tone
                                  const StatusIcon =
                                    tone === 'danger' || tone === 'warning'
                                      ? FaExclamationTriangle
                                      : FaCheckCircle

                                  return (
                                    <div
                                      key={component.id}
                                      className={cx(
                                        'rounded-md border bg-surface-2 p-4',
                                        TONE_BORDER[tone]
                                      )}
                                    >
                                      <div className="mb-3 flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-2">
                                          <StatusIcon
                                            className={cx('shrink-0 text-2xl', TONE_TEXT[tone])}
                                          />
                                          <div className="min-w-0">
                                            <h3 className="truncate text-h3 text-text-primary">
                                              {component.name}
                                            </h3>
                                            <Badge tone={TONE_BADGE[tone]}>
                                              {STATUS_META[getStatusKey(component.wearLevel)].label}
                                            </Badge>
                                          </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                          <div className={cx('text-h2 font-bold', TONE_TEXT[tone])}>
                                            {component.wearLevel}%
                                          </div>
                                          <div className="text-caption text-text-muted">износ</div>
                                        </div>
                                      </div>

                                      <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
                                        <div
                                          className={cx(
                                            'h-full rounded-full transition-all',
                                            TONE_BG[tone]
                                          )}
                                          style={{ width: `${component.wearLevel}%` }}
                                        />
                                      </div>

                                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <KeyValue
                                          label="Макс. пробег"
                                          value={`${component.maxMileage?.toLocaleString('ru-RU') || 'N/A'} км`}
                                        />
                                        {component.currentMileage ? (
                                          <KeyValue
                                            label="Текущий пробег"
                                            value={`${component.currentMileage.toLocaleString('ru-RU')} км`}
                                          />
                                        ) : null}
                                        {component.lastReplacementDate ? (
                                          <KeyValue
                                            label="Последняя замена"
                                            value={new Date(
                                              component.lastReplacementDate
                                            ).toLocaleDateString('ru-RU')}
                                            className="sm:col-span-2"
                                          />
                                        ) : null}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : null}
                          </div>
                        )
                      }
                    )}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
