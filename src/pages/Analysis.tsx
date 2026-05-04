import { useMemo, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Motorcycle } from '../types'
import { avgByBrand, samplesByBrand, consumptionHistogram, countByType } from '../utils/stats'
import BrandRankBar from '../charts/BrandRankBar'
import TypeDistributionPie from '../charts/TypeDistributionPie'
import ConsumptionHistogram from '../charts/ConsumptionHistogram'

interface Props {
  data: Motorcycle[]
}

const STORAGE_KEY = 'motofuel-analysis-filter'

function loadSavedFilter(): { selectedBrands: string[]; minBrandSamples: number } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export default function Analysis({ data }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const saved = loadSavedFilter()

  const [selectedBrands, setSelectedBrands] = useState<string[]>(saved?.selectedBrands ?? [])
  const [minBrandSamples, setMinBrandSamples] = useState(saved?.minBrandSamples ?? 1000)
  const [brandExpanded, setBrandExpanded] = useState(false)
  const [filterCollapsed, setFilterCollapsed] = useState(false)

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedBrands, minBrandSamples }))
  }, [selectedBrands, minBrandSamples])

  const brandSampleStats = useMemo(() => samplesByBrand(data), [data])
  const topBrands = useMemo(
    () => brandSampleStats.filter(b => b.totalSamples >= minBrandSamples),
    [brandSampleStats, minBrandSamples]
  )

  const displayedBrands = useMemo(() => {
    if (brandExpanded) {
      return [...brandSampleStats].sort((a, b) => a.brand.localeCompare(b.brand, 'zh'))
    }
    return topBrands.slice(0, 30)
  }, [topBrands, brandExpanded, brandSampleStats])

  const filteredByBrand = useMemo(() => {
    if (selectedBrands.length === 0) {
      return data.filter(d => {
        const brandStat = brandSampleStats.find(b => b.brand === d.brand)
        return brandStat && brandStat.totalSamples >= minBrandSamples
      })
    }
    return data.filter(d => selectedBrands.includes(d.brand))
  }, [data, selectedBrands, brandSampleStats, minBrandSamples])

  const brandAvgData = useMemo(() => avgByBrand(filteredByBrand), [filteredByBrand])
  const histogram = useMemo(() => consumptionHistogram(filteredByBrand), [filteredByBrand])
  const typeCount = useMemo(() => countByType(filteredByBrand), [filteredByBrand])

  const brandSamplesMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of filteredByBrand) {
      map.set(d.brand, (map.get(d.brand) || 0) + d.samples)
    }
    return map
  }, [filteredByBrand])

  const typeSamplesMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of filteredByBrand) {
      map.set(d.type, (map.get(d.type) || 0) + d.samples)
    }
    return map
  }, [filteredByBrand])

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  const goToRanking = useCallback((params: { brand?: string; type?: string }) => {
    const query = new URLSearchParams()
    if (params.brand) query.set('brand', params.brand)
    if (params.type) query.set('type', params.type)
    query.set('minSamples', String(minBrandSamples))
    navigate(`/ranking?${query.toString()}`)
  }, [navigate, minBrandSamples])

  return (
    <div className="max-w-4xl mx-auto">
      <section className="py-8 md:py-12 animate-in">
        <div className="text-[12px] font-bold text-primary uppercase tracking-[0.12em] mb-3">
          {t('analysis.kicker')}
        </div>
        <h1 className="font-serif text-[36px] md:text-[48px] font-black leading-[1.1] tracking-tight text-text">
          {t('analysis.title')}
        </h1>
        <p className="text-[15px] text-text-secondary mt-3">
          {t('analysis.basedOn', { count: filteredByBrand.length })}
        </p>
      </section>

      {/* Brand filter */}
      <div className="editorial-card sticky top-14 z-40 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2.5 border-b border-border">
          <button onClick={() => setFilterCollapsed(!filterCollapsed)}
            className="flex items-center gap-1.5 text-sm font-semibold hover:text-primary transition-colors">
            <svg className={`w-4 h-4 transition-transform ${filterCollapsed ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            {t('analysis.brandFilter')}
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-secondary">{t('filter.label.minSamples')}</label>
              <input type="range" min={0} max={5000} step={100} value={minBrandSamples}
                onChange={e => { setMinBrandSamples(parseInt(e.target.value)); setSelectedBrands([]) }}
                className="w-20 sm:w-28 accent-primary" />
              <span className="text-xs font-mono w-12">{minBrandSamples}</span>
            </div>
            <button onClick={() => { setSelectedBrands([]); setMinBrandSamples(1000) }}
              className="text-xs text-text-secondary hover:text-accent-red transition-colors">{t('filter.reset')}</button>
          </div>
        </div>
        {!filterCollapsed && (
          <div className="px-4 pb-4 flex flex-wrap gap-1.5 pt-3">
            <button onClick={() => setSelectedBrands([])}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedBrands.length === 0 ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
              }`}
            >{t('filter.all')}</button>
            {displayedBrands.map(b => (
              <button key={b.brand} onClick={() => toggleBrand(b.brand)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedBrands.includes(b.brand) ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
                }`}>{b.brand} <span className="opacity-60">{b.totalSamples.toLocaleString()}</span></button>
            ))}
            {!brandExpanded && topBrands.length < brandSampleStats.length && (
              <button onClick={() => setBrandExpanded(true)}
                className="px-2.5 py-1 text-xs text-primary hover:bg-primary/10">
                {t('filter.expandAll', { count: brandSampleStats.length })}
              </button>
            )}
            {brandExpanded && (
              <button onClick={() => setBrandExpanded(false)}
                className="px-2.5 py-1 text-xs text-primary hover:bg-primary/10">
                {t('filter.collapse')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Brand rank chart */}
      <section className="mb-8">
        <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.12em] mb-2">
          {t('analysis.brandRank.kicker')}
        </div>
        <h2 className="font-serif text-[28px] font-extrabold leading-tight mb-1 text-text">
          {t('analysis.brandRank.title')}
        </h2>
        <p className="text-[13px] text-text-tertiary mb-5">
          {t('analysis.brandRank.hint')}
        </p>
        <BrandRankBar data={brandAvgData} brandSamplesMap={brandSamplesMap} onBrandClick={(brand) => goToRanking({ brand })} />
        <div className="chart-caption">
          {t('analysis.brandRank.caption')}
        </div>
      </section>

      <hr className="section-rule mb-8" />

      {/* TWO COLUMN: Pie + Histogram */}
      <section className="mb-10">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.12em] mb-2">
              {t('analysis.typeDistribution.kicker')}
            </div>
            <h2 className="font-serif text-[24px] font-extrabold leading-tight mb-1 text-text">
              {t('analysis.typeDistribution.title')}
            </h2>
            <p className="text-[13px] text-text-tertiary mb-4">
              {t('analysis.typeDistribution.hint')}
            </p>
            <TypeDistributionPie data={typeCount} typeSamplesMap={typeSamplesMap} onTypeClick={(type) => goToRanking({ type })} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.12em] mb-2">
              {t('analysis.histogram.kicker')}
            </div>
            <h2 className="font-serif text-[24px] font-extrabold leading-tight mb-1 text-text">
              {t('analysis.histogram.title')}
            </h2>
            <p className="text-[13px] text-text-tertiary mb-4">
              {t('analysis.histogram.description')}
            </p>
            <ConsumptionHistogram data={histogram} />
          </div>
        </div>
      </section>
    </div>
  )
}
