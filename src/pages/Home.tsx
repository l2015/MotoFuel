import { useMemo } from 'react'
import type { Motorcycle } from '../types'
import { calcSummary, avgByDisplacement, countByType, countByBrand } from '../utils/stats'
import StatCard from '../components/StatCard'
import ConsumptionTrendLine from '../charts/ConsumptionTrendLine'
import ConsumptionByDispBar from '../charts/ConsumptionByDispBar'
import TypeDistributionPie from '../charts/TypeDistributionPie'
import BrandDistributionPie from '../charts/BrandDistributionPie'
import ModelConsumptionBar from '../charts/ModelConsumptionBar'

interface Props {
  data: Motorcycle[]
}

export default function Home({ data }: Props) {
  const summary = useMemo(() => calcSummary(data), [data])
  const dispAvg = useMemo(() => avgByDisplacement(data), [data])
  const typeCount = useMemo(() => countByType(data), [data])
  const brandCount = useMemo(() => countByBrand(data), [data])
  const top20 = useMemo(
    () => [...data].sort((a, b) => a.consumption - b.consumption).slice(0, 20),
    [data]
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">摩托车油耗总览</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="总车型数" value={summary.totalModels} />
        <StatCard title="品牌数" value={summary.totalBrands} />
        <StatCard title="排量级别" value={summary.totalDisplacements} />
        <StatCard
          title="最低油耗"
          value={summary.lowestConsumption ? `${summary.lowestConsumption.consumption} L/100km` : '-'}
          subtitle={summary.lowestConsumption ? `${summary.lowestConsumption.brand} ${summary.lowestConsumption.series}` : undefined}
          color="text-accent-green"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-base font-semibold mb-3">排量与平均油耗趋势</h2>
          <ConsumptionTrendLine data={dispAvg} />
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-base font-semibold mb-3">各排量平均油耗</h2>
          <ConsumptionByDispBar data={dispAvg} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-base font-semibold mb-3">车型类型分布</h2>
          <TypeDistributionPie data={typeCount} />
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-base font-semibold mb-3">品牌车型数量</h2>
          <BrandDistributionPie data={brandCount} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-4">
        <h2 className="text-base font-semibold mb-3">跨排量 Top 20 最省油车型</h2>
        <ModelConsumptionBar data={top20} maxItems={20} />
      </div>
    </div>
  )
}
