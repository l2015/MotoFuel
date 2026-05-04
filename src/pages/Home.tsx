import { useMemo, useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Motorcycle } from '../types'
import { calcSummary, weightedAvgByDisplacement, topBySamples, samplesByBrand, countByType } from '../utils/stats'
import ConsumptionTrendLine from '../charts/ConsumptionTrendLine'
import TypeDistributionPie from '../charts/TypeDistributionPie'
import ModelConsumptionBar from '../charts/ModelConsumptionBar'

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

function HeroStat({ label, target, decimals = 0, suffix = '', sub }: {
  label: string
  target: number
  decimals?: number
  suffix?: string
  sub?: string
}) {
  const { ref, value } = useAnimatedCounter(target, 1200, decimals)
  return (
    <div className="text-center">
      <span ref={ref} className="text-3xl md:text-4xl font-bold text-primary tabular-nums">
        {decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString()}
      </span>
      {suffix && <span className="text-sm text-text-secondary ml-0.5">{suffix}</span>}
      <p className="text-xs text-text-secondary mt-1">{label}</p>
      {sub && <p className="text-[10px] text-text-secondary/70 truncate max-w-[120px] mx-auto">{sub}</p>}
    </div>
  )
}

export default function Home({ data }: Props) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabKey>('brand')

  const summary = useMemo(() => calcSummary(data), [data])
  const weightedDisp = useMemo(() => weightedAvgByDisplacement(data), [data])
  const typeCount = useMemo(() => countByType(data), [data])
  const brandSamples = useMemo(() => samplesByBrand(data).slice(0, 15), [data])
  const top15Models = useMemo(() => topBySamples(data, 15), [data])
  const topConsumption = useMemo(
    () => data.filter(d => d.samples >= 10).sort((a, b) => a.consumption - b.consumption).slice(0, 20),
    [data]
  )

  // Type stats: total samples + model count
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

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="glass-card p-6 md:p-10 text-center">
        <h1 className="text-3xl md:text-5xl font-bold gradient-text mb-2">
          {t('home.hero.title')}
        </h1>
        <p className="text-sm md:text-base text-text-secondary mb-8">
          {t('home.hero.subtitle')}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
          <HeroStat
            label={t('home.stat.lowestConsumption')}
            target={summary.lowestConsumption?.consumption ?? 0}
            decimals={1}
            suffix="L"
            sub={summary.lowestConsumption ? `${summary.lowestConsumption.brand} ${summary.lowestConsumption.series}` : undefined}
          />
          <HeroStat label={t('home.stat.totalBrands')} target={summary.totalBrands} />
          <HeroStat label={t('home.stat.totalModels')} target={summary.totalModels} />
          <HeroStat label={t('home.stat.totalSamples')} target={summary.totalSamples} />
        </div>
      </div>

      {/* Full-width trend */}
      <div className="glass-card p-5">
        <h2 className="text-base font-semibold mb-1">{t('home.trend.title')}</h2>
        <p className="text-xs text-text-secondary mb-3">{t('home.trend.description')}</p>
        <ConsumptionTrendLine data={weightedDisp} />
      </div>

      {/* Top 20 + Tabbed ranking side by side */}
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('home.top20.title')}</h2>
            <Link to="/ranking" className="text-sm text-primary hover:underline">{t('home.link.fullRanking')}</Link>
          </div>
          <ModelConsumptionBar data={topConsumption} maxItems={20} />
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-1 mb-3">
            <button onClick={() => setActiveTab('brand')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'brand' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-alt'
              }`}>{t('table.header.brand')}</button>
            <button onClick={() => setActiveTab('model')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'model' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-alt'
              }`}>{t('home.tab.model')}</button>
            <button onClick={() => setActiveTab('type')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'type' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-alt'
              }`}>{t('table.header.type')}</button>
          </div>

          <div className="min-h-[480px]">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="text-left text-text-secondary border-b border-border">
                  <th className="pb-2 w-8">#</th>
                  <th className="pb-2 w-auto">
                    {activeTab === 'brand' ? t('table.header.brand') : activeTab === 'model' ? t('home.tab.model') : t('table.header.type')}
                  </th>
                  <th className="pb-2 w-24 text-right">{t('table.header.samples')}</th>
                  <th className="pb-2 w-20 text-right">{activeTab === 'model' ? t('table.header.consumption') : t('table.header.models')}</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === 'brand' && brandSamples.map((b, i) => (
                  <tr key={b.brand} className="border-b border-border/50">
                    <td className="py-1.5 text-text-secondary">{i + 1}</td>
                    <td className="py-1.5 font-medium truncate">{b.brand}</td>
                    <td className="py-1.5 text-right font-mono text-accent-amber">{b.totalSamples.toLocaleString()}</td>
                    <td className="py-1.5 text-right font-mono text-text-secondary">{b.modelCount}</td>
                  </tr>
                ))}
                {activeTab === 'model' && top15Models.map((d, i) => (
                  <tr key={d.id} className="border-b border-border/50">
                    <td className="py-1.5 text-text-secondary">{i + 1}</td>
                    <td className="py-1.5 font-medium truncate">{d.brand} {d.series}</td>
                    <td className="py-1.5 text-right font-mono text-accent-amber">{d.samples}</td>
                    <td className="py-1.5 text-right font-mono text-primary">{d.consumption}</td>
                  </tr>
                ))}
                {activeTab === 'type' && typeStats.map((ty, i) => (
                  <tr key={ty.type} className="border-b border-border/50">
                    <td className="py-1.5 text-text-secondary">{i + 1}</td>
                    <td className="py-1.5 font-medium truncate">{ty.type}</td>
                    <td className="py-1.5 text-right font-mono text-accent-amber">{ty.samples.toLocaleString()}</td>
                    <td className="py-1.5 text-right font-mono text-text-secondary">{ty.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Type distribution */}
      <div className="glass-card p-5">
        <h2 className="text-base font-semibold mb-3">{t('home.typeDistribution.title')}</h2>
        <TypeDistributionPie data={typeCount} />
      </div>
    </div>
  )
}
