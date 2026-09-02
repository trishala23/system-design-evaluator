import { ICON_BY_TYPE, PALETTE_BY_TYPE } from '../../data/palette'
import type { SerializedNode } from '../../types'

interface InspectorTabProps {
  node: SerializedNode | null
  onChangeLabel: (label: string) => void
  onChangeNotes: (notes: string) => void
  onDelete: () => void
}

export function InspectorTab({ node, onChangeLabel, onChangeNotes, onDelete }: InspectorTabProps) {
  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-400">
        <p>Select a component on the canvas to edit its label and notes.</p>
      </div>
    )
  }

  const Icon = ICON_BY_TYPE[node.data.type]
  const paletteItem = PALETTE_BY_TYPE[node.data.type]

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Icon size={16} />
        <span className="text-xs font-medium uppercase tracking-wide">{paletteItem.label}</span>
      </div>

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
        Label
        <input
          value={node.data.label}
          onChange={(e) => onChangeLabel(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
        Notes
        <textarea
          value={node.data.notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          rows={5}
          placeholder="Why this component? What's it responsible for?"
          className="resize-none rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>

      <button
        onClick={onDelete}
        className="mt-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
      >
        Delete component
      </button>
    </div>
  )
}
