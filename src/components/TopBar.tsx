import { Layers3, Moon, Settings, Sun } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export function TopBar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Layers3 size={16} />
        </div>
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">System Design Evaluator</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  )
}
