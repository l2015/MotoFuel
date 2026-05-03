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
  }, [])

  const barData = useMemo(
    () => [...filtered].sort((a, b) => a.consumption - b.consumption).slice(0, 40),
    [filtered]
  )

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

      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-sm text-text-secondary mb-2">
            <span>筛选结果: <strong className="text-text">{filtered.length}</strong> 款车型</span>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-xs text-primary hover:underline"
            >
              {sidebarOpen ? '收起图表' : '展开图表'}
            </button>
          </div>
          <DataTable data={filtered} showDisplacement />
        </div>

        {sidebarOpen && barData.length > 0 && (
          <div className="w-64 shrink-0 hidden lg:block">
            <div className="sticky top-32 bg-white rounded-xl border border-border p-3">
              <h3 className="text-sm font-semibold mb-2">油耗排名 Top {barData.length}</h3>
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                <table className="w-full text-[11px]">
                  <tbody>
                    {barData.map((d, i) => (
                      <tr key={d.id} className="group">
                        <td className="py-0.5 pr-1 text-text-secondary w-5 text-right">{i + 1}</td>
                        <td className="py-0.5 pr-1 truncate max-w-24">{d.brand} {d.series}</td>
                        <td className="py-0.5 w-20">
                          <div className="flex items-center gap-1">
                            <div
                              className="h-3 rounded-sm bg-primary/70"
                              style={{ width: `${Math.max(4, (d.consumption / barData[barData.length - 1].consumption) * 60)}px` }}
                            />
                            <span className="font-mono text-primary whitespace-nowrap">{d.consumption}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
