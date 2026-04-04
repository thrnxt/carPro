import { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { 
  FaHome, 
  FaCar, 
  FaWrench, 
  FaCalendar, 
  FaCalendarAlt, 
  FaClipboardList, 
  FaBell, 
  FaComments,
  FaShieldAlt,
  FaChartBar,
  FaUsers,
  FaStar,
  FaCog,
  FaCarSide,
  FaFileInvoiceDollar,
  FaTools
} from 'react-icons/fa'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)

  const avatarSrc = user?.avatarUrl
    ? user.avatarUrl.startsWith('http://') || user.avatarUrl.startsWith('https://')
      ? user.avatarUrl
      : user.avatarUrl.startsWith('/')
        ? `/api${user.avatarUrl}`
        : `/api/${user.avatarUrl}`
    : null

  useEffect(() => {
    setAvatarLoadFailed(false)
  }, [avatarSrc])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isServiceCenter = user?.role === 'SERVICE_CENTER'
  const isAdmin = user?.role === 'ADMIN'

  // Навигация для обычных пользователей
  const userNavItems = [
    { path: '/', label: 'Главная', icon: FaHome },
    { path: '/garage', label: 'Мой гараж', icon: FaCar },
    { path: '/service-centers', label: 'Сервисы', icon: FaWrench },
    { path: '/bookings', label: 'Мои записи', icon: FaCalendar },
    { path: '/my-documents', label: 'Счета и операции', icon: FaFileInvoiceDollar },
    { path: '/maintenance-calendar', label: 'Календарь', icon: FaCalendarAlt },
    { path: '/maintenance-history', label: 'История ТО', icon: FaClipboardList },
    { path: '/notifications', label: 'Уведомления', icon: FaBell },
    { path: '/chat', label: 'Чат', icon: FaComments },
  ]

  // Навигация для сервисных центров
  const serviceCenterNavItems = [
    { path: '/', label: 'Панель управления', icon: FaChartBar },
    { path: '/service-center/bookings', label: 'Записи клиентов', icon: FaClipboardList },
    { path: '/service-center/clients', label: 'Клиенты', icon: FaUsers },
    { path: '/service-center/operations', label: 'Операции', icon: FaTools },
    { path: '/service-center/invoices', label: 'Счета', icon: FaFileInvoiceDollar },
    { path: '/service-center/reviews', label: 'Отзывы', icon: FaStar },
    { path: '/service-center/settings', label: 'Настройки', icon: FaCog },
  ]

  const navItems = isServiceCenter ? serviceCenterNavItems : userNavItems

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
      <nav className="auto-nav sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Логотип и навигация */}
            <div className="flex items-center flex-1 min-w-0">
              <Link to="/" className="flex items-center space-x-2 group flex-shrink-0 mr-4 lg:mr-8">
                <FaCarSide className="text-2xl text-red-500 group-hover:text-red-400 transition-colors" />
                <span className="text-xl font-bold text-white group-hover:text-red-400 transition-colors whitespace-nowrap">
                  AutoService
                </span>
              </Link>
              {/* Навигационные ссылки с горизонтальным скроллом */}
              <div className="hidden lg:flex items-center space-x-1 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                <div className="flex items-center space-x-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path || 
                      (item.path !== '/' && location.pathname.startsWith(item.path))
                    const IconComponent = item.icon
                    return (
                      <Link style={{display:"flex", alignItems:"center"}}
                        key={item.path}
                        to={item.path}
                        className={`auto-nav-link whitespace-nowrap ${isActive ? 'active' : ''}`}
                      >
                        <IconComponent className="mr-1.5 text-base" />
                        <span className="hidden xl:inline">{item.label}</span>
                        <span className="xl:hidden">{item.label.split(' ')[0]}</span>
                      </Link>
                    )
                  })}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={`auto-nav-link whitespace-nowrap ${location.pathname === '/admin' ? 'active' : ''}`}
                    >
                      <FaShieldAlt className="mr-1.5 text-base" />
                      <span className="hidden xl:inline">Админ-панель</span>
                      <span className="xl:hidden">Админ</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
            
            {/* Пользователь и выход */}
            <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-white leading-tight">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-400 leading-tight">
                    {isServiceCenter ? 'Сервисный центр' : isAdmin ? 'Администратор' : 'Владелец'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                  {avatarSrc && !avatarLoadFailed ? (
                    <img
                      src={avatarSrc}
                      alt={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Avatar'}
                      className="h-full w-full object-cover"
                      onError={() => setAvatarLoadFailed(true)}
                    />
                  ) : (
                    <span>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all whitespace-nowrap"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
