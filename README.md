# MotoFuel

[![Scrape Data](https://github.com/l2015/MotoFuel/actions/workflows/scrape.yml/badge.svg)](https://github.com/l2015/MotoFuel/actions/workflows/scrape.yml)
[![Deploy](https://github.com/l2015/MotoFuel/actions/workflows/deploy.yml/badge.svg)](https://github.com/l2015/MotoFuel/actions/workflows/deploy.yml)

> **[中文文档](./README-CN.md)**

A data-driven motorcycle fuel consumption analysis platform. Visualizes consumption data for 1700+ models across 170+ brands, with interactive charts, multi-dimensional filtering, and trend analysis.

**Live Site**: https://l2015.github.io/MotoFuel/

## Features

- **Overview Dashboard** — summary stats, consumption distribution, top models
- **Ranking Table** — sortable, filterable table with deep-linking support (`?brand=`, `?type=`)
- **Trend Analysis** — weighted averages by displacement, brand comparisons, type distribution
- **Explorer Scatter Plot** — interactive scatter chart with zoom, click-to-detail, and jitter for overlapping points
- **Cascading Filters** — type narrows brands/displacements, persistent via URL params and sessionStorage
- **i18n** — Chinese and English, auto-detected from browser language
- **PWA** — installable, works offline with cached data
- **Weekly Data Updates** — automated scraper runs every Monday

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## Project Structure

```
src/
  components/       # FilterBar, Header, Footer, etc.
  charts/           # ECharts wrappers (TrendLine, TypePie, etc.)
  hooks/            # useData, useFilter, useFilteredData
  utils/            # stats.ts (pure functions), chartTheme.ts
  types/            # TypeScript interfaces (Motorcycle, FilterState, etc.)
  pages/            # Home, Ranking, Analysis, Explorer, About
public/
  data/             # motorcycles.json (auto-updated by scraper)
  locales/          # i18n translation files (zh.json, en.json)
scraper/
  index.js          # Fetcher with retry logic
  parser.js         # HTML parser with validation
.github/workflows/
  scrape.yml        # Weekly data scraping + validation
  deploy.yml        # GitHub Pages deployment
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Charts | ECharts 6 + echarts-for-react |
| Routing | react-router-dom v7 |
| i18n | react-i18next + i18next-browser-languagedetector |
| PWA | vite-plugin-pwa (Workbox) |
| Testing | Vitest |
| Scraper | Cheerio + node-fetch |
| Deploy | GitHub Pages (GitHub Actions) |

## Development

### Scraper

```bash
cd scraper
npm install
node index.js    # Fetches data and writes to public/data/motorcycles.json
```

The scraper fetches 18 displacement-level pages from xiaoxiongyouhao.com, parses motorcycle data with Cheerio, and validates results before writing. If the source website structure changes significantly, the scraper will abort and a GitHub Issue will be created automatically.

### Adding Translations

All UI strings use `t()` from react-i18next. Translation files are in `public/locales/{zh,en}.json`.

### Charts

Chart components are thin wrappers around `echarts-for-react`. Colors are unified in `src/utils/chartTheme.ts`.

## Deployment

Automated via GitHub Actions:

- **Data**: `scrape.yml` runs weekly (Monday 03:00 UTC), validates and commits new data to `master`
- **Site**: `deploy.yml` triggers on push to `master`, builds and deploys to GitHub Pages

SPA routing is handled via `404.html` redirect + `index.html` restore script.

## Data Source

Motorcycle data is sourced from [xiaoxiongyouhao.com](https://www.xiaoxiongyouhao.com/), a community-driven fuel consumption reporting platform. Data is refreshed weekly via automated scraping.

## License

Private project. Data attribution: xiaoxiongyouhao.com.
