import { Background, BackgroundVariant, ReactFlow, ReactFlowProvider } from '@xyflow/react'
import { X } from 'lucide-react'
import { DesignNode } from './DesignNode'
import type { Problem } from '../../types'
import type { FlowEdge, FlowNode } from '../../flowTypes'

const nodeTypes = { designNode: DesignNode }

export function ReferenceDesignModal({ problem, onClose }: { problem: Problem; onClose: () => void }) {
  const nodes: FlowNode[] = problem.reference.nodes.map((n) => ({
    id: n.id,
    position: { x: n.x, y: n.y },
    type: 'designNode',
    draggable: false,
    data: { type: n.type, label: n.label, notes: '' },
  }))
  const edges: FlowEdge[] = problem.reference.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
  }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={onClose}>
      <div
        className="flex h-full max-h-[720px] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Reference Design</p>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{problem.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-5">
          <div className="h-64 border-b border-slate-200 md:col-span-3 md:h-auto md:border-b-0 md:border-r dark:border-slate-800">
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
              </ReactFlow>
            </ReactFlowProvider>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto p-4 md:col-span-2">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Overview</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{problem.reference.overview}</p>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Trade-offs</p>
              <ul className="list-disc space-y-1.5 pl-4 text-sm text-slate-600 dark:text-slate-300">
                {problem.reference.tradeoffs.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
