import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'

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
    } else {
      calculateScore()
      setShowResults(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const calculateScore = () => {
    let correct = 0
    quiz?.questions?.forEach((question: any, index: number) => {
      const selectedAnswerId = selectedAnswers[index]
      const correctAnswer = question.answers.find((a: any) => a.isCorrect)
      if (selectedAnswerId === correctAnswer?.id) {
        correct++
      }
    })
    setScore(correct)
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

  if (!quiz) {
    return (
      <div className="p-6">
        <div className="auto-card p-12 text-center">
          <p className="text-white text-xl">Квиз не найден</p>
        </div>
      </div>
    )
  }

  const currentQuestion = quiz.questions?.[currentQuestionIndex]
  const totalQuestions = quiz.questions?.length || 0
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  if (showResults) {
    const percentage = Math.round((score / totalQuestions) * 100)
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="auto-card p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Результаты квиза</h1>
          <div className="text-6xl font-bold text-red-400 mb-4">
            {score} / {totalQuestions}
          </div>
          <div className="text-2xl mb-6 text-white">
            {percentage >= 80 ? '🎉 Отлично!' :
             percentage >= 60 ? '👍 Хорошо!' :
             '📚 Есть что улучшить'}
          </div>
          <div className="mb-6">
            <div className="w-full bg-slate-700 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${
                  percentage >= 80 ? 'bg-emerald-500' :
                  percentage >= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="mt-2 text-slate-400">{percentage}% правильных ответов</p>
          </div>
          <button
            onClick={() => {
              setShowResults(false)
              setCurrentQuestionIndex(0)
              setSelectedAnswers({})
              setScore(0)
            }}
            className="auto-button-primary"
          >
            🔄 Пройти еще раз
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="auto-card p-6">
        <h1 className="text-2xl font-bold text-white mb-4">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-slate-300 mb-6">{quiz.description}</p>
        )}

        {/* Прогресс */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Вопрос {currentQuestionIndex + 1} из {totalQuestions}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Вопрос */}
        {currentQuestion && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">{currentQuestion.question}</h2>
            
            <div className="space-y-3 mb-6">
              {currentQuestion.answers?.map((answer: any) => (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerSelect(answer.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAnswers[currentQuestionIndex] === answer.id
                      ? 'border-red-500 bg-red-900/30 text-white'
                      : 'border-slate-600 bg-slate-800/50 text-white hover:border-slate-500'
                  }`}
                >
                  {answer.answer}
                </button>
              ))}
            </div>

            {/* Навигация */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="auto-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Назад
              </button>
              <button
                onClick={handleNext}
                disabled={!selectedAnswers[currentQuestionIndex]}
                className="auto-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentQuestionIndex === totalQuestions - 1 ? 'Завершить' : 'Далее →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
