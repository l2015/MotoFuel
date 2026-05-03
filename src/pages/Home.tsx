import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Motorcycle } from '../types'
import { calcSummary, weightedAvgByDisplacement, topBySamples, samplesByBrand, countByType } from '../utils/stats'
import StatCard from '../components/StatCard'
import ConsumptionTrendLine from '../charts/ConsumptionTrendLine'
import TypeDistributionPie from '../charts/TypeDistributionPie'
import ModelConsumptionBar from '../charts/ModelConsumptionBar'

interface Props {
  data: Motorcycle[]
}

export default function Home({ data }: Props) {
  const summary = useMemo(() => calcSummary(data), [data])
  const weightedDisp = useMemo(() => weightedAvgByDisplacement(data), [data])
  const typeCount = useMemo(() => countByType(data), [data])
  const brandSamples = useMemo(() => samplesByBrand(data).slice(0, 10), [data])
  const top20 = useMemo(() => topBySamples(data, 20), [data])
  const topConsumption = useMemo(
    () => [...data].sort((a, b) => a.consumption - b.consumption).slice(0, 20),
    [data]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">摩托车油耗总览</h1>
        <a
          href="https://www.xiaoxiongyouhao.com/page_rank_chexi_moto.php"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
        >
          数据来源：小熊油耗
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="总车型数" value={summary.totalModels} />
        <StatCard title="品牌数" value={summary.totalBrands} />
        <StatCard title="排量级别" value={summary.totalDisplacements} />
        <StatCard title="总样本数" value={summary.totalSamples.toLocaleString()} color="text-accent-amber" />
        <StatCard
          title="最低油耗"
          value={summary.lowestConsumption ? `${summary.lowestConsumption.consumption} L/100km` : '-'}
          subtitle={summary.lowestConsumption ? `${summary.lowestConsumption.brand} ${summary.lowestConsumption.series}` : undefined}
          color="text-accent-green"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-base font-semibold mb-1">排量与平均油耗趋势</h2>
          <ConsumptionTrendLine data={weightedDisp} />
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-base font-semibold mb-3">车型类型分布</h2>
          <TypeDistributionPie data={typeCount} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-base font-semibold mb-3">样本数最多的品牌 Top 10</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="pb-2">品牌</th>
                <th className="pb-2 text-right">总样本数</th>
                <th className="pb-2 text-right">车型数</th>
              </tr>
            </thead>
            <tbody>
              {brandSamples.map((b, i) => (
                <tr key={b.brand} className="border-b border-border/50">
                  <td className="py-2 font-medium">
                    <span className="text-text-secondary mr-2">{i + 1}</span>
                    {b.brand}
                  </td>
                  <td className="py-2 text-right font-mono text-accent-amber">{b.totalSamples.toLocaleString()}</td>
                  <td className="py-2 text-right font-mono text-text-secondary">{b.modelCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-base font-semibold mb-3">跨排量 Top 20 最省油车型</h2>
          <ModelConsumptionBar data={topConsumption} maxItems={20} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">样本数最多的车型 Top 20</h2>
          <Link to="/ranking" className="text-xs text-primary hover:underline">查看完整排行榜 →</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-secondary border-b border-border">
              <th className="pb-2">排名</th>
              <th className="pb-2">品牌</th>
              <th className="pb-2">车系</th>
              <th className="pb-2">排量</th>
              <th className="pb-2 text-right">油耗(L/100km)</th>
              <th className="pb-2 text-right">样本数</th>
            </tr>
          </thead>
          <tbody>
            {top20.map((d, i) => (
              <tr key={d.id} className="border-b border-border/50 hover:bg-blue-50/30">
                <td className="py-2 font-mono text-text-secondary">{i + 1}</td>
                <td className="py-2 font-medium">{d.brand}</td>
                <td className="py-2">{d.series}</td>
                <td className="py-2 font-mono">{d.displacement}cc</td>
                <td className="py-2 text-right font-mono text-primary">{d.consumption}</td>
                <td className="py-2 text-right font-mono text-accent-amber">{d.samples}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
