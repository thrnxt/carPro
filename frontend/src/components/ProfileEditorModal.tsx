import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FaCamera, FaSave, FaTimes, FaTrashAlt } from 'react-icons/fa'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import { resolveFileUrl } from '../utils/resolveFileUrl'

type ProfileEditorModalProps = {
  open: boolean
  onClose: () => void
}

type ProfileFormState = {
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  avatarUrl: string
}

type ProfileUpdateResponse = {
  token: string | null
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string | null
  avatarUrl?: string | null
  role: string
  userId?: number
  id?: number
}

const roleLabels: Record<string, string> = {
  USER: 'Кабинет владельца',
  SERVICE_CENTER: 'Сервисный центр',
  ADMIN: 'Администратор',
  SUPPORT: 'Поддержка',
}

function createFormState(user: ReturnType<typeof useAuthStore.getState>['user']): ProfileFormState {
  return {
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
    avatarUrl: user?.avatarUrl || '',
  }
}

export default function ProfileEditorModal({ open, onClose }: ProfileEditorModalProps) {
  const { user, token, setAuth } = useAuthStore()
  const [formData, setFormData] = useState<ProfileFormState>(() => createFormState(user))
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) {
      setSelectedAvatarFile(null)
      setAvatarPreviewUrl((currentValue) => {
        if (currentValue) {
          URL.revokeObjectURL(currentValue)
        }
        return null
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      return
    }

    setFormData(createFormState(user))
    setSelectedAvatarFile(null)
    setAvatarPreviewUrl((currentValue) => {
      if (currentValue) {
        URL.revokeObjectURL(currentValue)
      }
      return null
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [open, user])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
    }
  }, [avatarPreviewUrl])

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      let avatarUrl = formData.avatarUrl.trim()

      if (selectedAvatarFile) {
        const uploadData = new FormData()
        uploadData.append('file', selectedAvatarFile)
        uploadData.append('subdirectory', 'avatars')

        const uploadResponse = await apiClient.post('/files/upload', uploadData)

        avatarUrl = uploadResponse.data.url
      }

      const response = await apiClient.put<ProfileUpdateResponse>('/auth/me', {
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        avatarUrl,
      })

      return response.data
    },
    onSuccess: (data) => {
      const nextToken = data.token || token
      if (!nextToken) {
        toast.error('Не удалось обновить сессию после сохранения профиля')
        return
      }

      const { token: _token, ...updatedUser } = data
      setAuth(nextToken, updatedUser)
      toast.success('Профиль обновлён')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Не удалось сохранить профиль')
    },
  })

  if (!open || !user) {
    return null
  }

  const initials = `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`.trim() || 'AU'
  const resolvedAvatarUrl = avatarPreviewUrl || resolveFileUrl(formData.avatarUrl)
  const roleLabel = roleLabels[user.role] || 'Пользователь'

  const handleAvatarSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Можно выбрать только изображение')
      event.target.value = ''
      return
    }

    setSelectedAvatarFile(file)
    setAvatarPreviewUrl((currentValue) => {
      if (currentValue) {
        URL.revokeObjectURL(currentValue)
      }
      return URL.createObjectURL(file)
    })
  }

  const handleAvatarRemove = () => {
    setSelectedAvatarFile(null)
    setFormData((currentValue) => ({
      ...currentValue,
      avatarUrl: '',
    }))
    setAvatarPreviewUrl((currentValue) => {
      if (currentValue) {
        URL.revokeObjectURL(currentValue)
      }
      return null
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast.error('Заполните имя, фамилию и email')
      return
    }

    updateProfileMutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
        aria-label="Закрыть окно редактирования профиля"
      />

      <div className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#08111d]/95 shadow-[0_44px_120px_-42px_rgba(2,6,23,0.96)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(255,107,74,0.28),transparent_52%),radial-gradient(circle_at_top_right,rgba(96,165,250,0.18),transparent_42%)]" />

        <div className="relative grid lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="border-b border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Profile</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-white">Редактирование профиля</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
              Обновите личные данные и фото. Если измените email, сессия автоматически обновится.
            </p>

            <div className="mt-8 flex flex-col items-start">
              <div className="relative">
                <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-[#ff6b4a]/45 via-[#ff9d82]/10 to-sky-400/20 blur-md" />
                <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-[#ff6b4a] to-[#ff845f] text-3xl font-bold text-white shadow-[0_26px_50px_-28px_rgba(255,107,74,0.7)]">
                  {resolvedAvatarUrl ? (
                    <img
                      src={resolvedAvatarUrl}
                      alt={`${formData.firstName} ${formData.lastName}`.trim() || 'Avatar'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950 text-white shadow-[0_18px_36px_-20px_rgba(2,6,23,0.95)] transition-colors hover:bg-slate-900"
                  aria-label="Загрузить новый аватар"
                >
                  <FaCamera />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarSelect}
              />

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="auto-button-secondary px-4 py-2.5 text-sm">
                  <FaCamera />
                  Загрузить фото
                </button>
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  className="auto-button-secondary px-4 py-2.5 text-sm"
                  disabled={!formData.avatarUrl && !selectedAvatarFile}
                >
                  <FaTrashAlt />
                  Удалить
                </button>
              </div>

              <div className="mt-6 w-full rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Текущий доступ</p>
                <p className="mt-2 text-sm font-semibold text-white">{roleLabel}</p>
                <p className="mt-1 break-all text-sm text-slate-400">{user.email}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative p-6 sm:p-8">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-6 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Закрыть окно"
            >
              <FaTimes />
            </button>

            <div className="pr-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Personal data</p>
              <h3 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-white">Что можно редактировать</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Имя и фамилия нужны для чатов, бронирований и уведомлений. Телефон и фотография используются как
                контактная карточка внутри кабинета.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Имя</label>
                <input
                  className="auto-input"
                  value={formData.firstName}
                  onChange={(event) => setFormData((currentValue) => ({ ...currentValue, firstName: event.target.value }))}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Фамилия</label>
                <input
                  className="auto-input"
                  value={formData.lastName}
                  onChange={(event) => setFormData((currentValue) => ({ ...currentValue, lastName: event.target.value }))}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm text-slate-300">Email</label>
                <input
                  className="auto-input"
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((currentValue) => ({ ...currentValue, email: event.target.value }))}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm text-slate-300">Телефон</label>
                <input
                  className="auto-input"
                  value={formData.phoneNumber}
                  placeholder="+7 700 000 00 00"
                  onChange={(event) => setFormData((currentValue) => ({ ...currentValue, phoneNumber: event.target.value }))}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
              <p className="text-sm text-slate-500">Изменения сохраняются сразу в профиль и в текущую сессию.</p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={onClose} className="auto-button-secondary px-4 py-2.5 text-sm">
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="auto-button-primary px-5 py-2.5 text-sm"
                >
                  <FaSave />
                  {updateProfileMutation.isPending ? 'Сохраняем...' : 'Сохранить профиль'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
