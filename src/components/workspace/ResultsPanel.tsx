import { CheckCircle2, Circle, Sparkles } from 'lucide-react'
import type { EvaluationResult } from '../../types'

interface ResultsPanelProps {
  result: EvaluationResult | null
  onEvaluate: () => void
  onViewReference: () => void
  aiFeedback?: string | null
  aiLoading?: boolean
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 50) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function scoreRing(score: number) {
  if (score >= 80) return 'stroke-emerald-500'
  if (score >= 50) return 'stroke-amber-500'
  return 'stroke-red-500'
}

export function ResultsPanel({ result, onEvaluate, onViewReference, aiFeedback, aiLoading }: ResultsPanelProps) {
  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Build your design and answer the key questions, then evaluate to get a rubric-based score and feedback.
        </p>
        <button
          onClick={onEvaluate}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Evaluate my design
        </button>
      </div>
    )
  }

  const circumference = 2 * Math.PI * 42

  return (
    <div className="flex flex-col gap-5 overflow-y-auto p-4">
      <div className="flex items-center gap-4">
        <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0 -rotate-90">
          <circle cx="48" cy="48" r="42" fill="none" strokeWidth="8" className="stroke-slate-200 dark:stroke-slate-700" />
          <circle
            cx="48"
            cy="48"
            r="42"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={scoreRing(result.overallScore)}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (result.overallScore / 100) * circumference}
          />
        </svg>
        <div>
          <p className={`text-3xl font-bold ${scoreColor(result.overallScore)}`}>{result.overallScore}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">out of 100</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {result.categories.map((cat) => (
          <div key={cat.id}>
            <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
              <span>{cat.name}</span>
              <span className={scoreColor(cat.scorePercent)}>{cat.scorePercent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full rounded-full ${cat.scorePercent >= 80 ? 'bg-emerald-500' : cat.scorePercent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${cat.scorePercent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {result.strengths.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">What's working</p>
          <ul className="flex flex-col gap-1.5">
            {result.strengths.map((s) => (
              <li key={s} className="flex gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.gaps.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Suggestions to improve</p>
          <ul className="flex flex-col gap-1.5">
            {result.gaps.map((g) => (
              <li key={g} className="flex gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <Circle size={14} className="mt-0.5 shrink-0 text-slate-300 dark:text-slate-600" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(aiFeedback || aiLoading) && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-900 dark:bg-indigo-500/10">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <Sparkles size={13} /> AI reviewer notes
          </p>
          {aiLoading ? (
            <p className="text-xs text-indigo-600 dark:text-indigo-300">Thinking…</p>
          ) : (
            <p className="whitespace-pre-wrap text-xs text-indigo-900 dark:text-indigo-200">{aiFeedback}</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onEvaluate}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Re-evaluate
        </button>
        <button
          onClick={onViewReference}
          className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
        >
          View reference design
        </button>
      </div>
    </div>
  )
}
