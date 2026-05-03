import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
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
  const [brandExpanded, setBrandExpanded] = useState(false)
  const [prevHighlightType, setPrevHighlightType] = useState<string | null>(null)

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

  const filteredData = useMemo(() => {
    if (selectedBrands.length === 0) return data
    return data.filter(d => selectedBrands.includes(d.brand))
  }, [data, selectedBrands])

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  // Zoom to filtered data
  const zoomToData = useCallback((items: Motorcycle[]) => {
    const chart = chartRef.current?.getEchartsInstance()
    if (!chart || items.length === 0) return

    const disps = items.map(d => d.displacement)
    const minDispIdx = Math.min(...disps.map(d => allDisplacements.indexOf(d)))
    const maxDispIdx = Math.max(...disps.map(d => allDisplacements.indexOf(d)))
    const totalCats = allDisplacements.length

    // Add 10% padding
    const startPct = Math.max(0, (minDispIdx / totalCats) * 100 - 5)
    const endPct = Math.min(100, ((maxDispIdx + 1) / totalCats) * 100 + 5)

    chart.dispatchAction({
      type: 'dataZoom',
      start: startPct,
      end: endPct,
    })
  }, [allDisplacements])

  // Zoom animation on type filter change
  useEffect(() => {
    if (highlightType === prevHighlightType) return
    setPrevHighlightType(highlightType)

    const items = highlightType
      ? filteredData.filter(d => d.type === highlightType)
      : filteredData

    if (items.length > 0 && items.length < filteredData.length * 0.8) {
      zoomToData(items)
    } else if (!highlightType) {
      // Reset zoom when showing all
      const chart = chartRef.current?.getEchartsInstance()
      if (chart) {
        chart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 })
      }
    }
  }, [highlightType])

  // Zoom on brand filter change
  useEffect(() => {
    if (selectedBrands.length > 0 && filteredData.length > 0) {
      zoomToData(filteredData)
    }
  }, [selectedBrands, filteredData, zoomToData])

  const option = useMemo(() => {
    // For each displacement column, get top items by samples for labeling
    const labelsByDisp = new Map<number, Set<string>>()
    for (const disp of allDisplacements) {
      const colItems = filteredData.filter(d => d.displacement === disp)
      const sorted = [...colItems].sort((a, b) => b.samples - a.samples)
      const topN = Math.min(sorted.length, 6)
      labelsByDisp.set(disp, new Set(sorted.slice(0, topN).map(d => `${d.brand}|${d.series}`)))
    }

    const series = allTypes.map(type => {
      const items = filteredData.filter(d => d.type === type)
      const color = typeColorMap[type]
      const isDimmed = highlightType !== null && highlightType !== type

      return {
        name: type,
        type: 'scatter' as const,
        data: items.map(d => {
          const xIdx = allDisplacements.indexOf(d.displacement)
          const colLabels = labelsByDisp.get(d.displacement)
          const showLabel = colLabels?.has(`${d.brand}|${d.series}`) ?? false
          return {
            value: [xIdx, d.consumption],
            _brand: d.brand,
            _series: d.series,
            _samples: d.samples,
            _disp: d.displacement,
            label: {
              show: showLabel && !isDimmed,
              formatter: `{a|${d.brand}} {b|${d.series}}`,
              position: 'right' as const,
              distance: 5,
              rich: {
                a: { fontSize: 9, color: '#475569', fontWeight: 500 },
                b: { fontSize: 8, color: '#94a3b8' },
              },
            },
          }
        }),
        symbolSize: 7,
        itemStyle: {
          color: isDimmed ? 'rgba(200,200,200,0.2)' : color,
          opacity: isDimmed ? 0.12 : 0.8,
        },
        emphasis: {
          itemStyle: { borderWidth: 2, shadowBlur: 6, shadowColor: color },
          label: {
            show: true,
            formatter: (p: any) => `${p.data._brand} ${p.data._series}  ${p.data._disp}cc  ${p.value[1]}L  (${p.data._samples}样本)`,
            fontSize: 11,
            color: '#1e293b',
            backgroundColor: 'rgba(255,255,255,0.92)',
            padding: [4, 8],
            borderRadius: 4,
            borderColor: '#e2e8f0',
            borderWidth: 1,
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
      grid: { left: 60, right: 30, top: 16, bottom: 50 },
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
        { type: 'inside' as const, xAxisIndex: 0, zoomOnMouseWheel: true },
        { type: 'inside' as const, yAxisIndex: 0 },
        { type: 'slider' as const, xAxisIndex: 0, bottom: 4, height: 18, borderColor: '#e2e8f0', fillerColor: 'rgba(37,99,235,0.06)' },
        { type: 'slider' as const, yAxisIndex: 0, right: 2, width: 18, borderColor: '#e2e8f0', fillerColor: 'rgba(37,99,235,0.06)' },
      ],
      legend: { show: false },
      series,
      labelLayout: {
        hideOverlap: true,
        moveOverlap: 'shiftY' as const,
      },
    }
  }, [filteredData, allTypes, typeColorMap, highlightType, allDisplacements, dispLabels])

  return (
    <div className="fixed inset-0 top-14 flex flex-col bg-white">
      <div className="px-6 py-3 border-b border-border space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">散点油耗图</h1>
          <span className="text-sm text-text-secondary">{filteredData.length} 款车型</span>
          {selectedBrands.length > 0 && (
            <button onClick={() => setSelectedBrands([])}
              className="text-xs text-accent-red hover:underline">清除品牌</button>
          )}
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {/* Type filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-secondary shrink-0">类型</span>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setHighlightType(null)}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                  highlightType === null ? 'bg-text text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
                }`}
              >全部</button>
              {allTypes.map(t => (
                <button
                  key={t}
                  onClick={() => setHighlightType(highlightType === t ? null : t)}
                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors ${
                    highlightType === t ? 'ring-2 ring-offset-1 ring-primary' : 'bg-surface-alt hover:bg-border'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: typeColorMap[t] }} />
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Brand filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-secondary shrink-0">品牌</span>
            <div className="flex flex-wrap gap-1">
              {displayedBrands.map(b => (
                <button key={b.brand} onClick={() => toggleBrand(b.brand)}
                  className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                    selectedBrands.includes(b.brand) ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
                  }`}>{b.brand}</button>
              ))}
              {brandsBySamples.length > 20 && (
                <button onClick={() => setBrandExpanded(!brandExpanded)}
                  className="text-xs px-2 py-0.5 rounded-full text-primary hover:bg-primary/10">
                  {brandExpanded ? '收起' : `+${brandsBySamples.length - 20}`}
                </button>
              )}
            </div>
          </div>
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
