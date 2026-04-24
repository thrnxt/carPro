import { useMemo } from 'react'
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
  FaCheck,
  FaCheckCircle,
  FaInfoCircle
} from 'react-icons/fa'

interface CarComponent {
  id: number
  name: string
  category: string
  wearLevel: number
  status: string
  icon?: string
}

interface CarVisualizationProps {
  components: CarComponent[]
  carBrand?: string
  carModel?: string
}

export default function CarVisualization({ components, carBrand, carModel }: CarVisualizationProps) {
  const componentsByCategory = useMemo(() => {
    const grouped: Record<string, CarComponent[]> = {}
    components.forEach(comp => {
      if (!grouped[comp.category]) {
        grouped[comp.category] = []
      }
      grouped[comp.category].push(comp)
    })
    return grouped
  }, [components])

  const getStatusColor = (wearLevel: number) => {
    if (wearLevel >= 90) return 'bg-red-500'
    if (wearLevel >= 70) return 'bg-orange-500'
    if (wearLevel >= 50) return 'bg-yellow-500'
    return 'bg-emerald-500'
  }

  const getStatusTextColor = (wearLevel: number) => {
    if (wearLevel >= 90) return 'text-red-300'
    if (wearLevel >= 70) return 'text-orange-300'
    if (wearLevel >= 50) return 'text-yellow-300'
    return 'text-emerald-300'
  }

  const getStatusText = (wearLevel: number) => {
    if (wearLevel >= 90) return 'Критический износ'
    if (wearLevel >= 70) return 'Требует внимания'
    if (wearLevel >= 50) return 'Норма'
    return 'Отлично'
  }

  const getCategoryWear = (categoryComponents: CarComponent[]) => {
    const avgWear = categoryComponents.reduce((sum, c) => sum + c.wearLevel, 0) / categoryComponents.length
    return Math.round(avgWear)
  }

  // Категории с их позициями вокруг автомобиля - используем компоненты иконок
  const categoryPositions = [
    { category: 'Двигатель', position: 'top', Icon: FaWrench },
    { category: 'Тормоза', position: 'bottom', Icon: FaStopCircle },
    { category: 'Подвеска', position: 'left', Icon: FaCog },
    { category: 'Рулевое управление', position: 'right', Icon: FaCar },
    { category: 'Трансмиссия', position: 'top-left', Icon: FaBolt },
    { category: 'Электрика', position: 'top-right', Icon: FaPlug },
    { category: 'Кузов', position: 'bottom-left', Icon: FaCarSide },
    { category: 'Колеса', position: 'bottom-right', Icon: FaCircle },
  ]

  // Получаем общий статус
  const allWear = components.map(c => c.wearLevel)
  const avgWear = allWear.length > 0 ? allWear.reduce((a, b) => a + b, 0) / allWear.length : 0
  const overallStatus =
    avgWear >= 90
      ? { text: 'Критическое', color: 'text-red-400', Icon: FaExclamationTriangle }
      : avgWear >= 70
        ? { text: 'Требует внимания', color: 'text-orange-400', Icon: FaExclamationTriangle }
        : avgWear >= 50
          ? { text: 'Нормальное', color: 'text-yellow-400', Icon: FaInfoCircle }
          : { text: 'Отличное', color: 'text-emerald-400', Icon: FaCheckCircle }

  return (
    <div className="auto-card p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <FaCarSide className="text-red-500" />
        Визуализация состояния автомобиля
      </h2>
      {(carBrand || carModel) && (
        <p className="text-slate-200 mb-6 text-center text-lg font-semibold">
          {carBrand} {carModel}
        </p>
      )}
      
      {/* Визуализация автомобиля с индикаторами */}
      <div className="mb-8">
        <div className="relative mx-auto bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-16 md:p-20 border border-slate-700 shadow-2xl" style={{ maxWidth: '900px', minHeight: '600px' }}>
          {/* Центральная иконка автомобиля - только одна, как фон */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <FaCarSide className="text-9xl md:text-[16rem] text-slate-700 opacity-10 select-none" />
          </div>

          {/* Индикаторы категорий вокруг автомобиля */}
          {categoryPositions.map(({ category, position, Icon }) => {
            const categoryComponents = componentsByCategory[category]
            if (!categoryComponents || categoryComponents.length === 0) return null
            
            const avgWear = getCategoryWear(categoryComponents)
            const color = getStatusColor(avgWear)
            const textColor = getStatusTextColor(avgWear)
            
            // Позиции с достаточными отступами
            const positionClasses = {
              'top': 'top-8 left-1/2 -translate-x-1/2',
              'bottom': 'bottom-8 left-1/2 -translate-x-1/2',
              'left': 'left-8 top-1/2 -translate-y-1/2',
              'right': 'right-8 top-1/2 -translate-y-1/2',
              'top-left': 'top-16 left-16',
              'top-right': 'top-16 right-16',
              'bottom-left': 'bottom-16 left-16',
              'bottom-right': 'bottom-16 right-16',
            }

            return (
              <div
                key={category}
                className={`absolute ${positionClasses[position as keyof typeof positionClasses]} group cursor-pointer z-20`}
              >
                <div className="flex flex-col items-center">
                  {/* Индикатор состояния */}
                  <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center shadow-xl border-2 border-white/40 transition-transform group-hover:scale-110 relative`}>
                    <Icon className="text-white text-xl" />
                    {/* Пульсирующий эффект для критических значений */}
                    {avgWear >= 90 && (
                      <div className={`absolute inset-0 rounded-full ${color} animate-ping opacity-50`}></div>
                    )}
                  </div>
                  {/* Текст категории */}
                  <div className="mt-2 text-center min-w-[110px]">
                    <div className="text-xs font-bold text-white bg-slate-950/98 px-2.5 py-1.5 rounded-lg backdrop-blur-sm whitespace-nowrap border-2 border-slate-600 shadow-2xl">
                      {category}
                    </div>
                    <div className={`text-sm font-bold mt-1.5 px-2.5 py-1 rounded-lg ${textColor} bg-slate-950/98 border-2 border-slate-600 shadow-xl`}>
                      {avgWear}%
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Общий статус - вынесен за пределы контейнера с иконкой */}
      <div className="mb-8 flex justify-center">
        <div className="auto-card px-6 py-4 inline-block">
          <div className="text-center">
            <div className="text-sm text-slate-300 mb-2 font-semibold uppercase tracking-wide">Общее состояние</div>
            <div className={`text-2xl font-bold ${overallStatus.color} flex items-center justify-center gap-2`}>
              <overallStatus.Icon className="text-xl" />
              <span>{overallStatus.text}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Детали по категориям */}
      <div className="space-y-6">
        {Object.entries(componentsByCategory).map(([category, categoryComponents]) => {
          const categoryIconMap: Record<string, any> = {
            'Двигатель': FaWrench,
            'Тормоза': FaStopCircle,
            'Подвеска': FaCog,
            'Рулевое управление': FaCar,
            'Трансмиссия': FaBolt,
            'Электрика': FaPlug,
            'Кузов': FaCarSide,
            'Колеса': FaCircle,
          }
          const CategoryIcon = categoryIconMap[category] || FaWrench
          
          return (
            <div key={category} className="border-b border-slate-700 pb-4">
              <h3 className="text-xl font-semibold mb-3 text-white flex items-center gap-2">
                <CategoryIcon className="text-red-500" />
                {category}
              </h3>
              <div className="space-y-3">
                {categoryComponents.map((component) => (
                  <div key={component.id} className="auto-card p-4 hover:scale-[1.02] transition-transform">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{component.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`auto-badge ${
                          component.wearLevel >= 90 ? 'auto-badge-danger' :
                          component.wearLevel >= 70 ? 'auto-badge-warning' :
                          component.wearLevel >= 50 ? 'auto-badge-info' :
                          'auto-badge-success'
                        }`}>
                          {getStatusText(component.wearLevel)}
                        </span>
                        <span className="text-lg font-bold text-white">{component.wearLevel}%</span>
                      </div>
                    </div>
                    
                    {/* Жизненная полоска */}
                    <div className="relative">
                      <div className="w-full bg-slate-700 rounded-full h-6 overflow-hidden shadow-inner">
                        <div
                          className={`h-6 rounded-full transition-all duration-500 ${getStatusColor(component.wearLevel)}`}
                          style={{ width: `${component.wearLevel}%` }}
                        >
                          {component.wearLevel >= 90 && (
                            <div className="absolute inset-0 bg-red-400 animate-pulse"></div>
                          )}
                        </div>
                      </div>
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                        style={{ width: `${component.wearLevel}%` }}
                      />
                    </div>
                    
                    {/* Дополнительная информация */}
                    <div className="mt-2 text-sm flex items-center gap-2">
                      {component.wearLevel >= 90 && (
                        <>
                          <FaExclamationTriangle className="text-red-400" />
                          <span className="text-red-300 font-semibold">Требуется срочная замена!</span>
                        </>
                      )}
                      {component.wearLevel >= 70 && component.wearLevel < 90 && (
                        <>
                          <FaExclamationTriangle className="text-orange-400" />
                          <span className="text-orange-300">Рекомендуется замена в ближайшее время</span>
                        </>
                      )}
                      {component.wearLevel < 70 && (
                        <>
                          <FaCheck className="text-emerald-400" />
                          <span className="text-emerald-300">Состояние в норме</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
