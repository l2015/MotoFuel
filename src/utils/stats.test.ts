import { describe, it, expect } from 'vitest'
import type { Motorcycle } from '../types'
import {
  calcSummary,
  avgByDisplacement,
  avgByBrand,
  countByType,
  countByBrand,
  consumptionHistogram,
  weightedAvgByDisplacement,
  topBySamples,
  samplesByBrand,
} from './stats'

function makeMoto(partial: Partial<Motorcycle> = {}): Motorcycle {
  return {
    id: 1,
    brand: '豪爵',
    series: 'DR160',
    type: '街车',
    displacement: 160,
    consumption: 2.5,
    samples: 100,
    rank: 1,
    logoUrl: '',
    ...partial,
  }
}

describe('calcSummary', () => {
  it('returns zeros for empty data', () => {
    const s = calcSummary([])
    expect(s.totalModels).toBe(0)
    expect(s.lowestConsumption).toBeNull()
  })

  it('calculates correct summary', () => {
    const data = [
      makeMoto({ brand: 'A', displacement: 125, consumption: 2.0, samples: 50 }),
      makeMoto({ brand: 'B', displacement: 250, consumption: 3.0, samples: 100, id: 2 }),
    ]
    const s = calcSummary(data)
    expect(s.totalModels).toBe(2)
    expect(s.totalBrands).toBe(2)
    expect(s.totalDisplacements).toBe(2)
    expect(s.totalSamples).toBe(150)
    expect(s.lowestConsumption?.consumption).toBe(2.0)
    expect(s.avgConsumption).toBe(2.5)
  })
})

describe('avgByDisplacement', () => {
  it('groups and averages by displacement', () => {
    const data = [
      makeMoto({ displacement: 125, consumption: 2.0 }),
      makeMoto({ displacement: 125, consumption: 3.0, id: 2 }),
      makeMoto({ displacement: 250, consumption: 4.0, id: 3 }),
    ]
    const result = avgByDisplacement(data)
    expect(result).toHaveLength(2)
    expect(result[0].displacement).toBe(125)
    expect(result[0].avg).toBe(2.5)
    expect(result[0].count).toBe(2)
    expect(result[1].displacement).toBe(250)
    expect(result[1].avg).toBe(4.0)
  })

  it('returns empty for empty data', () => {
    expect(avgByDisplacement([])).toEqual([])
  })
})

describe('avgByBrand', () => {
  it('sorts by avg ascending', () => {
    const data = [
      makeMoto({ brand: 'B', consumption: 3.0 }),
      makeMoto({ brand: 'A', consumption: 2.0, id: 2 }),
    ]
    const result = avgByBrand(data)
    expect(result[0].brand).toBe('A')
    expect(result[1].brand).toBe('B')
  })
})

describe('countByType', () => {
  it('counts and sorts descending', () => {
    const data = [
      makeMoto({ type: '街车' }),
      makeMoto({ type: '街车', id: 2 }),
      makeMoto({ type: '踏板车', id: 3 }),
    ]
    const result = countByType(data)
    expect(result[0].type).toBe('街车')
    expect(result[0].count).toBe(2)
    expect(result[1].count).toBe(1)
  })
})

describe('countByBrand', () => {
  it('counts by brand descending', () => {
    const data = [
      makeMoto({ brand: 'A' }),
      makeMoto({ brand: 'B', id: 2 }),
      makeMoto({ brand: 'B', id: 3 }),
    ]
    const result = countByBrand(data)
    expect(result[0].brand).toBe('B')
    expect(result[0].count).toBe(2)
  })
})

describe('consumptionHistogram', () => {
  it('creates bins', () => {
    const data = [
      makeMoto({ consumption: 1.5 }),
      makeMoto({ consumption: 2.3, id: 2 }),
      makeMoto({ consumption: 3.7, id: 3 }),
    ]
    const bins = consumptionHistogram(data)
    expect(bins.length).toBeGreaterThan(0)
    const totalCount = bins.reduce((s, b) => s + b.count, 0)
    expect(totalCount).toBe(3)
  })

  it('returns empty for empty data', () => {
    expect(consumptionHistogram([])).toEqual([])
  })
})

describe('weightedAvgByDisplacement', () => {
  it('computes simple and weighted averages', () => {
    const data = [
      makeMoto({ displacement: 125, consumption: 2.0, samples: 10 }),
      makeMoto({ displacement: 125, consumption: 3.0, samples: 90, id: 2 }),
    ]
    const result = weightedAvgByDisplacement(data)
    expect(result).toHaveLength(1)
    expect(result[0].avg).toBe(2.5) // simple average
    // weighted: (2*10 + 3*90) / (10+90) = 290/100 = 2.9
    expect(result[0].weightedAvg).toBe(2.9)
  })

  it('filters by minSamples', () => {
    const data = [
      makeMoto({ displacement: 125, consumption: 2.0, samples: 3 }), // below default min 5
      makeMoto({ displacement: 125, consumption: 3.0, samples: 100, id: 2 }),
    ]
    const result = weightedAvgByDisplacement(data)
    // weighted avg should only use the 2nd item (samples >= 5)
    expect(result[0].weightedAvg).toBe(3.0)
  })
})

describe('topBySamples', () => {
  it('returns top N by samples descending', () => {
    const data = [
      makeMoto({ samples: 10 }),
      makeMoto({ samples: 30, id: 2 }),
      makeMoto({ samples: 20, id: 3 }),
    ]
    const result = topBySamples(data, 2)
    expect(result).toHaveLength(2)
    expect(result[0].samples).toBe(30)
    expect(result[1].samples).toBe(20)
  })
})

describe('samplesByBrand', () => {
  it('aggregates samples by brand', () => {
    const data = [
      makeMoto({ brand: 'A', samples: 10 }),
      makeMoto({ brand: 'A', samples: 20, id: 2 }),
      makeMoto({ brand: 'B', samples: 50, id: 3 }),
    ]
    const result = samplesByBrand(data)
    expect(result[0].brand).toBe('B') // sorted by totalSamples desc
    expect(result[0].totalSamples).toBe(50)
    expect(result[1].brand).toBe('A')
    expect(result[1].totalSamples).toBe(30)
    expect(result[1].modelCount).toBe(2)
  })
})
