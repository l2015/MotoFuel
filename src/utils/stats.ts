import type { Motorcycle, StatSummary } from '../types'

export function calcSummary(data: Motorcycle[]): StatSummary {
  if (data.length === 0) {
    return { totalModels: 0, totalBrands: 0, totalDisplacements: 0, totalSamples: 0, lowestConsumption: null, avgConsumption: 0 }
  }
  const brands = new Set(data.map(d => d.brand))
  const disps = new Set(data.map(d => d.displacement))
  const totalSamples = data.reduce((s, d) => s + d.samples, 0)
  const lowest = data.reduce((a, b) => a.consumption < b.consumption ? a : b)
  const avg = data.reduce((s, d) => s + d.consumption, 0) / data.length
  return {
    totalModels: data.length,
    totalBrands: brands.size,
    totalDisplacements: disps.size,
    totalSamples,
    lowestConsumption: lowest,
    avgConsumption: Math.round(avg * 100) / 100,
  }
}

export function avgByDisplacement(data: Motorcycle[]): { displacement: number; avg: number; count: number }[] {
  const map = new Map<number, { sum: number; count: number }>()
  for (const d of data) {
    const cur = map.get(d.displacement) || { sum: 0, count: 0 }
    cur.sum += d.consumption
    cur.count++
    map.set(d.displacement, cur)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([displacement, { sum, count }]) => ({
      displacement,
      avg: Math.round((sum / count) * 100) / 100,
      count,
    }))
}

export function avgByBrand(data: Motorcycle[]): { brand: string; avg: number; count: number }[] {
  const map = new Map<string, { sum: number; count: number }>()
  for (const d of data) {
    const cur = map.get(d.brand) || { sum: 0, count: 0 }
    cur.sum += d.consumption
    cur.count++
    map.set(d.brand, cur)
  }
  return [...map.entries()]
    .map(([brand, { sum, count }]) => ({
      brand,
      avg: Math.round((sum / count) * 100) / 100,
      count,
    }))
    .sort((a, b) => a.avg - b.avg)
}

export function countByType(data: Motorcycle[]): { type: string; count: number }[] {
  const map = new Map<string, number>()
  for (const d of data) {
    map.set(d.type, (map.get(d.type) || 0) + 1)
  }
  return [...map.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
}

export function countByBrand(data: Motorcycle[]): { brand: string; count: number }[] {
  const map = new Map<string, number>()
  for (const d of data) {
    map.set(d.brand, (map.get(d.brand) || 0) + 1)
  }
  return [...map.entries()]
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
}

export function consumptionHistogram(data: Motorcycle[], binSize = 1): { range: string; count: number }[] {
  if (data.length === 0) return []
  let min = Infinity, max = -Infinity
  for (const d of data) {
    if (d.consumption < min) min = d.consumption
    if (d.consumption > max) max = d.consumption
  }
  min = Math.floor(min)
  max = Math.ceil(max)
  const bins: { range: string; count: number }[] = []
  for (let i = min; i < max; i += binSize) {
    const upper = i + binSize
    const count = data.filter(d => d.consumption >= i && d.consumption < upper).length
    bins.push({ range: `${i}-${upper}`, count })
  }
  return bins
}

export function weightedAvgByDisplacement(
  data: Motorcycle[],
  minSamples = 5
): { displacement: number; avg: number; weightedAvg: number; count: number; filteredCount: number }[] {
  const map = new Map<number, { items: Motorcycle[] }>()
  for (const d of data) {
    const cur = map.get(d.displacement) || { items: [] }
    cur.items.push(d)
    map.set(d.displacement, cur)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([displacement, { items }]) => {
      const filtered = items.filter(d => d.samples >= minSamples)
      const simpleAvg = items.reduce((s, d) => s + d.consumption, 0) / items.length
      let weightedAvg = simpleAvg
      if (filtered.length > 0) {
        const totalWeight = filtered.reduce((s, d) => s + d.samples, 0)
        weightedAvg = filtered.reduce((s, d) => s + d.consumption * d.samples, 0) / totalWeight
      }
      return {
        displacement,
        avg: Math.round(simpleAvg * 100) / 100,
        weightedAvg: Math.round(weightedAvg * 100) / 100,
        count: items.length,
        filteredCount: filtered.length,
      }
    })
}

export function topBySamples(data: Motorcycle[], n = 20): Motorcycle[] {
  return [...data].sort((a, b) => b.samples - a.samples).slice(0, n)
}

export function samplesByBrand(data: Motorcycle[]): { brand: string; totalSamples: number; modelCount: number }[] {
  const map = new Map<string, { totalSamples: number; modelCount: number }>()
  for (const d of data) {
    const cur = map.get(d.brand) || { totalSamples: 0, modelCount: 0 }
    cur.totalSamples += d.samples
    cur.modelCount++
    map.set(d.brand, cur)
  }
  return [...map.entries()]
    .map(([brand, { totalSamples, modelCount }]) => ({ brand, totalSamples, modelCount }))
    .sort((a, b) => b.totalSamples - a.totalSamples)
}
