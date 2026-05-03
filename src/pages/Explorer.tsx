import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import type { Motorcycle } from '../types'

interface Props {
  data: Motorcycle[]
}

const PALETTE = ['#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6']

export default function Explorer({ data }: Props) {
  const [highlightType, setHighlightType] = useState<string | null>(null)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [brandExpanded, setBrandExpanded] = useState(false)

  const allTypes = useMemo(() => [...new Set(data.map(d => d.type))], [data])
  const allDisplacements = useMemo(
    () => [...new Set(data.map(d => d.displacement))].sort((a, b) => a - b),
    [data]
  )
  const dispLabels = useMemo(() => allDisplacements.map(d => `${d}`), [allDisplacements])

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
    if (selectedBrands.length === 0) return data
    return data.filter(d => selectedBrands.includes(d.brand))
  }, [data, selectedBrands])

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  const option = useMemo(() => {
    // Top items by samples for labeling
    const sorted = [...filteredData].sort((a, b) => b.samples - a.samples)
    const topN = Math.min(sorted.length, 30)
    const topKeys = new Set(sorted.slice(0, topN).map(d => `${d.brand}|${d.series}|${d.displacement}`))

    // Build series - each type is one series
    const series = allTypes.map(type => {
      const items = filteredData.filter(d => d.type === type)
      const color = typeColorMap[type]
      const isDimmed = highlightType !== null && highlightType !== type

      return {
        name: type,
        type: 'scatter' as const,
        data: items.map(d => {
          const xIdx = allDisplacements.indexOf(d.displacement)
          const isTop = topKeys.has(`${d.brand}|${d.series}|${d.displacement}`)
          return {
            value: [xIdx, d.consumption],
            _brand: d.brand,
            _series: d.series,
            _samples: d.samples,
            _disp: d.displacement,
            label: {
              show: isTop,
              formatter: `{a|${d.brand}} {b|${d.series}}`,
              position: 'right' as const,
              distance: 6,
              align: 'left' as const,
              rich: {
                a: { fontSize: 10, color: isDimmed ? '#cbd5e1' : '#475569', fontWeight: 600 },
                b: { fontSize: 9, color: isDimmed ? '#cbd5e1' : '#94a3b8' },
              },
            },
          }
        }),
        symbolSize: 7,
        itemStyle: {
          color: isDimmed ? 'rgba(200,200,200,0.25)' : color,
          opacity: isDimmed ? 0.15 : 0.8,
        },
        emphasis: {
          itemStyle: { borderWidth: 2, shadowBlur: 6, shadowColor: color },
          label: {
            show: true,
            formatter: (p: any) => `${p.data._brand} ${p.data._series}  ${p.data._disp}cc  ${p.value[1]}L/100km  (${p.data._samples}样本)`,
            fontSize: 11,
            color: '#1e293b',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: [3, 6],
            borderRadius: 3,
          },
        },
        large: true,
        animation: false,
      }
    })

    return {
      tooltip: {
        trigger: 'item' as const,
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#1e293b', fontSize: 13 },
        formatter: (p: any) => {
          const d = p.data
          return `<div style="font-weight:600;margin-bottom:4px">${d._brand} ${d._series}</div>
            <div>排量: ${d._disp}cc</div>
            <div>油耗: ${p.value[1]} L/100km</div>
            <div>样本数: ${d._samples}</div>
            <div>类型: ${p.seriesName}</div>`
        },
      },
      grid: { left: 65, right: 30, top: 16, bottom: 50 },
      xAxis: {
        type: 'category' as const,
        data: dispLabels,
        name: '排量 (cc)',
        nameLocation: 'center' as const,
        nameGap: 35,
        nameTextStyle: { fontSize: 13 },
        axisLabel: { fontSize: 11, interval: 0 },
        axisTick: { show: false },
        splitLine: { show: true, lineStyle: { color: '#f1f5f9' } },
      },
      yAxis: {
        type: 'value' as const,
        name: '油耗 (L/100km)',
        nameTextStyle: { fontSize: 13 },
        axisLabel: { fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        min: 0,
      },
      dataZoom: [
        { type: 'inside' as const, xAxisIndex: 0 },
        { type: 'inside' as const, yAxisIndex: 0 },
        { type: 'slider' as const, xAxisIndex: 0, bottom: 4, height: 18, borderColor: '#e2e8f0', fillerColor: 'rgba(37,99,235,0.06)' },
        { type: 'slider' as const, yAxisIndex: 0, right: 2, width: 18, borderColor: '#e2e8f0', fillerColor: 'rgba(37,99,235,0.06)' },
      ],
      legend: { show: false },
      series,
      labelLayout: { hideOverlap: true },
    }
  }, [filteredData, allTypes, typeColorMap, highlightType, allDisplacements, dispLabels])

  return (
    <div className="fixed inset-0 top-14 flex flex-col bg-white">
      <div className="flex items-center gap-4 px-6 py-2.5 border-b border-border overflow-x-auto">
        <div className="flex items-center gap-3 shrink-0">
          <h1 className="text-lg font-bold">数据探索</h1>
          <span className="text-sm text-text-secondary">{filteredData.length} 款车型</span>
          {selectedBrands.length > 0 && (
            <button onClick={() => setSelectedBrands([])}
              className="text-xs text-accent-red hover:underline">清除品牌筛选</button>
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

        {/* Brand filter */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-text-secondary">品牌</span>
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
          option={option}
          style={{ width: '100%', height: '100%' }}
          notMerge
          lazyUpdate
        />
      </div>
    </div>
  )
}
