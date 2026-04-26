import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  FaBars,
  FaBell,
  FaBookOpen,
  FaCalendar,
  FaCalendarAlt,
  FaCar,
  FaCarSide,
  FaChartBar,
  FaChevronRight,
  FaClipboardList,
  FaCog,
  FaComments,
  FaFileInvoiceDollar,
  FaHome,
  FaShieldAlt,
  FaStar,
  FaTimes,
  FaTools,
  FaUsers,
  FaWrench,
} from 'react-icons/fa'
import apiClient from '../api/client'
import ProfileEditorModal from './ProfileEditorModal'
import { useAuthStore } from '../store/authStore'
import { resolveFileUrl } from '../utils/resolveFileUrl'

type NavItem = {
  path: string
  label: string
  icon: typeof FaHome
  description: string
}

const userNavItems: NavItem[] = [
  { path: '/', label: 'Главная', icon: FaHome, description: 'Обзор аккаунта' },
  { path: '/garage', label: 'Гараж', icon: FaCar, description: 'Автомобили и VIN' },
  { path: '/service-centers', label: 'Сервисы', icon: FaWrench, description: 'Поиск партнеров' },
  { path: '/bookings', label: 'Записи', icon: FaCalendar, description: 'Активные визиты' },
  { path: '/my-documents', label: 'Документы', icon: FaFileInvoiceDollar, description: 'Операции и счета' },
  { path: '/maintenance-calendar', label: 'Календарь', icon: FaCalendarAlt, description: 'План обслуживания' },
  { path: '/maintenance-history', label: 'История ТО', icon: FaClipboardList, description: 'Архив работ' },
  { path: '/notifications', label: 'Уведомления', icon: FaBell, description: 'Напоминания и статус' },
  { path: '/educational-content', label: 'Знания', icon: FaBookOpen, description: 'Гайды и квизы' },
  { path: '/chat', label: 'Чат', icon: FaComments, description: 'Коммуникации' },
]

const serviceCenterNavItems: NavItem[] = [
  { path: '/', label: 'Обзор', icon: FaChartBar, description: 'KPI и расписание' },
  { path: '/service-center/bookings', label: 'Записи', icon: FaClipboardList, description: 'Поток клиентов' },
  { path: '/service-center/clients', label: 'Клиенты', icon: FaUsers, description: 'База и статусы' },
  { path: '/service-center/operations', label: 'Операции', icon: FaTools, description: 'Работы и фото' },
  { path: '/service-center/invoices', label: 'Счета', icon: FaFileInvoiceDollar, description: 'Выставление счетов' },
  { path: '/service-center/reviews', label: 'Отзывы', icon: FaStar, description: 'Рейтинг сервиса' },
  { path: '/service-center/settings', label: 'Настройки', icon: FaCog, description: 'Профиль сервиса' },
]

const aliasTitles = [
  { test: (pathname: string) => pathname.startsWith('/cars/'), title: 'Карточка автомобиля', group: 'Автопарк' },
  { test: (pathname: string) => pathname.startsWith('/service-centers/'), title: 'Карточка сервиса', group: 'Сервисы' },
  { test: (pathname: string) => pathname.startsWith('/quizzes/'), title: 'Квиз', group: 'Знания' },
]

const roleLabels: Record<string, string> = {
  USER: 'Кабинет владельца',
  SERVICE_CENTER: 'Сервисный центр',
  ADMIN: 'Администратор',
  SUPPORT: 'Поддержка',
}

function isPathActive(pathname: string, itemPath: string) {
  if (itemPath === '/') {
    return pathname === '/'
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

function getFallbackSection(pathname: string) {
  for (const alias of aliasTitles) {
    if (alias.test(pathname)) {
      return alias
    }
  }

  return {
    title: 'Workspace',
    group: 'Кабинет',
  }
}

function NavigationList({
  items,
  pathname,
  onNavigate,
  getBadgeContent,
}: {
  items: NavItem[]
  pathname: string
  onNavigate?: () => void
  getBadgeContent?: (item: NavItem) => string | null
}) {
  return (
    <nav className="space-y-2">
      {items.map((item) => {
        const IconComponent = item.icon
        const isActive = isPathActive(pathname, item.path)
        const badgeContent = getBadgeContent?.(item)

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`app-nav-link ${isActive ? 'app-nav-link-active' : ''}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/5 bg-white/5 text-base text-white/90">
              <IconComponent />
            </div>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{item.label}</p>
                <p className="truncate text-xs text-slate-400">{item.description}</p>
              </div>
              {badgeContent && (
                <span className="inline-flex min-w-[1.6rem] items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold leading-none text-white shadow-[0_10px_20px_-12px_rgba(239,68,68,0.95)]">
                  {badgeContent}
                </span>
              )}
            </div>
          </Link>
        )
      })}
    </nav>
  )
}

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileEditorOpen, setProfileEditorOpen] = useState(false)

  const avatarSrc = resolveFileUrl(user?.avatarUrl)
  const isServiceCenter = user?.role === 'SERVICE_CENTER'
  const isAdmin = user?.role === 'ADMIN'
  const navItems = isServiceCenter ? serviceCenterNavItems : userNavItems
  const shouldShowNotificationsBadge = Boolean(user && navItems.some((item) => item.path === '/notifications'))

  const { data: unreadNotificationsCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications/unread-count')
      return response.data
    },
    enabled: shouldShowNotificationsBadge,
  })

  useEffect(() => {
    setAvatarLoadFailed(false)
  }, [avatarSrc])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen || profileEditorOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen, profileEditorOpen])

  const currentSection = useMemo(() => {
    const activeItem = navItems.find((item) => isPathActive(location.pathname, item.path))
    if (activeItem) {
      return {
        title: activeItem.label,
        group: isServiceCenter ? 'Сервис' : 'Кабинет',
      }
    }

    if (isAdmin && location.pathname === '/admin') {
      return {
        title: 'Администрирование',
        group: 'Контроль',
      }
    }

    return getFallbackSection(location.pathname)
  }, [isAdmin, isServiceCenter, location.pathname, navItems])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.trim() || 'AS'
  const roleLabel = user?.role ? roleLabels[user.role] || 'Пользователь' : 'Пользователь'
  const notificationsBadgeContent =
    unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount > 0 ? String(unreadNotificationsCount) : null

  return (
    <div className="app-shell">
      <aside className="app-sidebar hidden lg:block">
        <div className="app-sidebar-panel">
          <Link to="/" className="app-brand">
            <div className="app-brand-mark">
              <FaCarSide className="text-xl" />
            </div>
            <div>
              <div className="app-brand-title">AutoService</div>
              <div className="app-brand-subtitle">Operations workspace</div>
            </div>
          </Link>

          <div className="app-sidebar-body space-y-6">
            <div className="space-y-3">
              <div className="app-sidebar-label">Navigation</div>
              <NavigationList
                items={navItems}
                pathname={location.pathname}
                getBadgeContent={(item) => (item.path === '/notifications' ? notificationsBadgeContent : null)}
              />
            </div>

            {isAdmin && (
              <div className="space-y-3">
                <div className="app-sidebar-label">Control</div>
                <NavigationList
                  items={[
                    {
                      path: '/admin',
                      label: 'Админ-панель',
                      icon: FaShieldAlt,
                      description: 'Модерация и контроль',
                    },
                  ]}
                  pathname={location.pathname}
                />
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-inner">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 lg:hidden"
                aria-label="Открыть меню"
              >
                <FaBars />
              </button>

              <div className="min-w-0">
                <p className="app-topbar-eyebrow">{currentSection.group}</p>
                <p className="app-topbar-title truncate">{currentSection.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setProfileEditorOpen(true)}
                className="group flex min-w-0 items-center gap-3 rounded-[1.45rem] border border-white/10 bg-white/5 px-3 py-2 text-left transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08]"
              >
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 rounded-[1.35rem] bg-gradient-to-br from-[#ff6b4a]/40 via-transparent to-sky-400/20 opacity-90 blur-sm transition-opacity duration-200 group-hover:opacity-100" />
                  <div className="app-avatar relative h-11 w-11 rounded-[1.1rem] text-sm ring-1 ring-white/10">
                    {avatarSrc && !avatarLoadFailed ? (
                      <img
                        src={avatarSrc}
                        alt={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Avatar'}
                        className="h-full w-full object-cover"
                        onError={() => setAvatarLoadFailed(true)}
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#08111d] bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.16)]" />
                </div>

                <div className="hidden min-w-0 sm:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Профиль</p>
                  <p className="truncate text-sm font-semibold text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="truncate text-xs text-slate-400">{roleLabel}</p>
                  <p className="hidden text-[11px] text-[#ff9b82] xl:block">Нажмите, чтобы изменить данные</p>
                </div>
                <div className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400 transition-all duration-200 group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-white md:flex">
                  <FaChevronRight className="text-xs" />
                </div>
              </button>

              <button type="button" onClick={handleLogout} className="auto-button-secondary px-4 py-2.5 text-sm">
                Выйти
              </button>
            </div>
          </div>
        </header>

        <main className="app-content">
          <div className="app-content-inner">
            <Outlet />
          </div>
        </main>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Закрыть меню"
          />

          <div className="relative h-full w-[88vw] max-w-sm border-r border-white/10 bg-[#08111d] p-4 shadow-[0_24px_60px_-24px_rgba(2,6,23,0.95)]">
            <div className="flex items-center justify-between pb-4">
              <Link to="/" className="app-brand">
                <div className="app-brand-mark">
                  <FaCarSide className="text-xl" />
                </div>
                <div>
                  <div className="app-brand-title">AutoService</div>
                  <div className="app-brand-subtitle">Operations workspace</div>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white"
                aria-label="Закрыть меню"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto pb-6">
              <div className="space-y-3">
                <div className="app-sidebar-label">Navigation</div>
                <NavigationList
                  items={navItems}
                  pathname={location.pathname}
                  onNavigate={() => setMobileMenuOpen(false)}
                  getBadgeContent={(item) => (item.path === '/notifications' ? notificationsBadgeContent : null)}
                />
              </div>

              {isAdmin && (
                <div className="space-y-3">
                  <div className="app-sidebar-label">Control</div>
                  <NavigationList
                    items={[
                      {
                        path: '/admin',
                        label: 'Админ-панель',
                        icon: FaShieldAlt,
                        description: 'Модерация и контроль',
                      },
                    ]}
                    pathname={location.pathname}
                    onNavigate={() => setMobileMenuOpen(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ProfileEditorModal open={profileEditorOpen} onClose={() => setProfileEditorOpen(false)} />
    </div>
  )
}
