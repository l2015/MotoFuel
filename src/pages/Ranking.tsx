import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Motorcycle } from '../types'
import { useFilter } from '../hooks/useData'
import FilterBar from '../components/FilterBar'
import DataTable from '../components/DataTable'

interface Props {
  data: Motorcycle[]
}

export default function Ranking({ data }: Props) {
  const { t } = useTranslation()
  const { filter, updateFilter, resetFilter, filtered, brands, types } = useFilter(data)
  const [searchParams, setSearchParams] = useSearchParams()
  const [showBar, setShowBar] = useState(false)

  useEffect(() => {
    const brand = searchParams.get('brand')
    if (brand && brands.includes(brand)) {
      updateFilter({ brands: [brand] })
      setSearchParams({}, { replace: true })
    }
    const type = searchParams.get('type')
    if (type && types.includes(type)) {
      updateFilter({ types: [type] })
      setSearchParams({}, { replace: true })
    }
    const minSamples = searchParams.get('minSamples')
    if (minSamples) {
      updateFilter({ minSamples: parseInt(minSamples) })
      setSearchParams({}, { replace: true })
    }
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('ranking.title')}</h1>

      <FilterBar
        filter={filter}
        allData={data}
        types={types}
        onFilterChange={updateFilter}
        onReset={resetFilter}
      />

      <div>
        <div className="flex items-center justify-between text-sm text-text-secondary mb-2">
          <span>{t('ranking.filterResult', { count: filtered.length })}</span>
          <button
            onClick={() => setShowBar(!showBar)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-colors ${
              showBar ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
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
