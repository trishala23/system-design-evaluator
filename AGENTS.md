# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Copilot, etc.) working in this repository. Humans should read `README.md` and `CONTRIBUTING.md` instead.

## What this is

A static, client-side web app for practicing system design interviews:

1. Pick a problem from `src/data/problems.ts`.
2. Design a solution on an interactive canvas (`@xyflow/react`) by dragging components from a palette and connecting them, plus write answers to a few key trade-off questions.
3. Click **Evaluate** — a deterministic, rule-based rubric engine (`src/engine/evaluator.ts`) scores the design against the problem's rubric and returns category scores, strengths, and gaps.
4. Optionally reveal the reference design and read/compare trade-offs.

There is **no backend**. Everything runs in the browser and deploys as static files to GitHub Pages. State (in-progress designs, past scores, theme, optional API key) persists to `localStorage` via `zustand/middleware persist`. An optional "bring your own key" integration (`src/engine/aiEvaluator.ts`) calls the Anthropic API directly from the browser for a qualitative second opinion — the app is fully functional without it.

## Stack

React 19 + TypeScript + Vite + Tailwind CSS v4 + Zustand + `@xyflow/react` (React Flow) + Vitest. Linting is `oxlint`.

## Commands

Run these from the repo root:

- `npm install` — install dependencies
- `npm run dev` — start the dev server
- `npm run lint` — lint with oxlint
- `npm run typecheck` — `tsc -b` project-wide type check
- `npm run test` — run the Vitest suite once
- `npm run test:watch` — Vitest in watch mode
- `npm run build` — typecheck + production build to `dist/`
- `npm run preview` — serve the production build locally

**Before considering any change done, run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.** All four must pass — this mirrors exactly what CI runs on every PR (`.github/workflows/ci.yml`).

## Where things live

```
src/
  types.ts                 Core domain types: ComponentType, Problem, RubricCheck, Attempt, EvaluationResult, ...
  flowTypes.ts              React Flow node/edge type aliases (FlowNode, FlowEdge)
  data/
    palette.ts              The catalog of draggable components (icons, categories)
    problems.ts              The problem bank — every interview problem, its rubric, and its reference design
    rubricHelpers.ts         Small factory functions used to keep problems.ts declarative
  engine/
    evaluator.ts             Pure, deterministic rubric scoring — the core of the product. Has unit tests.
    evaluator.test.ts
    aiEvaluator.ts            Optional BYOK call to the Anthropic API for qualitative feedback
  store/
    useAppStore.ts            Single Zustand store: view state, per-problem attempts, results, history, settings
  components/
    TopBar.tsx, SettingsModal.tsx
    problems/                 Problem list screen
    workspace/                 Design workspace: canvas, palette, tabs (brief/questions/inspector/results), reference modal
  App.tsx, main.tsx, index.css
```

## Working on the problem bank (`src/data/problems.ts`)

This is the main place to extend the app's content. Each `Problem` needs:

- `functionalRequirements` / `nonFunctionalRequirements` / `constraints` — shown in the Brief tab.
- `keyQuestions` — free-text prompts with a `keywords` list used for heuristic scoring (substring match, case-insensitive) against the user's answers.
- `rubric` — an array of `RubricCategory`, each with a `weight` (all categories in one problem's rubric **must sum to 1**) and a list of `RubricCheck`s built with the helpers in `rubricHelpers.ts` (`presence`, `countMin`, `connected`, `keyword`, `noOrphans`, `minNodes`). Every check needs a `label` (short, shown when met) and a `hint` (actionable, shown when missed).
- `reference` — a static reference architecture (`nodes`/`edges` with fixed `x`/`y` positions) plus an `overview` paragraph and a `tradeoffs` list. This is rendered read-only in `ReferenceDesignModal`.

When adding a new problem, add a matching test case (or extend `evaluator.test.ts`) if it exercises new rubric-check behavior, and sanity-check that a "good" design (covering the intended components/answers) scores highly and an empty design scores near zero — `evaluator.test.ts` does exactly this for `url-shortener` as a template.

## Working on the evaluation engine (`src/engine/evaluator.ts`)

Keep it pure and deterministic: no `Date.now()`-dependent scoring, no randomness, no network calls. It takes a `Problem`, the serialized nodes/edges, and the answers map, and returns an `EvaluationResult`. If you add a new `RubricCheck` kind, add it to the discriminated union in `types.ts`, handle it in `checkPasses`, and add a helper factory in `rubricHelpers.ts`. Add or update unit tests in `evaluator.test.ts` alongside any behavior change.

## Component conventions

- New draggable component types go in `ComponentType` (`types.ts`), `PALETTE` (`data/palette.ts`, with a category), and `ICON_BY_TYPE` (a `lucide-react` icon).
- Canvas state (`nodes`/`edges`) is owned by `WorkspaceView` as local React state, mirrored into the Zustand store on every change so it survives navigation/reload. `DesignCanvas` itself is a controlled/presentational component — don't reintroduce internal React Flow state there.
- Tailwind: this project uses Tailwind v4's CSS-based config (`@import 'tailwindcss'` in `index.css`, no `tailwind.config.js`). Dark mode is class-based via `@custom-variant dark` — toggle by adding/removing the `dark` class on `<html>` (see `App.tsx`), driven by `useAppStore`'s `theme`.

## Git workflow

- **Never commit directly to `main`.** Every change goes on its own branch (`git checkout -b <descriptive-name>`), gets pushed, and lands via a pull request.
- CI (`.github/workflows/ci.yml`) runs lint/typecheck/test/build on every PR and every push to a non-`main` branch — keep it green before asking for review/merge.
- Deployment (`.github/workflows/deploy.yml`) runs only on push to `main`: it builds and publishes `dist/` to GitHub Pages via `actions/deploy-pages`. Don't add a manual deploy step or push built artifacts — the workflow is the only deployment path.
- Keep commits scoped and messages descriptive; prefer several small PRs over one large one when the work is separable.

## Things to avoid

- Don't add a backend/server — the whole point of this project is that it's a static app deployable to GitHub Pages with zero infrastructure.
- Don't make the rubric engine depend on the optional AI integration — `evaluateDesign` must keep working with no API key configured.
- Don't store anything sensitive in `localStorage` beyond what's already there (the user's own optional Anthropic key, entered voluntarily, used only for direct browser→Anthropic calls).
- Don't hand-edit `dist/` or commit build output.
