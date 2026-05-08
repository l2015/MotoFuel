# MotoFuel

[![Scrape Data](https://github.com/l2015/MotoFuel/actions/workflows/scrape.yml/badge.svg)](https://github.com/l2015/MotoFuel/actions/workflows/scrape.yml)
[![Deploy](https://github.com/l2015/MotoFuel/actions/workflows/deploy.yml/badge.svg)](https://github.com/l2015/MotoFuel/actions/workflows/deploy.yml)

> **[English](./README.md)**

摩托车油耗数据分析平台。覆盖 170+ 品牌、1700+ 车型，提供交互式图表、多维筛选和趋势分析。

**在线访问**: https://l2015.github.io/MotoFuel/

## 功能特性

- **总览仪表盘** — 统计概览、油耗分布、热门车型排行
- **排行榜** — 可排序、可筛选的表格，支持 URL 深度链接（`?brand=`、`?type=`）
- **趋势分析** — 按排量加权平均、品牌对比、车型分布
- **探索散点图** — 交互式散点图，支持缩放、点击详情、重叠抖动
- **级联筛选** — 选择车型后自动收窄品牌/排量选项，筛选状态持久化
- **国际化** — 中文/英文，自动检测浏览器语言
- **PWA** — 可安装，离线可用
- **每周数据更新** — 自动抓取程序每周一运行

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm run test
```

## 项目结构

```
src/
  components/       # FilterBar、Header、Footer 等组件
  charts/           # ECharts 封装（趋势图、饼图等）
  hooks/            # useData、useFilter、useFilteredData
  utils/            # stats.ts（纯函数）、chartTheme.ts（图表主题）
  types/            # TypeScript 接口定义
  pages/            # 首页、排行榜、分析、探索、关于
public/
  data/             # motorcycles.json（由抓取程序自动更新）
  locales/          # 国际化翻译文件（zh.json、en.json）
scraper/
  index.js          # 数据抓取器（含重试机制）
  parser.js         # HTML 解析器（含数据校验）
.github/workflows/
  scrape.yml        # 每周数据抓取 + 校验
  deploy.yml        # GitHub Pages 部署
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | React 19 |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS v4 |
| 图表 | ECharts 6 + echarts-for-react |
| 路由 | react-router-dom v7 |
| 国际化 | react-i18next + i18next-browser-languagedetector |
| PWA | vite-plugin-pwa（Workbox） |
| 测试 | Vitest |
| 抓取 | Cheerio + node-fetch |
| 部署 | GitHub Pages（GitHub Actions） |

## 开发指南

### 数据抓取

```bash
cd scraper
npm install
node index.js    # 抓取数据并写入 public/data/motorcycles.json
```

抓取程序从 xiaoxiongyouhao.com 获取 18 个排量级别的页面，使用 Cheerio 解析数据并校验后写入文件。如果源网站结构发生重大变化，抓取程序会自动终止并创建 GitHub Issue 通知。

### 添加翻译

所有界面文字使用 react-i18next 的 `t()` 函数。翻译文件位于 `public/locales/{zh,en}.json`。

### 图表开发

图表组件是对 `echarts-for-react` 的薄封装。颜色定义统一在 `src/utils/chartTheme.ts`。

## 部署

通过 GitHub Actions 自动化：

- **数据**：`scrape.yml` 每周一（UTC 03:00）运行，校验后提交新数据到 `master`
- **站点**：`deploy.yml` 在推送到 `master` 时触发，构建并部署到 GitHub Pages

SPA 路由通过 `404.html` 重定向 + `index.html` 恢复脚本实现。

## 数据来源

摩托车油耗数据来源于[小熊油耗](https://www.xiaoxiongyouhao.com/)，一个社区驱动的油耗上报平台。数据通过自动抓取每周更新。

## 许可

私有项目。数据归属：小熊油耗。
