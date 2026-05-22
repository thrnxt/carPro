import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { FaArrowRight, FaCarSide, FaCheckCircle, FaClipboardList, FaShieldAlt } from 'react-icons/fa'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import { BRAND_NAME, BRAND_SUBTITLE, BRAND_TAGLINE } from '../config/branding'
import { Button, Input } from '../components/ui'

type LoginFields = {
  email: string
  password: string
}

const FEATURES = [
  {
    Icon: FaClipboardList,
    title: 'Операционный центр',
    description:
      'Гараж, записи, сервисные операции, счета и документы — в едином цифровом паспорте автомобиля.',
  },
  {
    Icon: FaShieldAlt,
    title: 'Контроль и прозрачность',
    description:
      'История обслуживания, фотофиксация, статусы клиентов и электронные документы без ручного хаоса.',
  },
]

const PROOF_POINTS = [
  'Единый кабинет для владельцев и сервисных центров',
  'Плотные рабочие экраны без лишних элементов',
  'Структура под реальные SaaS-сценарии владения авто',
]

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginFields) => {
    try {
      const response = await apiClient.post('/auth/login', data)
      const { token, userId, ...user } = response.data
      setAuth(token, { ...user, id: userId })
      toast.success('Вход выполнен')
      navigate('/')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Неверный email или пароль')
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">

        {/* ── Hero panel ── */}
        <section className="auto-card hidden p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="page-eyebrow mb-6">{BRAND_SUBTITLE}</div>

            <div className="flex items-center gap-4">
              <div className="app-brand-mark h-14 w-14 shrink-0 text-2xl">
                <FaCarSide />
              </div>
              <div>
                <h1 className="text-h1 text-text-primary">{BRAND_NAME}</h1>
                <p className="mt-1 text-body text-text-secondary">{BRAND_TAGLINE}</p>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              {FEATURES.map(({ Icon, title, description }) => (
                <div key={title} className="glass-panel p-5">
                  <div className="flex items-start gap-4">
                    <div className="app-brand-mark h-11 w-11 shrink-0 text-base">
                      <Icon />
                    </div>
                    <div>
                      <h2 className="text-h3 text-text-primary">{title}</h2>
                      <p className="mt-1.5 text-body leading-relaxed text-text-secondary">{description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            {PROOF_POINTS.map((point) => (
              <div key={point} className="glass-panel p-4">
                <div className="flex items-start gap-3">
                  <FaCheckCircle className="mt-0.5 shrink-0 text-sm text-success" />
                  <p className="text-body text-text-secondary">{point}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Form panel ── */}
        <section className="auto-card flex items-center p-6 sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-6 lg:hidden">
              <div className="page-eyebrow mb-3">{BRAND_NAME}</div>
            </div>

            <h1 className="text-h1 text-text-primary">Вход в систему</h1>
            <p className="mt-2 text-body text-text-secondary">
              Гараж, операции и документы откроются после входа в ваш кабинет.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Input
                label="Email"
                type="email"
                placeholder="name@company.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email', {
                  required: 'Введите email',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Некорректный формат email',
                  },
                })}
              />

              <Input
                label="Пароль"
                type="password"
                placeholder="Введите пароль"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Введите пароль',
                })}
              />

              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                className="w-full justify-center"
              >
                Войти
                {!isSubmitting ? <FaArrowRight className="text-sm" /> : null}
              </Button>

              <p className="text-center text-body text-text-secondary">
                Нет аккаунта?{' '}
                <Link
                  to="/register"
                  className="font-medium text-text-primary underline-offset-4 hover:underline"
                >
                  Создать профиль
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
