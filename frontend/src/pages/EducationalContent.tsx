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
  FaSearch,
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
  SegmentedControl,
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

type FilterType = 'ALL' | ContentType

const TYPE_LABELS: Record<ContentType, string> = {
  ARTICLE: 'Статья',
  VIDEO: 'Видео',
  CHECKLIST: 'Чек-лист',
}

const TYPE_STYLES: Record<ContentType, string> = {
  ARTICLE: 'bg-sky-500/12 text-sky-200 border-sky-400/20',
  VIDEO: 'bg-[#ff6b4a]/12 text-orange-200 border-[#ff6b4a]/20',
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
  const [activeCategory, setActiveCategory] = useState<string>('Все')
  const [activeType, setActiveType] = useState<FilterType>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
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

  const categories = useMemo(
    () => ['Все', ...Array.from(new Set(orderedContent.map((item) => item.category)))],
    [orderedContent]
  )

  const filteredContent = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase()

    return orderedContent.filter((item) => {
      const matchesCategory = activeCategory === 'Все' || item.category === activeCategory
      const matchesType = activeType === 'ALL' || item.type === activeType

      const haystack = [
        item.title,
        item.content,
        item.category,
        item.provider,
        item.difficulty,
        TYPE_LABELS[item.type],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch = !normalizedQuery || haystack.includes(normalizedQuery)

      return matchesCategory && matchesType && matchesSearch
    })
  }, [activeCategory, activeType, orderedContent, searchTerm])

  const groupedContent = useMemo(() => {
    return categories
      .filter((category) => category !== 'Все')
      .map((category) => {
        const items = orderedContent.filter((item) => item.category === category)

        return {
          category,
          items,
          totalMinutes: items.reduce((sum, item) => sum + (item.durationMinutes ?? 0), 0),
        }
      })
      .filter((group) => group.items.length > 0)
  }, [categories, orderedContent])

  const totalVideoMinutes = useMemo(
    () => orderedContent.filter((item) => item.type === 'VIDEO').reduce((sum, item) => sum + (item.durationMinutes ?? 0), 0),
    [orderedContent]
  )

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory('Все')
    }
  }, [activeCategory, categories])

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
          <div className="inline-block h-9 w-9 animate-spin rounded-full border-b-2 border-[#ff9b82]"></div>
          <p className="mt-3 text-sm text-slate-400">Загрузка материалов...</p>
        </div>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader eyebrow="Знания" title="Знания" />

      <FilterBar className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <label className="relative block">
            <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Поиск по названию, теме или источнику"
              className="auto-input pl-11"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <Badge>{groupedContent.length} тем</Badge>
            <Badge>{orderedContent.length} материалов</Badge>
            <Badge>{totalVideoMinutes} минут видео</Badge>
          </div>
        </div>

        <SegmentedControl<FilterType>
          value={activeType}
          onChange={setActiveType}
          options={[
            { value: 'ALL', label: 'Все форматы' },
            { value: 'VIDEO', label: 'Видео' },
            { value: 'ARTICLE', label: 'Статьи' },
            { value: 'CHECKLIST', label: 'Чек-листы' },
          ]}
        />

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cx(
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                activeCategory === category
                  ? 'border-[#ff6b4a]/25 bg-[#ff6b4a]/12 text-white'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
              )}
            >
              {category}
            </button>
          ))}
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
                    className="auto-button-secondary px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Предыдущий урок"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    type="button"
                    onClick={() => nextItem && setSelectedItemId(nextItem.id)}
                    disabled={!nextItem}
                    className="auto-button-secondary px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Следующий урок"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#07101c] shadow-[0_24px_64px_-36px_rgba(2,6,23,0.95)]">
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
                  <div className="flex min-h-[320px] items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(255,107,74,0.18),transparent_34%),linear-gradient(180deg,#111c2b_0%,#08111b_100%)] p-8 text-center">
                    <div className="max-w-xl">
                      {SelectedItemIcon ? <SelectedItemIcon className="mx-auto text-6xl text-[#ff9b82]" /> : null}
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
                    <FaClock className="text-[#ff9b82]" />
                    {formatDuration(selectedItem.durationMinutes)}
                  </span>
                  {selectedItem.difficulty ? (
                    <span className="inline-flex items-center gap-2">
                      <FaSignal className="text-[#ff9b82]" />
                      {selectedItem.difficulty}
                    </span>
                  ) : null}
                </div>

                <div>
                  <h2 className="text-3xl font-bold tracking-[-0.04em] text-white">{selectedItem.title}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{selectedItem.content}</p>
                </div>

                {selectedItem.videoUrl ? (
                  <a
                    href={selectedItem.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="auto-button-secondary inline-flex"
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Программа</p>
                    <h3 className="mt-2 text-xl font-bold tracking-[-0.04em] text-white">Уроки и материалы</h3>
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
                          'w-full rounded-[1.25rem] border p-4 text-left transition-all',
                          selectedItem.id === item.id
                            ? 'border-[#ff6b4a]/25 bg-[#ff6b4a]/12'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#ff9b82]">
                            <LessonIcon />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-400">
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
            description="Измените фильтры или строку поиска."
          />
        )}
      </Section>

    </Page>
  )
}
