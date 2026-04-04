import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useState } from 'react'
import { FaWrench, FaStopCircle, FaCog, FaCar, FaBolt, FaPlug, FaCarSide, FaCircle, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa'

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

export default function ComponentsView() {
  const { id } = useParams()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

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

  // Группировка по категориям и подкатегориям
  const groupedComponents = components?.reduce((acc: any, comp: Component) => {
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

  const categories = Object.keys(groupedComponents || {})
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

  const getStatusTextColor = (wearLevel: number) => {
    if (wearLevel >= 90) return 'text-red-400'
    if (wearLevel >= 70) return 'text-orange-400'
    if (wearLevel >= 50) return 'text-yellow-400'
    return 'text-emerald-400'
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Детали автомобиля</h1>
        <p className="text-slate-400">Полный список всех компонентов и их состояние</p>
      </div>

      {/* Фильтры */}
      <div className="auto-card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Статус:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="auto-select"
            >
              <option value="ALL">Все</option>
              <option value="CRITICAL">Критический износ (≥90%)</option>
              <option value="WARNING">Требует внимания (70-89%)</option>
              <option value="NORMAL">Норма (&lt;70%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="auto-card p-4 border-l-4 border-red-500">
          <div className="text-3xl font-bold text-red-400 mb-1">
            {components?.filter((c: Component) => c.wearLevel >= 90).length || 0}
          </div>
          <div className="text-sm text-slate-400">Критический износ</div>
        </div>
        <div className="auto-card p-4 border-l-4 border-orange-500">
          <div className="text-3xl font-bold text-orange-400 mb-1">
            {components?.filter((c: Component) => c.wearLevel >= 70 && c.wearLevel < 90).length || 0}
          </div>
          <div className="text-sm text-slate-400">Требует внимания</div>
        </div>
        <div className="auto-card p-4 border-l-4 border-yellow-500">
          <div className="text-3xl font-bold text-yellow-400 mb-1">
            {components?.filter((c: Component) => c.wearLevel >= 50 && c.wearLevel < 70).length || 0}
          </div>
          <div className="text-sm text-slate-400">Норма</div>
        </div>
        <div className="auto-card p-4 border-l-4 border-emerald-500">
          <div className="text-3xl font-bold text-emerald-400 mb-1">
            {components?.filter((c: Component) => c.wearLevel < 50).length || 0}
          </div>
          <div className="text-sm text-slate-400">Отлично</div>
        </div>
      </div>

      {/* Категории */}
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category} className="auto-card">
            <button
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {(() => {
                  const IconComponent = categoryIcons[category]
                  return IconComponent ? <IconComponent className="text-3xl text-red-500" /> : <FaWrench className="text-3xl text-red-500" />
                })()}
                <h2 className="text-xl font-bold text-white">{category}</h2>
                <span className="text-sm text-slate-400">
                  ({Object.values(groupedComponents[category]).flat().length} деталей)
                </span>
              </div>
              <span className="text-slate-400 text-xl">
                {selectedCategory === category ? '▼' : '▶'}
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
                        {selectedSubcategory === subcategory ? '▼' : '▶'}
                      </span>
                    </button>

                    {selectedSubcategory === subcategory && (
                      <div className="p-4 space-y-3">
                        {subComponents
                          .filter((component: Component) => {
                            if (filterStatus === 'CRITICAL') return component.wearLevel >= 90
                            if (filterStatus === 'WARNING') return component.wearLevel >= 70 && component.wearLevel < 90
                            if (filterStatus === 'NORMAL') return component.wearLevel < 70
                            return true
                          })
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
