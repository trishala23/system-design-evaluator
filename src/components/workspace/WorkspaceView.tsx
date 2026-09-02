import { useCallback, useMemo, useState } from 'react'
import { applyEdgeChanges, applyNodeChanges, type EdgeChange, type NodeChange } from '@xyflow/react'
import { ArrowLeft, ClipboardList, HelpCircle, RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react'
import { getProblemById } from '../../data/problems'
import { useAppStore } from '../../store/useAppStore'
import { evaluateDesign } from '../../engine/evaluator'
import { getAiFeedback } from '../../engine/aiEvaluator'
import type { FlowEdge, FlowNode } from '../../flowTypes'
import type { SerializedEdge, SerializedNode } from '../../types'
import { DesignCanvas } from './DesignCanvas'
import { PaletteSidebar } from './PaletteSidebar'
import { BriefTab } from './BriefTab'
import { QuestionsTab } from './QuestionsTab'
import { InspectorTab } from './InspectorTab'
import { ResultsPanel } from './ResultsPanel'
import { ReferenceDesignModal } from './ReferenceDesignModal'

type Tab = 'brief' | 'questions' | 'inspector' | 'results'

function toFlowNodes(nodes: SerializedNode[]): FlowNode[] {
  return nodes.map((n) => ({ id: n.id, position: n.position, data: n.data, type: 'designNode' }))
}
function toFlowEdges(edges: SerializedEdge[]): FlowEdge[] {
  return edges.map((e) => ({ id: e.id, source: e.source, target: e.target, data: e.data, label: e.data?.label }))
}
function toSerializedNodes(nodes: FlowNode[]): SerializedNode[] {
  return nodes.map((n) => ({ id: n.id, position: n.position, data: n.data }))
}
function toSerializedEdges(edges: FlowEdge[]): SerializedEdge[] {
  return edges.map((e) => ({ id: e.id, source: e.source, target: e.target, data: e.data }))
}

export function WorkspaceView({ problemId }: { problemId: string }) {
  return <WorkspaceInner key={problemId} problemId={problemId} />
}

function WorkspaceInner({ problemId }: { problemId: string }) {
  const problem = getProblemById(problemId)
  const attempt = useAppStore((s) => s.attempts[problemId])
  const setNodesInStore = useAppStore((s) => s.setNodes)
  const setEdgesInStore = useAppStore((s) => s.setEdges)
  const setAnswer = useAppStore((s) => s.setAnswer)
  const backToProblems = useAppStore((s) => s.backToProblems)
  const resetAttempt = useAppStore((s) => s.resetAttempt)
  const recordEvaluation = useAppStore((s) => s.recordEvaluation)
  const result = useAppStore((s) => s.results[problemId])
  const showReference = useAppStore((s) => s.showReference[problemId] ?? false)
  const toggleReference = useAppStore((s) => s.toggleReference)
  const apiKey = useAppStore((s) => s.apiKey)

  const [nodes, setNodes] = useState<FlowNode[]>(() => toFlowNodes(attempt?.nodes ?? []))
  const [edges, setEdges] = useState<FlowEdge[]>(() => toFlowEdges(attempt?.edges ?? []))
  const [activeTab, setActiveTab] = useState<Tab>('brief')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [aiFeedback, setAiFeedback] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const persist = useCallback(
    (nextNodes: FlowNode[], nextEdges: FlowEdge[]) => {
      setNodesInStore(problemId, toSerializedNodes(nextNodes))
      setEdgesInStore(problemId, toSerializedEdges(nextEdges))
    },
    [problemId, setNodesInStore, setEdgesInStore],
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      setNodes((current) => {
        const next = applyNodeChanges(changes, current)
        persist(next, edges)
        return next
      })
    },
    [edges, persist],
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<FlowEdge>[]) => {
      setEdges((current) => {
        const next = applyEdgeChanges(changes, current)
        persist(nodes, next)
        return next
      })
    },
    [nodes, persist],
  )

  const handleConnect = useCallback(
    (edge: FlowEdge) => {
      setEdges((current) => {
        const next = [...current, edge]
        persist(nodes, next)
        return next
      })
    },
    [nodes, persist],
  )

  const handleAddNode = useCallback(
    (node: FlowNode) => {
      setNodes((current) => {
        const next = [...current, node]
        persist(next, edges)
        return next
      })
    },
    [edges, persist],
  )

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) ?? null, [nodes, selectedNodeId])

  const updateSelectedNode = useCallback(
    (patch: Partial<FlowNode['data']>) => {
      if (!selectedNodeId) return
      setNodes((current) => {
        const next = current.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, ...patch } } : n))
        persist(next, edges)
        return next
      })
    },
    [edges, persist, selectedNodeId],
  )

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return
    setNodes((current) => {
      const next = current.filter((n) => n.id !== selectedNodeId)
      const nextEdges = edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId)
      setEdges(nextEdges)
      persist(next, nextEdges)
      return next
    })
    setSelectedNodeId(null)
  }, [edges, persist, selectedNodeId])

  const handleAnswerChange = useCallback(
    (questionId: string, text: string) => setAnswer(problemId, questionId, text),
    [problemId, setAnswer],
  )

  const handleEvaluate = useCallback(() => {
    if (!problem) return
    const evalResult = evaluateDesign(problem, toSerializedNodes(nodes), toSerializedEdges(edges), attempt?.answers ?? {})
    recordEvaluation(problem.title, evalResult)
    setActiveTab('results')
    setAiFeedback(null)
    setAiError(null)

    if (apiKey) {
      setAiLoading(true)
      getAiFeedback(apiKey, problem, toSerializedNodes(nodes), toSerializedEdges(edges), attempt?.answers ?? {}, evalResult)
        .then(setAiFeedback)
        .catch((err: Error) => setAiError(err.message))
        .finally(() => setAiLoading(false))
    }
  }, [apiKey, attempt?.answers, edges, nodes, problem, recordEvaluation])

  const handleReset = useCallback(() => {
    if (!confirm('Clear this design and start over?')) return
    resetAttempt(problemId)
    setNodes([])
    setEdges([])
    setSelectedNodeId(null)
    setAiFeedback(null)
    setActiveTab('brief')
  }, [problemId, resetAttempt])

  if (!problem) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
        Problem not found. <button onClick={backToProblems} className="ml-1 text-indigo-600 underline">Go back</button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={backToProblems}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={14} /> Problems
          </button>
          <div>
            <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{problem.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            onClick={handleEvaluate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
          >
            <Sparkles size={13} /> Evaluate
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <PaletteSidebar />
        <div className="min-w-0 flex-1">
          <DesignCanvas
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onAddNode={handleAddNode}
            onSelectNode={setSelectedNodeId}
          />
        </div>
        <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex shrink-0 border-b border-slate-200 dark:border-slate-800">
            <TabButton icon={ClipboardList} label="Brief" active={activeTab === 'brief'} onClick={() => setActiveTab('brief')} />
            <TabButton icon={HelpCircle} label="Q&A" active={activeTab === 'questions'} onClick={() => setActiveTab('questions')} />
            <TabButton
              icon={SlidersHorizontal}
              label="Inspect"
              active={activeTab === 'inspector'}
              onClick={() => setActiveTab('inspector')}
            />
            <TabButton icon={Sparkles} label="Results" active={activeTab === 'results'} onClick={() => setActiveTab('results')} />
          </div>
          <div className="flex-1 overflow-hidden">
            {activeTab === 'brief' && <BriefTab problem={problem} />}
            {activeTab === 'questions' && (
              <QuestionsTab problem={problem} answers={attempt?.answers ?? {}} onChangeAnswer={handleAnswerChange} />
            )}
            {activeTab === 'inspector' && (
              <InspectorTab
                node={selectedNode ? { id: selectedNode.id, position: selectedNode.position, data: selectedNode.data } : null}
                onChangeLabel={(label) => updateSelectedNode({ label })}
                onChangeNotes={(notes) => updateSelectedNode({ notes })}
                onDelete={deleteSelectedNode}
              />
            )}
            {activeTab === 'results' && (
              <ResultsPanel
                result={result ?? null}
                onEvaluate={handleEvaluate}
                onViewReference={() => toggleReference(problemId)}
                aiFeedback={aiError ? `Couldn't get AI feedback: ${aiError}` : aiFeedback}
                aiLoading={aiLoading}
              />
            )}
          </div>
        </aside>
      </div>

      {showReference && <ReferenceDesignModal problem={problem} onClose={() => toggleReference(problemId)} />}
    </div>
  )
}

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof ClipboardList
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 border-b-2 px-2 py-2.5 text-[11px] font-medium transition ${
        active
          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
          : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}
