import { useMemo, useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import type { Motorcycle } from '../types'
import { calcSummary, weightedAvgByDisplacement, topBySamples, samplesByBrand, countByType, avgByBrand } from '../utils/stats'
import ConsumptionTrendLine from '../charts/ConsumptionTrendLine'
import TypeDistributionPie from '../charts/TypeDistributionPie'
import DispBrandHeatmap from '../charts/DispBrandHeatmap'

interface Props {
  data: Motorcycle[]
}

type TabKey = 'brand' | 'model' | 'type'

function useAnimatedCounter(target: number, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const animated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true
          const start = performance.now()
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Number((eased * target).toFixed(decimals)))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration, decimals])

  return { ref, value }
}

export default function Home({ data }: Props) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabKey>('brand')

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

  // Animated counters
  const stat1 = useAnimatedCounter(summary.lowestConsumption?.consumption ?? 0, 1200, 1)
  const stat2 = useAnimatedCounter(summary.totalBrands, 1200)
  const stat3 = useAnimatedCounter(summary.totalModels, 1200)
  const stat4 = useAnimatedCounter(summary.totalSamples, 1200)

  return (
    <div className="max-w-4xl mx-auto">
      {/* HERO */}
      <section className="py-12 md:py-16 animate-in">
        <div className="text-[12px] font-bold text-primary uppercase tracking-[0.12em] mb-3">
          {t('home.hero.kicker')}
        </div>
        <h1 className="font-serif text-[40px] md:text-[56px] font-black leading-[1.05] tracking-tight mb-4 text-text max-w-[700px]">
          {t('home.hero.title')}
        </h1>
        <p className="text-[17px] leading-relaxed text-text-secondary max-w-[600px] mb-0">
          {t('home.hero.subtitle')}
        </p>
      </section>

      {/* KEY STATS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-t-2 border-t-text border-b border-b-border mb-8">
        <div className="py-5 text-center border-r border-b border-r-border border-b-border md:border-b-0">
          <span ref={stat1.ref} className="font-serif text-[32px] md:text-[42px] font-black text-text leading-none">
            {stat1.value.toFixed(1)}
          </span>
          <div className="text-[10px] md:text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.1em] mt-1.5">
            {t('home.stat.lowestConsumption')} L/100km
          </div>
        </div>
        <div className="py-5 text-center border-b border-b-border md:border-r md:border-r-border md:border-b-0">
          <span ref={stat2.ref} className="font-serif text-[32px] md:text-[42px] font-black text-text leading-none">
            {Math.round(stat2.value).toLocaleString()}
          </span>
          <div className="text-[10px] md:text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.1em] mt-1.5">
            {t('home.stat.totalBrands')}
          </div>
        </div>
        <div className="py-5 text-center border-r border-r-border">
          <span ref={stat3.ref} className="font-serif text-[32px] md:text-[42px] font-black text-text leading-none">
            {Math.round(stat3.value).toLocaleString()}
          </span>
          <div className="text-[10px] md:text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.1em] mt-1.5">
            {t('home.stat.totalModels')}
          </div>
        </div>
        <div className="py-5 text-center">
          <span ref={stat4.ref} className="font-serif text-[32px] md:text-[42px] font-black text-text leading-none">
            {Math.round(stat4.value).toLocaleString()}
          </span>
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
          <p className="text-[15px] leading-relaxed text-text-secondary max-w-[600px] mb-5">
            {t('home.trend.description')}
          </p>
        </div>
        <ConsumptionTrendLine data={weightedDisp} />
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
              {t('home.brandRank.description')}
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
              {t('home.typeDistribution.description')}
            </p>
            <TypeDistributionPie data={typeCount} />
            <div className="sidebar-box mt-5">
              <h4>{t('home.sidebar.title')}</h4>
              <ul>
                <li><Trans i18nKey="home.sidebar.fact1" components={{ strong: <strong /> }} /></li>
                <li><Trans i18nKey="home.sidebar.fact2" components={{ strong: <strong /> }} /></li>
                <li><Trans i18nKey="home.sidebar.fact3" components={{ strong: <strong /> }} /></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PULL QUOTE */}
      <div className="pull-quote">
        <p>{t('home.pullQuote.text')}</p>
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
                <td className="font-medium">{ty.type}</td>
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
