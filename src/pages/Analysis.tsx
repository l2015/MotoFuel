import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Motorcycle } from '../types'
import { avgByBrand, samplesByBrand, consumptionHistogram, countByType } from '../utils/stats'
import BrandRankBar from '../charts/BrandRankBar'
import ConsumptionHistogram from '../charts/ConsumptionHistogram'
import TypeDistributionPie from '../charts/TypeDistributionPie'

interface Props {
  data: Motorcycle[]
}

export default function Analysis({ data }: Props) {
  const navigate = useNavigate()
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [minBrandSamples, setMinBrandSamples] = useState(50)

  const brandSampleStats = useMemo(() => samplesByBrand(data), [data])
  const topBrands = useMemo(
    () => brandSampleStats.filter(b => b.totalSamples >= minBrandSamples).slice(0, 30),
    [brandSampleStats, minBrandSamples]
  )

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

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  const goToRanking = (brand: string) => {
    navigate(`/ranking?brand=${encodeURIComponent(brand)}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">深度分析</h1>
        <span className="text-sm text-text-secondary">基于 {filteredByBrand.length} 款车型</span>
      </div>

      <div className="bg-white rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">品牌平均油耗排名</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-secondary">品牌总样本 ≥</label>
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={minBrandSamples}
              onChange={e => { setMinBrandSamples(parseInt(e.target.value)); setSelectedBrands([]) }}
              className="w-24 accent-primary"
            />
            <span className="text-xs font-mono w-12">{minBrandSamples}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setSelectedBrands([])}
            className={`px-2.5 py-1 rounded-full text-xs ${selectedBrands.length === 0 ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'}`}
          >
            全部（样本≥{minBrandSamples}）
          </button>
          {topBrands.map(b => (
            <button
              key={b.brand}
              onClick={() => toggleBrand(b.brand)}
              onDoubleClick={() => goToRanking(b.brand)}
              title={`双击跳转排行榜筛选 ${b.brand}`}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                selectedBrands.includes(b.brand)
                  ? 'bg-primary text-white'
                  : 'bg-surface-alt text-text-secondary hover:bg-border'
              }`}
            >
              {b.brand}
              <span className="ml-1 opacity-60">({b.totalSamples})</span>
            </button>
          ))}
        </div>
        <BrandRankBar data={brandAvgData} />
        <p className="text-xs text-text-secondary mt-2">双击品牌标签可跳转排行榜查看该品牌全部车型</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-base font-semibold mb-3">油耗分布直方图</h2>
          <ConsumptionHistogram data={histogram} />
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-base font-semibold mb-3">车型类型分布</h2>
          <TypeDistributionPie data={typeCount} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-4">
        <h2 className="text-base font-semibold mb-3">各品牌数据详情（按总样本数排序）</h2>
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="pb-2 pr-4">品牌</th>
                <th className="pb-2 pr-4 text-right">车型数</th>
                <th className="pb-2 pr-4 text-right">总样本数</th>
                <th className="pb-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {brandSampleStats.slice(0, 50).map(b => (
                <tr key={b.brand} className="border-b border-border/50 hover:bg-blue-50/30">
                  <td className="py-1.5 font-medium">{b.brand}</td>
                  <td className="py-1.5 text-right font-mono text-text-secondary">{b.modelCount}</td>
                  <td className="py-1.5 text-right font-mono text-accent-amber">{b.totalSamples.toLocaleString()}</td>
                  <td className="py-1.5 text-right">
                    <button
                      onClick={() => goToRanking(b.brand)}
                      className="text-xs text-primary hover:underline"
                    >
                      查看排行 →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
