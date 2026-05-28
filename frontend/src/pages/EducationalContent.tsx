import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FaBookOpen,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaExternalLinkAlt,
  FaPlayCircle,
  FaSignal,
} from 'react-icons/fa'
import apiClient from '../api/client'
import {
  Badge,
  EmptyState,
  FilterBar,
  Page,
  PageHeader,
  Section,
  Surface,
  cx,
} from '../components/ui'

type ContentType = 'ARTICLE' | 'VIDEO' | 'CHECKLIST'

type EducationalItem = {
  id: number
  title: string
  content: string
  type: ContentType
  videoUrl?: string | null
  imageUrl?: string | null
  category: string
  provider?: string | null
  difficulty?: string | null
  durationMinutes?: number | null
  sortOrder?: number | null
}

const TYPE_LABELS: Record<ContentType, string> = {
  ARTICLE: 'Статья',
  VIDEO: 'Видео',
  CHECKLIST: 'Чек-лист',
}

const TYPE_STYLES: Record<ContentType, string> = {
  ARTICLE: 'bg-sky-500/12 text-sky-200 border-sky-400/20',
  VIDEO: 'bg-surface-3 text-info border-border',
  CHECKLIST: 'bg-emerald-500/12 text-emerald-200 border-emerald-400/20',
}

function extractYoutubeId(url?: string | null) {
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1) || null
    }

    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.split('/embed/')[1] || null
      }

      return parsed.searchParams.get('v')
    }
  } catch {
    return null
  }

  return null
}

function buildEmbedUrl(url?: string | null) {
  const videoId = extractYoutubeId(url)
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` : null
}

function getTypeIcon(type: ContentType) {
  if (type === 'VIDEO') {
    return FaPlayCircle
  }
  if (type === 'CHECKLIST') {
    return FaCheckCircle
  }
  return FaBookOpen
}

function formatDuration(duration?: number | null) {
  if (!duration) {
    return 'Без оценки'
  }

  return `${duration} мин`
}

export default function EducationalContent() {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)

  const { data: content = [], isLoading } = useQuery<EducationalItem[]>({
    queryKey: ['educational-content'],
    queryFn: async () => {
      const response = await apiClient.get('/educational-content')
      return response.data
    },
  })

  const orderedContent = useMemo(
    () =>
      [...content].sort(
        (left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
      ),
    [content]
  )

  const filteredContent = orderedContent

  const topicsCount = useMemo(
    () => new Set(orderedContent.map((item) => item.category)).size,
    [orderedContent]
  )

  const totalVideoMinutes = useMemo(
    () => orderedContent.filter((item) => item.type === 'VIDEO').reduce((sum, item) => sum + (item.durationMinutes ?? 0), 0),
    [orderedContent]
  )

  useEffect(() => {
    if (filteredContent.length === 0) {
      setSelectedItemId(null)
      return
    }

    const selectedStillVisible = filteredContent.some((item) => item.id === selectedItemId)
    if (!selectedStillVisible) {
      setSelectedItemId(filteredContent[0].id)
    }
  }, [filteredContent, selectedItemId])

  const selectedItem =
    filteredContent.find((item) => item.id === selectedItemId) ??
    orderedContent.find((item) => item.id === selectedItemId) ??
    null

  const selectedEmbedUrl = buildEmbedUrl(selectedItem?.videoUrl)
  const SelectedItemIcon = selectedItem ? getTypeIcon(selectedItem.type) : null
  const selectedIndex = selectedItem ? filteredContent.findIndex((item) => item.id === selectedItem.id) : -1
  const previousItem = selectedIndex > 0 ? filteredContent[selectedIndex - 1] : null
  const nextItem = selectedIndex >= 0 && selectedIndex < filteredContent.length - 1 ? filteredContent[selectedIndex + 1] : null

  if (isLoading) {
    return (
      <Page>
        <div className="p-10 text-center">
          <div className="inline-block h-9 w-9 animate-spin rounded-full border-b-2 border-info"></div>
          <p className="mt-3 text-sm text-slate-400">Загрузка материалов...</p>
        </div>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader title="Знания" />

      <FilterBar>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <Badge>{topicsCount} тем</Badge>
          <Badge>{orderedContent.length} материалов</Badge>
          <Badge>{totalVideoMinutes} минут видео</Badge>
        </div>
      </FilterBar>

      <Section>
        {filteredContent.length > 0 && selectedItem ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={TYPE_STYLES[selectedItem.type]}>{TYPE_LABELS[selectedItem.type]}</Badge>
                  <Badge>{selectedItem.category}</Badge>
                  {selectedItem.provider ? <Badge>{selectedItem.provider}</Badge> : null}
                  {selectedItem.difficulty ? (
                    <Badge tone="bg-white/5 text-slate-200 border border-white/10">{selectedItem.difficulty}</Badge>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => previousItem && setSelectedItemId(previousItem.id)}
                    disabled={!previousItem}
                    className="btn-secondary px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Предыдущий урок"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    type="button"
                    onClick={() => nextItem && setSelectedItemId(nextItem.id)}
                    disabled={!nextItem}
                    className="btn-secondary px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Следующий урок"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-border bg-surface-2">
                {selectedEmbedUrl ? (
                  <div className="aspect-video">
                    <iframe
                      className="h-full w-full"
                      src={selectedEmbedUrl}
                      title={selectedItem.title}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[320px] items-center justify-center bg-surface-3 p-8 text-center">
                    <div className="max-w-xl">
                      {SelectedItemIcon ? <SelectedItemIcon className="mx-auto text-6xl text-text-muted" /> : null}
                      <p className="mt-5 text-xl font-semibold text-white">{TYPE_LABELS[selectedItem.type]}</p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">{selectedItem.content}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <span>
                    Урок {selectedIndex + 1} из {filteredContent.length}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <FaClock className="text-text-muted" />
                    {formatDuration(selectedItem.durationMinutes)}
                  </span>
                  {selectedItem.difficulty ? (
                    <span className="inline-flex items-center gap-2">
                      <FaSignal className="text-text-muted" />
                      {selectedItem.difficulty}
                    </span>
                  ) : null}
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedItem.title}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{selectedItem.content}</p>
                </div>

                {selectedItem.videoUrl ? (
                  <a
                    href={selectedItem.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary inline-flex"
                  >
                    <FaExternalLinkAlt />
                    Открыть источник
                  </a>
                ) : null}
              </div>
            </div>

            <Surface className="h-fit p-0 xl:sticky xl:top-6">
              <div className="border-b border-white/10 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Программа</p>
                    <h3 className="mt-2 text-xl font-bold text-white">Уроки и материалы</h3>
                  </div>
                  <Badge>{filteredContent.length}</Badge>
                </div>
              </div>

              <div className="max-h-[720px] overflow-y-auto p-3">
                <div className="space-y-2">
                  {filteredContent.map((item, index) => {
                    const LessonIcon = getTypeIcon(item.type)

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedItemId(item.id)}
                        className={cx(
                          'w-full rounded-lg border p-4 text-left transition-all',
                          selectedItem.id === item.id
                            ? 'border-info bg-surface-3'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-text-muted">
                            <LessonIcon />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <span>Урок {index + 1}</span>
                              <span>{TYPE_LABELS[item.type]}</span>
                            </div>
                            <p className="mt-2 text-sm font-semibold leading-6 text-white">{item.title}</p>
                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                              <span>{item.category}</span>
                              {item.provider ? <span>{item.provider}</span> : null}
                              <span>{formatDuration(item.durationMinutes)}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </Surface>
          </div>
        ) : (
          <EmptyState
            icon={FaBookOpen}
            title="Материалы не найдены"
            description="Материалы появятся здесь."
          />
        )}
      </Section>
    </Page>
  )
}
