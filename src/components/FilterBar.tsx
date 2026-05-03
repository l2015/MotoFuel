import { useState, useRef, useEffect } from 'react'
import type { FilterState } from '../types'

interface FilterBarProps {
  filter: FilterState
  brands: string[]
  types: string[]
  onFilterChange: (partial: Partial<FilterState>) => void
  onReset: () => void
}

function MultiSelectDropdown({ label, options, selected, onChange }: {
  label: string
  options: string[]
  selected: string[]
  onChange: (val: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter(s => s !== opt))
    else onChange([...selected, opt])
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white text-sm hover:border-primary transition-colors"
      >
        {label}
        {selected.length > 0 && (
          <span className="bg-primary text-white text-xs rounded-full px-1.5 min-w-5 text-center">{selected.length}</span>
        )}
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索..."
              className="w-full px-2 py-1 text-xs border border-border rounded"
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {filtered.map(opt => (
              <label key={opt} className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-surface-alt rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                  className="rounded"
                />
                {opt}
              </label>
            ))}
            {filtered.length === 0 && <p className="text-xs text-text-secondary p-2">无匹配项</p>}
          </div>
          {selected.length > 0 && (
            <div className="p-1.5 border-t border-border">
              <button onClick={() => onChange([])} className="text-xs text-accent-red hover:underline">清除选择</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function FilterBar({ filter, brands, types, onFilterChange, onReset }: FilterBarProps) {
  const consumptionMax = 20

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <MultiSelectDropdown
          label="品牌"
          options={brands}
          selected={filter.brands}
          onChange={val => onFilterChange({ brands: val })}
        />
        <MultiSelectDropdown
          label="类型"
          options={types}
          selected={filter.types}
          onChange={val => onFilterChange({ types: val })}
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-secondary whitespace-nowrap">样本≥</label>
          <input
            type="range"
            min={0}
            max={200}
            value={filter.minSamples}
            onChange={e => onFilterChange({ minSamples: parseInt(e.target.value) })}
            className="w-20 accent-primary"
          />
          <span className="text-xs font-mono w-6">{filter.minSamples}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-secondary whitespace-nowrap">油耗≤</label>
          <input
            type="range"
            min={1}
            max={consumptionMax}
            step={0.5}
            value={filter.consumptionRange[1]}
            onChange={e => onFilterChange({ consumptionRange: [filter.consumptionRange[0], parseFloat(e.target.value)] })}
            className="w-20 accent-primary"
          />
          <span className="text-xs font-mono w-10">{filter.consumptionRange[1]}L</span>
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
          className="text-xs text-text-secondary hover:text-accent-red transition-colors"
        >
          重置筛选
        </button>
      </div>
    </div>
  )
}
