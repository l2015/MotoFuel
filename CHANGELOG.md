# Changelog

## v1.0.0 (2026-05-04)

### Visual Overhaul
- Dark theme with glass morphism cards (`backdrop-filter: blur(24px)`)
- Unified chart color palette (`chartTheme.ts`) — 11-color modern palette
- Consumption-based color coding (green→red gradient)
- Consistent dark tooltips and axis styles across all charts
- `#6366f1` indigo primary color

### Mobile Responsiveness
- Hamburger menu navigation on mobile
- Collapsible filter panels (Explorer, Analysis)
- Hidden rank column and consumption bar on small screens
- Touch-optimized controls (44px min touch targets, larger sliders)
- Responsive chart grid spacing

### Home Page Redesign
- Hero section with gradient text title
- Scroll-triggered animated counter numbers (brand count, model count, samples, lowest fuel)
- Data story layout: full-width trend → Top 20 + pie → brand ranking table

### Explorer Upgrade
- Click-to-detail popup card (brand, series, displacement, consumption, samples, same-displacement rank)
- Zoom statistics summary (visible model count, avg consumption, best/worst)
- Interactive legend synced with type filter pills

### Internationalization (i18n)
- `react-i18next` with automatic browser language detection
- Chinese (zh) and English (en) support
- Language switcher in header (desktop + mobile)
- 73 translation keys covering all UI text, tooltips, and chart labels

### Fixes
- Fixed footer GitHub URL (`MotoFuel/MotoFuel` → `l2015/MotoFuel`)
- Fixed GitHub Pages deploy workflow (branch `main` → `master`)
- Added `public/404.html` for SPA routing on GitHub Pages
- Removed dead code (`StatCard.tsx`, `DisplacementTabs.tsx`)

### Infrastructure
- GitHub Actions: auto-deploy on push to `master`
- GitHub Actions: weekly scraper cron job
- PWA support with offline caching
- Version bumped to `1.0.0`

---

## v0.6.5

- Initial data scraper and React frontend
- Rankings, Analysis, Explorer pages
- Filter bar with cascading filters
- ECharts visualizations (scatter, bar, pie, histogram)
- GitHub Pages deployment
