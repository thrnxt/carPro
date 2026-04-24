import { useQuery } from '@tanstack/react-query'
import { FaBookOpen, FaPlayCircle } from 'react-icons/fa'
import apiClient from '../api/client'
import { EmptyState, Page, PageHeader, Section } from '../components/ui'

export default function EducationalContent() {
  const { data: content = [], isLoading } = useQuery({
    queryKey: ['educational-content'],
    queryFn: async () => {
      const response = await apiClient.get('/educational-content')
      return response.data
    },
  })

  if (isLoading) {
    return (
      <Page>
        <div className="p-10 text-center">
          <div className="inline-block h-9 w-9 animate-spin rounded-full border-b-2 border-[#ff9b82]"></div>
          <p className="mt-3 text-sm text-slate-400">Загрузка материалов...</p>
        </div>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Knowledge base"
        title="Обучающий контент"
        description="Материалы, заметки и видео встроены в тот же продуктовый shell, чтобы knowledge-слой не выглядел отдельным учебным разделом."
      />

      <Section title="Материалы" description="Подборка полезных публикаций и видео по обслуживанию автомобиля.">
        {content.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {content.map((item: any) => (
              <div key={item.id} className="auto-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {item.category}
                    </p>
                    <h3 className="mt-2 text-xl font-bold tracking-[-0.04em] text-white">{item.title}</h3>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#ff9b82]">
                    <FaBookOpen />
                  </div>
                </div>

                <p className="mt-4 line-clamp-4 text-sm leading-7 text-slate-300">{item.content}</p>

                {item.videoUrl && (
                  <a
                    href={item.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#ff9b82] transition-colors hover:text-[#ffb29f]"
                  >
                    <FaPlayCircle />
                    Смотреть видео
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FaBookOpen}
            title="Контент пока не добавлен"
            description="Когда материалы появятся в системе, этот раздел станет частью общего knowledge workspace."
          />
        )}
      </Section>
    </Page>
  )
}
