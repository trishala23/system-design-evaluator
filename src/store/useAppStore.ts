import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Attempt, EvaluationResult, HistoryEntry, SerializedEdge, SerializedNode } from '../types'

export type View = 'problems' | 'workspace'
export type Theme = 'light' | 'dark'

interface AppState {
  view: View
  currentProblemId: string | null
  attempts: Record<string, Attempt>
  history: HistoryEntry[]
  results: Record<string, EvaluationResult>
  showReference: Record<string, boolean>
  settingsOpen: boolean
  apiKey: string
  theme: Theme

  openProblem: (problemId: string) => void
  backToProblems: () => void
  setNodes: (problemId: string, nodes: SerializedNode[]) => void
  setEdges: (problemId: string, edges: SerializedEdge[]) => void
  setAnswer: (problemId: string, questionId: string, text: string) => void
  recordEvaluation: (problemTitle: string, result: EvaluationResult) => void
  toggleReference: (problemId: string) => void
  resetAttempt: (problemId: string) => void
  setSettingsOpen: (open: boolean) => void
  setApiKey: (key: string) => void
  toggleTheme: () => void
}

function blankAttempt(problemId: string): Attempt {
  return { problemId, nodes: [], edges: [], answers: {}, updatedAt: Date.now() }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      view: 'problems',
      currentProblemId: null,
      attempts: {},
      history: [],
      results: {},
      showReference: {},
      settingsOpen: false,
      apiKey: '',
      theme: 'light',

      openProblem: (problemId) =>
        set((state) => ({
          view: 'workspace',
          currentProblemId: problemId,
          attempts: state.attempts[problemId] ? state.attempts : { ...state.attempts, [problemId]: blankAttempt(problemId) },
        })),

      backToProblems: () => set({ view: 'problems', currentProblemId: null }),

      setNodes: (problemId, nodes) =>
        set((state) => ({
          attempts: {
            ...state.attempts,
            [problemId]: {
              ...(state.attempts[problemId] ?? blankAttempt(problemId)),
              nodes,
              updatedAt: Date.now(),
            },
          },
        })),

      setEdges: (problemId, edges) =>
        set((state) => ({
          attempts: {
            ...state.attempts,
            [problemId]: {
              ...(state.attempts[problemId] ?? blankAttempt(problemId)),
              edges,
              updatedAt: Date.now(),
            },
          },
        })),

      setAnswer: (problemId, questionId, text) =>
        set((state) => {
          const attempt = state.attempts[problemId] ?? blankAttempt(problemId)
          return {
            attempts: {
              ...state.attempts,
              [problemId]: {
                ...attempt,
                answers: { ...attempt.answers, [questionId]: text },
                updatedAt: Date.now(),
              },
            },
          }
        }),

      recordEvaluation: (problemTitle, result) =>
        set((state) => ({
          results: { ...state.results, [result.problemId]: result },
          history: [
            { problemId: result.problemId, problemTitle, overallScore: result.overallScore, evaluatedAt: result.evaluatedAt },
            ...state.history,
          ].slice(0, 100),
        })),

      toggleReference: (problemId) =>
        set((state) => ({ showReference: { ...state.showReference, [problemId]: !state.showReference[problemId] } })),

      resetAttempt: (problemId) =>
        set((state) => {
          const { [problemId]: _removedResult, ...restResults } = state.results
          return {
            attempts: { ...state.attempts, [problemId]: blankAttempt(problemId) },
            results: restResults,
            showReference: { ...state.showReference, [problemId]: false },
          }
        }),

      setSettingsOpen: (open) => set({ settingsOpen: open }),
      setApiKey: (key) => set({ apiKey: key }),
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    {
      name: 'system-design-evaluator',
      partialize: (state) => ({
        attempts: state.attempts,
        history: state.history,
        results: state.results,
        apiKey: state.apiKey,
        theme: state.theme,
      }),
    },
  ),
)
