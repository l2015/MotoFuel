import { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import type { Motorcycle } from '../types'
import { avgByBrand, samplesByBrand, consumptionHistogram, countByType } from '../utils/stats'

interface Props {
  data: Motorcycle[]
}

export default function Analysis({ data }: Props) {
  const navigate = useNavigate()
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [minBrandSamples, setMinBrandSamples] = useState(0)
  const [brandExpanded, setBrandExpanded] = useState(false)

  const brandSampleStats = useMemo(() => samplesByBrand(data), [data])
  const topBrands = useMemo(
    () => brandSampleStats.filter(b => b.totalSamples >= minBrandSamples),
    [brandSampleStats, minBrandSamples]
  )
  const displayedBrands = brandExpanded ? topBrands : topBrands.slice(0, 30)

  const filteredByBrand = useMemo(() => {
    if (selectedBrands.length === 0) {
      return data.filter(d => {
        const brandStat = brandSampleStats.find(b => b.brand === d.brand)
        return brandStat && brandStat.totalSamples >= minBrandSamples
      })
    }
    return data.filter(d => selectedBrands.includes(d.brand))
  }, [data, selectedBrands, brandSampleStats, minBrandSamples])

  const brandAvgData = useMemo(() => avgByBrand(filteredByBrand), [filteredByBrand])
  const histogram = useMemo(() => consumptionHistogram(filteredByBrand), [filteredByBrand])
  const typeCount = useMemo(() => countByType(filteredByBrand), [filteredByBrand])

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  const goToRanking = useCallback((params: { brand?: string; type?: string }) => {
    const query = new URLSearchParams()
    if (params.brand) query.set('brand', params.brand)
    if (params.type) query.set('type', params.type)
    navigate(`/ranking?${query.toString()}`)
  }, [navigate])

  // Clickable chart: brand rank bar
  const brandChartOption = useMemo(() => {
    const items = brandAvgData.slice(0, 30)
    return {
      tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
      grid: { left: 100, right: 40, top: 10, bottom: 20 },
      xAxis: { type: 'value' as const, name: 'L/100km' },
      yAxis: { type: 'category' as const, data: items.map(d => d.brand), inverse: true },
      series: [{
        type: 'bar' as const,
        data: items.map(d => ({
          value: d.avg,
          itemStyle: {
            color: d.avg < 3 ? '#16a34a' : d.avg < 5 ? '#2563eb' : d.avg < 7 ? '#f59e0b' : '#dc2626',
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barMaxWidth: 14,
      }],
    }
  }, [brandAvgData])

  const onBrandChartClick = useCallback((params: any) => {
    const brand = brandAvgData[params.dataIndex]?.brand
    if (brand) goToRanking({ brand })
  }, [brandAvgData, goToRanking])

  // Clickable chart: type pie
  const typePieOption = useMemo(() => ({
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c} 款 ({d}%)' },
    series: [{
      type: 'pie' as const,
      radius: ['35%', '65%'],
      data: typeCount.map(d => ({ name: d.type, value: d.count })),
      label: {
        fontSize: 11,
        formatter: (p: any) => p.percent >= 5 ? `${p.name} ${p.percent}%` : p.name,
      },
    }],
  }), [typeCount])

  const onTypePieClick = useCallback((params: any) => {
    if (params.name) goToRanking({ type: params.name })
  }, [goToRanking])

  // Histogram chart
  const histogramOption = useMemo(() => ({
    tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
    grid: { left: 50, right: 20, top: 20, bottom: 50 },
    xAxis: { type: 'category' as const, data: histogram.map(d => d.range + 'L'), axisLabel: { rotate: 45 } },
    yAxis: { type: 'value' as const, name: '车型数' },
    series: [{
      type: 'bar' as const,
      data: histogram.map(d => d.count),
      itemStyle: { color: '#818cf8', borderRadius: [3, 3, 0, 0] },
      barMaxWidth: 30,
    }],
  }), [histogram])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">深度分析</h1>
        <span className="text-sm text-text-secondary">基于 {filteredByBrand.length} 款车型</span>
      </div>

      <div className="bg-white rounded-xl border border-border p-4 sticky top-14 z-40">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">品牌筛选（按总样本数）</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-secondary">样本 ≥</label>
            <input type="range" min={0} max={5000} step={50} value={minBrandSamples}
              onChange={e => { setMinBrandSamples(parseInt(e.target.value)); setSelectedBrands([]) }}
              className="w-28 accent-primary" />
            <span className="text-xs font-mono w-12">{minBrandSamples}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedBrands([])}
            className={`px-2.5 py-1 rounded-full text-xs ${selectedBrands.length === 0 ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'}`}
          >全部</button>
          {displayedBrands.map(b => (
            <button
              key={b.brand}
              onClick={() => toggleBrand(b.brand)}
              className={`px-2 py-1 rounded-full text-xs transition-colors ${
                selectedBrands.includes(b.brand) ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
              }`}
            >
              {b.brand}
              <span className="ml-0.5 opacity-50 text-[10px]">{b.totalSamples > 999 ? `${Math.round(b.totalSamples/1000)}k` : b.totalSamples}</span>
            </button>
          ))}
          {topBrands.length > 30 && (
            <button onClick={() => setBrandExpanded(!brandExpanded)}
              className="px-2.5 py-1 rounded-full text-xs text-primary hover:bg-primary/10">
              {brandExpanded ? '收起' : `展开 ${topBrands.length} 个`}
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-base font-semibold mb-3">
            品牌平均油耗排名
            <span className="text-xs text-text-secondary font-normal ml-2">点击柱子跳转排行榜</span>
          </h2>
          <ReactECharts
            option={brandChartOption}
            style={{ height: Math.max(300, Math.min(brandAvgData.length, 30) * 22) }}
            onEvents={{ click: onBrandChartClick }}
          />
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-base font-semibold mb-3">
            车型类型分布
            <span className="text-xs text-text-secondary font-normal ml-2">点击扇区跳转排行榜</span>
          </h2>
          <ReactECharts
            option={typePieOption}
            style={{ height: 300 }}
            onEvents={{ click: onTypePieClick }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-4">
        <h2 className="text-base font-semibold mb-3">油耗分布直方图</h2>
        <ReactECharts option={histogramOption} style={{ height: 300 }} />
      </div>
    </div>
  )
}
