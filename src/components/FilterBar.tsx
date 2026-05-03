import { useState, useMemo } from 'react'
import type { FilterState, Motorcycle } from '../types'

interface FilterBarProps {
  filter: FilterState
  allData: Motorcycle[]
  types: string[]
  onFilterChange: (partial: Partial<FilterState>) => void
  onReset: () => void
}

const DISP_RANGES: { label: string; desc: string; range: [number, number] }[] = [
  { label: '小排量', desc: '50-150cc', range: [50, 150] },
  { label: '中排量', desc: '160-400cc', range: [160, 400] },
  { label: '大排量', desc: '450-1000cc', range: [450, 1000] },
]

export default function FilterBar({ filter, allData, types, onFilterChange, onReset }: FilterBarProps) {
  const [brandExpanded, setBrandExpanded] = useState(false)

  // Cascading: available options based on current other filters
  const cascadedData = useMemo(() => {
    let result = allData
    if (filter.types.length > 0) {
      result = result.filter(d => filter.types.includes(d.type))
    }
    return result
  }, [allData, filter.types])

  const cascadedBrands = useMemo(() => {
    const brandSamples = new Map<string, number>()
    for (const d of cascadedData) {
      brandSamples.set(d.brand, (brandSamples.get(d.brand) || 0) + d.samples)
    }
    return [...brandSamples.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([brand, samples]) => ({ brand, samples }))
  }, [cascadedData])

  const cascadedDisplacements = useMemo(
    () => [...new Set(cascadedData.map(d => d.displacement))].sort((a, b) => a - b),
    [cascadedData]
  )

  // Data-driven consumption range
  const consumptionBounds = useMemo(() => {
    if (cascadedData.length === 0) return { min: 0, max: 15 }
    const consumptions = cascadedData.map(d => d.consumption)
    return {
      min: Math.floor(Math.min(...consumptions)),
      max: Math.ceil(Math.max(...consumptions)),
    }
  }, [cascadedData])

  const displayedBrands = brandExpanded ? cascadedBrands : cascadedBrands.slice(0, 30)

  const toggleType = (type: string) => {
    const next = filter.types.includes(type)
      ? filter.types.filter(t => t !== type)
      : [...filter.types, type]
    // Remove brands/displacements not available after type change
    onFilterChange({ types: next })
  }

  const toggleBrand = (brand: string) => {
    const next = filter.brands.includes(brand)
      ? filter.brands.filter(b => b !== brand)
      : [...filter.brands, brand]
    onFilterChange({ brands: next })
  }

  const toggleDisplacement = (disp: number) => {
    if (filter.displacements.length === 0) {
      onFilterChange({ displacements: [disp] })
    } else if (filter.displacements.includes(disp)) {
      const next = filter.displacements.filter(d => d !== disp)
      onFilterChange({ displacements: next })
    } else {
      onFilterChange({ displacements: [...filter.displacements, disp] })
    }
  }

  const selectDispRange = (range: [number, number]) => {
    const inRange = cascadedDisplacements.filter(d => d >= range[0] && d <= range[1])
    onFilterChange({ displacements: inRange })
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4 space-y-3 sticky top-14 z-40">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-text-secondary w-10">类型</span>
        <div className="flex flex-wrap gap-1.5">
          {types.map(t => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                filter.types.includes(t)
                  ? 'bg-primary text-white'
                  : 'bg-surface-alt text-text-secondary hover:bg-border'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-text-secondary w-10">排量</span>
        <div className="flex flex-wrap gap-1.5 items-center">
          <button
            onClick={() => onFilterChange({ displacements: [] })}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              filter.displacements.length === 0
                ? 'bg-primary text-white'
                : 'bg-surface-alt text-text-secondary hover:bg-border'
            }`}
          >全部</button>
          {cascadedDisplacements.map(d => (
            <button
              key={d}
              onClick={() => toggleDisplacement(d)}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                filter.displacements.includes(d)
                  ? 'bg-primary text-white'
                  : 'bg-surface-alt text-text-secondary hover:bg-border'
              }`}
            >{d}cc</button>
          ))}
          <span className="text-border mx-1">|</span>
          {DISP_RANGES.map(r => (
            <button
              key={r.label}
              onClick={() => selectDispRange(r.range)}
              className="px-2 py-1 rounded-full text-xs font-medium bg-accent-amber/10 text-accent-amber hover:bg-accent-amber/20 transition-colors"
            >{r.label}</button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 flex-wrap">
        <span className="text-xs font-medium text-text-secondary w-10 pt-1">品牌</span>
        <div className="flex flex-wrap gap-1.5 flex-1">
          {filter.brands.length > 0 && (
            <button
              onClick={() => onFilterChange({ brands: [] })}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors"
            >清除</button>
          )}
          {displayedBrands.map(b => (
            <button
              key={b.brand}
              onClick={() => toggleBrand(b.brand)}
              className={`px-2 py-1 rounded-full text-xs transition-colors ${
                filter.brands.includes(b.brand)
                  ? 'bg-primary text-white'
                  : 'bg-surface-alt text-text-secondary hover:bg-border'
              }`}
            >
              {b.brand}
              <span className="ml-0.5 opacity-50 text-[10px]">{b.samples > 999 ? `${Math.round(b.samples/1000)}k` : b.samples}</span>
            </button>
          ))}
          {cascadedBrands.length > 30 && (
            <button
              onClick={() => setBrandExpanded(!brandExpanded)}
              className="px-2.5 py-1 rounded-full text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              {brandExpanded ? '收起' : `展开全部 ${cascadedBrands.length} 个品牌`}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-text-secondary">样本 ≥</label>
          <input type="range" min={0} max={5000} step={50} value={filter.minSamples}
            onChange={e => onFilterChange({ minSamples: parseInt(e.target.value) })}
            className="w-28 accent-primary" />
          <span className="text-xs font-mono w-10">{filter.minSamples}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-text-secondary">油耗</label>
          <input type="number" min={consumptionBounds.min} max={filter.consumptionRange[1]} step={0.5}
            value={filter.consumptionRange[0]}
            onChange={e => onFilterChange({ consumptionRange: [parseFloat(e.target.value) || 0, filter.consumptionRange[1]] })}
            className="w-14 px-1.5 py-1 text-xs border border-border rounded text-center" />
          <span className="text-xs text-text-secondary">~</span>
          <input type="number" min={filter.consumptionRange[0]} max={consumptionBounds.max} step={0.5}
            value={filter.consumptionRange[1]}
            onChange={e => onFilterChange({ consumptionRange: [filter.consumptionRange[0], parseFloat(e.target.value) || consumptionBounds.max] })}
            className="w-14 px-1.5 py-1 text-xs border border-border rounded text-center" />
          <span className="text-xs text-text-secondary">L</span>
        </div>
        <div className="flex-1 min-w-32">
          <input type="text" value={filter.searchText}
            onChange={e => onFilterChange({ searchText: e.target.value })}
            placeholder="搜索..."
            className="w-full px-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:border-primary" />
        </div>
        <button onClick={onReset} className="text-xs text-text-secondary hover:text-accent-red transition-colors">重置</button>
      </div>
    </div>
  )
}
