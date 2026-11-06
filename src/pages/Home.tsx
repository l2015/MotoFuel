import { useMemo, useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import type { Motorcycle } from '../types'
import { calcSummary, weightedAvgByDisplacement, topBySamples, samplesByBrand, countByType, avgByBrand } from '../utils/stats'
import DispBrandHeatmap from '../charts/DispBrandHeatmap'
import { useTypeLabel } from '../utils/typeLabel'

// 图表依赖 echarts（按需后仍有 ~600KB），延迟加载让首屏数字先出来
const ConsumptionTrendLine = lazy(() => import('../charts/ConsumptionTrendLine'))
const TypeDistributionPie = lazy(() => import('../charts/TypeDistributionPie'))

function ChartSkeleton({ height }: { height: number }) {
  return <div className="animate-pulse bg-surface-alt/60 border border-border-subtle" style={{ height }} />
}

interface Props {
  data: Motorcycle[]
}

type TabKey = 'brand' | 'model' | 'type'

// 趋势图文案引用的排量档位（这些档位在当前数据中稳定存在；缺失时回退到 0.00）
const LOW_DISP = 125
const MID_DISP = 300
const HIGH_DISP = 400
const PLATEAU_DISP = 600

interface AnimatedNumberProps {
  target: number
  decimals?: number
  grouping?: boolean
  className?: string
}

/**
 * 数字滚动组件：进入视口时从 0 递增到 target。
 *
 * value 初值为 null，此时直接渲染 target —— 这样即使 IntersectionObserver
 * 不回调（打印、无头渲染、旧浏览器、用户开了「减少动态效果」）也不会永远停在 0，
 * 首屏和无动画场景都能直接看到正确数字。
 */
function AnimatedNumber({ target, decimals = 0, grouping = false, className }: AnimatedNumberProps) {
  const [value, setValue] = useState<number | null>(null)
  const ref = useRef<HTMLSpanElement>(null)
  const animated = useRef(false)
  const duration = 1200

  useEffect(() => {
    const el = ref.current
    if (!el || !target) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || typeof IntersectionObserver === 'undefined') return

    let frame = 0
    let fallback = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || animated.current) return
        animated.current = true
        window.clearTimeout(fallback)
        const start = performance.now()
        const step = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setValue(progress < 1 ? Number((eased * target).toFixed(decimals)) : target)
          if (progress < 1) frame = requestAnimationFrame(step)
        }
        frame = requestAnimationFrame(step)
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    // 兜底：2.5s 内没进入视口就当它已经展示过（例如被容器裁剪），保持渲染终值
    fallback = window.setTimeout(() => {
      if (!animated.current) {
        animated.current = true
        observer.disconnect()
      }
    }, 2500)

    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
      cancelAnimationFrame(frame)
    }
  }, [target, decimals])

  const shown = value ?? target

  return (
    <span ref={ref} className={className}>
      {grouping ? Math.round(shown).toLocaleString() : shown.toFixed(decimals)}
    </span>
  )
}

export default function Home({ data }: Props) {
  const { t } = useTranslation()
  const typeText = useTypeLabel()
  const [activeTab, setActiveTab] = useState<TabKey>('brand')
  const [trendMode, setTrendMode] = useState<'simple' | 'weighted'>('simple')

  const summary = useMemo(() => calcSummary(data), [data])
  const weightedDisp = useMemo(() => weightedAvgByDisplacement(data), [data])
  const typeCount = useMemo(() => countByType(data), [data])
  // 品牌排行：过滤 10 款以上才有参考价值
  const topBrands = useMemo(
    () => avgByBrand(data).filter(b => b.count >= 10).slice(0, 10),
    [data]
  )
  // Top 20 最省油：样本 ≥ 10
  const topConsumption = useMemo(
    () => data.filter(d => d.samples >= 10).sort((a, b) => a.consumption - b.consumption).slice(0, 20),
    [data]
  )

  // Tab 数据
  const brandSamples = useMemo(() => samplesByBrand(data).slice(0, 15), [data])
  const top15Models = useMemo(() => topBySamples(data, 15), [data])
  const typeStats = useMemo(() => {
    const map = new Map<string, { samples: number; count: number }>()
    for (const d of data) {
      const cur = map.get(d.type) || { samples: 0, count: 0 }
      cur.samples += d.samples
      cur.count++
      map.set(d.type, cur)
    }
    return [...map.entries()]
      .map(([type, { samples, count }]) => ({ type, samples, count }))
      .sort((a, b) => b.samples - a.samples)
  }, [data])


  // 首页文案里的数字全部从数据算出：此前语言包硬编码了 1,779 款 / 47 万条 / 173 品牌 等，
  // 数据每周更新后 H1 会和下方统计栏自相矛盾；部分描述（Top20 口径、热力图说明）也与实际计算不符。
  const copyVars = useMemo(() => {
    const avgAt = (disp: number) => weightedDisp.find(d => d.displacement === disp)?.avg ?? 0
    const minDisp = weightedDisp[0]?.displacement ?? 0
    const maxDisp = weightedDisp[weightedDisp.length - 1]?.displacement ?? 0
    const minDispAvg = weightedDisp[0]?.avg ?? 0
    const maxDispAvg = weightedDisp[weightedDisp.length - 1]?.avg ?? 0

    const plateauValues = weightedDisp
      .filter(d => d.displacement >= PLATEAU_DISP)
      .map(d => d.avg)

    const typeRanked = [...typeCount].sort((a, b) => b.count - a.count)
    const brandsWithTen = avgByBrand(data).filter(b => b.count >= 10)
    const bestBrand = [...brandsWithTen].sort((a, b) => a.avg - b.avg)[0]
    const widestBrand = [...brandsWithTen].sort((a, b) => b.count - a.count)[0]

    const dispCounts = new Map<number, number>()
    for (const row of data) {
      dispCounts.set(row.displacement, (dispCounts.get(row.displacement) ?? 0) + 1)
    }
    const mostDisp = [...dispCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [0, 0]

    // 同一排量内，品牌平均油耗的最大相对差距（品牌在该排量至少 2 款车型）
    const brandConsumption = new Map<number, Map<string, number[]>>()
    for (const row of data) {
      const byBrand = brandConsumption.get(row.displacement) ?? new Map<string, number[]>()
      const values = byBrand.get(row.brand) ?? []
      values.push(row.consumption)
      byBrand.set(row.brand, values)
      brandConsumption.set(row.displacement, byBrand)
    }
    let gapPct = 0
    for (const byBrand of brandConsumption.values()) {
      const avgs = [...byBrand.values()]
        .filter(values => values.length >= 2)
        .map(values => values.reduce((sum, value) => sum + value, 0) / values.length)
      if (avgs.length < 2) continue
      const lo = Math.min(...avgs)
      const hi = Math.max(...avgs)
      if (lo > 0) gapPct = Math.max(gapPct, ((hi - lo) / lo) * 100)
    }

    return {
      models: summary.totalModels.toLocaleString('en-US'),
      brands: summary.totalBrands.toLocaleString('en-US'),
      samplesWan: Math.round(summary.totalSamples / 10000),
      samplesTotal: summary.totalSamples.toLocaleString('en-US'),
      minDisp,
      maxDisp,
      minDispAvg: minDispAvg.toFixed(2),
      maxDispAvg: maxDispAvg.toFixed(2),
      ratio: (maxDispAvg / (minDispAvg || 1)).toFixed(1),
      lowDisp: LOW_DISP,
      midDisp: MID_DISP,
      highDisp: HIGH_DISP,
      plateauDisp: PLATEAU_DISP,
      lowAvg: avgAt(LOW_DISP).toFixed(2),
      midAvg: avgAt(MID_DISP).toFixed(2),
      plateauMin: plateauValues.length ? Math.min(...plateauValues).toFixed(2) : '—',
      plateauMax: plateauValues.length ? Math.max(...plateauValues).toFixed(2) : '—',
      topType: typeRanked[0] ? typeText(typeRanked[0].type) : '',
      topTypeCount: typeRanked[0]?.count ?? 0,
      secondType: typeRanked[1] ? typeText(typeRanked[1].type) : '',
      secondTypeCount: typeRanked[1]?.count ?? 0,
      bestBrand: bestBrand?.brand ?? '',
      bestAvg: (bestBrand?.avg ?? 0).toFixed(2),
      widestBrand: widestBrand?.brand ?? '',
      widestCount: widestBrand?.count ?? 0,
      widestAvg: (widestBrand?.avg ?? 0).toFixed(2),
      mostDisp: mostDisp[0],
      mostDispCount: mostDisp[1],
      gapPct: Math.round(gapPct),
    }
  }, [data, summary, weightedDisp, typeCount, typeText])

  return (
    <div className="max-w-4xl mx-auto">
      {/* HERO */}
      <section className="py-6 md:py-16 animate-in">
        <div className="text-[12px] font-bold text-primary uppercase tracking-[0.12em] mb-3">
          {t('home.hero.kicker')}
        </div>
        <h1 className="font-serif text-[40px] md:text-[56px] font-black leading-[1.05] tracking-tight mb-4 text-text max-w-[700px]">
          {t('home.hero.title', copyVars)}
        </h1>
        <p className="text-[17px] leading-relaxed text-text-secondary max-w-[600px] mb-0">
          {t('home.hero.subtitle', copyVars)}
        </p>
      </section>

      {/* KEY STATS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-t-2 border-t-text border-b border-b-border mb-8">
        <div className="py-5 text-center border-r border-b border-r-border border-b-border md:border-b-0">
          <AnimatedNumber target={summary.lowestConsumption?.consumption ?? 0} decimals={1} className="font-serif text-[32px] md:text-[42px] font-black text-text leading-none" />
          <div className="text-[10px] md:text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.1em] mt-1.5">
            {t('home.stat.lowestConsumption')} L/100km
          </div>
        </div>
        <div className="py-5 text-center border-b border-b-border md:border-r md:border-r-border md:border-b-0">
          <AnimatedNumber target={summary.totalBrands} grouping className="font-serif text-[32px] md:text-[42px] font-black text-text leading-none" />
          <div className="text-[10px] md:text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.1em] mt-1.5">
            {t('home.stat.totalBrands')}
          </div>
        </div>
        <div className="py-5 text-center border-r border-r-border">
          <AnimatedNumber target={summary.totalModels} grouping className="font-serif text-[32px] md:text-[42px] font-black text-text leading-none" />
          <div className="text-[10px] md:text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.1em] mt-1.5">
            {t('home.stat.totalModels')}
          </div>
        </div>
        <div className="py-5 text-center">
          <AnimatedNumber target={summary.totalSamples} grouping className="font-serif text-[32px] md:text-[42px] font-black text-text leading-none" />
          <div className="text-[10px] md:text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.1em] mt-1.5">
            {t('home.stat.totalSamples')}
          </div>
        </div>
      </div>

      {/* TREND CHART */}
      <section className="mb-10 -mx-4 sm:mx-0">
        <div className="px-4 sm:px-0">
          <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.12em] mb-2">
            {t('home.trend.kicker')}
          </div>
          <h2 className="font-serif text-[28px] md:text-[32px] font-extrabold leading-tight mb-3 text-text">
            {t('home.trend.title')}
          </h2>
          <p className="text-[15px] leading-relaxed text-text-secondary max-w-[600px] mb-3">
            {t('home.trend.description', copyVars)}
          </p>
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setTrendMode('simple')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                trendMode === 'simple' ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
              }`}
            >
              {t('chart.mode.simpleAverage')}
            </button>
            <button
              onClick={() => setTrendMode('weighted')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                trendMode === 'weighted' ? 'bg-accent-green text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
              }`}
            >
              {t('chart.mode.weightedAverage')}
            </button>
          </div>
        </div>
        <Suspense fallback={<ChartSkeleton height={260} />}>
          <ConsumptionTrendLine data={weightedDisp} mode={trendMode} />
        </Suspense>
        <div className="px-4 sm:px-0 chart-caption">
          {t('home.trend.caption')}
        </div>
      </section>

      <hr className="section-rule mb-10" />

      {/* TWO COLUMN: BRAND TABLE + PIE */}
      <section className="mb-10">
        <div className="grid md:grid-cols-2 gap-10">
          {/* LEFT: Brand ranking (10+ models only) */}
          <div>
            <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.12em] mb-2">
              {t('home.brandRank.kicker')}
            </div>
            <h2 className="font-serif text-[26px] font-extrabold leading-tight mb-3 text-text">
              {t('home.brandRank.title')}
            </h2>
            <p className="text-[14px] leading-relaxed text-text-secondary mb-5">
              {t('home.brandRank.description', copyVars)}
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('table.header.brand')}</th>
                  <th>{t('table.header.consumption')}</th>
                  <th>{t('table.header.models')}</th>
                </tr>
              </thead>
              <tbody>
                {topBrands.map((b, i) => (
                  <tr key={b.brand}>
                    <td>
                      <span className={`font-serif text-[18px] font-extrabold ${i < 3 ? 'text-primary' : 'text-text-tertiary'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="font-medium">{b.brand}</td>
                    <td>
                      <span className={`font-mono font-medium px-2 py-0.5 rounded text-[12px] ${
                        b.avg < 2.5 ? 'bg-accent-green/[0.08] text-accent-green' :
                        b.avg < 3 ? 'bg-accent-blue/[0.08] text-accent-blue' :
                        'bg-accent-amber/[0.08] text-accent-amber'
                      }`}>
                        {b.avg.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-text-secondary">{b.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Link to="/ranking" className="inline-block mt-4 text-[13px] text-primary hover:underline font-medium no-underline">
              {t('home.link.fullRanking')} &rarr;
            </Link>
          </div>

          {/* RIGHT: Type distribution + sidebar */}
          <div>
            <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.12em] mb-2">
              {t('home.typeDistribution.kicker')}
            </div>
            <h2 className="font-serif text-[26px] font-extrabold leading-tight mb-3 text-text">
              {t('home.typeDistribution.title')}
            </h2>
            <p className="text-[14px] leading-relaxed text-text-secondary mb-5">
              {t('home.typeDistribution.description', copyVars)}
            </p>
            <Suspense fallback={<ChartSkeleton height={320} />}>
              <TypeDistributionPie data={typeCount} />
            </Suspense>
            <div className="sidebar-box mt-5">
              <h4>{t('home.sidebar.title')}</h4>
              <ul>
                <li><Trans i18nKey="home.sidebar.fact1" values={copyVars} components={{ strong: <strong /> }} /></li>
                <li><Trans i18nKey="home.sidebar.fact2" values={copyVars} components={{ strong: <strong /> }} /></li>
                <li><Trans i18nKey="home.sidebar.fact3" values={copyVars} components={{ strong: <strong /> }} /></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PULL QUOTE */}
      <div className="pull-quote">
        <p>{t('home.pullQuote.text', copyVars)}</p>
        <cite>{t('home.pullQuote.cite')}</cite>
      </div>

      {/* TABBED RANKING TABLE (Brand / Model / Type) */}
      <section className="mb-10 mt-10">
        <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.12em] mb-2">
          {t('home.tabSection.kicker')}
        </div>
        <h2 className="font-serif text-[28px] font-extrabold leading-tight mb-5 text-text">
          {t('home.tabSection.title')}
        </h2>

        <div className="flex gap-1 mb-5 border-b border-border pb-0">
          {(['brand', 'model', 'type'] as TabKey[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors -mb-px ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-b-primary'
                  : 'text-text-tertiary hover:text-text border-b-2 border-b-transparent'
              }`}>
              {tab === 'brand' ? t('table.header.brand') : tab === 'model' ? t('home.tab.model') : t('table.header.type')}
            </button>
          ))}
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{activeTab === 'brand' ? t('table.header.brand') : activeTab === 'model' ? t('home.tab.model') : t('table.header.type')}</th>
              <th className="text-right">{t('table.header.samples')}</th>
              <th className="text-right">
                {activeTab === 'model' ? t('table.header.consumption') : t('table.header.models')}
              </th>
            </tr>
          </thead>
          <tbody>
            {activeTab === 'brand' && brandSamples.map((b, i) => (
              <tr key={b.brand}>
                <td className="text-text-secondary">{i + 1}</td>
                <td className="font-medium">{b.brand}</td>
                <td className="text-right">
                  <span className="font-mono text-accent-amber">{b.totalSamples.toLocaleString()}</span>
                </td>
                <td className="text-right text-text-secondary">{b.modelCount}</td>
              </tr>
            ))}
            {activeTab === 'model' && top15Models.map((d, i) => (
              <tr key={d.id}>
                <td className="text-text-secondary">{i + 1}</td>
                <td className="font-medium">{d.brand} {d.series}</td>
                <td className="text-right">
                  <span className="font-mono text-accent-amber">{d.samples.toLocaleString()}</span>
                </td>
                <td className="text-right">
                  <span className="font-mono text-primary font-medium">{d.consumption}</span>
                </td>
              </tr>
            ))}
            {activeTab === 'type' && typeStats.map((ty, i) => (
              <tr key={ty.type}>
                <td className="text-text-secondary">{i + 1}</td>
                <td className="font-medium">{typeText(ty.type)}</td>
                <td className="text-right">
                  <span className="font-mono text-accent-amber">{ty.samples.toLocaleString()}</span>
                </td>
                <td className="text-right text-text-secondary">{ty.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* TOP 20 MODELS (with samples) */}
      <section className="mb-10">
        <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.12em] mb-2">
          {t('home.top20.kicker')}
        </div>
        <h2 className="font-serif text-[28px] md:text-[32px] font-extrabold leading-tight mb-3 text-text">
          {t('home.top20.title')}
        </h2>
        <p className="text-[15px] leading-relaxed text-text-secondary max-w-[600px] mb-5">
          {t('home.top20.description')}
        </p>

        {/* Top 20 with sample count shown */}
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('home.tab.model')}</th>
              <th className="text-right">{t('table.header.consumption')}</th>
              <th className="text-right">{t('table.header.samples')}</th>
            </tr>
          </thead>
          <tbody>
            {topConsumption.map((d, i) => (
              <tr key={d.id}>
                <td>
                  <span className={`font-serif text-[16px] font-extrabold ${i < 3 ? 'text-primary' : 'text-text-tertiary'}`}>
                    {i + 1}
                  </span>
                </td>
                <td className="font-medium">{d.brand} {d.series}</td>
                <td className="text-right">
                  <span className={`font-mono font-medium px-2 py-0.5 rounded text-[12px] ${
                    d.consumption < 2 ? 'bg-accent-green/[0.08] text-accent-green' :
                    d.consumption < 2.5 ? 'bg-accent-blue/[0.08] text-accent-blue' :
                    'bg-accent-amber/[0.08] text-accent-amber'
                  }`}>
                    {d.consumption.toFixed(2)}
                  </span>
                </td>
                <td className="text-right">
                  <span className="font-mono text-accent-amber text-[13px]">{d.samples.toLocaleString()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <hr className="section-rule mb-10" />

      {/* DISP-BRAND HEATMAP */}
      <section className="mb-10">
        <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.12em] mb-2">
          {t('home.dispHeatmap.kicker')}
        </div>
        <h2 className="font-serif text-[28px] md:text-[32px] font-extrabold leading-tight mb-3 text-text">
          {t('home.dispHeatmap.title')}
        </h2>
        <p className="text-[15px] leading-relaxed text-text-secondary max-w-[600px] mb-5">
          {t('home.dispHeatmap.description')}
        </p>
        <DispBrandHeatmap data={data} />
        <div className="chart-caption">
          {t('home.dispHeatmap.caption')}
        </div>
      </section>

      <div className="pb-8" />
    </div>
  )
}
