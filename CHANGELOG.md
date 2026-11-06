# Changelog

## v0.9.0 (2026-11-06)

### 数据更新链路
- 数据文件移出 SW 预缓存，改为 NetworkFirst 运行时缓存（此前回访用户会一直看到旧数据）
- 源站改版跟进：rank 页迁移到 /rank_moto/、page_app.php → app_download、page_rank_chexi_moto.php → rank_moto
- scraper/validate.js 新增抓取回归校验：丢档、总量骤降 >10%、单档骤降 >30% 时直接失败，避免残缺数据上线
- 抓取失败告警补上 SMTP_HOST（此前环境变量为空，邮件通知永远不执行）

### 性能
- 路由与图表全部懒加载，ECharts 按需引入（自写 src/charts/EChart.tsx 薄封装，移除 echarts-for-react）
- 首屏 JS gzip 从 488KB 降到约 97KB
- 移除车型 logoUrl 字段，数据从 495KB 降到 353KB；数据请求加骨架屏
- 移除 Google Fonts，改用系统字体栈（大陆不可达且阻塞首屏）

### 可访问性
- 可排序表头改为按钮，补 aria-sort；图表容器补 aria-label；html lang 随语言切换；语言包新增 a11y 文案

### 文案与国际化
- 首页所有数字改为从数据实时计算（此前 1,779 款 / 47 万条 / 2.54 / 2.29 等写死的数字全部失实）
- 中文页 13 个英文 kicker 全部本地化；新增 src/utils/typeLabel.ts，英文页车型类型显示 Scooter / Street / Cruiser 等（筛选状态与深链仍用原始值）
- 语言包从 public/locales 迁到 src/locales，随 bundle 打包

### 工程
- 构建期注入 SEO 数字（%MODELS% / %BRANDS% / %SAMPLES_WAN% 等占位符，未替换则构建失败）
- CI 增加 lint + test 门禁；eslint 报错从 39 降到 0；新增 scraper 回归校验单测
- 许可证统一为 MIT，并单独声明数据授权范围
- .npmrc 加 legacy-peer-deps 修复 npm install 直接失败

### PWA
- 重做应用图标：此前 icon-192/icon-512 实际是纯色方块（没有任何图形），现在为橙底白色 M + 双横线
- 新增 maskable 图标（Android 自适应图标不再被裁切/加白边）
- 新增 apple-touch-icon（iOS 添加到主屏幕不再退化成网页截图）
- manifest 补 lang / scope，主题色与站点背景一致；移除 dist 里重复的 manifest link

## v0.8.4 (2026-05-05)

- Explorer: track container size via ResizeObserver state, pass explicit pixel dimensions to ECharts (no more CSS percentage height)

## v0.8.3 (2026-05-05)

- Explorer: add ResizeObserver to force ECharts resize on container change, scatter chart renders correctly
- Home trend chart: full width on mobile, no side padding, less square
- ConsumptionTrendLine: extract mode state to parent, reduce chart height from 300 to 260, tighter grid margins
- Buttons moved to padded container, chart goes edge-to-edge

## v0.8.2 (2026-05-05)

- Explorer: fix zero-height chart container (min-h-0 → min-h-[400px]), scatter chart renders correctly
- Home: reduce hero vertical padding on mobile (py-12 → py-6)
- Home: trend chart buttons no longer touch edge on mobile
- DataTable: hide type column on mobile, give brand/series more space
- DataTable: brand names like "新大洲本田" no longer wrap, series visible
- Body font changed from sans-serif to serif (Playfair Display / Noto Serif SC)

## v0.8.1 (2026-05-05)

### Mobile UX
- Explorer: switch from fixed to normal flow, bottom nav now visible on Explorer page
- BottomNav: improved icons (grid, list, pie, scatter, info)
- Trend chart: wider on mobile, breaks out of container
- Heatmap: remove "cc" suffix from displacement headers
- Ranking table: responsive column widths, fits one screen without horizontal scroll
- DataTable: compact mobile padding and font sizes
- App: BottomNav always visible across all pages

## v0.8.0 (2026-05-05)

### Architecture & Code Quality
- TypeScript strict mode enabled
- Error Boundary added to prevent white screen crashes
- Analysis.tsx chart configs extracted into reusable components (`BrandRankBar`, `ConsumptionHistogram`)
- Explorer.tsx useEffect dependency arrays fixed (eliminated stale closure bugs)
- Hardcoded chart colors centralized via `chartTheme.ts`
- `dangerouslySetInnerHTML` replaced with `<Trans>` component
- Date formatting extracted to shared `formatDate.ts` utility
- Math.max(...array) replaced with reduce pattern (safe for large arrays)

### SEO & Analytics
- Google Analytics 4 (GA4) integration
- Sitemap.xml with all 5 pages
- Open Graph and Twitter Card meta tags
- JSON-LD structured data (WebSite + Dataset schemas)
- robots.txt with sitemap reference
- Canonical URL, meta keywords

### Testing
- Vitest unit tests for `stats.ts` (13 tests, 9 functions covered)

### Scraper Reliability
- 3x retry with exponential backoff for failed requests
- Data validation before write (minimum 500 models check)
- Multi-strategy JSON extraction (regex + fallback)
- Input validation (filter invalid consumption/samples values)

### CI Safety
- `scrape.yml`: data integrity validation step before commit
- `deploy.yml`: `if: success()` condition on workflow_run trigger

### Cleanup
- Removed 17 unused npm dependencies (194 packages)
- Removed dead code: DataTable props, unused i18n keys, preview HTML files
- Version management centralized via `__APP_VERSION__`
- CHANGELOG version synced with package.json

---

## v0.7.0 (2026-05-04)

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
- Version bumped to `0.7.0`

---

## v0.6.5

- Initial data scraper and React frontend
- Rankings, Analysis, Explorer pages
- Filter bar with cascading filters
- ECharts visualizations (scatter, bar, pie, histogram)
- GitHub Pages deployment
