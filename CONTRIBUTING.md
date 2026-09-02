# Contributing

## Branch workflow

- `main` is always deployable — every push to `main` triggers a production deploy to GitHub Pages (`.github/workflows/deploy.yml`).
- **Never commit directly to `main`.** Create a new branch for every change:

  ```bash
  git checkout -b your-name/short-description
  ```

- Push your branch and open a pull request into `main`. Every PR (and every push to a non-`main` branch) automatically runs lint, typecheck, tests, and a production build via `.github/workflows/ci.yml` — keep that green before merging.
- Prefer small, focused PRs. Squash-merge is fine; keep commit messages descriptive of *why*, not just *what*.

## Local checks

Run these before opening a PR — they're exactly what CI runs:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Adding a new interview problem

Problems live in `src/data/problems.ts` as a declarative array. See the "Working on the problem bank" section of [`AGENTS.md`](./AGENTS.md) for the full shape and the rubric-check helpers available in `src/data/rubricHelpers.ts`. A minimal checklist:

1. Add a `Problem` entry: requirements, constraints, 2-4 `keyQuestions` with matching keywords, and a `rubric` whose category weights sum to 1.
2. Add a `reference` design (nodes/edges/overview/trade-offs) so users have something to compare against.
3. Sanity check in `src/engine/evaluator.test.ts` (or manually via `npm run dev`) that an empty design scores low and a well-covered one scores high.

## Reporting issues

Open a GitHub issue with steps to reproduce, what you expected, and what happened instead.
