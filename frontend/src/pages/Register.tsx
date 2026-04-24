import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaArrowRight, FaCarSide, FaCheckCircle, FaFileInvoiceDollar, FaUsers } from 'react-icons/fa'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  })
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      const response = await apiClient.post('/auth/register', formData)
      const { token, userId, ...user } = response.data
      setAuth(token, { ...user, id: userId })
      toast.success('Регистрация успешна')
      navigate('/')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка регистрации')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        <section className="auto-card flex items-center p-6 sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-2xl">
            <div className="page-eyebrow mb-4">Create profile</div>
            <h1 className="text-3xl font-extrabold tracking-[-0.06em] text-white lg:text-4xl">
              Регистрация в рабочем кабинете
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Создайте аккаунт, чтобы управлять автомобилями, обслуживанием, документами и сервисными операциями в одном продукте.
            </p>

            <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  className="auto-input"
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Имя</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(event) => setFormData({ ...formData, firstName: event.target.value })}
                  className="auto-input"
                  placeholder="Иван"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Фамилия</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(event) => setFormData({ ...formData, lastName: event.target.value })}
                  className="auto-input"
                  placeholder="Иванов"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Телефон</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(event) => setFormData({ ...formData, phoneNumber: event.target.value })}
                  className="auto-input"
                  placeholder="+7 700 000 00 00"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Пароль</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                  className="auto-input"
                  placeholder="Минимум 8 символов"
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-4 pt-2">
                <button type="submit" className="auto-button-primary w-full justify-center sm:w-auto">
                  Создать аккаунт
                  <FaArrowRight className="text-sm" />
                </button>

                <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
                  После регистрации вы попадете в основной workspace. Роль и функциональность подхватятся из вашей учетной записи.
                </div>

                <div className="text-sm text-slate-400">
                  Уже есть аккаунт?{' '}
                  <Link to="/login" className="font-semibold text-[#ff9b82] transition-colors hover:text-[#ffb29f]">
                    Войти
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </section>

        <section className="auto-card hidden p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-white/10 text-3xl text-white shadow-[0_24px_42px_-26px_rgba(255,107,74,0.55)]">
                <FaCarSide />
              </div>
              <div>
                <h2 className="text-4xl font-extrabold tracking-[-0.06em] text-white">AutoService</h2>
                <p className="mt-1 text-base text-slate-400">Workspace для транспорта и сервиса.</p>
              </div>
            </div>

            <div className="mt-10 grid gap-4">
              <div className="glass-panel p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#ff9b82]">
                    <FaUsers />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Одна среда для ролей</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Владельцы автомобилей, сервисные центры и администраторы работают в одном продукте без разрыва сценариев.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sky-300">
                    <FaFileInvoiceDollar />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Операции и документы</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Счета, операции, история обслуживания, фото и отзывы остаются в одном контуре и не теряются между системами.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              'Сценарии для владельца и сервиса в одном интерфейсе',
              'Профессиональная подача без учебной верстки',
              'Структура под реальные SaaS и cabinet workflows',
            ].map((item) => (
              <div key={item} className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <FaCheckCircle className="mt-1 text-[#ff9b82]" />
                  <p className="text-sm leading-6 text-slate-300">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
