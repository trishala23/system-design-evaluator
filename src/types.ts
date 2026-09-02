/** Core domain types shared across the app: the component catalog, the
 * problem bank shape, the rubric format the evaluator consumes, and the
 * shape of a user's in-progress design. Add new problems in
 * `src/data/problems.ts` and new draggable components in
 * `src/data/palette.ts` — both are typed against this file. */

export type ComponentType =
  | 'client'
  | 'load_balancer'
  | 'api_gateway'
  | 'web_server'
  | 'app_server'
  | 'microservice'
  | 'sql_database'
  | 'nosql_database'
  | 'cache'
  | 'message_queue'
  | 'cdn'
  | 'object_storage'
  | 'search_index'
  | 'auth_service'
  | 'notification_service'
  | 'websocket_service'
  | 'stream_processor'
  | 'third_party_api'

export interface PaletteItem {
  type: ComponentType
  label: string
  description: string
  category: 'client' | 'compute' | 'data' | 'messaging' | 'networking' | 'external'
}

export interface DesignNodeData {
  type: ComponentType
  label: string
  notes: string
  [key: string]: unknown
}

export interface DesignEdgeData {
  label?: string
  protocol?: 'sync' | 'async'
  [key: string]: unknown
}

export interface KeyQuestion {
  id: string
  prompt: string
  /** Words/phrases whose presence in the free-text answer earns credit. Matching is
   * case-insensitive substring matching — keep entries short and specific. */
  keywords: string[]
}

export type RubricCheck =
  | {
      kind: 'component-present'
      id: string
      label: string
      hint: string
      points: number
      anyOf: ComponentType[]
    }
  | {
      kind: 'component-count-min'
      id: string
      label: string
      hint: string
      points: number
      type: ComponentType
      min: number
    }
  | {
      kind: 'connection-exists'
      id: string
      label: string
      hint: string
      points: number
      between: [ComponentType, ComponentType]
    }
  | {
      kind: 'keyword-in-answers'
      id: string
      label: string
      hint: string
      points: number
      keywords: string[]
      /** Restrict the search to specific question ids; omit to search all answers + node notes. */
      questionIds?: string[]
    }
  | {
      kind: 'no-orphan-nodes'
      id: string
      label: string
      hint: string
      points: number
    }
  | {
      kind: 'min-nodes'
      id: string
      label: string
      hint: string
      points: number
      min: number
    }

export interface RubricCategory {
  id: string
  name: string
  /** Fraction of the overall score this category contributes. All categories in a
   * problem's rubric should sum to 1. */
  weight: number
  checks: RubricCheck[]
}

export interface ReferenceNode {
  id: string
  type: ComponentType
  label: string
  x: number
  y: number
}

export interface ReferenceEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface ReferenceDesign {
  overview: string
  nodes: ReferenceNode[]
  edges: ReferenceEdge[]
  tradeoffs: string[]
}

export interface Problem {
  id: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  tags: string[]
  summary: string
  functionalRequirements: string[]
  nonFunctionalRequirements: string[]
  constraints: string[]
  keyQuestions: KeyQuestion[]
  rubric: RubricCategory[]
  reference: ReferenceDesign
}

export interface SerializedNode {
  id: string
  position: { x: number; y: number }
  data: DesignNodeData
}

export interface SerializedEdge {
  id: string
  source: string
  target: string
  data?: DesignEdgeData
}

export interface Attempt {
  problemId: string
  nodes: SerializedNode[]
  edges: SerializedEdge[]
  answers: Record<string, string>
  updatedAt: number
}

export interface CategoryResult {
  id: string
  name: string
  weight: number
  earnedPoints: number
  possiblePoints: number
  scorePercent: number
  metChecks: { id: string; label: string }[]
  missedChecks: { id: string; label: string; hint: string }[]
}

export interface EvaluationResult {
  problemId: string
  overallScore: number
  categories: CategoryResult[]
  strengths: string[]
  gaps: string[]
  evaluatedAt: number
}

export interface HistoryEntry {
  problemId: string
  problemTitle: string
  overallScore: number
  evaluatedAt: number
}
