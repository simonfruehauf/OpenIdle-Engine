# Manual GitHub Pages Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manual `workflow_dispatch` GitHub Action that builds Vite with base `/OpenIdle-Engine/` and deploys `dist/` to GitHub Pages via official `deploy-pages`.

**Architecture:** Two isolated units: (1) Vite base tweak reads `VITE_BASE` env so local dev stays `/` while CI builds `/OpenIdle-Engine/`; (2) Workflow `.github/workflows/deploy.yml` does checkout → Node 20 → install → build → upload artifact → deploy. No app code changes beyond config.

**Tech Stack:** Vite 6, GitHub Actions (checkout@v4, setup-node@v4, configure-pages@v5, upload-pages-artifact@v3, deploy-pages@v4), Node 20, npm

## Global Constraints

- Trigger: `on: workflow_dispatch` only (no push)
- Permissions: `contents: read, pages: write, id-token: write`
- Concurrency: `group: pages`
- Runner: `ubuntu-latest`
- Node: `20` with `cache: npm`
- Base for Pages: `/OpenIdle-Engine/` via `VITE_BASE` env (local dev stays `/`)
- Build cmd: `npm run build` (vite build) → `dist/`
- Upload path: `./dist`
- Deploy via `actions/deploy-pages@v4`, environment `github-pages`

---

### Task 1: Make vite.config.ts respect VITE_BASE for Pages

**Files:**
- Modify: `vite.config.ts:1-19`
- Test: local build with and without env

**Interfaces:**
- Consumes: `loadEnv` already used, env var `VITE_BASE`
- Produces: `config.base` used by `npm run build` in Task 2

- [ ] **Step 1: Read current vite.config.ts**

Run: `Read vite.config.ts`
Expected: 19 lines, `server.port 3000`, `plugins:[react()]`, no `base` (defaults to `/`).

- [ ] **Step 2: Edit vite.config.ts to add base from env**

```ts
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: env.VITE_BASE || '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
```

Diff is 1 line added: `base: env.VITE_BASE || '/',` before `server`.

- [ ] **Step 3: Verify local build still works (base /)**

Run: `npm run build`
Expected: PASS, `dist/index.html` contains `src="/assets/` (not `/OpenIdle-Engine/`), because `VITE_BASE` unset → `/`.

- [ ] **Step 4: Verify Pages base build**

Run: `VITE_BASE=/OpenIdle-Engine/ npm run build` (PowerShell: `$env:VITE_BASE='/OpenIdle-Engine/'; npm run build`)
Expected: PASS, `dist/index.html` contains `src="/OpenIdle-Engine/assets/` or `href="/OpenIdle-Engine/`. Check with: `Select-String -Pattern "/OpenIdle-Engine/" -Path dist/index.html`

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts
git commit -m "chore: make vite base respect VITE_BASE for Pages"
```

---

### Task 2: Create manual deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`
- Test: `actionlint` or `yamllint` + manual dry-run (if `act` not available, validate YAML syntax and build)

**Interfaces:**
- Consumes: `vite.config.ts` base from Task 1, `package.json` build script
- Produces: Workflow runnable via Actions tab → Run workflow

- [ ] **Step 1: Create directory**

Run: `mkdir -p .github/workflows` (PowerShell: `New-Item -ItemType Directory -Force -Path .github/workflows`)

- [ ] **Step 2: Write `.github/workflows/deploy.yml` with exact content**

```yaml
name: Deploy to GitHub Pages

on:
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
        env:
          VITE_BASE: /OpenIdle-Engine/
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Notes:
- Repo has no `package-lock.json`, so `npm install` not `npm ci` (ci would fail). If lockfile appears later, workflow still works; could switch to `npm ci` with fallback but keep `npm install` for now.
- `VITE_BASE` env is set on Build step so vite.config picks it up.

- [ ] **Step 3: Validate YAML and build**

Run: `npm run build` (again, with no env) — PASS as in Task 1.
Optional validate workflow syntax: `yamllint .github/workflows/deploy.yml` or `Get-Content .github/workflows/deploy.yml` — ensure no tabs, correct indent.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add manual GitHub Pages deploy workflow"
```

- [ ] **Step 5: Document manual Pages setting**

Add one line to README or verify deploy notes: After merge, enable Pages via Repo → Settings → Pages → Source: GitHub Actions. Then trigger workflow via Actions → Deploy to GitHub Pages → Run workflow.

No commit needed for docs, just ensure workflow notes are in plan.

---

## Self-Review

- Spec coverage:
  - S1 trigger/permissions/concurrency → Task 2 workflow header ✓
  - S2 build job (Node 20, npm install, VITE_BASE, upload) → Task 2 ✓
  - S3 deploy job + vite base tweak → Task 1 (vite.config) + Task 2 deploy job ✓
  - Verification (local build both bases, workflow green, Pages URL) → Task 1 Steps 3-4, Task 2 Step 3 ✓
- Placeholder scan: no TBD/TODO, all file paths exact, all YAML blocks complete with versions quoted (`'20'`, `/OpenIdle-Engine/`)
- Type consistency: `env.VITE_BASE` string, workflow env same string, artifact path `./dist` matches `vite build` output
