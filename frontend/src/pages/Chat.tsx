import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { FaComments, FaPaperPlane, FaSpinner } from 'react-icons/fa'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import { EmptyState, Page, PageHeader, Section } from '../components/ui'

export default function Chat() {
  const { receiverId } = useParams()
  const { user } = useAuthStore()
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data: conversation = [], isLoading } = useQuery({
    queryKey: ['messages', 'conversation', receiverId],
    queryFn: async () => {
      if (!receiverId) {
        return []
      }

      const response = await apiClient.get(`/messages/conversation/${receiverId}`)
      return response.data
    },
    enabled: !!receiverId,
    refetchInterval: 3000,
  })

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!receiverId) {
        throw new Error('Receiver ID is required')
      }

      const response = await apiClient.post('/messages', {
        receiverId: parseInt(receiverId, 10),
        content,
        type: 'CHAT',
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversation', receiverId] })
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
      console.error('Error sending message:', error)
    },
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation])

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault()
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim())
    }
  }

  if (!receiverId) {
    return (
      <Page>
        <PageHeader
          eyebrow="Messaging"
          title="Чат"
          description="Коммуникации встроены в кабинет, но для старта диалога нужен получатель в URL."
        />
        <Section title="Пустой диалог" description="Используйте формат `/chat/:receiverId`, чтобы открыть конкретную переписку.">
          <EmptyState
            icon={FaComments}
            title="Получатель не выбран"
            description="Откройте диалог через карточку сервиса или перейдите по URL вида `/chat/123`, где `123` — идентификатор пользователя."
          />
        </Section>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Messaging"
        title="Чат"
        description="Переписка с сервисными центрами и поддержкой теперь встроена в общий workspace без отдельного full-screen режима."
      />

      <Section title={`Диалог #${receiverId}`} description="Сообщения обновляются автоматически каждые несколько секунд.">
        <div className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-slate-950/35">
          <div className="flex min-h-[34rem] flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {isLoading ? (
                <div className="flex h-full min-h-[26rem] items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block h-9 w-9 animate-spin rounded-full border-b-2 border-[#ff9b82]"></div>
                    <p className="mt-3 text-sm text-slate-400">Загрузка переписки...</p>
                  </div>
                </div>
              ) : conversation.length > 0 ? (
                conversation.map((msg: any) => {
                  const isOwn = msg.sender.id === user?.id

                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xl rounded-[1.35rem] border px-4 py-3 ${
                          isOwn
                            ? 'border-[#ff6b4a]/20 bg-[#ff6b4a]/12 text-white'
                            : 'border-white/10 bg-white/5 text-white'
                        }`}
                      >
                        {!isOwn && (
                          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                            {msg.sender.firstName} {msg.sender.lastName}
                          </div>
                        )}
                        <p className="text-sm leading-6">{msg.content}</p>
                        <div className={`mt-2 text-xs ${isOwn ? 'text-[#ffb29f]' : 'text-slate-400'}`}>
                          {format(new Date(msg.createdAt), 'HH:mm', { locale: ru })}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <EmptyState
                  icon={FaComments}
                  title="Сообщений пока нет"
                  description="Начните переписку первым сообщением. Диалог будет появляться в этом окне автоматически."
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
          </div>
        </div>
      </Section>
    </Page>
  )
}
