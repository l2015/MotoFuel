import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Motorcycle } from '../types'
import { calcSummary, weightedAvgByDisplacement, topBySamples, samplesByBrand, countByType } from '../utils/stats'
import ConsumptionTrendLine from '../charts/ConsumptionTrendLine'
import TypeDistributionPie from '../charts/TypeDistributionPie'
import ModelConsumptionBar from '../charts/ModelConsumptionBar'

interface Props {
  data: Motorcycle[]
}

type TabKey = 'brand' | 'model' | 'type'

export default function Home({ data }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('brand')
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list')

  const summary = useMemo(() => calcSummary(data), [data])
  const weightedDisp = useMemo(() => weightedAvgByDisplacement(data), [data])
  const typeCount = useMemo(() => countByType(data), [data])
  const brandSamples = useMemo(() => samplesByBrand(data).slice(0, 15), [data])
  const top15Models = useMemo(() => topBySamples(data, 15), [data])
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-text-secondary">总车型数</p>
          <p className="text-2xl font-bold text-primary mt-1">{summary.totalModels}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-text-secondary">品牌数</p>
          <p className="text-2xl font-bold text-primary mt-1">{summary.totalBrands}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-text-secondary">排量级别</p>
          <p className="text-2xl font-bold text-primary mt-1">{summary.totalDisplacements}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-text-secondary">总样本数</p>
          <p className="text-2xl font-bold text-accent-amber mt-1">{summary.totalSamples.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-xs text-text-secondary">最低油耗</p>
          <p className="text-xl font-bold text-accent-green mt-1 whitespace-nowrap">
            {summary.lowestConsumption ? `${summary.lowestConsumption.consumption}` : '-'}
            <span className="text-xs font-normal text-text-secondary ml-0.5">L/100km</span>
          </p>
          {summary.lowestConsumption && (
            <p className="text-[10px] text-text-secondary mt-0.5 truncate">
              {summary.lowestConsumption.brand} {summary.lowestConsumption.series}
            </p>
          )}
        </div>
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('brand')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'brand' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-alt'
                }`}
              >品牌</button>
              <button
                onClick={() => setActiveTab('model')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'model' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-alt'
                }`}
              >车型</button>
              <button
                onClick={() => setActiveTab('type')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'type' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-alt'
                }`}
              >类型</button>
            </div>
            <button
              onClick={() => setViewMode(v => v === 'list' ? 'chart' : 'list')}
              className="text-xs text-text-secondary hover:text-primary transition-colors"
            >
              {viewMode === 'list' ? '图表' : '列表'}
            </button>
          </div>

          {viewMode === 'list' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary border-b border-border">
                  <th className="pb-2">#</th>
                  <th className="pb-2">{activeTab === 'brand' ? '品牌' : activeTab === 'model' ? '车型' : '类型'}</th>
                  <th className="pb-2 text-right">样本数</th>
                  {activeTab !== 'type' && <th className="pb-2 text-right">{activeTab === 'brand' ? '车型数' : '油耗'}</th>}
                </tr>
              </thead>
              <tbody>
                {activeTab === 'brand' && brandSamples.map((b, i) => (
                  <tr key={b.brand} className="border-b border-border/50">
                    <td className="py-1.5 text-text-secondary">{i + 1}</td>
                    <td className="py-1.5 font-medium">{b.brand}</td>
                    <td className="py-1.5 text-right font-mono text-accent-amber">{b.totalSamples.toLocaleString()}</td>
                    <td className="py-1.5 text-right font-mono text-text-secondary">{b.modelCount}</td>
                  </tr>
                ))}
                {activeTab === 'model' && top15Models.map((d, i) => (
                  <tr key={d.id} className="border-b border-border/50">
                    <td className="py-1.5 text-text-secondary">{i + 1}</td>
                    <td className="py-1.5 font-medium truncate max-w-40">{d.brand} {d.series}</td>
                    <td className="py-1.5 text-right font-mono text-accent-amber">{d.samples}</td>
                    <td className="py-1.5 text-right font-mono text-primary">{d.consumption}</td>
                  </tr>
                ))}
                {activeTab === 'type' && typeCount.map((t, i) => (
                  <tr key={t.type} className="border-b border-border/50">
                    <td className="py-1.5 text-text-secondary">{i + 1}</td>
                    <td className="py-1.5 font-medium">{t.type}</td>
                    <td className="py-1.5 text-right font-mono text-accent-amber">{t.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            activeTab === 'type'
              ? <TypeDistributionPie data={typeCount} />
              : activeTab === 'brand'
                ? <ModelConsumptionBar data={brandSamples.map(b => ({ brand: b.brand, series: `${b.totalSamples}样本`, consumption: 0 }))} maxItems={15} />
                : <ModelConsumptionBar data={top15Models} maxItems={15} />
          )}
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">跨排量 Top 20 最省油</h2>
            <Link to="/ranking" className="text-sm text-primary hover:underline">完整排行 →</Link>
          </div>
          <ModelConsumptionBar data={topConsumption} maxItems={20} />
        </div>
      </div>
    </div>
  )
}
