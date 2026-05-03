import { useMemo, useState } from 'react'
import type { Motorcycle } from '../types'
import { consumptionHistogram, avgByBrand } from '../utils/stats'
import BrandRankBar from '../charts/BrandRankBar'
import ConsumptionScatter from '../charts/ConsumptionScatter'
import ConsumptionHistogram from '../charts/ConsumptionHistogram'

interface Props {
  data: Motorcycle[]
}

export default function Analysis({ data }: Props) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const allBrands = useMemo(() => [...new Set(data.map(d => d.brand))].sort(), [data])
  const histogram = useMemo(() => consumptionHistogram(data), [data])

  const filteredByBrand = useMemo(() => {
    if (selectedBrands.length === 0) return data
    return data.filter(d => selectedBrands.includes(d.brand))
  }, [data, selectedBrands])

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">深度分析</h1>

      <div className="bg-white rounded-xl border border-border p-4">
        <h2 className="text-base font-semibold mb-3">品牌平均油耗排名</h2>
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setSelectedBrands([])}
            className={`px-2.5 py-1 rounded-full text-xs ${selectedBrands.length === 0 ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'}`}
          >
            全部
          </button>
          {allBrands.slice(0, 30).map(b => (
            <button
              key={b}
              onClick={() => toggleBrand(b)}
              className={`px-2.5 py-1 rounded-full text-xs ${selectedBrands.includes(b) ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'}`}
            >
              {b}
            </button>
          ))}
        </div>
        <BrandRankBar data={avgByBrand(filteredByBrand)} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-base font-semibold mb-3">油耗分布直方图</h2>
          <ConsumptionHistogram data={histogram} />
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-base font-semibold mb-3">样本数 vs 油耗（气泡大小=样本量）</h2>
          <ConsumptionScatter data={filteredByBrand} />
        </div>
      </div>
    </div>
  )
}
