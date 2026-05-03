import type { FilterState } from '../types'

interface FilterBarProps {
  filter: FilterState
  brands: string[]
  types: string[]
  onFilterChange: (partial: Partial<FilterState>) => void
  onReset: () => void
}

export default function FilterBar({ filter, brands, types, onFilterChange, onReset }: FilterBarProps) {
  const toggleBrand = (brand: string) => {
    const next = filter.brands.includes(brand)
      ? filter.brands.filter(b => b !== brand)
      : [...filter.brands, brand]
    onFilterChange({ brands: next })
  }

  const toggleType = (type: string) => {
    const next = filter.types.includes(type)
      ? filter.types.filter(t => t !== type)
      : [...filter.types, type]
    onFilterChange({ types: next })
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4 space-y-3">
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

      <div className="flex items-start gap-3 flex-wrap">
        <span className="text-xs font-medium text-text-secondary w-10 pt-1">品牌</span>
        <div className="flex flex-wrap gap-1.5 flex-1">
          {filter.brands.length > 0 && (
            <button
              onClick={() => onFilterChange({ brands: [] })}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors"
            >
              清除品牌
            </button>
          )}
          {brands.slice(0, 40).map(b => (
            <button
              key={b}
              onClick={() => toggleBrand(b)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                filter.brands.includes(b)
                  ? 'bg-primary text-white'
                  : 'bg-surface-alt text-text-secondary hover:bg-border'
              }`}
            >
              {b}
            </button>
          ))}
          {brands.length > 40 && (
            <span className="text-xs text-text-secondary self-center">+{brands.length - 40} 更多</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-text-secondary whitespace-nowrap">样本 ≥</label>
          <input
            type="range"
            min={0}
            max={100}
            value={filter.minSamples}
            onChange={e => onFilterChange({ minSamples: parseInt(e.target.value) })}
            className="w-24 accent-primary"
          />
          <span className="text-xs font-mono w-8 text-right">{filter.minSamples}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-text-secondary whitespace-nowrap">油耗 ≤</label>
          <input
            type="range"
            min={1}
            max={15}
            step={0.5}
            value={filter.consumptionRange[1]}
            onChange={e => onFilterChange({ consumptionRange: [0, parseFloat(e.target.value)] })}
            className="w-24 accent-primary"
          />
          <span className="text-xs font-mono w-10 text-right">{filter.consumptionRange[1]}L</span>
        </div>
        <div className="flex-1 min-w-36">
          <input
            type="text"
            value={filter.searchText}
            onChange={e => onFilterChange({ searchText: e.target.value })}
            placeholder="搜索品牌/车型/类型..."
            className="w-full px-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={onReset}
          className="text-xs text-text-secondary hover:text-accent-red transition-colors whitespace-nowrap"
        >
          重置筛选
        </button>
      </div>
    </div>
  )
}
