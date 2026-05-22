import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { FaArrowRight, FaCarSide, FaCheckCircle, FaFileInvoiceDollar, FaUsers } from 'react-icons/fa'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import { BRAND_NAME, BRAND_TAGLINE } from '../config/branding'
import { Button, Input } from '../components/ui'

type RegisterFields = {
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  password: string
  confirmPassword: string
}

const FEATURES = [
  {
    Icon: FaUsers,
    title: 'Одна среда для всех ролей',
    description:
      'Владельцы автомобилей, сервисные центры и администраторы работают в одном продукте без разрыва сценариев.',
  },
  {
    Icon: FaFileInvoiceDollar,
    title: 'Операции и документы',
    description:
      'Счета, история обслуживания, фото и отзывы хранятся в едином контуре и не теряются между системами.',
  },
]

const PROOF_POINTS = [
  'Сценарии для владельца и сервиса в одном интерфейсе',
  'Профессиональная подача без лишней стилистики',
  'Реальные SaaS-сценарии владения авто',
]

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>({
    mode: 'onTouched',
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  })

  const passwordValue = watch('password')

  const onSubmit = async ({ confirmPassword: _unused, ...registrationData }: RegisterFields) => {
    void _unused
    try {
      const response = await apiClient.post('/auth/register', registrationData)
      const { token, userId, ...user } = response.data
      setAuth(token, { ...user, id: userId })
      toast.success('Аккаунт создан')
      navigate('/')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка регистрации. Попробуйте снова.')
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[0.92fr_1.08fr]">

        {/* ── Form panel ── */}
        <section className="auto-card flex items-start p-6 sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-2xl">
            <div className="page-eyebrow mb-4">Новый аккаунт</div>
            <h1 className="text-h1 text-text-primary">Создать профиль</h1>
            <p className="mt-2 text-body text-text-secondary">
              Управляйте автомобилями, обслуживанием, документами и сервисными операциями в одном продукте.
            </p>

            <form
              className="mt-8 grid gap-5 md:grid-cols-2"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <div className="md:col-span-2">
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
              </div>

              <Input
                label="Имя"
                type="text"
                placeholder="Иван"
                autoComplete="given-name"
                error={errors.firstName?.message}
                {...register('firstName', {
                  required: 'Введите имя',
                  minLength: { value: 2, message: 'Минимум 2 символа' },
                })}
              />

              <Input
                label="Фамилия"
                type="text"
                placeholder="Иванов"
                autoComplete="family-name"
                error={errors.lastName?.message}
                {...register('lastName', {
                  required: 'Введите фамилию',
                  minLength: { value: 2, message: 'Минимум 2 символа' },
                })}
              />

              <Input
                label="Телефон"
                type="tel"
                placeholder="+7 700 000 00 00"
                autoComplete="tel"
                hint="Необязательно"
                error={errors.phoneNumber?.message}
                {...register('phoneNumber', {
                  pattern: {
                    value: /^[+]?[\d\s\-() ]{7,20}$/,
                    message: 'Некорректный формат номера',
                  },
                })}
              />

              <Input
                label="Пароль"
                type="password"
                placeholder="Минимум 8 символов"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Введите пароль',
                  minLength: { value: 8, message: 'Минимум 8 символов' },
                })}
              />

              <div className="md:col-span-2">
                <Input
                  label="Подтверждение пароля"
                  type="password"
                  placeholder="Повторите пароль"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword', {
                    required: 'Подтвердите пароль',
                    validate: (value) =>
                      value === passwordValue || 'Пароли не совпадают',
                  })}
                />
              </div>

              <div className="flex flex-col gap-4 pt-2 md:col-span-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  className="w-full justify-center sm:w-auto"
                >
                  Создать аккаунт
                  {!isSubmitting ? <FaArrowRight className="text-sm" /> : null}
                </Button>

                <p className="text-body text-text-secondary">
                  Уже есть аккаунт?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-text-primary underline-offset-4 hover:underline"
                  >
                    Войти
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </section>

        {/* ── Hero panel ── */}
        <section className="auto-card hidden p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <div className="app-brand-mark h-14 w-14 shrink-0 text-2xl">
                <FaCarSide />
              </div>
              <div>
                <h2 className="text-h1 text-text-primary">{BRAND_NAME}</h2>
                <p className="mt-1 text-body text-text-secondary">{BRAND_TAGLINE}</p>
              </div>
            </div>

            <div className="mt-10 grid gap-4">
              {FEATURES.map(({ Icon, title, description }) => (
                <div key={title} className="glass-panel p-5">
                  <div className="flex items-start gap-4">
                    <div className="app-brand-mark h-11 w-11 shrink-0 text-base">
                      <Icon />
                    </div>
                    <div>
                      <h3 className="text-h3 text-text-primary">{title}</h3>
                      <p className="mt-1.5 text-body leading-relaxed text-text-secondary">{description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
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
      </div>
    </div>
  )
}
