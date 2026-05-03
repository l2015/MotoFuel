import { useMemo, useState, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import type { Motorcycle } from '../types'

interface Props {
  data: Motorcycle[]
}

const PALETTE = ['#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6']

export default function Explorer({ data }: Props) {
  const chartRef = useRef<ReactECharts>(null)
  const [highlightType, setHighlightType] = useState<string | null>(null)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedDisps, setSelectedDisps] = useState<number[]>([])
  const [brandExpanded, setBrandExpanded] = useState(false)

  const allTypes = useMemo(() => [...new Set(data.map(d => d.type))], [data])
  const allDisplacements = useMemo(
    () => [...new Set(data.map(d => d.displacement))].sort((a, b) => a - b),
    [data]
  )
  const typeColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    allTypes.forEach((t, i) => { map[t] = PALETTE[i % PALETTE.length] })
    return map
  }, [allTypes])

  // Brands sorted by sample count
  const brandsBySamples = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of data) {
      map.set(d.brand, (map.get(d.brand) || 0) + d.samples)
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([brand, samples]) => ({ brand, samples }))
  }, [data])
  const displayedBrands = brandExpanded
    ? [...brandsBySamples].sort((a, b) => a.brand.localeCompare(b.brand, 'zh'))
    : brandsBySamples.slice(0, 20)

  // Filtered data
  const filteredData = useMemo(() => {
    let result = data
    if (selectedBrands.length > 0) {
      result = result.filter(d => selectedBrands.includes(d.brand))
    }
    if (selectedDisps.length > 0) {
      result = result.filter(d => selectedDisps.includes(d.displacement))
    }
    return result
  }, [data, selectedBrands, selectedDisps])

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  const toggleDisp = (disp: number) => {
    setSelectedDisps(prev =>
      prev.includes(disp) ? prev.filter(d => d !== disp) : [...prev, disp]
    )
  }

  // Zoom animation on filter change
  const chartInstance = chartRef.current?.getEchartsInstance()

  const resetZoom = () => {
    if (chartInstance) {
      chartInstance.dispatchAction({ type: 'dataZoom', start: 0, end: 100 })
    }
  }

  const option = useMemo(() => {
    // Get top items by samples for smart labeling
    const sorted = [...filteredData].sort((a, b) => b.samples - a.samples)
    const labelThreshold = Math.min(sorted.length, 50)
    const topSampleItems = new Set(sorted.slice(0, labelThreshold).map(d => `${d.brand}|${d.series}|${d.displacement}`))

    // Group by type for separate series
    const series = allTypes.map(type => {
      const items = filteredData.filter(d => d.type === type)
      const color = typeColorMap[type]
      const isDimmed = highlightType !== null && highlightType !== type

      return {
        name: type,
        type: 'scatter' as const,
        data: items.map(d => ({
          value: [d.displacement, d.consumption],
          _brand: d.brand,
          _series: d.series,
          _samples: d.samples,
          _key: `${d.brand}|${d.series}|${d.displacement}`,
          label: {
            show: topSampleItems.has(`${d.brand}|${d.series}|${d.displacement}`),
            formatter: `{brand|${d.brand}}`,
            position: 'top' as const,
            distance: 4,
            rich: {
              brand: {
                fontSize: 10,
                color: isDimmed ? '#cbd5e1' : '#64748b',
                lineHeight: 12,
              },
            },
          },
        })),
        symbolSize: (_val: number[], params: any) => {
          const samples = params.data._samples || 1
          return Math.max(5, Math.min(20, Math.sqrt(samples) * 0.8))
        },
        itemStyle: {
          color: isDimmed ? 'rgba(200,200,200,0.3)' : color,
          borderColor: isDimmed ? 'transparent' : color,
          borderWidth: 1,
          opacity: isDimmed ? 0.2 : 0.85,
        },
        emphasis: {
          itemStyle: { borderWidth: 2, shadowBlur: 8, shadowColor: color },
          label: { show: true, formatter: (p: any) => `${p.data._brand} ${p.data._series}` },
        },
        large: true,
        animationDuration: 500,
        animationEasing: 'cubicOut' as const,
      }
    })

    // Smart label layout: hide overlapping labels
    const labelLayout = {
      hideOverlap: true,
      moveOverlap: 'shiftY' as const,
    }

    return {
      tooltip: {
        trigger: 'item' as const,
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#1e293b', fontSize: 13 },
        formatter: (p: any) => {
          const d = p.data
          return `<div style="font-weight:600;margin-bottom:4px">${d._brand} ${d._series}</div>
            <div>排量: ${p.value[0]}cc</div>
            <div>油耗: ${p.value[1]} L/100km</div>
            <div>样本数: ${d._samples}</div>
            <div>类型: ${p.seriesName}</div>`
        },
      },
      grid: { left: 70, right: 40, top: 20, bottom: 60 },
      xAxis: {
        type: 'value' as const,
        name: '排量 (cc)',
        nameLocation: 'center' as const,
        nameGap: 40,
        nameTextStyle: { fontSize: 14, fontWeight: 500 },
        axisLabel: {
          fontSize: 12,
          formatter: (v: number) => `${v}`,
        },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        min: 0,
      },
      yAxis: {
        type: 'value' as const,
        name: '油耗 (L/100km)',
        nameLocation: 'center' as const,
        nameGap: 55,
        nameTextStyle: { fontSize: 14, fontWeight: 500 },
        axisLabel: { fontSize: 12 },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        min: 0,
      },
      dataZoom: [
        { type: 'inside' as const, xAxisIndex: 0, filterMode: 'none' as const },
        { type: 'inside' as const, yAxisIndex: 0, filterMode: 'none' as const },
        { type: 'slider' as const, xAxisIndex: 0, bottom: 8, height: 22, borderColor: '#e2e8f0', fillerColor: 'rgba(37,99,235,0.08)' },
        { type: 'slider' as const, yAxisIndex: 0, right: 4, width: 22, borderColor: '#e2e8f0', fillerColor: 'rgba(37,99,235,0.08)' },
      ],
      legend: { show: false },
      series,
      labelLayout,
    }
  }, [filteredData, allTypes, typeColorMap, highlightType])

  return (
    <div className="fixed inset-0 top-14 flex flex-col bg-white">
      <div className="flex items-center gap-4 px-6 py-2.5 border-b border-border overflow-x-auto">
        <div className="flex items-center gap-3 shrink-0">
          <h1 className="text-lg font-bold">数据探索</h1>
          <span className="text-sm text-text-secondary">{filteredData.length} 款车型</span>
          {(selectedBrands.length > 0 || selectedDisps.length > 0) && (
            <button onClick={() => { setSelectedBrands([]); setSelectedDisps([]); resetZoom() }}
              className="text-xs text-accent-red hover:underline">清除筛选</button>
          )}
        </div>

        <div className="h-6 w-px bg-border shrink-0" />

        {/* Type filter */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-text-secondary">类型</span>
          <button
            onClick={() => setHighlightType(null)}
            className={`text-xs px-2 py-1 rounded-full transition-colors ${
              highlightType === null ? 'bg-text text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
            }`}
          >全部</button>
          {allTypes.map(t => (
            <button
              key={t}
              onClick={() => setHighlightType(highlightType === t ? null : t)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                highlightType === t ? 'ring-2 ring-offset-1 ring-primary' : 'bg-surface-alt hover:bg-border'
              }`}
            >
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: typeColorMap[t] }} />
              {t}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-border shrink-0" />

        {/* Displacement filter */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-text-secondary">排量</span>
          <button onClick={() => { setSelectedDisps([]) }}
            className={`text-xs px-2 py-1 rounded-full transition-colors ${
              selectedDisps.length === 0 ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
            }`}>全部</button>
          {allDisplacements.map(d => (
            <button key={d} onClick={() => toggleDisp(d)}
              className={`text-xs px-2 py-1 rounded-full transition-colors ${
                selectedDisps.includes(d) ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
              }`}>{d}cc</button>
          ))}
        </div>

        <div className="h-6 w-px bg-border shrink-0" />

        {/* Brand filter */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-text-secondary">品牌</span>
          {selectedBrands.length > 0 && (
            <button onClick={() => setSelectedBrands([])}
              className="text-xs px-2 py-1 rounded-full bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors">清除</button>
          )}
          {displayedBrands.map(b => (
            <button key={b.brand} onClick={() => toggleBrand(b.brand)}
              className={`text-xs px-2 py-1 rounded-full transition-colors ${
                selectedBrands.includes(b.brand) ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
              }`}>{b.brand}</button>
          ))}
          {brandsBySamples.length > 20 && (
            <button onClick={() => setBrandExpanded(!brandExpanded)}
              className="text-xs px-2 py-1 rounded-full text-primary hover:bg-primary/10">
              {brandExpanded ? '收起' : `+${brandsBySamples.length - 20}`}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ width: '100%', height: '100%' }}
          notMerge
          lazyUpdate
        />
      </div>
    </div>
  )
}
