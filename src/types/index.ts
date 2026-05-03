export interface Motorcycle {
  id: number
  brand: string
  series: string
  type: string
  displacement: number
  consumption: number
  samples: number
  rank: number
  logoUrl: string
}

export interface MotorcycleData {
  metadata: {
    source: string
    scrapedAt: string
    totalModels: number
  }
  displacements: number[]
  data: Motorcycle[]
}

export interface FilterState {
  displacements: number[]
  brands: string[]
  types: string[]
  minSamples: number
  consumptionRange: [number, number]
  searchText: string
}

export interface StatSummary {
  totalModels: number
  totalBrands: number
  totalDisplacements: number
  lowestConsumption: Motorcycle | null
  avgConsumption: number
}
