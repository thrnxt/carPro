import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaComments,
  FaPaperPlane,
  FaSearch,
  FaSpinner,
} from 'react-icons/fa'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import { resolveFileUrl } from '../utils/resolveFileUrl'
import { useAuthStore } from '../store/authStore'
import { Badge, EmptyState, FilterBar, Page, PageHeader, Section, Surface, cx } from '../components/ui'

type ChatContact = {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string | null
  avatarUrl?: string | null
  role: 'USER' | 'SERVICE_CENTER' | 'ADMIN' | 'SUPPORT'
}

type Message = {
  id: number
  content: string
  createdAt: string
  isRead: boolean
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

const roleLabels: Record<ChatContact['role'], string> = {
  USER: 'Пользователь',
  SERVICE_CENTER: 'Сервис',
  ADMIN: 'Администратор',
  SUPPORT: 'Поддержка',
}

const roleStyles: Record<
  ChatContact['role'],
  {
    accentText: string
    accentBorder: string
    activeSurface: string
    avatarRing: string
    avatarFallback: string
  }
> = {
  USER: {
    accentText: 'text-sky-300',
    accentBorder: 'border-l-sky-400/70',
    activeSurface: 'border-sky-400/25 bg-sky-500/10',
    avatarRing: 'ring-sky-400/30',
    avatarFallback: 'bg-sky-500/12 text-sky-200 ring-1 ring-sky-400/30',
  },
  SERVICE_CENTER: {
    accentText: 'text-emerald-300',
    accentBorder: 'border-l-emerald-400/70',
    activeSurface: 'border-emerald-400/25 bg-emerald-500/10',
    avatarRing: 'ring-emerald-400/30',
    avatarFallback: 'bg-emerald-500/12 text-emerald-200 ring-1 ring-emerald-400/30',
  },
  ADMIN: {
    accentText: 'text-violet-300',
    accentBorder: 'border-l-violet-400/70',
    activeSurface: 'border-violet-400/25 bg-violet-500/10',
    avatarRing: 'ring-violet-400/30',
    avatarFallback: 'bg-violet-500/12 text-violet-200 ring-1 ring-violet-400/30',
  },
  SUPPORT: {
    accentText: 'text-amber-300',
    accentBorder: 'border-l-amber-400/70',
    activeSurface: 'border-amber-400/25 bg-amber-500/10',
    avatarRing: 'ring-amber-400/30',
    avatarFallback: 'bg-amber-500/12 text-amber-200 ring-1 ring-amber-400/30',
  },
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
  return initials || 'U'
}

export default function Chat() {
  const { receiverId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [message, setMessage] = useState('')
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [showContacts, setShowContacts] = useState(!receiverId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const activeReceiverId = receiverId ? Number(receiverId) : null

  useEffect(() => {
    setPage(0)
  }, [searchTerm])

  useEffect(() => {
    if (!receiverId) {
      setShowContacts(true)
    }
  }, [receiverId])

  const { data: contactsPage, isLoading: isContactsLoading } = useQuery<PagedResponse<ChatContact>>({
    queryKey: ['messages', 'contacts', page, searchTerm],
    queryFn: async () => {
      const response = await apiClient.get('/messages/contacts', {
        params: {
          page,
          size: 5,
          query: searchTerm.trim() || undefined,
        },
      })
      return response.data
    },
    refetchInterval: 15000,
  })

  const contacts = contactsPage?.content ?? []

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
      if (!activeReceiverId) {
        return []
      }

      const response = await apiClient.get(`/messages/conversation/${activeReceiverId}`)
      return response.data
    },
    enabled: Boolean(activeReceiverId),
    refetchInterval: 3000,
  })

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeReceiverId) {
        throw new Error('Receiver ID is required')
      }

      const response = await apiClient.post('/messages', {
        receiverId: activeReceiverId,
        content,
        type: 'CHAT',
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversation', activeReceiverId] })
      queryClient.invalidateQueries({ queryKey: ['messages', 'contacts'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      setMessage('')
      scrollToBottom()
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation])

  const conversationTitle = useMemo(() => {
    if (selectedContact) {
      return getFullName(selectedContact)
    }

    const counterpart = conversation.find((entry) => entry.sender.id !== user?.id)?.sender
    return counterpart ? getFullName(counterpart) : 'Диалог'
  }, [conversation, selectedContact, user?.id])

  const selectedRoleStyle = selectedContact ? roleStyles[selectedContact.role] : null
  const selectedAvatarSrc = selectedContact ? resolveFileUrl(selectedContact.avatarUrl) : null

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault()
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim())
    }
  }

  const openConversation = (contactId: number) => {
    navigate(`/chat/${contactId}`)
    setShowContacts(false)
  }

  return (
    <Page>
      <PageHeader eyebrow="Чат" title="Чат" />

      <Section>
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Surface className={cx('p-0 overflow-hidden', showContacts ? 'block' : 'hidden', 'xl:block')}>
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Контакты</p>
                  <h2 className="mt-2 text-xl font-bold tracking-[-0.04em] text-white">Пользователи</h2>
                </div>
                <Badge>{contactsPage?.totalElements ?? 0}</Badge>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <FilterBar className="space-y-3 p-0 bg-transparent border-0 shadow-none">
                <label className="relative block">
                  <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Поиск пользователя"
                    className="auto-input pl-11"
                  />
                </label>
              </FilterBar>

              <div className="space-y-2">
                {isContactsLoading ? (
                  <div className="flex min-h-[16rem] items-center justify-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-[#ff9b82]"></div>
                  </div>
                ) : contacts.length > 0 ? (
                  contacts.map((contact) => {
                    const isActive = contact.id === activeReceiverId
                    const avatarSrc = resolveFileUrl(contact.avatarUrl)
                    const roleStyle = roleStyles[contact.role]

                    return (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => openConversation(contact.id)}
                        className={cx(
                          'flex w-full items-center gap-3 rounded-[1.2rem] border border-l-[3px] p-3 text-left transition-all',
                          roleStyle.accentBorder,
                          isActive
                            ? roleStyle.activeSurface
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                        )}
                      >
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={getFullName(contact)}
                            className={cx('h-11 w-11 shrink-0 rounded-2xl object-cover ring-1', roleStyle.avatarRing)}
                          />
                        ) : (
                          <div className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-semibold', roleStyle.avatarFallback)}>
                            {getInitials(contact)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col items-start gap-1.5">
                            <p className={cx('text-[11px] font-semibold uppercase tracking-[0.16em]', roleStyle.accentText)}>
                              {roleLabels[contact.role]}
                            </p>
                            <p className="w-full truncate text-sm font-semibold text-white">{getFullName(contact)}</p>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-400">{contact.email}</p>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <EmptyState
                    icon={FaComments}
                    title="Пользователи не найдены"
                    description="Измените строку поиска или попробуйте другую страницу."
                    className="p-6"
                  />
                )}
              </div>

              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(current - 1, 0))}
                  disabled={!contactsPage || contactsPage.first}
                  className="auto-button-secondary h-11 w-11 px-0 py-0 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Предыдущая страница"
                >
                  <FaChevronLeft />
                </button>

                <div className="text-center text-sm tabular-nums text-slate-400 whitespace-nowrap">
                  {contactsPage ? `Стр. ${contactsPage.page + 1} / ${Math.max(contactsPage.totalPages, 1)}` : 'Стр. 1 / 1'}
                </div>

                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={!contactsPage || contactsPage.last}
                  className="auto-button-secondary h-11 w-11 px-0 py-0 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Следующая страница"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </Surface>

          <div className={cx(showContacts ? 'hidden' : 'flex', 'min-h-[40rem] xl:flex')}>
            <div className="w-full overflow-hidden rounded-[1.7rem] border border-white/10 bg-slate-950/35">
              <div className="flex h-full min-h-[40rem] flex-col">
                <div className="border-b border-white/10 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowContacts(true)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white xl:hidden"
                      aria-label="Показать контакты"
                    >
                      <FaArrowLeft />
                    </button>

                    {selectedContact ? (
                      selectedAvatarSrc ? (
                        <img
                          src={selectedAvatarSrc}
                          alt={getFullName(selectedContact)}
                          className={cx('h-11 w-11 rounded-2xl object-cover ring-1', selectedRoleStyle?.avatarRing)}
                        />
                      ) : (
                        <div
                          className={cx(
                            'flex h-11 w-11 items-center justify-center rounded-2xl font-semibold',
                            selectedRoleStyle?.avatarFallback
                          )}
                        >
                          {getInitials(selectedContact)}
                        </div>
                      )
                    ) : null}

                    <div className="min-w-0 flex-1">
                      {selectedContact ? (
                        <p
                          className={cx(
                            'text-[11px] font-semibold uppercase tracking-[0.16em]',
                            roleStyles[selectedContact.role].accentText
                          )}
                        >
                          {roleLabels[selectedContact.role]}
                        </p>
                      ) : null}
                      <h2 className="truncate text-xl font-bold tracking-[-0.04em] text-white">{conversationTitle}</h2>
                      <p className="mt-1 truncate text-sm text-slate-400">
                        {selectedContact ? selectedContact.email : 'Выберите пользователя'}
                      </p>
                    </div>
                  </div>
                </div>

                {activeReceiverId ? (
                  <>
                    <div className="flex-1 space-y-4 overflow-y-auto p-5">
                      {isConversationLoading ? (
                        <div className="flex h-full min-h-[26rem] items-center justify-center">
                          <div className="text-center">
                            <div className="inline-block h-9 w-9 animate-spin rounded-full border-b-2 border-[#ff9b82]"></div>
                            <p className="mt-3 text-sm text-slate-400">Загрузка переписки...</p>
                          </div>
                        </div>
                      ) : conversation.length > 0 ? (
                        conversation.map((entry) => {
                          const isOwn = entry.sender.id === user?.id

                          return (
                            <div key={entry.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`max-w-xl rounded-[1.35rem] border px-4 py-3 ${
                                  isOwn
                                    ? 'border-[#ff6b4a]/20 bg-[#ff6b4a]/12 text-white'
                                    : 'border-white/10 bg-white/5 text-white'
                                }`}
                              >
                                {!isOwn && (
                                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    {entry.sender.firstName} {entry.sender.lastName}
                                  </div>
                                )}
                                <p className="text-sm leading-6">{entry.content}</p>
                                <div className={`mt-2 text-xs ${isOwn ? 'text-[#ffb29f]' : 'text-slate-400'}`}>
                                  {format(new Date(entry.createdAt), 'HH:mm', { locale: ru })}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <EmptyState
                          icon={FaComments}
                          title="Сообщений пока нет"
                          description="Начните переписку первым сообщением."
                          className="mx-auto my-6 w-full max-w-3xl"
                        />
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="border-t border-white/10 bg-white/5 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                          type="text"
                          value={message}
                          onChange={(event) => setMessage(event.target.value)}
                          placeholder="Введите сообщение..."
                          className="auto-input flex-1"
                        />
                        <button
                          type="submit"
                          disabled={!message.trim() || sendMessageMutation.isPending}
                          className="auto-button-primary justify-center sm:min-w-[11rem]"
                        >
                          {sendMessageMutation.isPending ? (
                            <>
                              <FaSpinner className="animate-spin" />
                              Отправка...
                            </>
                          ) : (
                            <>
                              <FaPaperPlane />
                              Отправить
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center p-6">
                    <EmptyState
                      icon={FaComments}
                      title="Выберите пользователя"
                      description="Откройте контакт слева, чтобы начать переписку."
                      className="w-full max-w-3xl"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Section>
    </Page>
  )
}
