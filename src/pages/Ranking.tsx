import { useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Motorcycle } from '../types'
import { useFilter } from '../hooks/useData'
import FilterBar from '../components/FilterBar'
import DisplacementTabs from '../components/DisplacementTabs'
import DataTable from '../components/DataTable'
import ModelConsumptionBar from '../charts/ModelConsumptionBar'

interface Props {
  data: Motorcycle[]
}

export default function Ranking({ data }: Props) {
  const { filter, updateFilter, resetFilter, filtered, brands, types, displacements } = useFilter(data)
  const [searchParams, setSearchParams] = useSearchParams()

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
  }, []) // only on mount

  const barData = useMemo(
    () => [...filtered].sort((a, b) => a.consumption - b.consumption).slice(0, 30),
    [filtered]
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">摩托车油耗排行榜</h1>

      <FilterBar
        filter={filter}
        brands={brands}
        types={types}
        onFilterChange={updateFilter}
        onReset={resetFilter}
      />

      <div className="bg-white rounded-xl border border-border p-4">
        <DisplacementTabs
          displacements={displacements}
          selected={filter.displacements}
          onChange={val => updateFilter({ displacements: val })}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span>筛选结果: <strong className="text-text">{filtered.length}</strong> 款车型</span>
      </div>

      <DataTable data={filtered} showDisplacement />

      {barData.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-base font-semibold mb-3">当前筛选结果油耗排名</h2>
          <ModelConsumptionBar data={barData} maxItems={30} />
        </div>
      )}
    </div>
  )
}
