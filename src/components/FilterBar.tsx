import { useState, useMemo } from 'react'
import type { FilterState, Motorcycle } from '../types'

interface FilterBarProps {
  filter: FilterState
  allData: Motorcycle[]
  types: string[]
  onFilterChange: (partial: Partial<FilterState>) => void
  onReset: () => void
}

const DISP_QUICK_RANGES = [
  { label: '50-110', min: 50, max: 110 },
  { label: '125-250', min: 125, max: 250 },
  { label: '300-600', min: 300, max: 600 },
  { label: '650+', min: 650, max: 9999 },
]

export default function FilterBar({ filter, allData, types, onFilterChange, onReset }: FilterBarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [brandExpanded, setBrandExpanded] = useState(false)

  // Cascading: filter by type first
  const cascadedData = useMemo(() => {
    if (filter.types.length === 0) return allData
    return allData.filter(d => filter.types.includes(d.type))
  }, [allData, filter.types])

  const cascadedBrands = useMemo(() => {
    const brandSamples = new Map<string, number>()
    for (const d of cascadedData) {
      brandSamples.set(d.brand, (brandSamples.get(d.brand) || 0) + d.samples)
    }
    return [...brandSamples.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([brand]) => brand)
  }, [cascadedData])

  const cascadedDisplacements = useMemo(
    () => [...new Set(cascadedData.map(d => d.displacement))].sort((a, b) => a - b),
    [cascadedData]
  )

  // Brands sorted alphabetically when expanded
  const alphaBrands = useMemo(
    () => [...cascadedBrands].sort((a, b) => a.localeCompare(b, 'zh')),
    [cascadedBrands]
  )
  const displayedBrands = brandExpanded ? alphaBrands : cascadedBrands.slice(0, 30)

  const toggleType = (type: string) => {
    const next = filter.types.includes(type) ? filter.types.filter(t => t !== type) : [...filter.types, type]
    onFilterChange({ types: next })
  }

  const toggleBrand = (brand: string) => {
    const next = filter.brands.includes(brand) ? filter.brands.filter(b => b !== brand) : [...filter.brands, brand]
    onFilterChange({ brands: next })
  }

  const toggleDisplacement = (disp: number) => {
    if (filter.displacements.length === 0) {
      onFilterChange({ displacements: [disp] })
    } else if (filter.displacements.includes(disp)) {
      onFilterChange({ displacements: filter.displacements.filter(d => d !== disp) })
    } else {
      onFilterChange({ displacements: [...filter.displacements, disp] })
    }
  }

  const toggleQuickRange = (r: { min: number; max: number }) => {
    const inRange = cascadedDisplacements.filter(d => d >= r.min && d <= r.max)
    const allSelected = inRange.every(d => filter.displacements.includes(d))
    if (allSelected) {
      onFilterChange({ displacements: filter.displacements.filter(d => d < r.min || d > r.max) })
    } else {
      const merged = [...new Set([...filter.displacements, ...inRange])]
      onFilterChange({ displacements: merged })
    }
  }

  return (
    <div className="bg-white rounded-xl border border-border sticky top-14 z-40">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-surface-alt rounded-t-xl transition-colors"
      >
        <span>筛选条件 {filter.types.length + filter.brands.length + filter.displacements.length + (filter.minSamples > 0 ? 1 : 0) + (filter.consumptionRange[1] < 6 ? 1 : 0) + (filter.searchText ? 1 : 0) > 0 ? `（已启用）` : ''}</span>
        <svg className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-text-secondary w-10">类型</span>
            <div className="flex flex-wrap gap-1.5">
              {types.map(t => (
                <button key={t} onClick={() => toggleType(t)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter.types.includes(t) ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
                  }`}>{t}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-text-secondary w-10">排量</span>
            <div className="flex flex-wrap gap-1.5 items-center">
              <button onClick={() => onFilterChange({ displacements: [] })}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter.displacements.length === 0 ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
                }`}>全部</button>
              {cascadedDisplacements.map(d => (
                <button key={d} onClick={() => toggleDisplacement(d)}
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter.displacements.includes(d) ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
                  }`}>{d}cc</button>
              ))}
              <span className="text-border mx-1">|</span>
              {DISP_QUICK_RANGES.map(r => {
                const inRange = cascadedDisplacements.filter(d => d >= r.min && d <= r.max)
                const isActive = inRange.length > 0 && inRange.every(d => filter.displacements.includes(d))
                return (
                  <button key={r.label} onClick={() => toggleQuickRange(r)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                      isActive ? 'border-primary text-primary bg-primary/5' : 'border-border text-text-secondary hover:border-primary/50'
                    }`}>{r.label}</button>
                )
              })}
            </div>
          </div>

          <div className="flex items-start gap-3 flex-wrap">
            <span className="text-xs font-medium text-text-secondary w-10 pt-1">品牌</span>
            <div className="flex flex-wrap gap-1.5 flex-1">
              {filter.brands.length > 0 && (
                <button onClick={() => onFilterChange({ brands: [] })}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors">清除</button>
              )}
              {displayedBrands.map(b => (
                <button key={b} onClick={() => toggleBrand(b)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter.brands.includes(b) ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
                  }`}>{b}</button>
              ))}
              {cascadedBrands.length > 30 && (
                <button onClick={() => setBrandExpanded(!brandExpanded)}
                  className="px-2.5 py-1 rounded-full text-xs text-primary hover:bg-primary/10">
                  {brandExpanded ? '收起' : `展开全部 ${cascadedBrands.length} 个`}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-text-secondary">样本 ≥</label>
              <input type="range" min={0} max={5000} step={50} value={filter.minSamples}
                onChange={e => onFilterChange({ minSamples: parseInt(e.target.value) })}
                className="w-28 accent-primary" />
              <span className="text-xs font-mono w-10">{filter.minSamples}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-text-secondary">油耗</label>
              <div className="relative w-32 h-6">
                <input type="range" min={0} max={6} step={0.1}
                  value={filter.consumptionRange[0]}
                  onChange={e => {
                    const v = parseFloat(e.target.value)
                    if (v < filter.consumptionRange[1]) onFilterChange({ consumptionRange: [v, filter.consumptionRange[1]] })
                  }}
                  className="absolute inset-0 w-full accent-primary pointer-events-auto" style={{ zIndex: 1 }} />
                <input type="range" min={0} max={6} step={0.1}
                  value={filter.consumptionRange[1]}
                  onChange={e => {
                    const v = parseFloat(e.target.value)
                    if (v > filter.consumptionRange[0]) onFilterChange({ consumptionRange: [filter.consumptionRange[0], v] })
                  }}
                  className="absolute inset-0 w-full accent-primary pointer-events-auto" style={{ zIndex: 2 }} />
              </div>
              <span className="text-xs font-mono">{filter.consumptionRange[0]}~{filter.consumptionRange[1]}L</span>
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
      )}
    </div>
  )
}
