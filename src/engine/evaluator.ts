import type {
  CategoryResult,
  ComponentType,
  DesignEdgeData,
  DesignNodeData,
  EvaluationResult,
  Problem,
  RubricCheck,
  SerializedEdge,
  SerializedNode,
} from '../types'

/** Deterministic, rule-based scoring engine. No network calls, no randomness —
 * given the same design + answers it always produces the same result, which
 * keeps evaluation instant and works entirely offline (important since this
 * app ships as a static site with no backend). See `checkPasses` for how
 * each `RubricCheck` kind is interpreted. */

function componentCounts(nodes: SerializedNode[]): Map<ComponentType, number> {
  const counts = new Map<ComponentType, number>()
  for (const node of nodes) {
    const type = node.data.type
    counts.set(type, (counts.get(type) ?? 0) + 1)
  }
  return counts
}

function nodeTypeById(nodes: SerializedNode[]): Map<string, ComponentType> {
  return new Map(nodes.map((n) => [n.id, n.data.type]))
}

function connectionExists(
  nodes: SerializedNode[],
  edges: SerializedEdge[],
  between: [ComponentType, ComponentType],
): boolean {
  const typeById = nodeTypeById(nodes)
  const [a, b] = between
  return edges.some((edge) => {
    const sourceType = typeById.get(edge.source)
    const targetType = typeById.get(edge.target)
    if (!sourceType || !targetType) return false
    return (sourceType === a && targetType === b) || (sourceType === b && targetType === a)
  })
}

function hasOrphanNodes(nodes: SerializedNode[], edges: SerializedEdge[]): boolean {
  if (nodes.length === 0) return false
  const connected = new Set<string>()
  for (const edge of edges) {
    connected.add(edge.source)
    connected.add(edge.target)
  }
  return nodes.some((n) => !connected.has(n.id))
}

function gatherSearchableText(
  nodes: SerializedNode[],
  answers: Record<string, string>,
  questionIds: string[] | undefined,
): string {
  const answerText = Object.entries(answers)
    .filter(([qId]) => !questionIds || questionIds.includes(qId))
    .map(([, text]) => text)
    .join(' \n ')
  const noteText = questionIds ? '' : nodes.map((n) => n.data.notes ?? '').join(' \n ')
  return `${answerText} \n ${noteText}`.toLowerCase()
}

function checkPasses(
  check: RubricCheck,
  nodes: SerializedNode[],
  edges: SerializedEdge[],
  answers: Record<string, string>,
): boolean {
  const counts = componentCounts(nodes)
  switch (check.kind) {
    case 'component-present':
      return check.anyOf.some((type) => (counts.get(type) ?? 0) > 0)
    case 'component-count-min':
      return (counts.get(check.type) ?? 0) >= check.min
    case 'connection-exists':
      return connectionExists(nodes, edges, check.between)
    case 'keyword-in-answers': {
      const haystack = gatherSearchableText(nodes, answers, check.questionIds)
      return check.keywords.some((kw) => haystack.includes(kw.toLowerCase()))
    }
    case 'no-orphan-nodes':
      return !hasOrphanNodes(nodes, edges)
    case 'min-nodes':
      return nodes.length >= check.min
    default:
      return false
  }
}

export function evaluateDesign(
  problem: Problem,
  nodes: SerializedNode[],
  edges: SerializedEdge[],
  answers: Record<string, string>,
): EvaluationResult {
  const categories: CategoryResult[] = problem.rubric.map((category) => {
    let earnedPoints = 0
    let possiblePoints = 0
    const metChecks: { id: string; label: string }[] = []
    const missedChecks: { id: string; label: string; hint: string }[] = []

    for (const check of category.checks) {
      possiblePoints += check.points
      if (checkPasses(check, nodes, edges, answers)) {
        earnedPoints += check.points
        metChecks.push({ id: check.id, label: check.label })
      } else {
        missedChecks.push({ id: check.id, label: check.label, hint: check.hint })
      }
    }

    const scorePercent = possiblePoints === 0 ? 100 : Math.round((earnedPoints / possiblePoints) * 100)

    return {
      id: category.id,
      name: category.name,
      weight: category.weight,
      earnedPoints,
      possiblePoints,
      scorePercent,
      metChecks,
      missedChecks,
    }
  })

  const overallScore = Math.round(categories.reduce((sum, c) => sum + c.scorePercent * c.weight, 0))

  const strengths = categories
    .filter((c) => c.scorePercent >= 70)
    .map((c) => `Strong ${c.name.toLowerCase()} (${c.scorePercent}%): ${c.metChecks.map((m) => m.label).join('; ') || 'covered the essentials'}.`)

  const gaps = categories
    .filter((c) => c.missedChecks.length > 0)
    .flatMap((c) => c.missedChecks.map((m) => `[${c.name}] ${m.hint}`))

  return {
    problemId: problem.id,
    overallScore,
    categories,
    strengths,
    gaps,
    evaluatedAt: Date.now(),
  }
}

export function emptyNodeData(type: ComponentType, label: string): DesignNodeData {
  return { type, label, notes: '' }
}

export function emptyEdgeData(): DesignEdgeData {
  return { protocol: 'sync' }
}
