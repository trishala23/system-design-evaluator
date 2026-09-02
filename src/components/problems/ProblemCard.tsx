import { ArrowRight } from 'lucide-react'
import type { Problem } from '../../types'

const DIFFICULTY_STYLES: Record<Problem['difficulty'], string> = {
  Easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  Hard: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
}

export function ProblemCard({ problem, bestScore, onOpen }: { problem: Problem; bestScore?: number; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-600"
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${DIFFICULTY_STYLES[problem.difficulty]}`}>
          {problem.difficulty}
        </span>
        {bestScore !== undefined && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Last: {bestScore}
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{problem.title}</h3>
      <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{problem.summary}</p>
      <div className="flex flex-wrap gap-1.5">
        {problem.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          >
            {tag}
          </span>
        ))}
      </div>
      <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
        Start designing <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}
