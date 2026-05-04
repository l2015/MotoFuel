import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import ReactECharts from 'echarts-for-react'
import type { Motorcycle } from '../types'
import { CHART_PALETTE, CHART_AXIS, CHART_TOOLTIP } from '../utils/chartTheme'

interface Props {
  data: Motorcycle[]
}

interface ClickDetail {
  x: number
  y: number
  brand: string
  series: string
  displacement: number
  consumption: number
  samples: number
  type: string
  rank: number
  total: number
}

interface ZoomStats {
  count: number
  avgConsumption: number
  best: { brand: string; series: string; consumption: number } | null
  worst: { brand: string; series: string; consumption: number } | null
}

export default function Explorer({ data }: Props) {
  const { t } = useTranslation()
  const chartRef = useRef<ReactECharts>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [highlightType, setHighlightType] = useState<string | null>(null)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [brandExpanded, setBrandExpanded] = useState(false)
  const [minSamples, setMinSamples] = useState(0)
  const [filterOpen, setFilterOpen] = useState(true)
  const [clickDetail, setClickDetail] = useState<ClickDetail | null>(null)
  const [zoomStats, setZoomStats] = useState<ZoomStats | null>(null)
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

  const dispRankMap = useMemo(() => {
    const map = new Map<string, number>()
    const byDisp = new Map<number, Motorcycle[]>()
    for (const d of data) {
      const arr = byDisp.get(d.displacement) || []
      arr.push(d)
      byDisp.set(d.displacement, arr)
    }
    for (const [disp, items] of byDisp) {
      items.sort((a, b) => a.consumption - b.consumption)
      items.forEach((item, i) => {
        map.set(`${item.brand}|${item.series}|${disp}`, i + 1)
      })
    }
    return { map, totals: Object.fromEntries([...byDisp].map(([d, items]) => [d, items.length])) }
  }, [data])

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
    } catch (e) { console.warn('Chart not ready:', e) }
  }, [allDisplacements, allTypes])

  const resetZoom = useCallback(() => {
    try {
      const chart = chartRef.current?.getEchartsInstance()
      if (!chart || !chart.getWidth() || !chart.getHeight()) return
      chart.setOption({ yAxis: { min: 0, max: undefined } })
      chart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 })
    } catch (e) { console.warn('Chart not ready:', e) }
  }, [])

  useEffect(() => {
    if (initRef.current) { initRef.current = false; return }
    if (highlightType) {
      const items = filteredData.filter(d => d.type === highlightType)
      if (items.length > 0) doZoom(items)
    } else if (selectedBrands.length === 0 && minSamples === 0) {
      resetZoom()
    }
  }, [highlightType, filteredData, doZoom, resetZoom, selectedBrands.length, minSamples])

  useEffect(() => {
    if (initRef.current) return
    if ((selectedBrands.length > 0 || minSamples > 0) && filteredData.length > 0) {
      doZoom(filteredData)
    } else if (selectedBrands.length === 0 && minSamples === 0 && !highlightType) {
      resetZoom()
    }
  }, [selectedBrands, minSamples, filteredData, doZoom, resetZoom, highlightType])

  useEffect(() => {
    if (!clickDetail) return
    const handler = () => setClickDetail(null)
    const timer = setTimeout(() => window.addEventListener('click', handler), 100)
    return () => { clearTimeout(timer); window.removeEventListener('click', handler) }
  }, [clickDetail])

  const onChartClick = useCallback((params: any) => {
    if (!params.data?._brand) return
    const d = params.data
    const disp = d._disp
    const key = `${d._brand}|${d._series}|${disp}`
    const rank = dispRankMap.map.get(key) ?? 0
    const total = dispRankMap.totals[disp] ?? 0

    setClickDetail({
      x: params.event?.offsetX ?? 0,
      y: params.event?.offsetY ?? 0,
      brand: d._brand,
      series: d._series,
      displacement: disp,
      consumption: params.value[1],
      samples: d._samples,
      type: params.seriesName,
      rank,
      total,
    })
  }, [dispRankMap])

  const onDataZoom = useCallback((params: any) => {
    const chart = chartRef.current?.getEchartsInstance()
    if (!chart) return

    let startPercent = 0
    let endPercent = 100
    if (params.batch && params.batch.length > 0) {
      startPercent = params.batch[0].start ?? 0
      endPercent = params.batch[0].end ?? 100
    } else if (params.start !== undefined) {
      startPercent = params.start
      endPercent = params.end
    }

    const total = allDisplacements.length
    const startIdx = Math.floor((startPercent / 100) * total)
    const endIdx = Math.ceil((endPercent / 100) * total)
    const visibleDisps = new Set(allDisplacements.slice(startIdx, endIdx))

    const visible = filteredData.filter(d => visibleDisps.has(d.displacement))
    if (visible.length === 0) { setZoomStats(null); return }

    const avg = visible.reduce((s, d) => s + d.consumption, 0) / visible.length
    const sorted = [...visible].sort((a, b) => a.consumption - b.consumption)
    setZoomStats({
      count: visible.length,
      avgConsumption: Math.round(avg * 100) / 100,
      best: { brand: sorted[0].brand, series: sorted[0].series, consumption: sorted[0].consumption },
      worst: { brand: sorted[sorted.length - 1].brand, series: sorted[sorted.length - 1].series, consumption: sorted[sorted.length - 1].consumption },
    })
  }, [allDisplacements, filteredData])

  const onLegendChange = useCallback((params: any) => {
    const selected = params?.selected
    if (!selected) return
    const deselected = Object.entries(selected).find(([_, v]) => !v)?.[0]
    setHighlightType(prev => prev === deselected ? null : deselected || null)
  }, [])

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
        triggerEvent: true,
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
            a: { fontSize: 13, color: CHART_TOOLTIP.textStyle.color, fontWeight: 600 },
            b: { fontSize: 12, color: CHART_AXIS.label },
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
            formatter: (p: any) => `${p.data._brand} ${p.data._series}  ${p.data._disp}cc  ${p.value[1]}L  (${p.data._samples} ${t('explorer.detail.samples')})`,
            fontSize: 13,
            color: CHART_TOOLTIP.textStyle.color,
            backgroundColor: CHART_TOOLTIP.backgroundColor,
            padding: [6, 10],
            borderColor: CHART_TOOLTIP.borderColor,
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

    const legendSelected: Record<string, boolean> = {}
    if (highlightType) {
      allTypes.forEach(t => { legendSelected[t] = t === highlightType })
    }

    return {
      tooltip: {
        trigger: 'item' as const,
        ...CHART_TOOLTIP,
        formatter: (p: any) => {
          const d = p.data
          return `<div style="font-weight:600;margin-bottom:4px">${d._brand} ${d._series}</div>
            <div>${t('explorer.tooltip.displacement')}: ${d._disp}cc</div>
            <div>${t('explorer.tooltip.consumption')}: ${p.value[1]} L/100km</div>
            <div>${t('explorer.tooltip.sampleCount')}: ${d._samples}</div>
            <div>${t('explorer.tooltip.type')}: ${p.seriesName}</div>`
        },
      },
      grid: { left: 60, right: 30, top: 40, bottom: 50 },
      xAxis: {
        type: 'category' as const,
        data: dispLabels,
        name: t('explorer.axis.displacement'),
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
        name: t('explorer.axis.consumption'),
        nameTextStyle: { fontSize: 13, color: CHART_AXIS.name },
        axisLabel: { fontSize: 12, color: CHART_AXIS.label },
        axisLine: { lineStyle: { color: CHART_AXIS.line } },
        splitLine: { lineStyle: { color: CHART_AXIS.splitLine } },
        min: 0,
      },
      dataZoom: [
        { type: 'inside' as const, xAxisIndex: 0 },
        { type: 'slider' as const, xAxisIndex: 0, bottom: 4, height: 18, borderColor: CHART_AXIS.line, fillerColor: 'rgba(255,107,53,0.08)' },
        { type: 'slider' as const, yAxisIndex: 0, right: 2, width: 18, borderColor: CHART_AXIS.line, fillerColor: 'rgba(255,107,53,0.08)' },
      ],
      legend: {
        show: true,
        top: 8,
        textStyle: { color: CHART_AXIS.label, fontSize: 12 },
        itemWidth: 10,
        itemHeight: 10,
        icon: 'circle',
        ...(highlightType ? { selected: legendSelected } : {}),
      },
      series,
    }
  }, [filteredData, allTypes, typeColorMap, highlightType, allDisplacements, dispLabels, sampleStats, t])

  const chartEvents = useMemo(() => ({
    click: onChartClick,
    dataZoom: onDataZoom,
    legendselectchanged: onLegendChange,
  }), [onChartClick, onDataZoom, onLegendChange])

  return (
    <div className="fixed inset-0 top-14 flex flex-col bg-bg md:bottom-0 bottom-14">
      <div className="px-4 md:px-6 py-2 md:py-3 border-b-[3px] double-rule bg-[rgba(255,254,249,0.92)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-base md:text-lg font-bold">{t('explorer.title')}</h1>
          <span className="text-xs md:text-sm text-text-secondary">{t('explorer.modelCount', { count: filteredData.length })}</span>
          <button onClick={() => setFilterOpen(!filterOpen)}
            className="text-xs px-2 py-1 bg-surface-alt text-text-secondary hover:bg-border md:hidden min-h-[44px] flex items-center">
            {filterOpen ? t('filter.collapse') : `${t('filter.titleShort')}${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
          </button>
          {(selectedBrands.length > 0 || highlightType || minSamples > 0) && (
            <button onClick={() => { setSelectedBrands([]); setHighlightType(null); setMinSamples(0); resetZoom(); setZoomStats(null) }}
              className="text-xs text-accent-red hover:underline">{t('explorer.clearFilters')}</button>
          )}
        </div>

        {filterOpen && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-secondary shrink-0">{t('filter.label.type')}</span>
              <div className="flex flex-wrap gap-1">
                <button onClick={() => setHighlightType(null)}
                  className={`text-xs px-2 py-0.5 transition-colors ${
                    highlightType === null ? 'bg-text text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
                  }`}>{t('filter.all')}</button>
                {allTypes.map(ty => (
                  <button key={ty}
                    onClick={() => setHighlightType(highlightType === ty ? null : ty)}
                    className={`flex items-center gap-1 text-xs px-2 py-0.5 transition-colors ${
                      highlightType === ty ? 'ring-2 ring-offset-1 ring-primary' : 'bg-surface-alt hover:bg-border'
                    }`}>
                    <span className="w-2 h-2 inline-block" style={{ backgroundColor: typeColorMap[ty] }} />
                    {ty}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-secondary shrink-0">{t('filter.label.brand')}</span>
              <div className="flex flex-wrap gap-1">
                {displayedBrands.map(b => (
                  <button key={b.brand} onClick={() => toggleBrand(b.brand)}
                    className={`text-xs px-2 py-0.5 transition-colors ${
                      selectedBrands.includes(b.brand) ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
                    }`}>{b.brand}</button>
                ))}
                {brandsBySamples.length > 20 && (
                  <button onClick={() => setBrandExpanded(!brandExpanded)}
                    className="text-xs px-2 py-0.5 text-primary hover:bg-primary/10">
                    {brandExpanded ? t('filter.collapse') : `+${brandsBySamples.length - 20}`}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary shrink-0">{t('filter.label.minSamples')}</span>
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

      <div className="flex-1 min-h-0 relative" ref={containerRef}>
        <ReactECharts ref={chartRef} option={option} style={{ width: '100%', height: '100%' }} notMerge onEvents={chartEvents} />

        {/* Click detail popup */}
        {clickDetail && (
          <div
            className="absolute bg-surface border border-border p-3 z-50 min-w-[180px]"
            style={{
              left: Math.min(clickDetail.x + 12, (containerRef.current?.clientWidth ?? 800) - 220),
              top: Math.min(clickDetail.y + 12, (containerRef.current?.clientHeight ?? 600) - 200),
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-serif font-bold text-sm">{clickDetail.brand}</span>
              <button onClick={() => setClickDetail(null)} className="text-text-tertiary hover:text-text text-xs">✕</button>
            </div>
            <div className="text-xs space-y-1 text-text-secondary">
              <div className="flex justify-between"><span>{t('explorer.detail.series')}</span><span className="text-text font-medium">{clickDetail.series}</span></div>
              <div className="flex justify-between"><span>{t('explorer.detail.displacement')}</span><span className="text-text font-medium">{clickDetail.displacement}cc</span></div>
              <div className="flex justify-between"><span>{t('explorer.detail.consumption')}</span><span className="text-primary font-medium">{clickDetail.consumption} L/100km</span></div>
              <div className="flex justify-between"><span>{t('explorer.detail.samples')}</span><span className="text-accent-amber font-medium">{clickDetail.samples.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>{t('explorer.detail.type')}</span><span className="text-text font-medium">{clickDetail.type}</span></div>
              <div className="flex justify-between"><span>{t('explorer.detail.sameDispRank')}</span><span className="text-accent-green font-medium">{t('explorer.detail.rankFormat', { rank: clickDetail.rank, total: clickDetail.total })}</span></div>
            </div>
          </div>
        )}

        {/* Zoom stats */}
        {zoomStats && (
          <div className="absolute bottom-8 right-6 bg-surface border border-border px-3 py-2 text-[11px] text-text-secondary z-40 max-w-xs"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <div className="font-medium text-text mb-1">{t('explorer.zoomStats.title')}</div>
            <div className="flex gap-3 flex-wrap">
              <span>{t('explorer.zoomStats.count', { count: zoomStats.count })}</span>
              <span>{t('explorer.zoomStats.avg', { avg: zoomStats.avgConsumption })}</span>
              {zoomStats.best && (
                <span className="text-accent-green">{t('explorer.zoomStats.best')} {zoomStats.best.brand} {zoomStats.best.consumption}L</span>
              )}
              {zoomStats.worst && (
                <span className="text-accent-red">{t('explorer.zoomStats.worst')} {zoomStats.worst.brand} {zoomStats.worst.consumption}L</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
