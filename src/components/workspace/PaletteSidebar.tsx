import { CATEGORY_LABELS, ICON_BY_TYPE, PALETTE } from '../../data/palette'
import type { PaletteItem } from '../../types'

const CATEGORIES: PaletteItem['category'][] = ['client', 'networking', 'compute', 'data', 'messaging', 'external']

export function PaletteSidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Components</p>
      <p className="mb-3 px-1 text-[11px] text-slate-400">Drag onto the canvas to add.</p>
      {CATEGORIES.map((category) => (
        <div key={category} className="mb-4">
          <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {CATEGORY_LABELS[category]}
          </p>
          <div className="flex flex-col gap-1.5">
            {PALETTE.filter((item) => item.category === category).map((item) => (
              <PaletteChip key={item.type} item={item} />
            ))}
          </div>
        </div>
      ))}
    </aside>
  )
}

function PaletteChip({ item }: { item: PaletteItem }) {
  const Icon = ICON_BY_TYPE[item.type]
  return (
    <div
      draggable
      data-testid={`palette-chip-${item.type}`}
      onDragStart={(event) => {
        event.dataTransfer.setData('application/x-sde-component', item.type)
        event.dataTransfer.effectAllowed = 'move'
      }}
      title={item.description}
      className="flex cursor-grab items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
    >
      <Icon size={14} className="shrink-0" />
      <span className="truncate">{item.label}</span>
    </div>
  )
}
