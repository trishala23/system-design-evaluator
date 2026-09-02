import type { ComponentType, RubricCheck } from '../types'

/** Small factory functions so problem definitions in `problems.ts` stay
 * declarative and short. Each returns one typed `RubricCheck`. */

let counter = 0
function nextId(prefix: string) {
  counter += 1
  return `${prefix}-${counter}`
}

export function presence(anyOf: ComponentType[], label: string, hint: string, points = 10): RubricCheck {
  return { kind: 'component-present', id: nextId('presence'), anyOf, label, hint, points }
}

export function countMin(type: ComponentType, min: number, label: string, hint: string, points = 10): RubricCheck {
  return { kind: 'component-count-min', id: nextId('count'), type, min, label, hint, points }
}

export function connected(
  between: [ComponentType, ComponentType],
  label: string,
  hint: string,
  points = 10,
): RubricCheck {
  return { kind: 'connection-exists', id: nextId('conn'), between, label, hint, points }
}

export function keyword(
  keywords: string[],
  label: string,
  hint: string,
  points = 10,
  questionIds?: string[],
): RubricCheck {
  return { kind: 'keyword-in-answers', id: nextId('kw'), keywords, label, hint, points, questionIds }
}

export function noOrphans(points = 5): RubricCheck {
  return {
    kind: 'no-orphan-nodes',
    id: nextId('orphan'),
    label: 'Every component is connected',
    hint: 'Connect every node on the canvas to at least one other node — unconnected boxes read as unused.',
    points,
  }
}

export function minNodes(min: number, points = 5): RubricCheck {
  return {
    kind: 'min-nodes',
    id: nextId('nodes'),
    min,
    label: `Design has at least ${min} components`,
    hint: `Your diagram looks thin — a solid answer usually needs ${min}+ components to cover the requirements.`,
    points,
  }
}
