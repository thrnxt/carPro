import { useQuery } from '@tanstack/react-query'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { FaArrowLeft, FaCalendarAlt, FaClipboardList, FaInfoCircle, FaWrench } from 'react-icons/fa'
import apiClient from '../api/client'
import { Page, PageHeader, cx } from '../components/ui'

export interface CarSummaryData {
  id: number
  brand: string
  model: string
  year?: number
  licensePlate?: string
  color?: string
  vin?: string
  mileage?: number
  displayMileage?: number
  mileageIsEstimated?: boolean
  confirmedMileageAt?: string
  lastServiceDate?: string
  drivingStyle?: string
  drivingFrequency?: string
  [key: string]: unknown
}

export interface CarOutletContext {
  car: CarSummaryData
}

export default function CarLayout() {
  const { id } = useParams()

  const { data: car, isLoading } = useQuery<CarSummaryData>({
    queryKey: ['car', id],
    queryFn: async () => {
      const res = await apiClient.get(`/cars/${id}`)
      return res.data
    },
    enabled: !!id,
  })

  const backLink = (
    <Link
      to="/garage"
      className="flex items-center gap-1.5 text-text-muted transition-colors hover:text-text-primary"
    >
      <FaArrowLeft className="text-xs" />
      Гараж
    </Link>
  )

  if (isLoading) {
    return (
      <Page>
        <PageHeader eyebrow={backLink} title="Загрузка…" />
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-b-transparent" />
        </div>
      </Page>
    )
  }

  if (!car) {
    return (
      <Page>
        <PageHeader
          eyebrow={backLink}
          title="Автомобиль не найден"
          description="Возможно, автомобиль удалён или у вас больше нет к нему доступа."
        />
      </Page>
    )
  }

  const tabs = [
    { to: `/cars/${id}`, label: 'Обзор', icon: FaInfoCircle, end: true },
    { to: `/cars/${id}/components`, label: 'Детали', icon: FaWrench, end: false },
    { to: `/cars/${id}/history`, label: 'История ТО', icon: FaClipboardList, end: false },
    { to: `/cars/${id}/calendar`, label: 'Календарь', icon: FaCalendarAlt, end: false },
  ]

  return (
    <Page>
      <div className="flex flex-col gap-4">
        <PageHeader
          eyebrow={backLink}
          title={`${car.brand} ${car.model} ${car.year ?? ''}`.trim()}
          description={[car.licensePlate, car.color].filter(Boolean).join(' · ') || undefined}
        />

        <nav className="car-tabs" aria-label="Разделы автомобиля">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) => cx('car-tab', isActive && 'car-tab-active')}
              >
                <Icon className="text-sm" />
                {tab.label}
              </NavLink>
            )
          })}
        </nav>
      </div>

      <Outlet context={{ car }} />
    </Page>
  )
}
