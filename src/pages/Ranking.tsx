import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Motorcycle, FilterState } from '../types'
import { useFilter } from '../hooks/useData'
import { formatScrapeTime } from '../utils/formatDate'
import FilterBar from '../components/FilterBar'
import DataTable from '../components/DataTable'

interface Props {
  data: Motorcycle[]
  scrapeTime?: string
}

export default function Ranking({ data, scrapeTime }: Props) {
  const { t, i18n } = useTranslation()
  const { filter, updateFilter, resetFilter, filtered, brands, types, bounds } = useFilter(data)
  const [searchParams, setSearchParams] = useSearchParams()
  const [showBar, setShowBar] = useState(false)

  const formattedTime = scrapeTime ? formatScrapeTime(scrapeTime, i18n.language) : null

  // 深链参数：?brand= / ?type= / ?minSamples= 进入页面时消费一次。
  // 依赖 searchParams 而不是空数组，这样在同一路由内后再点品牌跳转也能生效
  // （原先 deps 为 []，只有首次挂载会读取参数）。
  useEffect(() => {
    const brand = searchParams.get('brand')
    const type = searchParams.get('type')
    const minSamples = searchParams.get('minSamples')
    if (!brand && !type && !minSamples) return

    const patch: Partial<FilterState> = {}
    if (brand && brands.includes(brand)) patch.brands = [brand]
    if (type && types.includes(type)) patch.types = [type]
    if (minSamples) {
      const value = parseInt(minSamples, 10)
      if (!Number.isNaN(value)) patch.minSamples = value
    }
    if (Object.keys(patch).length > 0) updateFilter(patch)
    // 参数已消费，清掉以免刷新后重复叠加
    setSearchParams({}, { replace: true })
  }, [searchParams, brands, types, updateFilter, setSearchParams])

  return (
    <div className="max-w-4xl mx-auto">
      <section className="py-8 md:py-12 animate-in">
        <div className="text-[12px] font-bold text-primary uppercase tracking-[0.12em] mb-3">
          {t('ranking.kicker')}
        </div>
        <h1 className="font-serif text-[36px] md:text-[48px] font-black leading-[1.1] tracking-tight text-text">
          {t('ranking.title')}
        </h1>
        {formattedTime && (
          <p className="text-[12px] text-text-tertiary mt-2 font-medium">
            {t('footer.scrapedAt')}{formattedTime}
          </p>
        )}
      </section>

      <FilterBar
        filter={filter}
        allData={data}
        types={types}
        bounds={bounds}
        onFilterChange={updateFilter}
        onReset={resetFilter}
      />

      <div className="mt-6 mb-8">
        <div className="flex items-center justify-between text-sm text-text-secondary mb-4">
          <span>{t('ranking.filterResult', { count: filtered.length })}</span>
          <button
            onClick={() => setShowBar(!showBar)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors border ${
              showBar ? 'border-primary text-primary bg-primary-light' : 'border-border text-text-secondary hover:border-primary/50'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            {t('ranking.barChart')}
          </button>
        </div>
        <DataTable data={filtered} showDisplacement showBar={showBar} />
      </div>
    </div>
  )
}
