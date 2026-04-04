import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { FaComments, FaPaperPlane, FaClock } from 'react-icons/fa'

export default function Chat() {
  const { receiverId } = useParams()
  const { user } = useAuthStore()
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data: conversation, isLoading } = useQuery({
    queryKey: ['messages', 'conversation', receiverId],
    queryFn: async () => {
      if (!receiverId) return []
      const response = await apiClient.get(`/messages/conversation/${receiverId}`)
      return response.data
    },
    enabled: !!receiverId,
    refetchInterval: 3000,
  })

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!receiverId) throw new Error('Receiver ID is required')
      const response = await apiClient.post('/messages', {
        receiverId: parseInt(receiverId),
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
      const errorMessage = error.response?.data?.message || 
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim())
    }
  }

  if (!receiverId) {
    return (
      <div className="p-6">
        <div className="auto-card p-12 text-center">
          <FaComments className="text-6xl text-red-500 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold text-white mb-4">Выберите получателя</h2>
          <p className="text-slate-400 mb-6">
            Для начала переписки необходимо указать получателя сообщения
          </p>
          <p className="text-sm text-slate-500">
            Используйте URL вида: /chat/123, где 123 - ID пользователя
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <p className="mt-2 text-slate-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-2">
          <FaComments className="text-red-500" />
          Чат
        </h1>
        <p className="text-slate-400">Общение с сервисными центрами и поддержкой</p>
      </div>

      <div className="flex-1 auto-card rounded-lg flex flex-col overflow-hidden">
        {/* Сообщения */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversation && conversation.length > 0 ? (
            conversation.map((msg: any) => {
              const isOwn = msg.sender.id === user?.id
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwn
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    {!isOwn && (
                      <div className="text-xs font-semibold mb-1 opacity-75">
                        {msg.sender.firstName} {msg.sender.lastName}
                      </div>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <div className={`text-xs mt-1 ${isOwn ? 'text-red-100' : 'text-slate-400'}`}>
                      {format(new Date(msg.createdAt), 'HH:mm', { locale: ru })}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center text-slate-400 py-8">
              <FaComments className="text-6xl text-red-500 mx-auto mb-4 opacity-50" />
              <p>Нет сообщений. Начните переписку!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Форма отправки */}
        <form onSubmit={handleSend} className="border-t border-slate-700 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Введите сообщение..."
              className="auto-input flex-1"
            />
            <button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="auto-button-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sendMessageMutation.isPending ? (
                <>
                  <FaClock className="animate-spin" />
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
  )
}
