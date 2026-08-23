# Design: Manual GitHub Action for GitHub Pages Deploy

> Status: APPROVED — ready for plan

## Context
Repo `simonfruehauf/OpenIdle-Engine`, Vite 6 + React 19, no existing `.github/` workflows. `package.json` scripts: `dev` (vite port 3000), `build` (vite build → `dist/`). `vite.config.ts` has no `base`, defaults to `/`. Target is Pages at `https://simonfruehauf.github.io/OpenIdle-Engine/` → needs base `/OpenIdle-Engine/`. User wants **manual only** trigger (no push auto-deploy). Node version default 20 (LTS, works with Vite 6).

## Goals
- One-click manual deploy from Actions tab (`workflow_dispatch`).
- Build current commit exactly as `npm run build` does locally, then publish `dist/` to Pages.
- Zero secrets, no branch push, uses official Pages deployment.

## Non-Goals
- No auto-deploy on push/tags.
- No custom domain handling.
- No preview deployments.

## Design

### Section 1 — Workflow file & trigger
- File: `.github/workflows/deploy.yml`
- Name: `Deploy to GitHub Pages`
- Trigger: `on: workflow_dispatch:` only
- Concurrency: `concurrency: group: pages, cancel-in-progress: false`
- Top-level `permissions: contents: read, pages: write, id-token: write` (required for `deploy-pages`)

### Section 2 — Build job
- Runner: `ubuntu-latest`
- Steps:
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4` with `node-version: '20'` and `cache: 'npm'`
  3. `npm ci` (fallback to `npm install` if no lockfile — repo currently has no `package-lock.json`, use `npm install`)
  4. Build: `npm run build` with base `/OpenIdle-Engine/` — inject via env `VITE_BASE=/OpenIdle-Engine/` or CLI flag `vite build --base=/OpenIdle-Engine/`; workflow sets env so vite config can read it
  5. `actions/configure-pages@v5` (setup)
  6. `actions/upload-pages-artifact@v3` with `path: ./dist`

### Section 3 — Deploy job + vite.config tweak
- Job `deploy` needs `build`, `environment: name: github-pages, url: ${{ steps.deployment.outputs.page_url }}`, runs `actions/deploy-pages@v4` (id: deployment)
- Vite config must respect Pages base: add `base: process.env.VITE_BASE || env.VITE_BASE || '/'` or check `GITHUB_REPOSITORY` — minimal patch in `vite.config.ts` to avoid hardcoding `/` locally. Parse `loadEnv` already present; add `base: env.VITE_BASE || '/'` so local dev stays `/` but workflow's `VITE_BASE=/OpenIdle-Engine/` is picked up. Alternative: hardcode `base: '/OpenIdle-Engine/'` — but breaks local preview at `/`. Chosen: env-driven.
- Pages settings prerequisite: repo Settings → Pages → Source = GitHub Actions (manual step documented, not automated).

### Section 4 — Verification
- `npm run build` locally with `VITE_BASE=/OpenIdle-Engine/ npm run build` → `dist/index.html` contains `src="/OpenIdle-Engine/assets/..."` and `href="/OpenIdle-Engine/..."`
- Workflow run via `gh` or UI shows green build → deploy → Pages URL.
- Manual QA: trigger workflow, wait, open `https://simonfruehauf.github.io/OpenIdle-Engine/` — app loads, resources visible, no 404 for assets.

## Risks
- Missing `package-lock.json` makes `npm ci` fail — workflow uses `npm ci` with fallback to `npm install` (or just `npm install`).
- If `vite.config` base not env-aware, assets 404 on Pages. Mitigated by config patch.

---
*Self-review: no TBD, trigger explicit, permissions minimal, base handling env-driven, file paths exact, verification concrete.*
