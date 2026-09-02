import { PROBLEMS } from '../../data/problems'
import { useAppStore } from '../../store/useAppStore'
import { ProblemCard } from './ProblemCard'

export function ProblemListView() {
  const openProblem = useAppStore((s) => s.openProblem)
  const results = useAppStore((s) => s.results)
  const history = useAppStore((s) => s.history)

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Practice a system design interview</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Pick a problem, sketch your architecture on the canvas, answer the key trade-off questions, then get an
          instant rubric-based evaluation with a reference design to compare against.
        </p>
      </div>

      {history.length > 0 && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent attempts</p>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 8).map((h, i) => (
              <span
                key={`${h.problemId}-${h.evaluatedAt}-${i}`}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {h.problemTitle}: <span className="font-semibold">{h.overallScore}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROBLEMS.map((problem) => (
          <ProblemCard
            key={problem.id}
            problem={problem}
            bestScore={results[problem.id]?.overallScore}
            onOpen={() => openProblem(problem.id)}
          />
        ))}
      </div>
    </div>
  )
}
