import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import { FaSave, FaWrench } from 'react-icons/fa'

interface ServiceCenter {
  id: number
  name: string
  address: string
  city?: string
  region?: string
  latitude: number
  longitude: number
  phoneNumber?: string
  email?: string
  website?: string
  description?: string
  licenseDocumentUrl?: string
  logoUrl?: string
}

interface FormState {
  name: string
  address: string
  city: string
  region: string
  latitude: string
  longitude: string
  phoneNumber: string
  email: string
  website: string
  description: string
  licenseDocumentUrl: string
  logoUrl: string
}

export default function ServiceCenterSettings() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<FormState>({
    name: '',
    address: '',
    city: '',
    region: '',
    latitude: '',
    longitude: '',
    phoneNumber: '',
    email: '',
    website: '',
    description: '',
    licenseDocumentUrl: '',
    logoUrl: '',
  })

  const { data: serviceCenter, isLoading } = useQuery<ServiceCenter>({
    queryKey: ['service-center', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/service-centers/my')
      return response.data
    },
  })

  useEffect(() => {
    if (!serviceCenter) return
    setFormData({
      name: serviceCenter.name || '',
      address: serviceCenter.address || '',
      city: serviceCenter.city || '',
      region: serviceCenter.region || '',
      latitude: serviceCenter.latitude?.toString() || '',
      longitude: serviceCenter.longitude?.toString() || '',
      phoneNumber: serviceCenter.phoneNumber || '',
      email: serviceCenter.email || '',
      website: serviceCenter.website || '',
      description: serviceCenter.description || '',
      licenseDocumentUrl: serviceCenter.licenseDocumentUrl || '',
      logoUrl: serviceCenter.logoUrl || '',
    })
  }, [serviceCenter])

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
      }
      const response = await apiClient.put('/service-centers/my', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-center', 'my'] })
      toast.success('Настройки сохранены')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Не удалось сохранить настройки')
    },
  })

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.address.trim() || !formData.latitude || !formData.longitude) {
      toast.error('Заполните обязательные поля: название, адрес, координаты')
      return
    }
    updateMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <p className="mt-2 text-slate-400">Загрузка настроек...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Настройки сервисного центра</h1>
        <p className="text-slate-400">Обновите публичную информацию о вашем сервисе</p>
      </div>

      <form onSubmit={handleSubmit} className="auto-card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Название *</label>
            <input className="auto-input" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Телефон</label>
            <input className="auto-input" value={formData.phoneNumber} onChange={(e) => handleChange('phoneNumber', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-300 mb-2">Адрес *</label>
            <input className="auto-input" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Город</label>
            <input className="auto-input" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Регион</label>
            <input className="auto-input" value={formData.region} onChange={(e) => handleChange('region', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Широта *</label>
            <input className="auto-input" type="number" step="0.000001" value={formData.latitude} onChange={(e) => handleChange('latitude', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Долгота *</label>
            <input className="auto-input" type="number" step="0.000001" value={formData.longitude} onChange={(e) => handleChange('longitude', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Email</label>
            <input className="auto-input" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Сайт</label>
            <input className="auto-input" value={formData.website} onChange={(e) => handleChange('website', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Лого URL</label>
            <input className="auto-input" value={formData.logoUrl} onChange={(e) => handleChange('logoUrl', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Лицензия URL</label>
            <input className="auto-input" value={formData.licenseDocumentUrl} onChange={(e) => handleChange('licenseDocumentUrl', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-300 mb-2">Описание</label>
            <textarea
              className="auto-textarea"
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="auto-button-primary flex items-center gap-2"
          >
            {updateMutation.isPending ? <FaWrench className="animate-spin" /> : <FaSave />}
            Сохранить
          </button>
        </div>
      </form>
    </div>
  )
}
