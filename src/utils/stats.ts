import type { Motorcycle, StatSummary } from '../types'

export function calcSummary(data: Motorcycle[]): StatSummary {
  if (data.length === 0) {
    return { totalModels: 0, totalBrands: 0, totalDisplacements: 0, lowestConsumption: null, avgConsumption: 0 }
  }
  const brands = new Set(data.map(d => d.brand))
  const disps = new Set(data.map(d => d.displacement))
  const lowest = data.reduce((a, b) => a.consumption < b.consumption ? a : b)
  const avg = data.reduce((s, d) => s + d.consumption, 0) / data.length
  return {
    totalModels: data.length,
    totalBrands: brands.size,
    totalDisplacements: disps.size,
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
  const min = Math.floor(Math.min(...data.map(d => d.consumption)))
  const max = Math.ceil(Math.max(...data.map(d => d.consumption)))
  const bins: { range: string; count: number }[] = []
  for (let i = min; i < max; i += binSize) {
    const upper = i + binSize
    const count = data.filter(d => d.consumption >= i && d.consumption < upper).length
    bins.push({ range: `${i}-${upper}`, count })
  }
  return bins
}
