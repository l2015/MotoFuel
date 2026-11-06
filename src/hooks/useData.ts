import { useState, useEffect, useMemo } from 'react'
import type { Motorcycle, MotorcycleData, FilterState } from '../types'

const DEFAULT_FILTER: FilterState = {
  displacements: [],
  brands: [],
  types: [],
  minSamples: 0,
  // 实际上界由 useFilter 按当前数据集初始化，这里只是占位默认值
  consumptionRange: [0, 6],
  searchText: '',
}

export function useData() {
  const [raw, setRaw] = useState<MotorcycleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/'
    fetch(`${base}data/motorcycles.json`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load data')
        return r.json()
      })
      .then(d => { setRaw(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  return { data: raw, loading, error }
}

export function useFilteredData(data: Motorcycle[], filter: FilterState): Motorcycle[] {
  return useMemo(() => {
    let result = data

    if (filter.displacements.length > 0) {
      result = result.filter(d => filter.displacements.includes(d.displacement))
    }
    if (filter.brands.length > 0) {
      result = result.filter(d => filter.brands.includes(d.brand))
    }
    if (filter.types.length > 0) {
      result = result.filter(d => filter.types.includes(d.type))
    }
    if (filter.minSamples > 0) {
      result = result.filter(d => d.samples >= filter.minSamples)
    }
    // 油耗区间：默认区间等于数据的完整区间（由 useFilter 计算），所以不会误杀任何记录；
    // 这里不再用"上界是否 < 6"来判断是否启用，避免将来出现 6L 以上的车型时筛选静默失效。
    result = result.filter(
      d => d.consumption >= filter.consumptionRange[0] && d.consumption <= filter.consumptionRange[1]
    )
    if (filter.searchText.trim()) {
      const q = filter.searchText.trim().toLowerCase()
      result = result.filter(d =>
        d.brand.toLowerCase().includes(q) ||
        d.series.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q)
      )
    }

    return result
  }, [data, filter])
}

export function useFilter(data: Motorcycle[]) {
  // 筛选项的物理上限来自数据本身：油耗上界、样本量上界都不再写死。
  const bounds = useMemo(() => {
    let maxConsumption = 0
    let maxSamples = 0
    for (const d of data) {
      if (d.consumption > maxConsumption) maxConsumption = d.consumption
      if (d.samples > maxSamples) maxSamples = d.samples
    }
    return {
      maxConsumption: Math.max(1, Math.ceil(maxConsumption * 10) / 10),
      maxSamples: Math.max(1, maxSamples),
    }
  }, [data])

  const [filter, setFilter] = useState<FilterState>(() => ({
    ...DEFAULT_FILTER,
    consumptionRange: [0, bounds.maxConsumption],
  }))

  // 数据集变化时（例如将来加入手动刷新/重新抓取），把"未被用户改动过"的油耗上界
  // 同步到新数据的上界；否则新出现且高于旧上界的车型会被静默过滤掉。
  const [boundsFor, setBoundsFor] = useState(bounds)
  if (boundsFor !== bounds) {
    setBoundsFor(bounds)
    setFilter(prev =>
      prev.consumptionRange[1] === boundsFor.maxConsumption
        ? { ...prev, consumptionRange: [0, bounds.maxConsumption] }
        : prev
    )
  }

  const brands = useMemo(() => [...new Set(data.map(d => d.brand))].sort(), [data])
  const types = useMemo(() => [...new Set(data.map(d => d.type))].sort(), [data])
  const displacements = useMemo(
    () => [...new Set(data.map(d => d.displacement))].sort((a, b) => a - b),
    [data]
  )

  const updateFilter = (partial: Partial<FilterState>) => {
    setFilter(prev => ({ ...prev, ...partial }))
  }

  const resetFilter = () =>
    setFilter({ ...DEFAULT_FILTER, consumptionRange: [0, bounds.maxConsumption] })

  const filtered = useFilteredData(data, filter)

  return { filter, updateFilter, resetFilter, filtered, brands, types, displacements, bounds }
}
