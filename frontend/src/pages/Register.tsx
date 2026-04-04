import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import apiClient from '../api/client'
import toast from 'react-hot-toast'
import { FaCarSide } from 'react-icons/fa'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
      <div className="max-w-md w-full space-y-8 p-8 auto-card">
        <div className="text-center">
          <FaCarSide className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white">
            Регистрация
          </h2>
          <p className="text-slate-400 mt-2">Создайте аккаунт для управления автомобилями</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="auto-input"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Пароль</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="auto-input"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Имя</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="auto-input"
              placeholder="Иван"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Фамилия</label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="auto-input"
              placeholder="Иванов"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Телефон</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="auto-input"
              placeholder="+7 (XXX) XXX-XX-XX"
            />
          </div>
          <button
            type="submit"
            className="w-full auto-button-primary"
          >
            Зарегистрироваться
          </button>
          <div className="text-center">
            <Link to="/login" className="text-sm text-red-400 hover:text-red-300">
              Уже есть аккаунт? Войти
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
