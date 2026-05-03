import { useMemo, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Motorcycle } from '../types'
import { useFilter } from '../hooks/useData'
import FilterBar from '../components/FilterBar'
import DataTable from '../components/DataTable'

interface Props {
  data: Motorcycle[]
}

export default function Ranking({ data }: Props) {
  const { filter, updateFilter, resetFilter, filtered, brands, types } = useFilter(data)
  const [searchParams, setSearchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(true)

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

  const barData = useMemo(
    () => [...filtered].sort((a, b) => a.consumption - b.consumption).slice(0, 40),
    [filtered]
  )

  const maxConsumption = barData.length > 0 ? barData[barData.length - 1].consumption : 1

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">摩托车油耗排行榜</h1>

      <FilterBar
        filter={filter}
        allData={data}
        types={types}
        onFilterChange={updateFilter}
        onReset={resetFilter}
      />

      <div className="flex gap-0">
        <div className={`min-w-0 transition-all duration-300 ${sidebarOpen ? 'flex-1' : 'w-full'}`}>
          <div className="flex items-center justify-between text-sm text-text-secondary mb-2">
            <span>筛选结果: <strong className="text-text">{filtered.length}</strong> 款车型</span>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-xs text-primary hover:underline">
              {sidebarOpen ? '隐藏侧栏' : '显示排名'}
            </button>
          </div>
          <DataTable data={filtered} showDisplacement />
        </div>

        {sidebarOpen && barData.length > 0 && (
          <div className="w-72 shrink-0 ml-4 hidden lg:block">
            <div className="sticky top-32 bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-surface-alt">
                <h3 className="text-sm font-semibold">油耗排名 Top {barData.length}</h3>
              </div>
              <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
                {barData.map((d, i) => (
                  <div key={d.id} className="flex items-center px-3 py-1.5 hover:bg-blue-50/50 border-b border-border/30 last:border-0">
                    <span className="text-xs text-text-secondary w-5 text-right shrink-0">{i + 1}</span>
                    <div className="ml-2 flex-1 min-w-0">
                      <div className="text-xs truncate">{d.brand} {d.series}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex-1 bg-surface-alt rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${(d.consumption / maxConsumption) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-primary font-medium shrink-0">{d.consumption}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
