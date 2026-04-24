import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaArrowRight, FaCarSide, FaCheckCircle, FaClipboardList, FaShieldAlt } from 'react-icons/fa'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      const response = await apiClient.post('/auth/login', { email, password })
      const { token, userId, ...user } = response.data
      setAuth(token, { ...user, id: userId })
      toast.success('Вход выполнен успешно')
      navigate('/')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка входа')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="auto-card hidden p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="page-eyebrow mb-5">Fleet workspace</div>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-white/10 text-3xl text-white shadow-[0_24px_42px_-26px_rgba(255,107,74,0.55)]">
                <FaCarSide />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold tracking-[-0.06em] text-white">AutoService</h1>
                <p className="mt-1 text-base text-slate-400">
                  Кабинет для владельцев авто, сервисов и операционных команд.
                </p>
              </div>
            </div>

            <div className="mt-10 space-y-5">
              <div className="glass-panel p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#ff9b82]">
                    <FaClipboardList />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Операционный cockpit</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Гараж, записи, сервисные операции, счета и документы в одном рабочем пространстве.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sky-300">
                    <FaShieldAlt />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Контроль и прозрачность</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      История обслуживания, фотофиксация, статусы клиентов и электронные документы без ручного хаоса.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {[
              'Единый кабинет для владельцев и сервисов',
              'Плотные рабочие экраны без учебной стилистики',
              'Подготовлено под SaaS/fintech логику операций',
            ].map((item) => (
              <div key={item} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <FaCheckCircle className="mt-1 text-[#ff9b82]" />
                  <p className="text-sm leading-6 text-slate-300">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="auto-card flex items-center p-6 sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="lg:hidden">
              <div className="page-eyebrow mb-4">AutoService</div>
              <h1 className="text-3xl font-extrabold tracking-[-0.06em] text-white">Вход в workspace</h1>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Управляйте автомобилями, обслуживанием, клиентскими визитами и документами из одного кабинета.
              </p>
            </div>

            <div className="hidden lg:block">
              <h2 className="text-4xl font-extrabold tracking-[-0.06em] text-white">Вход в workspace</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Возвращаем вас в рабочий контур: гараж, операции, сервисные записи и документы.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="auto-input"
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                  Пароль
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="auto-input"
                  placeholder="Введите пароль"
                />
              </div>

              <button type="submit" className="auto-button-primary w-full justify-center">
                Войти
                <FaArrowRight className="text-sm" />
              </button>

              <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
                Вход открывает доступ к единому кабинету владельца, сервисного центра или администратора в зависимости от роли.
              </div>

              <div className="text-center text-sm text-slate-400">
                Нет аккаунта?{' '}
                <Link to="/register" className="font-semibold text-[#ff9b82] transition-colors hover:text-[#ffb29f]">
                  Создать профиль
                </Link>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
