# MotoFuel

摩托车油耗数据分析平台 — 基于 [小熊油耗](https://www.xiaoxiongyouhao.com) 公开数据的可视化分析。

## 功能

- **总览** — 油耗趋势、Top 20 省油车型、类型分布
- **排行榜** — 按品牌/类型/排量筛选的油耗排行
- **数据洞察** — 多维度统计分析
- **数据探索** — 散点图交互式探索，按样本量筛选

## 数据

173 个品牌 · 1,779 款车型 · 11 种类型 · 18 级排量（50–1000cc）

数据来源：[小熊油耗](https://www.xiaoxiongyouhao.com/page_rank_chexi_moto.php) 公开加油数据，每周一自动更新。

## 技术栈

React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · ECharts 6 · PWA

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```

## 数据抓取

```bash
cd scraper
npm install
node index.js
```

## License

MIT
