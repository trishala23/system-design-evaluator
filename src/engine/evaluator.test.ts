import { describe, expect, it } from 'vitest'
import { evaluateDesign } from './evaluator'
import { getProblemById } from '../data/problems'
import type { SerializedEdge, SerializedNode } from '../types'

const urlShortener = getProblemById('url-shortener')!

function node(id: string, type: SerializedNode['data']['type'], notes = ''): SerializedNode {
  return { id, position: { x: 0, y: 0 }, data: { type, label: type, notes } }
}

function edge(id: string, source: string, target: string): SerializedEdge {
  return { id, source, target }
}

describe('evaluateDesign', () => {
  it('scores an empty design at (or near) zero', () => {
    const result = evaluateDesign(urlShortener, [], [], {})
    expect(result.overallScore).toBeLessThanOrEqual(10)
    expect(result.gaps.length).toBeGreaterThan(0)
  })

  it('rewards a well-covered design with a high score', () => {
    const nodes: SerializedNode[] = [
      node('n1', 'client'),
      node('n2', 'load_balancer'),
      node('n3', 'app_server'),
      node('n4', 'cache'),
      node('n5', 'sql_database'),
    ]
    const edges: SerializedEdge[] = [
      edge('e1', 'n1', 'n2'),
      edge('e2', 'n2', 'n3'),
      edge('e3', 'n3', 'n4'),
      edge('e4', 'n3', 'n5'),
    ]
    const answers = {
      encoding: 'We use a base62 counter to generate unique short codes and redirect with a 302.',
      'read-scaling': 'We put a redis cache in front of the database to keep redirects fast, and could add a cdn.',
      expiry: 'Expired links use a TTL column and a background cron job to clean up lazily.',
    }
    const result = evaluateDesign(urlShortener, nodes, edges, answers)
    expect(result.overallScore).toBeGreaterThanOrEqual(80)
    expect(result.strengths.length).toBeGreaterThan(0)
  })

  it('flags orphan nodes as a missed check', () => {
    const nodes: SerializedNode[] = [node('n1', 'client'), node('n2', 'sql_database')]
    const result = evaluateDesign(urlShortener, nodes, [], {})
    const dataCategory = result.categories.find((c) => c.id === 'data')!
    expect(dataCategory.missedChecks.some((m) => m.label.includes('connected'))).toBe(true)
  })

  it('is deterministic across repeated runs', () => {
    const nodes: SerializedNode[] = [node('n1', 'client'), node('n2', 'cache')]
    const edges: SerializedEdge[] = [edge('e1', 'n1', 'n2')]
    const first = evaluateDesign(urlShortener, nodes, edges, { encoding: 'hash based' })
    const second = evaluateDesign(urlShortener, nodes, edges, { encoding: 'hash based' })
    expect(first.overallScore).toBe(second.overallScore)
    expect(first.categories).toEqual(second.categories)
  })

  it('weights categories so overall score is a weighted average', () => {
    const nodes: SerializedNode[] = [node('n1', 'client')]
    const result = evaluateDesign(urlShortener, nodes, [], {})
    const totalWeight = result.categories.reduce((sum, c) => sum + c.weight, 0)
    expect(totalWeight).toBeCloseTo(1, 5)
  })
})
