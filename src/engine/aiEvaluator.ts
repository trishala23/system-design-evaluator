import type { EvaluationResult, Problem, SerializedEdge, SerializedNode } from '../types'

/** Optional "bring your own key" feedback layer on top of the deterministic
 * rubric engine. Calls the Anthropic Messages API directly from the browser
 * using a key the user pastes into Settings (kept only in their own
 * localStorage, sent only to api.anthropic.com). This is entirely optional —
 * the app is fully functional without it since `evaluateDesign` already
 * produces a complete score and feedback offline. */

const ANTHROPIC_MODEL = 'claude-sonnet-5'
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

function describeDesign(nodes: SerializedNode[], edges: SerializedEdge[]): string {
  if (nodes.length === 0) return '(no components placed on the canvas)'
  const nodeLines = nodes.map((n) => `- ${n.data.label} (${n.data.type})${n.data.notes ? `: ${n.data.notes}` : ''}`)
  const nameById = new Map(nodes.map((n) => [n.id, n.data.label]))
  const edgeLines = edges.map((e) => `- ${nameById.get(e.source) ?? e.source} -> ${nameById.get(e.target) ?? e.target}`)
  return `Components:\n${nodeLines.join('\n')}\n\nConnections:\n${edgeLines.join('\n') || '(none)'}`
}

function buildPrompt(problem: Problem, nodes: SerializedNode[], edges: SerializedEdge[], answers: Record<string, string>, rubricResult: EvaluationResult): string {
  const answerLines = problem.keyQuestions
    .map((q) => `Q: ${q.prompt}\nA: ${answers[q.id]?.trim() || '(not answered)'}`)
    .join('\n\n')

  return `You are an experienced system design interviewer giving a candidate quick, specific feedback on their answer to: "${problem.title}".

Problem summary: ${problem.summary}

The candidate's diagram:
${describeDesign(nodes, edges)}

The candidate's written answers:
${answerLines}

An automated rubric already scored this design at ${rubricResult.overallScore}/100 across these categories: ${rubricResult.categories.map((c) => `${c.name} (${c.scorePercent}%)`).join(', ')}.

Give feedback that goes beyond that mechanical rubric: comment on the reasoning quality, call out anything technically wrong or hand-wavy, and note one or two things a strong candidate would additionally discuss for this problem at this scale. Be direct and concise: 4-6 sentences, no headers, no bullet lists, plain prose.`
}

export async function getAiFeedback(
  apiKey: string,
  problem: Problem,
  nodes: SerializedNode[],
  edges: SerializedEdge[],
  answers: Record<string, string>,
  rubricResult: EvaluationResult,
): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: buildPrompt(problem, nodes, edges, answers, rubricResult) }],
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Anthropic API error ${response.status}: ${body.slice(0, 300)}`)
  }

  const data = (await response.json()) as { content: { type: string; text?: string }[] }
  const text = data.content.find((block) => block.type === 'text')?.text
  if (!text) throw new Error('No text content returned from the API.')
  return text.trim()
}
