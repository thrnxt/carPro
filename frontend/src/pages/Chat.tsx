import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FaArrowLeft,
  FaCheck,
  FaCheckDouble,
  FaEllipsisV,
  FaPaperPlane,
  FaPaperclip,
  FaPhone,
  FaRegBuilding,
  FaRegTrashAlt,
  FaSearch,
  FaSpinner,
} from 'react-icons/fa'
import { format, isToday, isYesterday } from 'date-fns'
import ru from 'date-fns/locale/ru'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import { resolveFileUrl } from '../utils/resolveFileUrl'
import { useAuthStore } from '../store/authStore'
import { EmptyState, Page, PageHeader, Skeleton, cx } from '../components/ui'

type ChatContact = {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string | null
  avatarUrl?: string | null
  role: 'USER' | 'SERVICE_CENTER' | 'ADMIN' | 'SUPPORT'
  serviceCenterId?: number | null
}

type Message = {
  id: number
  content: string
  attachmentUrl?: string | null
  createdAt: string
  isRead: boolean
  type?: string
  sender: {
    id: number
    firstName: string
    lastName: string
  }
  receiver: {
    id: number
    firstName: string
    lastName: string
  }
}

type PagedResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

const CONTACTS_PAGE_SIZE = 5 // бэкенд ограничивает размер страницы пятью

const statusLabels: Record<ChatContact['role'], string> = {
  USER: 'Пользователь',
  SERVICE_CENTER: 'Сервисный центр',
  ADMIN: 'Администратор',
  SUPPORT: 'Поддержка',
}

function getFullName(contact?: Partial<ChatContact> | null) {
  if (!contact) {
    return 'Диалог'
  }
  const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
  return fullName || contact.email || 'Диалог'
}

function getInitials(contact?: Partial<ChatContact> | null) {
  const initials = `${contact?.firstName?.[0] || ''}${contact?.lastName?.[0] || ''}`.trim()
  return initials.toUpperCase() || 'U'
}

function avatarTone(role: ChatContact['role']) {
  return role === 'SERVICE_CENTER' ? 'bg-success text-white' : 'bg-info text-white'
}

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

// Краткое время для списка контактов: сегодня → 14:32, вчера → Вчера,
// в течение недели → Пн, иначе → 31.05
function formatListTime(iso: string) {
  const date = new Date(iso)
  if (isToday(date)) return format(date, 'HH:mm')
  if (isYesterday(date)) return 'Вчера'
  if (Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
    return capitalize(format(date, 'EEEEEE', { locale: ru }))
  }
  return format(date, 'dd.MM')
}

function dayLabel(date: Date) {
  if (isToday(date)) return 'Сегодня'
  if (isYesterday(date)) return 'Вчера'
  return format(date, 'd MMMM', { locale: ru })
}

function isSystemMessage(message: Message) {
  return Boolean(message.type) && message.type !== 'CHAT'
}

type ContactAvatarProps = {
  contact: ChatContact
  size?: 'sm' | 'md' | 'lg'
}

function ContactAvatar({ contact, size = 'md' }: ContactAvatarProps) {
  const dimension = size === 'lg' ? 'h-11 w-11 text-sm' : size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-10 w-10 text-xs'
  const src = resolveFileUrl(contact.avatarUrl)

  if (src) {
    return <img src={src} alt={getFullName(contact)} className={cx('shrink-0 rounded-full object-cover', dimension)} />
  }

  return (
    <div className={cx('flex shrink-0 items-center justify-center rounded-full font-semibold', dimension, avatarTone(contact.role))}>
      {getInitials(contact)}
    </div>
  )
}

export default function Chat() {
  const { receiverId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [message, setMessage] = useState('')
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [contacts, setContacts] = useState<ChatContact[]>([])
  const [showContacts, setShowContacts] = useState(!receiverId)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeReceiverId = receiverId ? Number(receiverId) : null

  useEffect(() => {
    setPage(0)
  }, [searchTerm])

  useEffect(() => {
    if (!receiverId) {
      setShowContacts(true)
    }
    setMenuOpen(false)
  }, [receiverId])

  // Закрытие меню по клику снаружи
  useEffect(() => {
    if (!menuOpen) return
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const { data: contactsPage, isLoading: isContactsLoading } = useQuery<PagedResponse<ChatContact>>({
    queryKey: ['messages', 'contacts', page, searchTerm],
    queryFn: async () => {
      const response = await apiClient.get('/messages/contacts', {
        params: {
          page,
          size: CONTACTS_PAGE_SIZE,
          query: searchTerm.trim() || undefined,
        },
      })
      return response.data
    },
    refetchInterval: 15000,
  })

  // Бесконечная лента: накапливаем страницы, сбрасывая на первой (новый поиск / refetch)
  useEffect(() => {
    if (!contactsPage) return
    setContacts((prev) => {
      if (contactsPage.page === 0) {
        return contactsPage.content
      }
      const seen = new Set(prev.map((item) => item.id))
      return [...prev, ...contactsPage.content.filter((item) => !seen.has(item.id))]
    })
  }, [contactsPage])

  // IntersectionObserver — подгрузка следующей страницы при достижении конца списка
  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && contactsPage && !contactsPage.last && !isContactsLoading) {
          setPage((current) => current + 1)
        }
      },
      { rootMargin: '160px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [contactsPage, isContactsLoading])

  const { data: unreadMessages = [] } = useQuery<Message[]>({
    queryKey: ['messages', 'unread'],
    queryFn: async () => {
      const response = await apiClient.get('/messages/unread')
      return response.data
    },
    refetchInterval: 12000,
  })

  // Непрочитанные сгруппированы по отправителю → бейджи и превью последнего сообщения
  const unreadBySender = useMemo(() => {
    const map = new Map<number, { count: number; last: Message }>()
    for (const item of unreadMessages) {
      const current = map.get(item.sender.id)
      if (!current) {
        map.set(item.sender.id, { count: 1, last: item })
      } else {
        current.count += 1
        if (new Date(item.createdAt) > new Date(current.last.createdAt)) {
          current.last = item
        }
      }
    }
    return map
  }, [unreadMessages])

  const { data: selectedContact } = useQuery<ChatContact>({
    queryKey: ['messages', 'contact', activeReceiverId],
    queryFn: async () => {
      const response = await apiClient.get(`/messages/contacts/${activeReceiverId}`)
      return response.data
    },
    enabled: Boolean(activeReceiverId),
  })

  const { data: conversation = [], isLoading: isConversationLoading } = useQuery<Message[]>({
    queryKey: ['messages', 'conversation', activeReceiverId],
    queryFn: async () => {
      if (!activeReceiverId) return []
      const response = await apiClient.get(`/messages/conversation/${activeReceiverId}`)
      return response.data
    },
    enabled: Boolean(activeReceiverId),
    refetchInterval: 3000,
  })

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: { content: string; attachmentUrl?: string }) => {
      if (!activeReceiverId) {
        throw new Error('Receiver ID is required')
      }
      const response = await apiClient.post('/messages', {
        receiverId: activeReceiverId,
        content: payload.content,
        attachmentUrl: payload.attachmentUrl,
        type: 'CHAT',
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversation', activeReceiverId] })
      queryClient.invalidateQueries({ queryKey: ['messages', 'contacts'] })
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      setMessage('')
      resetTextareaHeight()
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Ошибка отправки сообщения'
      toast.error(errorMessage)
    },
  })

  const deleteConversationMutation = useMutation({
    mutationFn: async () => {
      if (!activeReceiverId) {
        throw new Error('Receiver ID is required')
      }
      await apiClient.delete(`/messages/conversation/${activeReceiverId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversation', activeReceiverId] })
      queryClient.invalidateQueries({ queryKey: ['messages', 'contacts'] })
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread'] })
      setMenuOpen(false)
      toast.success('Переписка очищена')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Не удалось очистить переписку')
    },
  })

  // Загрузка изображения и отправка его сообщением
  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = '' // позволяем повторно выбрать тот же файл
    if (!file || !activeReceiverId) return

    if (!file.type.startsWith('image/')) {
      toast.error('Можно отправлять только изображения')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл слишком большой (максимум 10 МБ)')
      return
    }

    setIsUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('subdirectory', 'chat')
      const uploadResponse = await apiClient.post('/files/upload', uploadData)
      await sendMessageMutation.mutateAsync({ content: '', attachmentUrl: uploadResponse.data.url })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Не удалось загрузить изображение')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClearConversation = () => {
    if (window.confirm('Очистить всю переписку? Это действие необратимо.')) {
      deleteConversationMutation.mutate()
    }
  }

  const handleOpenServiceProfile = () => {
    if (selectedContact?.serviceCenterId) {
      navigate(`/service-centers/${selectedContact.serviceCenterId}`)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation])

  // Открытие диалога помечает сообщения прочитанными на сервере — обновляем бейджи
  useEffect(() => {
    if (activeReceiverId && conversation.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread'] })
    }
  }, [activeReceiverId, conversation.length, queryClient])

  // Сгруппированный по дате поток сообщений с флагами для аватара и хвоста пузыря
  const renderedStream = useMemo(() => {
    const sorted = [...conversation].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    type Rendered =
      | { kind: 'day'; key: string; label: string }
      | { kind: 'system'; key: string; content: string }
      | {
          kind: 'message'
          key: string
          isOwn: boolean
          content: string
          attachmentUrl?: string | null
          time: string
          isRead: boolean
          showAvatar: boolean
        }

    const items: Rendered[] = []
    let lastDayKey = ''

    sorted.forEach((entry, index) => {
      const date = new Date(entry.createdAt)
      const dayKey = format(date, 'yyyy-MM-dd')
      if (dayKey !== lastDayKey) {
        items.push({ kind: 'day', key: `day-${dayKey}`, label: dayLabel(date) })
        lastDayKey = dayKey
      }

      if (isSystemMessage(entry)) {
        items.push({
          kind: 'system',
          key: `msg-${entry.id}`,
          content: `${entry.content} · ${dayLabel(date).toLowerCase()} ${format(date, 'HH:mm')}`,
        })
        return
      }

      const isOwn = entry.sender.id === user?.id
      const next = sorted[index + 1]
      const nextContinues =
        next &&
        next.sender.id === entry.sender.id &&
        !isSystemMessage(next) &&
        format(new Date(next.createdAt), 'yyyy-MM-dd') === dayKey

      items.push({
        kind: 'message',
        key: `msg-${entry.id}`,
        isOwn,
        content: entry.content,
        attachmentUrl: entry.attachmentUrl,
        time: format(date, 'HH:mm'),
        isRead: entry.isRead,
        showAvatar: !isOwn && !nextContinues,
      })
    })

    return items
  }, [conversation, user?.id])

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault()
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate({ content: message.trim() })
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend(event)
    }
  }

  const resetTextareaHeight = () => {
    const node = textareaRef.current
    if (node) {
      node.style.height = 'auto'
    }
  }

  const handleInput = () => {
    const node = textareaRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, 96)}px` // ~4 строки
  }

  const openConversation = (contactId: number) => {
    navigate(`/chat/${contactId}`)
    setShowContacts(false)
  }

  const services = contacts.filter((contact) => contact.role === 'SERVICE_CENTER')
  const people = contacts.filter((contact) => contact.role !== 'SERVICE_CENTER')
  const canSend = Boolean(message.trim()) && !sendMessageMutation.isPending
  const selectedPhone = selectedContact?.phoneNumber?.trim()

  const messagePreview = (msg: Message) => msg.content?.trim() || (msg.attachmentUrl ? '📷 Фото' : '')

  const renderContactRow = (contact: ChatContact) => {
    const isActive = contact.id === activeReceiverId
    const unread = unreadBySender.get(contact.id)

    let preview = unread ? messagePreview(unread.last) : ''
    let previewTime = unread ? formatListTime(unread.last.createdAt) : undefined

    if (!preview && isActive && conversation.length > 0) {
      const last = conversation[conversation.length - 1]
      preview = messagePreview(last)
      previewTime = formatListTime(last.createdAt)
    }

    return (
      <button
        key={contact.id}
        type="button"
        onClick={() => openConversation(contact.id)}
        aria-current={isActive ? 'true' : undefined}
        className={cx(
          'flex w-full items-center gap-3 rounded-md border-l-[3px] px-3 py-2.5 text-left transition-colors duration-150',
          isActive
            ? 'border-l-accent bg-accent/20 ring-1 ring-inset ring-accent/30'
            : 'border-l-transparent hover:bg-surface-3'
        )}
      >
        <ContactAvatar contact={contact} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={cx(
                'truncate text-sm',
                isActive ? 'font-semibold text-accent' : 'font-medium text-text-primary'
              )}
            >
              {getFullName(contact)}
            </p>
            {previewTime ? <span className="shrink-0 text-[11px] text-text-muted">{previewTime}</span> : null}
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p className="truncate text-xs text-text-secondary">{preview || 'Открыть диалог'}</p>
            {unread && unread.count > 0 ? (
              <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-success px-1.5 text-[11px] font-semibold text-white">
                {unread.count}
              </span>
            ) : null}
          </div>
        </div>
      </button>
    )
  }

  return (
    <Page>
      <PageHeader title="Чат" description="Переписка с сервисными центрами" />

      <div className="auto-card h-[78vh] min-h-[34rem] overflow-hidden p-0">
        <div className="grid h-full grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]">
          {/* ── Левая колонка ─────────────────────────────────────────── */}
          <aside
            className={cx(
              'h-full min-h-0 flex-col border-r border-border bg-surface-2',
              showContacts ? 'flex' : 'hidden',
              'md:flex'
            )}
          >
            <div className="shrink-0 space-y-3 border-b border-border px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[18px] font-bold text-text-primary">Сообщения</h2>
                {unreadMessages.length > 0 ? (
                  <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-success px-2 text-xs font-semibold text-white">
                    {unreadMessages.length}
                  </span>
                ) : null}
              </div>
              <label className="relative block">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Поиск..."
                  className="auto-input h-10 w-full py-0 pl-9"
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {isContactsLoading && contacts.length === 0 ? (
                <div className="space-y-2 p-1">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3 px-2 py-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : contacts.length === 0 ? (
                <EmptyState
                  icon={FaSearch}
                  title="Никого не найдено"
                  description="Измените поисковый запрос."
                  className="m-2 border-0 bg-transparent p-6"
                />
              ) : (
                <>
                  {services.length > 0 ? (
                    <div>
                      <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Сервисные центры
                      </p>
                      <div className="space-y-0.5">{services.map(renderContactRow)}</div>
                    </div>
                  ) : null}

                  {services.length > 0 && people.length > 0 ? (
                    <div className="my-2 border-t border-border" />
                  ) : null}

                  {people.length > 0 ? (
                    <div>
                      <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Контакты
                      </p>
                      <div className="space-y-0.5">{people.map(renderContactRow)}</div>
                    </div>
                  ) : null}

                  <div ref={sentinelRef} className="h-px" />
                </>
              )}
            </div>
          </aside>

          {/* ── Правая панель ─────────────────────────────────────────── */}
          <section
            className={cx(
              'h-full min-h-0 min-w-0 flex-col bg-surface-1',
              showContacts ? 'hidden' : 'flex',
              'md:flex'
            )}
          >
            {activeReceiverId && selectedContact ? (
              <>
                {/* Шапка диалога */}
                <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setShowContacts(true)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary md:hidden"
                    aria-label="Назад к списку"
                  >
                    <FaArrowLeft />
                  </button>

                  <ContactAvatar contact={selectedContact} size="md" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-text-primary">{getFullName(selectedContact)}</p>
                    <p className="truncate text-xs text-text-secondary">{statusLabels[selectedContact.role]}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {selectedPhone ? (
                      <a
                        href={`tel:${selectedPhone}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
                        aria-label="Позвонить"
                      >
                        <FaPhone />
                      </a>
                    ) : null}
                    <div className="relative" ref={menuRef}>
                      <button
                        type="button"
                        onClick={() => setMenuOpen((open) => !open)}
                        className={cx(
                          'inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-surface-3 hover:text-text-primary',
                          menuOpen ? 'bg-surface-3 text-text-primary' : 'text-text-secondary'
                        )}
                        aria-label="Меню"
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                      >
                        <FaEllipsisV />
                      </button>

                      {menuOpen ? (
                        <div
                          role="menu"
                          className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-md border border-border bg-surface-2 py-1 shadow-panel"
                        >
                          {selectedContact.serviceCenterId ? (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={handleOpenServiceProfile}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-surface-3"
                            >
                              <FaRegBuilding className="text-text-secondary" />
                              Профиль сервиса
                            </button>
                          ) : null}
                          <button
                            type="button"
                            role="menuitem"
                            onClick={handleClearConversation}
                            disabled={deleteConversationMutation.isPending}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
                          >
                            <FaRegTrashAlt />
                            Очистить переписку
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Лента сообщений */}
                <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-4">
                  {isConversationLoading && conversation.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-b-info" />
                    </div>
                  ) : renderedStream.length === 0 ? (
                    <div className="flex h-full items-center justify-center px-6 text-center">
                      <p className="text-sm text-text-secondary">
                        Сообщений пока нет. Напишите первым, чтобы начать переписку.
                      </p>
                    </div>
                  ) : (
                    renderedStream.map((item) => {
                      if (item.kind === 'day') {
                        return (
                          <div key={item.key} className="flex justify-center py-2">
                            <span className="rounded-full bg-surface-3 px-3 py-1 text-[11px] font-medium text-text-secondary">
                              {item.label}
                            </span>
                          </div>
                        )
                      }

                      if (item.kind === 'system') {
                        return (
                          <p key={item.key} className="mx-auto max-w-md py-1 text-center text-xs italic text-text-muted">
                            {item.content}
                          </p>
                        )
                      }

                      if (item.isOwn) {
                        return (
                          <div key={item.key} className="flex flex-col items-end pt-1">
                            <div
                              className={cx(
                                'max-w-[78%] overflow-hidden rounded-[16px] rounded-tr-[4px] bg-[#0F6E56] text-sm leading-snug text-white',
                                item.attachmentUrl ? 'p-1' : 'px-3.5 py-2'
                              )}
                            >
                              <MessageAttachment url={item.attachmentUrl} />
                              {item.content ? (
                                <p className={cx('whitespace-pre-wrap break-words', item.attachmentUrl && 'px-2.5 pb-1 pt-2')}>
                                  {item.content}
                                </p>
                              ) : null}
                            </div>
                            <span className="mt-1 flex items-center gap-1 px-1 text-[10px] text-text-muted">
                              {item.time}
                              {item.isRead ? (
                                <FaCheckDouble className="text-success" />
                              ) : (
                                <FaCheck className="text-text-muted" />
                              )}
                            </span>
                          </div>
                        )
                      }

                      return (
                        <div key={item.key} className="flex items-end gap-2 pt-1">
                          {item.showAvatar ? (
                            <ContactAvatar contact={selectedContact} size="sm" />
                          ) : (
                            <div className="w-7 shrink-0" />
                          )}
                          <div className="flex max-w-[78%] flex-col items-start">
                            <div
                              className={cx(
                                'overflow-hidden rounded-[16px] rounded-tl-[4px] bg-surface-3 text-sm leading-snug text-text-primary',
                                item.attachmentUrl ? 'p-1' : 'px-3.5 py-2'
                              )}
                            >
                              <MessageAttachment url={item.attachmentUrl} />
                              {item.content ? (
                                <p className={cx('whitespace-pre-wrap break-words', item.attachmentUrl && 'px-2.5 pb-1 pt-2')}>
                                  {item.content}
                                </p>
                              ) : null}
                            </div>
                            <span className="mt-1 px-1 text-[10px] text-text-muted">{item.time}</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Поле ввода */}
                <form onSubmit={handleSend} className="shrink-0 border-t border-border px-3 py-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelected}
                    className="hidden"
                  />
                  <div className="flex items-end gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 transition-colors focus-within:border-accent">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || sendMessageMutation.isPending}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:text-text-secondary disabled:opacity-50"
                      aria-label="Прикрепить изображение"
                    >
                      {isUploading ? <FaSpinner className="animate-spin" /> : <FaPaperclip />}
                    </button>
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      onInput={handleInput}
                      onKeyDown={handleKeyDown}
                      placeholder={isUploading ? 'Загрузка изображения...' : 'Написать сообщение...'}
                      className="max-h-24 flex-1 resize-none self-center bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!canSend}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success text-white transition-all hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Отправить"
                    >
                      <FaPaperPlane className="text-sm" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Empty state — диалог не выбран */
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <ChatEmptyIllustration />
                <h3 className="mt-6 text-[18px] font-bold text-text-primary">Начните переписку</h3>
                <p className="mt-2 max-w-sm text-sm text-text-secondary">
                  Выберите сервисный центр, чтобы задать вопрос или уточнить детали записи
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/service-centers')}
                  className="btn-primary mt-6"
                >
                  Найти сервис
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </Page>
  )
}

function MessageAttachment({ url }: { url?: string | null }) {
  if (!url) return null
  const src = resolveFileUrl(url) || undefined
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className="block">
      <img
        src={src}
        alt="Вложение"
        loading="lazy"
        className="max-h-72 w-auto max-w-full rounded-[12px] object-cover"
      />
    </a>
  )
}

function ChatEmptyIllustration() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M20 18h56a8 8 0 0 1 8 8v34a8 8 0 0 1-8 8H40L26 80V68h-6a8 8 0 0 1-8-8V26a8 8 0 0 1 8-8Z"
        fill="var(--color-surface-3)"
        stroke="var(--color-border)"
        strokeWidth="2"
      />
      <path
        d="M34 50v-6l3-8a3 3 0 0 1 2.8-2h16.4a3 3 0 0 1 2.8 2l3 8v6a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2H40v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2Z"
        fill="var(--color-success)"
        opacity="0.9"
      />
      <path d="M37 44h22l-2.2-6a1 1 0 0 0-.95-.7H40.15a1 1 0 0 0-.95.7L37 44Z" fill="var(--color-surface-2)" />
      <circle cx="39" cy="47" r="2" fill="var(--color-surface-2)" />
      <circle cx="57" cy="47" r="2" fill="var(--color-surface-2)" />
    </svg>
  )
}
