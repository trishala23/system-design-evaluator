# System Design Evaluator

Practice system design interviews end to end: get a problem, design it on an interactive canvas, and get an instant, rubric-based evaluation with a reference solution to compare against.

**Live app:** https://trishala23.github.io/system-design-evaluator/

## What it does

1. **Pick a problem** — a small bank of realistic interview problems (URL shortener, rate limiter, chat app, news feed, video streaming, ride-hailing dispatch, e-commerce checkout, web crawler, notification system), each with functional/non-functional requirements and scale constraints.
2. **Design it** — drag components (load balancer, cache, database, message queue, CDN, ...) onto a canvas, connect them, annotate them with notes, and answer a few short trade-off questions.
3. **Get evaluated** — a deterministic rubric engine scores your design across weighted categories (e.g. scalability, reliability, data modeling) and explains exactly what's missing, with actionable hints — instantly, entirely in your browser.
4. **Compare** — reveal the reference architecture and read through the intended trade-offs.

Your progress (in-progress designs, past scores, settings) is saved to your browser's local storage, so it's there when you come back.

### Optional: AI feedback

You can add your own Anthropic API key in Settings to get an additional qualitative review from Claude alongside the rubric score. This is entirely optional — the app is fully useful without it. Your key is stored only in your browser's local storage and sent directly from your browser to Anthropic's API; it never touches any server of ours (there isn't one).

## Why no backend

This is a static site — everything, including evaluation, runs client-side. That keeps it free to host, trivial to deploy (GitHub Pages), and fast (no round trip for a score). The trade-off is that the built-in evaluator is rule-based rather than a general AI judge — see the [optional AI feedback](#optional-ai-feedback) above if you want a second opinion.

## Tech stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) for styling (dark mode included)
- [React Flow](https://reactflow.dev/) for the interactive design canvas
- [Zustand](https://github.com/pmndrs/zustand) for state management, persisted to `localStorage`
- [Vitest](https://vitest.dev/) for unit tests, [oxlint](https://oxc.rs/) for linting
- Deployed to [GitHub Pages](https://pages.github.com/) via GitHub Actions

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. Other useful scripts:

```bash
npm run lint        # oxlint
npm run typecheck   # tsc -b
npm run test        # vitest run
npm run build        # typecheck + production build to dist/
npm run preview      # serve the production build locally
```

## Project structure

See [`AGENTS.md`](./AGENTS.md) for a detailed map of the codebase, the data model behind problems/rubrics, and conventions to follow when extending it (this file also doubles as the guide for AI coding agents working in this repo).

## Contributing & workflow

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the branch/PR workflow and how CI and deployment are wired up.

## License

[MIT](./LICENSE)
