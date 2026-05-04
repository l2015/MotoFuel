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
  const [minSamples, setMinSamples] = useState(0)
  const initRef = useRef(true)

  const allTypes = useMemo(() => [...new Set(data.map(d => d.type))], [data])
  const allDisplacements = useMemo(
    () => [...new Set(data.map(d => d.displacement))].sort((a, b) => a - b),
    [data]
  )

  // Global sample range for consistent sizing
  const globalSampleRange = useMemo(() => {
    let min = Infinity, max = 0
    for (const d of data) {
      if (d.samples < min) min = d.samples
      if (d.samples > max) max = d.samples
    }
    return { min, max: Math.max(max, 1) }
  }, [data])

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

  const doZoom = useCallback((items: Motorcycle[]) => {
    try {
      const chart = chartRef.current?.getEchartsInstance()
      if (!chart || items.length === 0) return
      if (!chart.getWidth() || !chart.getHeight()) return

      const disps = [...new Set(items.map(d => d.displacement))].sort((a, b) => a - b)
      const total = allDisplacements.length
      if (disps.length === 0 || total === 0) return

      const xMin = disps[0], xMax = disps[disps.length - 1]
      const dispRange = xMax - xMin
      const pad = Math.max(30, dispRange * 0.15)

      const consumptions = items.map(d => d.consumption)
      const yMin = Math.min(...consumptions)
      const yMax = Math.max(...consumptions)
      const yPad = Math.max(0.5, (yMax - yMin) * 0.25)

      chart.setOption({
        xAxis: { min: xMin - pad, max: xMax + pad },
        yAxis: { min: Math.max(0, yMin - yPad), max: yMax + yPad },
        series: allTypes.map(() => ({})),
      })
    } catch { /* chart not ready */ }
  }, [allDisplacements, allTypes])

  const resetZoom = useCallback(() => {
    try {
      const chart = chartRef.current?.getEchartsInstance()
      if (!chart || !chart.getWidth() || !chart.getHeight()) return
      chart.setOption({
        xAxis: { min: undefined, max: undefined },
        yAxis: { min: 0, max: undefined },
      })
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

  const option = useMemo(() => {
    const { min: sMin, max: sMax } = globalSampleRange

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
          const hash = d.brand.length * 31 + d.series.length * 17 + i * 7
          const norm = (d.samples - sMin) / (sMax - sMin)
          // Jitter: ±6cc max, high-sample items tighter
          const spread = 6 * (1 - norm * 0.5)
          const jitter = ((hash % 100) / 100 - 0.5) * 2 * spread

          return {
            value: [d.displacement + jitter, d.consumption],
            // Size: 4px (few samples) → 22px (5000+), using sqrt for smoother curve
            symbolSize: Math.round(4 + Math.sqrt(norm) * 18),
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
            a: { fontSize: 13, color: '#334155', fontWeight: 600 },
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
            color: '#1e293b',
            backgroundColor: 'rgba(255,255,255,0.95)',
            padding: [6, 10],
            borderRadius: 6,
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
      grid: { left: 60, right: 30, top: 20, bottom: 50 },
      xAxis: {
        type: 'value' as const,
        name: '排量 (cc)',
        nameLocation: 'center' as const,
        nameGap: 35,
        nameTextStyle: { fontSize: 13 },
        axisLabel: {
          fontSize: 12,
          formatter: (v: number) => {
            if (allDisplacements.includes(v)) return `${v}`
            return ''
          },
        },
        axisTick: { show: false },
        splitLine: { show: true, lineStyle: { color: '#f1f5f9' } },
        min: allDisplacements[0] - 30,
        max: allDisplacements[allDisplacements.length - 1] + 30,
      },
      yAxis: {
        type: 'value' as const,
        name: '油耗 (L/100km)',
        nameLocation: 'end' as const,
        nameTextStyle: { fontSize: 13, padding: [0, 0, 0, 0] },
        axisLabel: { fontSize: 12 },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        min: 0,
      },
      dataZoom: [
        { type: 'inside' as const },
        { type: 'slider' as const, xAxisIndex: 0, bottom: 4, height: 18, borderColor: '#e2e8f0', fillerColor: 'rgba(37,99,235,0.06)' },
        { type: 'slider' as const, yAxisIndex: 0, right: 2, width: 18, borderColor: '#e2e8f0', fillerColor: 'rgba(37,99,235,0.06)' },
      ],
      legend: { show: false },
      series,
    }
  }, [filteredData, allTypes, typeColorMap, highlightType, allDisplacements, globalSampleRange])

  return (
    <div className="fixed inset-0 top-14 flex flex-col bg-white">
      <div className="px-6 py-3 border-b border-border space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">散点油耗图</h1>
          <span className="text-sm text-text-secondary">{filteredData.length} 款车型</span>
          {(selectedBrands.length > 0 || highlightType || minSamples > 0) && (
            <button onClick={() => { setSelectedBrands([]); setHighlightType(null); setMinSamples(0); resetZoom() }}
              className="text-xs text-accent-red hover:underline">清除筛选</button>
          )}
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
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
      </div>

      <div className="flex-1 min-h-0">
        <ReactECharts ref={chartRef} option={option} style={{ width: '100%', height: '100%' }} notMerge />
      </div>
    </div>
  )
}
