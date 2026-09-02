import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ICON_BY_TYPE } from '../../data/palette'
import type { FlowNode } from '../../flowTypes'

export function DesignNode({ data, selected }: NodeProps<FlowNode>) {
  const Icon = ICON_BY_TYPE[data.type]
  return (
    <div
      className={`group flex min-w-[150px] items-center gap-2 rounded-xl border-2 bg-white px-3 py-2 shadow-sm transition dark:bg-slate-800 ${
        selected ? 'border-indigo-500 shadow-indigo-200 dark:shadow-none' : 'border-slate-300 dark:border-slate-600'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-slate-400" />
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !bg-slate-400" />
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{data.label}</div>
        {data.notes ? <div className="truncate text-[11px] text-slate-400 dark:text-slate-500">{data.notes}</div> : null}
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-slate-400" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !bg-slate-400" />
    </div>
  )
}
