import type { ReactNode } from 'react'
import type { Problem } from '../../types'

export function BriefTab({ problem }: { problem: Problem }) {
  return (
    <div className="flex flex-col gap-5 overflow-y-auto p-4 text-sm">
      <div>
        <p className="text-slate-600 dark:text-slate-300">{problem.summary}</p>
      </div>

      <Section title="Functional Requirements">
        <ul className="list-disc space-y-1 pl-4 text-slate-600 dark:text-slate-300">
          {problem.functionalRequirements.map((req) => (
            <li key={req}>{req}</li>
          ))}
        </ul>
      </Section>

      <Section title="Non-Functional Requirements">
        <ul className="list-disc space-y-1 pl-4 text-slate-600 dark:text-slate-300">
          {problem.nonFunctionalRequirements.map((req) => (
            <li key={req}>{req}</li>
          ))}
        </ul>
      </Section>

      <Section title="Scale & Constraints">
        <ul className="flex flex-col gap-1.5">
          {problem.constraints.map((c) => (
            <li
              key={c}
              className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {c}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      {children}
    </div>
  )
}
