import { useState, useEffect, useMemo } from 'react'
import type { Motorcycle, MotorcycleData, FilterState } from '../types'

const DEFAULT_FILTER: FilterState = {
  displacements: [],
  brands: [],
  types: [],
  minSamples: 0,
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
    if (filter.consumptionRange[0] > 0) {
      result = result.filter(d => d.consumption >= filter.consumptionRange[0])
    }
    if (filter.consumptionRange[1] < 6) {
      result = result.filter(d => d.consumption <= filter.consumptionRange[1])
    }
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
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER)

  const brands = useMemo(() => [...new Set(data.map(d => d.brand))].sort(), [data])
  const types = useMemo(() => [...new Set(data.map(d => d.type))].sort(), [data])
  const displacements = useMemo(
    () => [...new Set(data.map(d => d.displacement))].sort((a, b) => a - b),
    [data]
  )

  const updateFilter = (partial: Partial<FilterState>) => {
    setFilter(prev => ({ ...prev, ...partial }))
  }

  const resetFilter = () => setFilter(DEFAULT_FILTER)

  const filtered = useFilteredData(data, filter)

  return { filter, updateFilter, resetFilter, filtered, brands, types, displacements }
}
