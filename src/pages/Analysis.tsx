import { useMemo, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import type { Motorcycle } from '../types'
import { avgByBrand, samplesByBrand, consumptionHistogram, countByType } from '../utils/stats'

interface Props {
  data: Motorcycle[]
}

const STORAGE_KEY = 'motofuel-analysis-filter'

function loadSavedFilter(): { selectedBrands: string[]; minBrandSamples: number } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export default function Analysis({ data }: Props) {
  const navigate = useNavigate()
  const saved = loadSavedFilter()

  const [selectedBrands, setSelectedBrands] = useState<string[]>(saved?.selectedBrands ?? [])
  const [minBrandSamples, setMinBrandSamples] = useState(saved?.minBrandSamples ?? 1000)
  const [brandExpanded, setBrandExpanded] = useState(false)
  const [filterCollapsed, setFilterCollapsed] = useState(false)

  // Persist filter state
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedBrands, minBrandSamples }))
  }, [selectedBrands, minBrandSamples])

  const brandSampleStats = useMemo(() => samplesByBrand(data), [data])
  const topBrands = useMemo(
    () => brandSampleStats.filter(b => b.totalSamples >= minBrandSamples),
    [brandSampleStats, minBrandSamples]
  )

  // When expanded, show ALL brands sorted alphabetically
  const displayedBrands = useMemo(() => {
    if (brandExpanded) {
      return [...brandSampleStats].sort((a, b) => a.brand.localeCompare(b.brand, 'zh'))
    }
    return topBrands.slice(0, 30)
  }, [topBrands, brandExpanded, brandSampleStats])

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

  // Samples per brand (for tooltip)
  const brandSamplesMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of filteredByBrand) {
      map.set(d.brand, (map.get(d.brand) || 0) + d.samples)
    }
    return map
  }, [filteredByBrand])

  // Samples per type (for tooltip)
  const typeSamplesMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of filteredByBrand) {
      map.set(d.type, (map.get(d.type) || 0) + d.samples)
    }
    return map
  }, [filteredByBrand])

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  const goToRanking = useCallback((params: { brand?: string; type?: string }) => {
    const query = new URLSearchParams()
    if (params.brand) query.set('brand', params.brand)
    if (params.type) query.set('type', params.type)
    query.set('minSamples', String(minBrandSamples))
    navigate(`/ranking?${query.toString()}`)
  }, [navigate, minBrandSamples])

  // Brand rank chart
  const brandChartOption = useMemo(() => {
    const items = brandAvgData.slice(0, 30)
    return {
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        formatter: (p: any) => {
          const idx = p[0]?.dataIndex ?? 0
          const item = items[idx]
          if (!item) return ''
          return `${item.brand}<br/>平均油耗: ${item.avg} L/100km<br/>车型数: ${item.count}<br/>样本数: ${(brandSamplesMap.get(item.brand) || 0).toLocaleString()}`
        },
      },
      grid: { left: 100, right: 50, top: 10, bottom: 20 },
      xAxis: { type: 'value' as const, name: 'L/100km' },
      yAxis: { type: 'category' as const, data: items.map(d => d.brand), inverse: true, axisLabel: { fontSize: 13 } },
      series: [{
        type: 'bar' as const,
        data: items.map(d => ({
          value: d.avg,
          label: { show: true, position: 'right' as const, formatter: '{c}', fontSize: 11 },
          itemStyle: {
            color: d.avg < 3 ? '#16a34a' : d.avg < 5 ? '#2563eb' : d.avg < 7 ? '#f59e0b' : '#dc2626',
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barMaxWidth: 16,
      }],
    }
  }, [brandAvgData, brandSamplesMap])

  const onBrandChartClick = useCallback((params: any) => {
    const brand = brandAvgData[params.dataIndex]?.brand
    if (brand) goToRanking({ brand })
  }, [brandAvgData, goToRanking])

  // Type pie chart
  const typePieOption = useMemo(() => ({
    tooltip: {
      trigger: 'item' as const,
      formatter: (p: any) => {
        const samples = typeSamplesMap.get(p.name) || 0
        return `${p.name}<br/>车型数: ${p.value} 款 (${p.percent}%)<br/>样本数: ${samples.toLocaleString()}`
      },
    },
    series: [{
      type: 'pie' as const,
      radius: ['30%', '65%'],
      center: ['50%', '55%'],
      data: typeCount.map(d => ({ name: d.type, value: d.count })),
      label: {
        fontSize: 12,
        formatter: (p: any) => p.percent >= 5 ? `${p.name} ${p.percent}%` : p.name,
      },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.15)' } },
    }],
  }), [typeCount, typeSamplesMap])

  const onTypePieClick = useCallback((params: any) => {
    if (params.name) goToRanking({ type: params.name })
  }, [goToRanking])

  // Histogram chart
  const histogramOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'shadow' as const },
      formatter: (p: any) => {
        const idx = p[0]?.dataIndex ?? 0
        const d = histogram[idx]
        if (!d) return ''
        return `${d.range}L/100km<br/>车型数: ${d.count}`
      },
    },
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
        <h1 className="text-2xl font-bold">数据洞察</h1>
        <span className="text-sm text-text-secondary">基于 {filteredByBrand.length} 款车型</span>
      </div>

      <div className="bg-white rounded-xl border border-border sticky top-14 z-40">
        <div className="flex items-center justify-between px-4 py-2.5">
          <button onClick={() => setFilterCollapsed(!filterCollapsed)}
            className="flex items-center gap-1.5 text-sm font-semibold hover:text-primary transition-colors">
            <svg className={`w-4 h-4 transition-transform ${filterCollapsed ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            品牌筛选
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-secondary">样本 ≥</label>
              <input type="range" min={0} max={5000} step={100} value={minBrandSamples}
                onChange={e => { setMinBrandSamples(parseInt(e.target.value)); setSelectedBrands([]) }}
                className="w-28 accent-primary" />
              <span className="text-xs font-mono w-12">{minBrandSamples}</span>
            </div>
            <button onClick={() => { setSelectedBrands([]); setMinBrandSamples(1000) }}
              className="text-xs text-text-secondary hover:text-accent-red transition-colors">重置</button>
          </div>
        </div>
        {!filterCollapsed && (
          <div className="px-4 pb-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
            <button onClick={() => setSelectedBrands([])}
              className={`px-2.5 py-1 rounded-full text-xs ${selectedBrands.length === 0 ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'}`}
            >全部</button>
            {displayedBrands.map(b => (
              <button key={b.brand} onClick={() => toggleBrand(b.brand)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedBrands.includes(b.brand) ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
                }`}>{b.brand} <span className="opacity-60">{b.totalSamples.toLocaleString()}</span></button>
            ))}
            {!brandExpanded && topBrands.length < brandSampleStats.length && (
              <button onClick={() => setBrandExpanded(true)}
                className="px-2.5 py-1 rounded-full text-xs text-primary hover:bg-primary/10">
                展开全部 {brandSampleStats.length} 个
              </button>
            )}
            {brandExpanded && (
              <button onClick={() => setBrandExpanded(false)}
                className="px-2.5 py-1 rounded-full text-xs text-primary hover:bg-primary/10">
                收起
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold mb-4">
          品牌平均油耗排名
          <span className="text-xs text-text-secondary font-normal ml-2">点击柱子查看该品牌排行榜</span>
        </h2>
        <ReactECharts
          option={brandChartOption}
          style={{ height: Math.max(300, Math.min(brandAvgData.length, 30) * 26) }}
          onEvents={{ click: onBrandChartClick }}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold mb-3">
            车型类型分布
            <span className="text-xs text-text-secondary font-normal ml-2">点击扇区查看</span>
          </h2>
          <ReactECharts option={typePieOption} style={{ height: 340 }} onEvents={{ click: onTypePieClick }} />
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold mb-3">油耗分布直方图</h2>
          <ReactECharts option={histogramOption} style={{ height: 340 }} />
        </div>
      </div>
    </div>
  )
}
