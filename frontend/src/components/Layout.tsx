import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  FaBars,
  FaBell,
  FaBookOpen,
  FaCalendar,
  FaCar,
  FaCarSide,
  FaChartBar,
  FaChevronDown,
  FaChevronRight,
  FaClipboardList,
  FaCog,
  FaComments,
  FaFileInvoiceDollar,
  FaHome,
  FaSignOutAlt,
  FaShieldAlt,
  FaStar,
  FaTimes,
  FaTools,
  FaUserCog,
  FaUsers,
  FaWrench,
} from 'react-icons/fa'
import apiClient from '../api/client'
import ProfileEditorModal from './ProfileEditorModal'
import { useAuthStore } from '../store/authStore'
import { resolveFileUrl } from '../utils/resolveFileUrl'
import { BRAND_NAME, BRAND_SUBTITLE } from '../config/branding'

type NavigationItem = {
  path: string
  label: string
  icon: typeof FaHome
  description: string
  group?: string
  isActive?: (pathname: string) => boolean
}

type NavigationSection = {
  label: string
  items: NavigationItem[]
}

function isRouteActive(pathname: string, itemPath: string) {
  if (itemPath === '/') {
    return pathname === '/'
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

function isPathActive(pathname: string, item: NavigationItem) {
  if (item.isActive) {
    return item.isActive(pathname)
  }

  return isRouteActive(pathname, item.path)
}

const isGarageProductActive = (pathname: string) =>
  pathname === '/garage' ||
  pathname.startsWith('/cars/') ||
  pathname === '/my-documents' ||
  pathname.startsWith('/my-documents/') ||
  pathname === '/maintenance-history' ||
  pathname.startsWith('/maintenance-history/')

const isGarageOverviewActive = (pathname: string) =>
  pathname === '/garage' || (pathname.startsWith('/cars/') && !pathname.includes('/history'))

const isMaintenanceHistoryActive = (pathname: string) =>
  pathname === '/maintenance-history' ||
  pathname.startsWith('/maintenance-history/') ||
  (pathname.startsWith('/cars/') && pathname.includes('/history'))

const isServiceProductActive = (pathname: string) =>
  pathname === '/service-centers' ||
  pathname.startsWith('/service-centers/') ||
  pathname === '/bookings' ||
  pathname.startsWith('/bookings/') ||
  pathname === '/maintenance-calendar'

const userPrimaryNavItems: NavigationItem[] = [
  { path: '/', label: 'Главная', icon: FaHome, description: 'Обзор аккаунта', group: 'Кабинет' },
  { path: '/chat', label: 'Чат', icon: FaComments, description: 'Коммуникации', group: 'Кабинет' },
]

const userBottomNavItems: NavigationItem[] = [
  userPrimaryNavItems[0],
  {
    path: '/garage',
    label: 'Гараж',
    icon: FaCar,
    description: 'Автомобили, документы и история ТО',
    group: 'Гараж',
    isActive: isGarageProductActive,
  },
  {
    path: '/service-centers',
    label: 'Сервис',
    icon: FaWrench,
    description: 'Подбор сервиса и записи',
    group: 'Обслуживание',
    isActive: isServiceProductActive,
  },
  userPrimaryNavItems[1],
]

const userGarageNavItems: NavigationItem[] = [
  {
    path: '/garage',
    label: 'Автомобили',
    icon: FaCar,
    description: 'Автомобили и VIN',
    group: 'Гараж',
    isActive: isGarageOverviewActive,
  },
  {
    path: '/my-documents',
    label: 'Документы',
    icon: FaFileInvoiceDollar,
    description: 'Операции и счета',
    group: 'Гараж',
  },
  {
    path: '/maintenance-history',
    label: 'История ТО',
    icon: FaClipboardList,
    description: 'Архив выполненных работ',
    group: 'Гараж',
    isActive: isMaintenanceHistoryActive,
  },
]

const userServiceNavItems: NavigationItem[] = [
  {
    path: '/service-centers',
    label: 'Найти сервис',
    icon: FaWrench,
    description: 'Подбор сервисного центра',
    group: 'Обслуживание',
  },
  {
    path: '/bookings',
    label: 'Записи',
    icon: FaCalendar,
    description: 'Записи, история и календарь',
    group: 'Обслуживание',
  },
]

const userSidebarSections: NavigationSection[] = [
  { label: 'Навигация', items: userPrimaryNavItems },
  { label: 'Гараж', items: userGarageNavItems },
  { label: 'Обслуживание', items: userServiceNavItems },
]

const userTopNavItems: NavigationItem[] = [
  { path: '/educational-content', label: 'Знания', icon: FaBookOpen, description: 'Гайды и квизы', group: 'Кабинет' },
  { path: '/notifications', label: 'Уведомления', icon: FaBell, description: 'Напоминания и статус', group: 'Кабинет' },
]

const serviceCenterNavItems: NavigationItem[] = [
  { path: '/', label: 'Обзор', icon: FaChartBar, description: 'KPI и расписание', group: 'Сервис' },
  { path: '/service-center/bookings', label: 'Записи', icon: FaClipboardList, description: 'Поток клиентов', group: 'Сервис' },
  { path: '/service-center/clients', label: 'Клиенты', icon: FaUsers, description: 'База и статусы', group: 'Сервис' },
  { path: '/service-center/operations', label: 'Операции', icon: FaTools, description: 'Работы и фото', group: 'Сервис' },
  { path: '/service-center/invoices', label: 'Счета', icon: FaFileInvoiceDollar, description: 'Выставление счетов', group: 'Сервис' },
  { path: '/service-center/reviews', label: 'Отзывы', icon: FaStar, description: 'Рейтинг сервиса', group: 'Сервис' },
  { path: '/service-center/settings', label: 'Настройки', icon: FaCog, description: 'Профиль сервиса', group: 'Сервис' },
]

const serviceCenterSidebarSections: NavigationSection[] = [
  { label: 'Навигация', items: serviceCenterNavItems },
]

const serviceCenterBottomNavItems = serviceCenterNavItems.slice(0, 4)

const userSectionItems = [
  ...userGarageNavItems,
  ...userServiceNavItems,
  ...userTopNavItems,
  ...userPrimaryNavItems,
]

const aliasTitles = [
  { test: (pathname: string) => pathname.startsWith('/cars/'), title: 'Карточка автомобиля', group: 'Гараж' },
  { test: (pathname: string) => pathname.startsWith('/service-centers/'), title: 'Карточка сервиса', group: 'Обслуживание' },
  { test: (pathname: string) => pathname.startsWith('/quizzes/'), title: 'Квиз', group: 'Знания' },
]

const roleLabels: Record<string, string> = {
  USER: 'Кабинет владельца',
  SERVICE_CENTER: 'Сервисный центр',
  ADMIN: 'Администратор',
  SUPPORT: 'Поддержка',
}

type ServiceCenterProfileChrome = {
  name: string
  logoUrl?: string | null
}

function getFallbackSection(pathname: string) {
  for (const alias of aliasTitles) {
    if (alias.test(pathname)) {
      return alias
    }
  }

  return {
    title: 'Кабинет',
    group: 'Кабинет',
  }
}

function NavigationList({
  items,
  pathname,
  onNavigate,
  getBadgeContent,
}: {
  items: NavigationItem[]
  pathname: string
  onNavigate?: () => void
  getBadgeContent?: (item: NavigationItem) => string | null
}) {
  return (
    <nav className="space-y-2">
      {items.map((item) => {
        const isActive = isPathActive(pathname, item)
        const badgeContent = getBadgeContent?.(item)

        return (
          <NavItem
            key={item.path}
            item={item}
            active={isActive}
            badgeContent={badgeContent}
            onNavigate={onNavigate}
          />
        )
      })}
    </nav>
  )
}

function NavigationSections({
  sections,
  pathname,
  onNavigate,
  getBadgeContent,
}: {
  sections: NavigationSection[]
  pathname: string
  onNavigate?: () => void
  getBadgeContent?: (item: NavigationItem) => string | null
}) {
  return (
    <>
      {sections.map((section) => (
        <div key={section.label} className="space-y-3">
          <div className="app-sidebar-label">{section.label}</div>
          <NavigationList
            items={section.items}
            pathname={pathname}
            onNavigate={onNavigate}
            getBadgeContent={getBadgeContent}
          />
        </div>
      ))}
    </>
  )
}

export function NavItem({
  item,
  active,
  badgeContent,
  onNavigate,
}: {
  item: NavigationItem
  active: boolean
  badgeContent?: string | null
  onNavigate?: () => void
}) {
  const IconComponent = item.icon

  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      className={`app-nav-link ${active ? 'app-nav-link-active' : ''}`}
      aria-current={active ? 'page' : undefined}
      title={item.description}
    >
      <span className="app-nav-icon" aria-hidden="true">
        <IconComponent />
      </span>
      <span className="app-nav-label">{item.label}</span>
      {badgeContent ? (
        <span className="app-nav-badge" aria-label={`${badgeContent} непрочитанных уведомлений`}>
          {badgeContent}
        </span>
      ) : null}
    </Link>
  )
}

function BottomNavigation({
  items,
  pathname,
  getBadgeContent,
}: {
  items: NavigationItem[]
  pathname: string
  getBadgeContent?: (item: NavigationItem) => string | null
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <nav className="app-bottom-nav lg:hidden" aria-label="Основная навигация">
      <div
        className="app-bottom-nav-inner"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const IconComponent = item.icon
          const active = isPathActive(pathname, item)
          const badgeContent = getBadgeContent?.(item)

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`app-bottom-nav-link ${active ? 'app-bottom-nav-link-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              title={item.description}
            >
              <span className="app-bottom-nav-icon" aria-hidden="true">
                <IconComponent />
              </span>
              <span className="app-bottom-nav-label">{item.label}</span>
              {badgeContent ? (
                <span className="app-bottom-nav-badge" aria-label={`${badgeContent} непрочитанных уведомлений`}>
                  {badgeContent}
                </span>
              ) : null}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function TopNavButton({
  item,
  active,
  badgeContent,
}: {
  item: NavigationItem
  active: boolean
  badgeContent?: string | null
}) {
  const IconComponent = item.icon

  return (
    <Link
      to={item.path}
      className={`btn-secondary relative h-11 w-11 p-0 ${active ? 'border-accent/40 bg-surface-3 text-accent' : ''}`}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      title={item.description}
    >
      <IconComponent className="text-sm" />
      {badgeContent ? (
        <span
          className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white"
          aria-label={`${badgeContent} непрочитанных уведомлений`}
        >
          {badgeContent}
        </span>
      ) : null}
    </Link>
  )
}

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileEditorOpen, setProfileEditorOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const isServiceCenter = user?.role === 'SERVICE_CENTER'
  const isAdmin = user?.role === 'ADMIN'
  const navigationSections = isServiceCenter ? serviceCenterSidebarSections : userSidebarSections
  const bottomNavItems = isServiceCenter ? serviceCenterBottomNavItems : userBottomNavItems
  const topNavItems = isServiceCenter ? [] : userTopNavItems
  const shouldShowNotificationsBadge = Boolean(user && topNavItems.some((item) => item.path === '/notifications'))
  const { data: serviceCenterProfile } = useQuery<ServiceCenterProfileChrome>({
    queryKey: ['service-center', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/service-centers/my')
      return response.data
    },
    enabled: isServiceCenter,
    refetchOnWindowFocus: false,
  })

  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
  const profileTitle = isServiceCenter ? serviceCenterProfile?.name || fullName || 'Сервисный центр' : fullName || user?.email || 'Пользователь'
  const initials = profileTitle
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'SP'
  const avatarSrc = resolveFileUrl(isServiceCenter ? serviceCenterProfile?.logoUrl || user?.avatarUrl : user?.avatarUrl)

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
    setUserMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!userMenuOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [userMenuOpen])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen || profileEditorOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen, profileEditorOpen])

  const currentSection = useMemo(() => {
    const items = isServiceCenter
      ? serviceCenterNavItems
      : userSectionItems
    const activeItem = items.find((item) => isPathActive(location.pathname, item))
    if (activeItem) {
      return {
        title: activeItem.label,
        group: activeItem.group || (isServiceCenter ? 'Сервис' : 'Кабинет'),
      }
    }

    if (isAdmin && location.pathname === '/admin') {
      return {
        title: 'Администрирование',
        group: 'Контроль',
      }
    }

    return getFallbackSection(location.pathname)
  }, [isAdmin, isServiceCenter, location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

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
              <div className="app-brand-title">{BRAND_NAME}</div>
              <div className="app-brand-subtitle">{BRAND_SUBTITLE}</div>
            </div>
          </Link>

          <div className="app-sidebar-body space-y-6">
            <NavigationSections
              sections={navigationSections}
              pathname={location.pathname}
              getBadgeContent={(item) => (item.path === '/notifications' ? notificationsBadgeContent : null)}
            />

            {isAdmin && (
              <div className="space-y-3">
                <div className="app-sidebar-label">Управление</div>
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
                className="btn-secondary h-11 w-11 p-0 lg:hidden"
                aria-label="Открыть меню"
              >
                <FaBars />
              </button>

              <nav aria-label="Хлебные крошки" className="min-w-0">
                <ol className="flex items-center gap-2 text-sm">
                  <li className="hidden shrink-0 text-text-muted sm:block">{currentSection.group}</li>
                  <li className="hidden shrink-0 text-text-muted sm:block" aria-hidden="true">
                    <FaChevronRight className="text-[10px]" />
                  </li>
                  <li className="min-w-0 truncate font-medium text-text-primary" aria-current="page">
                    {currentSection.title}
                  </li>
                </ol>
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {topNavItems.length > 0 ? (
                <nav className="flex items-center gap-1" aria-label="Быстрый доступ">
                  {topNavItems.map((item) => (
                    <TopNavButton
                      key={item.path}
                      item={item}
                      active={isPathActive(location.pathname, item)}
                      badgeContent={item.path === '/notifications' ? notificationsBadgeContent : null}
                    />
                  ))}
                </nav>
              ) : null}

              {topNavItems.length > 0 ? (
                <span className="hidden h-8 w-px bg-border sm:block" aria-hidden="true" />
              ) : null}

              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((value) => !value)}
                  className="flex max-w-[12rem] min-w-0 items-center gap-2.5 rounded-lg border border-border bg-surface-2 py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-surface-3 sm:max-w-[16rem]"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  aria-label="Меню профиля"
                >
                  <div className="relative shrink-0">
                    <div className="app-avatar h-9 w-9 text-sm">
                      {avatarSrc && !avatarLoadFailed ? (
                        <img
                          src={avatarSrc}
                          alt={profileTitle}
                          className="h-full w-full object-cover"
                          onError={() => setAvatarLoadFailed(true)}
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-2 bg-success" />
                  </div>

                  <div className="hidden min-w-0 text-left sm:block">
                    <p className="truncate text-sm font-medium leading-tight text-text-primary">{profileTitle}</p>
                    <p className="truncate text-caption leading-tight text-text-muted">{roleLabel}</p>
                  </div>

                  <FaChevronDown
                    className={`hidden shrink-0 text-xs text-text-muted transition-transform duration-200 sm:block ${userMenuOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {userMenuOpen ? (
                  <div
                    role="menu"
                    aria-label="Меню профиля"
                    className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 origin-top-right overflow-hidden rounded-lg border border-border bg-surface-2 shadow-xl"
                  >
                    <div className="flex items-center gap-3 border-b border-border bg-surface-3 p-4">
                      <div className="app-avatar h-10 w-10 shrink-0 text-sm">
                        {avatarSrc && !avatarLoadFailed ? (
                          <img src={avatarSrc} alt={profileTitle} className="h-full w-full object-cover" />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">{profileTitle}</p>
                        <p className="truncate text-caption text-text-muted">{user?.email}</p>
                      </div>
                    </div>

                    <div className="p-1.5">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false)
                          setProfileEditorOpen(true)
                        }}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
                      >
                        <FaUserCog className="shrink-0 text-text-muted" />
                        Редактировать профиль
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false)
                          handleLogout()
                        }}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10"
                      >
                        <FaSignOutAlt className="shrink-0" />
                        Выйти
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
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
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Навигация">
          <button
            type="button"
            className="absolute inset-0 bg-surface-1/80"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Закрыть меню"
          />

          <div className="relative h-full w-[88vw] max-w-sm border-r border-border bg-surface-2 p-4">
            <div className="flex items-center justify-between pb-4">
              <Link to="/" className="app-brand">
                <div className="app-brand-mark">
                  <FaCarSide className="text-xl" />
                </div>
                <div>
                  <div className="app-brand-title">{BRAND_NAME}</div>
                  <div className="app-brand-subtitle">{BRAND_SUBTITLE}</div>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-secondary h-10 w-10 p-0"
                aria-label="Закрыть меню"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto pb-6">
              <NavigationSections
                sections={navigationSections}
                pathname={location.pathname}
                onNavigate={() => setMobileMenuOpen(false)}
                getBadgeContent={(item) => (item.path === '/notifications' ? notificationsBadgeContent : null)}
              />

              {isAdmin && (
                <div className="space-y-3">
                  <div className="app-sidebar-label">Управление</div>
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

      <BottomNavigation
        items={bottomNavItems}
        pathname={location.pathname}
        getBadgeContent={(item) => (item.path === '/notifications' ? notificationsBadgeContent : null)}
      />

      <ProfileEditorModal open={profileEditorOpen} onClose={() => setProfileEditorOpen(false)} />
    </div>
  )
}
