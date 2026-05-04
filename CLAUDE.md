# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build
npm run lint         # eslint .
npm run preview      # preview production build

cd scraper && node index.js   # run scraper manually
```

## Architecture

React 19 + Vite 8 + Tailwind CSS v4 + ECharts 6. Static site deployed to GitHub Pages.

**Data flow**: Scraper (`scraper/`) fetches from xiaoxiongyouhao.com → writes `public/data/motorcycles.json` (1779 models, 173 brands) → `useData()` hook fetches on mount → `App.tsx` passes `Motorcycle[]` to all pages as prop.

**Four pages**: Home (总览), Ranking (排行榜), Analysis (数据洞察), Explorer (数据探索 scatter).

**Charts** (`src/charts/`): Thin `echarts-for-react` wrappers, each computes `option` in `useMemo`.

**Filtering**: `useFilter` + `useFilteredData` hooks in `src/hooks/useData.ts`. `FilterBar` component implements cascading filters (type narrows brands/displacements). Ranking supports deep-linking via URL params (`?brand=`, `?type=`). Analysis persists filter to `sessionStorage`.

**Stats**: All pure functions in `src/utils/stats.ts` — `calcSummary`, `weightedAvgByDisplacement`, `topBySamples`, etc. Take `Motorcycle[]`, return computed arrays.

**Routing**: `react-router-dom` v7, `basename="/MotoFuel"`. Explorer renders as full-screen `fixed inset-0 top-14` bypassing normal layout (conditional in `App.tsx`).

**Theming**: Tailwind v4 `@theme` directive in `src/index.css` (no tailwind.config.js). Custom colors: `primary`, `surface`, `surface-alt`, `border`, `text`, `text-secondary`, `accent-green/red/amber`. Plugin: `@tailwindcss/vite`.

**PWA**: `vite-plugin-pwa` with `autoUpdate`. Manifest defined inline in `vite.config.ts`. External images cached via workbox CacheFirst.

**Deployment**: GitHub Pages via `.github/workflows/deploy.yml` (push to `master`). Scraper runs weekly Monday 03:00 UTC via `scrape.yml`. SPA routing uses `404.html` redirect + `index.html` restore script.

## Non-Obvious Details

**Explorer scatter jitter**: Category x-axis with deterministic fractional offsets. `doZoom` must call `setOption` BEFORE `dispatchAction` (reverse order breaks). Data sorted DESC by samples for `hideOverlap` label priority. `triggerEvent: false` on series prevents label-hover tooltip.

**Version badge**: Hardcoded in `Header.tsx` and `Footer.tsx` — update alongside `package.json` version.

**Base path**: `/MotoFuel/` in `vite.config.ts` and `main.tsx` BrowserRouter basename. Must match for GitHub Pages.

**Dead code**: `StatCard.tsx` and `DisplacementTabs.tsx` are not imported anywhere.
