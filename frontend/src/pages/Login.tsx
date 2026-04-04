import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import apiClient from '../api/client'
import toast from 'react-hot-toast'
import { FaCarSide } from 'react-icons/fa'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
      <div className="max-w-md w-full space-y-8 p-8 auto-card">
        <div className="text-center">
          <FaCarSide className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white">
            Вход в систему
          </h2>
          <p className="text-slate-400 mt-2">Добро пожаловать в AutoService</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auto-input"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auto-input"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full auto-button-primary"
          >
            Войти
          </button>
          <div className="text-center">
            <Link to="/register" className="text-sm text-red-400 hover:text-red-300">
              Нет аккаунта? Зарегистрироваться
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
