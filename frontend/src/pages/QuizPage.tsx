import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaRedoAlt } from 'react-icons/fa'
import apiClient from '../api/client'
import { EmptyState, Page, PageHeader, Section } from '../components/ui'

export default function QuizPage() {
  const { id } = useParams()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', id],
    queryFn: async () => {
      const response = await apiClient.get(`/quizzes/${id}`)
      return response.data
    },
    enabled: !!id,
  })

  const handleAnswerSelect = (answerId: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answerId,
    })
  }

  const handleNext = () => {
    if (currentQuestionIndex < (quiz?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      return
    }

    let correct = 0
    quiz?.questions?.forEach((question: any, index: number) => {
      const selectedAnswerId = selectedAnswers[index]
      const correctAnswer = question.answers.find((answer: any) => answer.isCorrect)
      if (selectedAnswerId === correctAnswer?.id) {
        correct += 1
      }
    })

    setScore(correct)
    setShowResults(true)
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  if (isLoading) {
    return (
      <Page>
        <div className="p-10 text-center">
          <div className="inline-block h-9 w-9 animate-spin rounded-full border-b-2 border-[#ff9b82]"></div>
          <p className="mt-3 text-sm text-slate-400">Загрузка квиза...</p>
        </div>
      </Page>
    )
  }

  if (!quiz) {
    return (
      <Page>
        <Section title="Квиз не найден" description="Проверьте ссылку или вернитесь в раздел материалов.">
          <EmptyState
            icon={FaCheckCircle}
            title="Квиз не найден"
            description="Запрошенный тест недоступен или был удален."
          />
        </Section>
      </Page>
    )
  }

  const currentQuestion = quiz.questions?.[currentQuestionIndex]
  const totalQuestions = quiz.questions?.length || 0
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0

  if (showResults) {
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
    const resultTitle =
      percentage >= 80 ? 'Отличный результат' : percentage >= 60 ? 'Хороший результат' : 'Есть что улучшить'
    const resultTone =
      percentage >= 80 ? 'text-emerald-300' : percentage >= 60 ? 'text-amber-300' : 'text-rose-300'
    const resultBar =
      percentage >= 80 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'

    return (
      <Page className="max-w-4xl mx-auto">
        <PageHeader
          eyebrow="Knowledge"
          title="Результаты квиза"
          description="Проверка знаний оформлена как часть основного продукта, а не как отдельный учебный экран."
        />

        <Section title={resultTitle} description={`Вы ответили правильно на ${score} из ${totalQuestions} вопросов.`}>
          <div className="mx-auto max-w-2xl rounded-[1.6rem] border border-white/10 bg-white/5 p-8 text-center">
            <div className={`text-6xl font-extrabold tracking-[-0.08em] ${resultTone}`}>{percentage}%</div>
            <p className="mt-4 text-lg font-semibold text-white">
              {score} / {totalQuestions}
            </p>
            <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-800">
              <div className={`h-4 rounded-full ${resultBar}`} style={{ width: `${percentage}%` }} />
            </div>
            <p className="mt-3 text-sm text-slate-400">Итоговая точность ответов</p>

            <button
              onClick={() => {
                setShowResults(false)
                setCurrentQuestionIndex(0)
                setSelectedAnswers({})
                setScore(0)
              }}
              className="auto-button-primary mt-8"
            >
              <FaRedoAlt />
              Пройти заново
            </button>
          </div>
        </Section>
      </Page>
    )
  }

  return (
    <Page className="max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Knowledge"
        title={quiz.title}
        description={quiz.description || 'Короткий тест для проверки понимания материалов и сценариев обслуживания.'}
      />

      <Section title={`Вопрос ${currentQuestionIndex + 1} из ${totalQuestions}`} description="Выберите один ответ и двигайтесь по квизу последовательно.">
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
            <span>Прогресс</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-2 rounded-full bg-[#ff6b4a] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {currentQuestion && (
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">{currentQuestion.question}</h2>

            <div className="mt-6 space-y-3">
              {currentQuestion.answers?.map((answer: any) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === answer.id

                return (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswerSelect(answer.id)}
                    className={`w-full rounded-[1.35rem] border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-[#ff6b4a]/25 bg-[#ff6b4a]/12 text-white'
                        : 'border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/8'
                    }`}
                  >
                    {answer.answer}
                  </button>
                )
              })}
            </div>

            <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="auto-button-secondary justify-center disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaArrowLeft />
                Назад
              </button>

              <button
                onClick={handleNext}
                disabled={!selectedAnswers[currentQuestionIndex]}
                className="auto-button-primary justify-center disabled:cursor-not-allowed disabled:opacity-50"
              >
                {currentQuestionIndex === totalQuestions - 1 ? 'Завершить квиз' : 'Следующий вопрос'}
                <FaArrowRight />
              </button>
            </div>
          </div>
        )}
      </Section>
    </Page>
  )
}
