import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'

export default function EducationalContent() {
  const { data: content, isLoading } = useQuery({
    queryKey: ['educational-content'],
    queryFn: async () => {
      const response = await apiClient.get('/educational-content')
      return response.data
    },
  })

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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">📚 Обучающий контент</h1>
        <p className="text-slate-400">Полезные материалы по обслуживанию автомобилей</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {content && content.length > 0 ? (
          content.map((item: any) => (
            <div key={item.id} className="auto-card p-6">
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400 mb-3">Категория: {item.category}</p>
              <p className="text-slate-300 line-clamp-3 mb-4">{item.content}</p>
              {item.videoUrl && (
                <a
                  href={item.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300 font-medium inline-flex items-center gap-2"
                >
                  ▶ Смотреть видео
                </a>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full auto-card p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-slate-400 text-lg">Контент пока не добавлен</p>
          </div>
        )}
      </div>
    </div>
  )
}
