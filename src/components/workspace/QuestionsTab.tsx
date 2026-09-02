import type { Problem } from '../../types'

interface QuestionsTabProps {
  problem: Problem
  answers: Record<string, string>
  onChangeAnswer: (questionId: string, text: string) => void
}

export function QuestionsTab({ problem, answers, onChangeAnswer }: QuestionsTabProps) {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Answer these alongside your diagram — the evaluator reads them too, so explain your key decisions.
      </p>
      {problem.keyQuestions.map((q) => (
        <label key={q.id} className="flex flex-col gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
          {q.prompt}
          <textarea
            value={answers[q.id] ?? ''}
            onChange={(e) => onChangeAnswer(q.id, e.target.value)}
            rows={4}
            placeholder="Type your reasoning here..."
            className="resize-none rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-normal text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
      ))}
    </div>
  )
}
