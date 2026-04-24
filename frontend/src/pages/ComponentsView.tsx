import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useEffect, useState } from 'react'
import {
  FaWrench,
  FaStopCircle,
  FaCog,
  FaCar,
  FaBolt,
  FaPlug,
  FaCarSide,
  FaCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaChevronDown,
  FaChevronRight,
} from 'react-icons/fa'

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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <p className="mt-2 text-slate-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="auto-card p-6 border-l-4 border-red-500">
          <h2 className="text-red-400 font-bold mb-2">Ошибка загрузки</h2>
          <p className="text-slate-300">
            {error instanceof Error ? error.message : 'Не удалось загрузить детали автомобиля'}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Убедитесь, что вы авторизованы и имеете доступ к этому автомобилю.
          </p>
        </div>
      </div>
    )
  }

  const categoryIcons: Record<string, any> = {
    'Двигатель': FaWrench,
    'Тормоза': FaStopCircle,
    'Подвеска': FaCog,
    'Рулевое управление': FaCar,
    'Трансмиссия': FaBolt,
    'Электрика': FaPlug,
    'Кузов': FaCarSide,
    'Колеса': FaCircle,
  }

  const getStatusKey = (wearLevel: number): StatusFilter => {
    if (wearLevel >= 90) return 'CRITICAL'
    if (wearLevel >= 70) return 'WARNING'
    if (wearLevel >= 50) return 'NORMAL'
    return 'EXCELLENT'
  }

  const matchesStatusFilter = (component: Component, filter: StatusFilter | null) => {
    if (!filter) return true
    return getStatusKey(component.wearLevel) === filter
  }

  const getStatusColor = (wearLevel: number) => {
    if (wearLevel >= 90) return 'border-red-500/50 bg-red-900/20'
    if (wearLevel >= 70) return 'border-orange-500/50 bg-orange-900/20'
    if (wearLevel >= 50) return 'border-yellow-500/50 bg-yellow-900/20'
    return 'border-emerald-500/50 bg-emerald-900/20'
  }

  const getStatusText = (wearLevel: number) => {
    if (wearLevel >= 90) return 'Критический износ'
    if (wearLevel >= 70) return 'Требует внимания'
    if (wearLevel >= 50) return 'Норма'
    return 'Отлично'
  }

  const getFilterLabel = (filter: StatusFilter | null) => {
    if (filter === 'CRITICAL') return 'Критический износ'
    if (filter === 'WARNING') return 'Требует внимания'
    if (filter === 'NORMAL') return 'Норма'
    if (filter === 'EXCELLENT') return 'Отлично'
    return 'Все детали'
  }

  const getStatusTextColor = (wearLevel: number) => {
    if (wearLevel >= 90) return 'text-red-400'
    if (wearLevel >= 70) return 'text-orange-400'
    if (wearLevel >= 50) return 'text-yellow-400'
    return 'text-emerald-400'
  }

  const groupedComponents = components?.reduce((acc: Record<string, Record<string, Component[]>>, comp: Component) => {
    if (!acc[comp.category]) {
      acc[comp.category] = {}
    }
    const subcat = comp.subcategory || 'Без подкатегории'
    if (!acc[comp.category][subcat]) {
      acc[comp.category][subcat] = []
    }
    acc[comp.category][subcat].push(comp)
    return acc
  }, {})

  const filteredGroupedComponents = Object.entries(groupedComponents || {}).reduce(
    (acc: Record<string, Record<string, Component[]>>, [category, subcategories]) => {
      const filteredSubcategories = Object.entries(subcategories as Record<string, Component[]>).reduce(
        (subAcc: Record<string, Component[]>, [subcategory, subComponents]) => {
          const filteredComponents = (subComponents as Component[]).filter((component: Component) =>
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

  const statusCards: Array<{
    key: StatusFilter
    label: string
    count: number
    countClassName: string
    activeClassName: string
    activeStyle: {
      borderColor: string
      boxShadow: string
    }
  }> = [
    {
      key: 'CRITICAL',
      label: 'Критический износ',
      count: components?.filter((component: Component) => getStatusKey(component.wearLevel) === 'CRITICAL').length || 0,
      countClassName: 'text-red-400',
      activeClassName: 'bg-red-500/10',
      activeStyle: {
        borderColor: 'rgb(239 68 68 / 1)',
        boxShadow: '0 0 0 1px rgba(239, 68, 68, 0.22)',
      },
    },
    {
      key: 'WARNING',
      label: 'Требует внимания',
      count: components?.filter((component: Component) => getStatusKey(component.wearLevel) === 'WARNING').length || 0,
      countClassName: 'text-orange-400',
      activeClassName: 'bg-orange-500/10',
      activeStyle: {
        borderColor: 'rgb(249 115 22 / 1)',
        boxShadow: '0 0 0 1px rgba(249, 115, 22, 0.22)',
      },
    },
    {
      key: 'NORMAL',
      label: 'Норма',
      count: components?.filter((component: Component) => getStatusKey(component.wearLevel) === 'NORMAL').length || 0,
      countClassName: 'text-yellow-400',
      activeClassName: 'bg-yellow-500/10',
      activeStyle: {
        borderColor: 'rgb(234 179 8 / 1)',
        boxShadow: '0 0 0 1px rgba(234, 179, 8, 0.22)',
      },
    },
    {
      key: 'EXCELLENT',
      label: 'Отлично',
      count: components?.filter((component: Component) => getStatusKey(component.wearLevel) === 'EXCELLENT').length || 0,
      countClassName: 'text-emerald-400',
      activeClassName: 'bg-emerald-500/10',
      activeStyle: {
        borderColor: 'rgb(16 185 129 / 1)',
        boxShadow: '0 0 0 1px rgba(16, 185, 129, 0.22)',
      },
    },
  ]

  const handleStatusCardClick = (status: StatusFilter) => {
    setActiveStatusFilter((currentStatus) => (currentStatus === status ? null : status))
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Детали автомобиля</h1>
        <p className="text-slate-400">Полный список всех компонентов и их состояние</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {statusCards.map((card) => {
          const isActive = activeStatusFilter === card.key

          return (
            <button
              key={card.key}
              type="button"
              onClick={() => handleStatusCardClick(card.key)}
              className={`auto-card p-4 text-left border transition-all duration-200 ${
                isActive
                  ? card.activeClassName
                  : 'border-slate-700/80 bg-slate-900/40 hover:border-slate-500/80'
              }`}
              style={isActive ? card.activeStyle : undefined}
              aria-pressed={isActive}
            >
              <div className={`text-3xl font-bold mb-1 ${card.countClassName}`}>{card.count}</div>
              <div className="text-sm font-medium text-slate-200">{card.label}</div>
            </button>
          )
        })}
      </div>

      <div className="auto-card p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-300">
            Показаны: <span className="font-semibold text-white">{getFilterLabel(activeStatusFilter)}</span>
          </div>
          {activeStatusFilter && (
            <button
              type="button"
              onClick={() => setActiveStatusFilter(null)}
              className="inline-flex items-center rounded-full border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
            >
              Сбросить фильтр
            </button>
          )}
        </div>
      </div>

      {/* Категории */}
      <div className="space-y-6">
        {categories.length === 0 && (
          <div className="auto-card p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Под выбранный статус детали не найдены</h2>
            <p className="text-slate-400 mb-4">
              Попробуйте выбрать другой статус или сбросить текущий фильтр.
            </p>
            {activeStatusFilter && (
              <button
                type="button"
                onClick={() => setActiveStatusFilter(null)}
                className="auto-btn-secondary"
              >
                Показать все детали
              </button>
            )}
          </div>
        )}

        {categories.map((category) => (
          <div key={category} className="auto-card">
            <button
              onClick={() => {
                setSelectedCategory(selectedCategory === category ? null : category)
                setSelectedSubcategory(null)
              }}
              className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {(() => {
                  const IconComponent = categoryIcons[category]
                  return IconComponent ? <IconComponent className="text-3xl text-red-500" /> : <FaWrench className="text-3xl text-red-500" />
                })()}
                <h2 className="text-xl font-bold text-white">{category}</h2>
                <span className="text-sm text-slate-400">
                  ({Object.values(filteredGroupedComponents[category]).flat().length} деталей)
                </span>
              </div>
              <span className="text-slate-400 text-xl">
                {selectedCategory === category ? <FaChevronDown /> : <FaChevronRight />}
              </span>
            </button>

            {selectedCategory === category && (
              <div className="border-t border-slate-700">
                {Object.entries(groupedComponents[category]).map(([subcategory, subComponents]: [string, any]) => (
                  <div key={subcategory}>
                    <button
                      onClick={() => setSelectedSubcategory(
                        selectedSubcategory === subcategory ? null : subcategory
                      )}
                      className="w-full p-3 text-left flex items-center justify-between hover:bg-slate-800/50 border-b border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{subcategory}</span>
                        <span className="text-xs text-slate-400">({subComponents.length})</span>
                      </div>
                      <span className="text-slate-400 text-sm">
                        {selectedSubcategory === subcategory ? <FaChevronDown /> : <FaChevronRight />}
                      </span>
                    </button>

                    {selectedSubcategory === subcategory && (
                      <div className="p-4 space-y-3">
                        {subComponents
                          .map((component: Component) => (
                          <div
                            key={component.id}
                            className={`auto-card p-4 border-2 ${getStatusColor(component.wearLevel)}`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2 flex-1">
                                {component.wearLevel >= 90 ? (
                                  <FaExclamationTriangle className="text-2xl text-red-500" />
                                ) : component.wearLevel >= 70 ? (
                                  <FaExclamationTriangle className="text-2xl text-orange-500" />
                                ) : (
                                  <FaCheckCircle className="text-2xl text-emerald-500" />
                                )}
                                <div>
                                  <h3 className="font-semibold text-lg text-white">{component.name}</h3>
                                  <p className={`text-sm ${getStatusTextColor(component.wearLevel)}`}>
                                    {getStatusText(component.wearLevel)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${getStatusTextColor(component.wearLevel)}`}>
                                  {component.wearLevel}%
                                </div>
                                <div className="text-xs text-slate-400">износ</div>
                              </div>
                            </div>

                            {/* Жизненная полоска */}
                            <div className="mb-3">
                              <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                                <div
                                  className={`h-4 rounded-full transition-all ${
                                    component.wearLevel >= 90 ? 'bg-red-500' :
                                    component.wearLevel >= 70 ? 'bg-orange-500' :
                                    component.wearLevel >= 50 ? 'bg-yellow-500' :
                                    'bg-emerald-500'
                                  }`}
                                  style={{ width: `${component.wearLevel}%` }}
                                />
                              </div>
                            </div>

                            {/* Дополнительная информация */}
                            <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                              <div>
                                <span className="text-slate-400">Макс. пробег:</span>{' '}
                                <strong className="text-white">{component.maxMileage?.toLocaleString() || 'N/A'} км</strong>
                              </div>
                              {component.currentMileage && (
                                <div>
                                  <span className="text-slate-400">Текущий пробег:</span>{' '}
                                  <strong className="text-white">{component.currentMileage.toLocaleString()} км</strong>
                                </div>
                              )}
                              {component.lastReplacementDate && (
                                <div className="col-span-2">
                                  <span className="text-slate-400">Последняя замена:</span>{' '}
                                  <strong className="text-white">
                                    {new Date(component.lastReplacementDate).toLocaleDateString('ru-RU')}
                                  </strong>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
