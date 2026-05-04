import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import type { Motorcycle } from '../types'
import { CHART_PALETTE, CHART_AXIS, CHART_TOOLTIP } from '../utils/chartTheme'

interface Props {
  data: Motorcycle[]
}

export default function Explorer({ data }: Props) {
  const chartRef = useRef<ReactECharts>(null)
  const [highlightType, setHighlightType] = useState<string | null>(null)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [brandExpanded, setBrandExpanded] = useState(false)
  const [minSamples, setMinSamples] = useState(0)
  const [filterOpen, setFilterOpen] = useState(true)
  const initRef = useRef(true)

  const allTypes = useMemo(() => [...new Set(data.map(d => d.type))], [data])
  const allDisplacements = useMemo(
    () => [...new Set(data.map(d => d.displacement))].sort((a, b) => a - b),
    [data]
  )
  const dispLabels = useMemo(() => allDisplacements.map(d => `${d}`), [allDisplacements])

  const sampleStats = useMemo(() => {
    let min = Infinity, max = 0
    for (const d of data) {
      if (d.samples < min) min = d.samples
      if (d.samples > max) max = d.samples
    }
    return { min, max: Math.max(max, 1) }
  }, [data])

  const typeColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    allTypes.forEach((t, i) => { map[t] = CHART_PALETTE[i % CHART_PALETTE.length] })
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
    let result = data
    if (selectedBrands.length > 0) {
      result = result.filter(d => selectedBrands.includes(d.brand))
    }
    if (minSamples > 0) {
      result = result.filter(d => d.samples >= minSamples)
    }
    return result
  }, [data, selectedBrands, minSamples])

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  const activeFilterCount = selectedBrands.length + (highlightType ? 1 : 0) + (minSamples > 0 ? 1 : 0)

  const doZoom = useCallback((items: Motorcycle[]) => {
    try {
      const chart = chartRef.current?.getEchartsInstance()
      if (!chart || items.length === 0) return
      if (!chart.getWidth() || !chart.getHeight()) return

      const disps = [...new Set(items.map(d => d.displacement))]
      const dispIndices = disps.map(d => allDisplacements.indexOf(d)).filter(i => i >= 0)
      const total = allDisplacements.length
      if (dispIndices.length === 0 || total === 0) return

      const xMin = Math.min(...dispIndices)
      const xMax = Math.max(...dispIndices)
      const pad = Math.max(2, Math.round((xMax - xMin) * 0.3))
      const start = Math.max(0, ((xMin - pad) / total) * 100)
      const end = Math.min(100, ((xMax + 1 + pad) / total) * 100)

      const consumptions = items.map(d => d.consumption)
      const yMin = Math.min(...consumptions)
      const yMax = Math.max(...consumptions)
      const yPad = Math.max(0.5, (yMax - yMin) * 0.25)

      chart.setOption({
        yAxis: { min: Math.max(0, yMin - yPad), max: yMax + yPad },
        series: allTypes.map(() => ({})),
      })
      chart.dispatchAction({ type: 'dataZoom', start, end })
    } catch { /* chart not ready */ }
  }, [allDisplacements, allTypes])

  const resetZoom = useCallback(() => {
    try {
      const chart = chartRef.current?.getEchartsInstance()
      if (!chart || !chart.getWidth() || !chart.getHeight()) return
      chart.setOption({ yAxis: { min: 0, max: undefined } })
      chart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 })
    } catch { /* chart not ready */ }
  }, [])

  // Zoom on type filter (skip initial mount)
  useEffect(() => {
    if (initRef.current) { initRef.current = false; return }
    if (highlightType) {
      const items = filteredData.filter(d => d.type === highlightType)
      if (items.length > 0) doZoom(items)
    } else if (selectedBrands.length === 0 && minSamples === 0) {
      resetZoom()
    }
  }, [highlightType])

  // Zoom on brand / sample filter (skip initial mount)
  useEffect(() => {
    if (initRef.current) return
    if ((selectedBrands.length > 0 || minSamples > 0) && filteredData.length > 0) {
      doZoom(filteredData)
    } else if (selectedBrands.length === 0 && minSamples === 0 && !highlightType) {
      resetZoom()
    }
  }, [selectedBrands, minSamples])

  const option = useMemo(() => {
    const { min: sMin, max: sMax } = sampleStats

    const series = allTypes.map(type => {
      const items = filteredData
        .filter(d => d.type === type)
        .sort((a, b) => b.samples - a.samples)
      const color = typeColorMap[type]
      const isDimmed = highlightType !== null && highlightType !== type

      return {
        name: type,
        type: 'scatter' as const,
        triggerEvent: false,
        data: items.map((d, i) => {
          const xIdx = allDisplacements.indexOf(d.displacement)
          const norm = (d.samples - sMin) / (sMax - sMin)
          const hash = d.brand.length * 31 + d.series.length * 17 + i * 7
          const spread = 0.3 * (1 - norm * 0.73)
          const jitter = ((hash % 100) / 50 - 1) * spread

          return {
            value: [xIdx + jitter, d.consumption],
            symbolSize: Math.round(6 + Math.sqrt(norm) * 20),
            _brand: d.brand,
            _series: d.series,
            _samples: d.samples,
            _disp: d.displacement,
          }
        }),
        itemStyle: {
          color: isDimmed ? 'rgba(200,200,200,0.2)' : color,
          opacity: isDimmed ? 0.12 : 0.85,
        },
        label: {
          show: !isDimmed,
          formatter: (p: any) => `{a|${p.data._brand}} {b|${p.data._series}}`,
          position: 'right',
          distance: 8,
          rich: {
            a: { fontSize: 13, color: '#e2e8f0', fontWeight: 600 },
            b: { fontSize: 12, color: '#94a3b8' },
          },
        },
        labelLayout: {
          hideOverlap: true,
          moveOverlap: 'shiftY',
        },
        emphasis: {
          itemStyle: { borderWidth: 2, shadowBlur: 8, shadowColor: color },
          label: {
            show: true,
            formatter: (p: any) => `${p.data._brand} ${p.data._series}  ${p.data._disp}cc  ${p.value[1]}L  (${p.data._samples}样本)`,
            fontSize: 13,
            color: '#f1f5f9',
            backgroundColor: 'rgba(30,41,59,0.95)',
            padding: [6, 10],
            borderRadius: 6,
            borderColor: 'rgba(148,163,184,0.2)',
            borderWidth: 1,
          },
        },
        large: true,
        animation: true,
        animationDuration: 300,
        animationEasing: 'cubicOut',
        animationDurationUpdate: 250,
        animationEasingUpdate: 'cubicOut',
      }
    })

    return {
      tooltip: {
        trigger: 'item' as const,
        backgroundColor: CHART_TOOLTIP.backgroundColor,
        borderColor: CHART_TOOLTIP.borderColor,
        textStyle: CHART_TOOLTIP.textStyle,
        formatter: (p: any) => {
          const d = p.data
          return `<div style="font-weight:600;margin-bottom:4px">${d._brand} ${d._series}</div>
            <div>排量: ${d._disp}cc</div>
            <div>油耗: ${p.value[1]} L/100km</div>
            <div>样本数: ${d._samples}</div>
            <div>类型: ${p.seriesName}</div>`
        },
      },
      grid: { left: 60, right: 30, top: 20, bottom: 50 },
      xAxis: {
        type: 'category' as const,
        data: dispLabels,
        name: '排量 (cc)',
        nameLocation: 'center' as const,
        nameGap: 35,
        nameTextStyle: { fontSize: 13, color: CHART_AXIS.name },
        axisLabel: { fontSize: 12, interval: 0, color: CHART_AXIS.label },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART_AXIS.line } },
        splitLine: { show: true, lineStyle: { color: CHART_AXIS.splitLine } },
      },
      yAxis: {
        type: 'value' as const,
        name: '油耗 (L/100km)',
        nameTextStyle: { fontSize: 13, color: CHART_AXIS.name },
        axisLabel: { fontSize: 12, color: CHART_AXIS.label },
        axisLine: { lineStyle: { color: CHART_AXIS.line } },
        splitLine: { lineStyle: { color: CHART_AXIS.splitLine } },
        min: 0,
      },
      dataZoom: [
        { type: 'inside' as const, xAxisIndex: 0 },
        { type: 'slider' as const, xAxisIndex: 0, bottom: 4, height: 18, borderColor: CHART_AXIS.line, fillerColor: 'rgba(99,102,241,0.1)' },
        { type: 'slider' as const, yAxisIndex: 0, right: 2, width: 18, borderColor: CHART_AXIS.line, fillerColor: 'rgba(99,102,241,0.1)' },
      ],
      legend: { show: false },
      series,
    }
  }, [filteredData, allTypes, typeColorMap, highlightType, allDisplacements, dispLabels, sampleStats])

  return (
    <div className="fixed inset-0 top-14 flex flex-col bg-surface-alt">
      <div className="px-4 md:px-6 py-2 md:py-3 border-b border-border glass-card rounded-none border-x-0 border-t-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base md:text-lg font-bold">散点油耗图</h1>
          <span className="text-xs md:text-sm text-text-secondary">{filteredData.length} 款车型</span>
          <button onClick={() => setFilterOpen(!filterOpen)}
            className="text-xs px-2 py-1 rounded-full bg-surface-alt text-text-secondary hover:bg-border md:hidden min-h-[44px] flex items-center">
            {filterOpen ? '收起' : `筛选${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
          </button>
          {(selectedBrands.length > 0 || highlightType || minSamples > 0) && (
            <button onClick={() => { setSelectedBrands([]); setHighlightType(null); setMinSamples(0); resetZoom() }}
              className="text-xs text-accent-red hover:underline">清除筛选</button>
          )}
        </div>

        {(filterOpen) && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-secondary shrink-0">类型</span>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setHighlightType(null)}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                  highlightType === null ? 'bg-text text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
                }`}>全部</button>
              {allTypes.map(t => (
                <button key={t}
                  onClick={() => setHighlightType(highlightType === t ? null : t)}
                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors ${
                    highlightType === t ? 'ring-2 ring-offset-1 ring-primary' : 'bg-surface-alt hover:bg-border'
                  }`}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: typeColorMap[t] }} />
                  {t}
                </button>
              ))}
            </div>
          </div>

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

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary shrink-0">样本量 ≥</span>
            <input
              type="range"
              min={0}
              max={5000}
              step={10}
              value={minSamples}
              onChange={e => setMinSamples(Number(e.target.value))}
              className="w-28 accent-primary"
            />
            <span className="text-xs font-mono text-text w-10 text-right">{minSamples}</span>
          </div>
        </div>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <ReactECharts ref={chartRef} option={option} style={{ width: '100%', height: '100%' }} notMerge />
      </div>
    </div>
  )
}
