import { useCallback, useRef, type DragEvent } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react'
import { v4 as uuid } from 'uuid'
import { DesignNode } from './DesignNode'
import type { ComponentType } from '../../types'
import type { FlowEdge, FlowNode } from '../../flowTypes'
import { PALETTE_BY_TYPE } from '../../data/palette'

const nodeTypes = { designNode: DesignNode }

interface DesignCanvasProps {
  nodes: FlowNode[]
  edges: FlowEdge[]
  selectedNodeId: string | null
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void
  onConnect: (connection: FlowEdge) => void
  onAddNode: (node: FlowNode) => void
  onSelectNode: (id: string | null) => void
}

function DesignCanvasInner({
  nodes,
  edges,
  selectedNodeId,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddNode,
  onSelectNode,
}: DesignCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect({ ...connection, id: uuid(), data: { protocol: 'sync' } } as FlowEdge)
    },
    [onConnect],
  )

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/x-sde-component') as ComponentType
      if (!type || !wrapperRef.current) return
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      const paletteItem = PALETTE_BY_TYPE[type]
      onAddNode({
        id: uuid(),
        type: 'designNode',
        position,
        data: { type, label: paletteItem.label, notes: '' },
      })
    },
    [onAddNode, screenToFlowPosition],
  )

  return (
    <div
      ref={wrapperRef}
      data-testid="design-canvas"
      className="relative h-full w-full"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <ReactFlow
        nodes={nodes.map((n) => ({ ...n, selected: n.id === selectedNodeId }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable className="!bg-white dark:!bg-slate-800" />
      </ReactFlow>
    </div>
  )
}

export function DesignCanvas(props: DesignCanvasProps) {
  return (
    <ReactFlowProvider>
      <DesignCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
