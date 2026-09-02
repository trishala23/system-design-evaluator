import { useState } from 'react'
import { X } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const apiKey = useAppStore((s) => s.apiKey)
  const setApiKey = useAppStore((s) => s.setApiKey)
  const [draft, setDraft] = useState(apiKey)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
          Anthropic API key (optional)
          <input
            type="password"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="sk-ant-..."
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Adds an optional AI-written review alongside the built-in rubric score. Your key is stored only in this
          browser's local storage and sent directly to Anthropic's API — never to any server of ours. Leave blank to
          use the rubric evaluator only, which works fully offline.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setApiKey(draft.trim())
              onClose()
            }}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
