import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import type { Motorcycle } from '../types'

interface Props {
  data: Motorcycle[]
}

const PALETTE = ['#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6']

export default function Explorer({ data }: Props) {
  const [highlightType, setHighlightType] = useState<string | null>(null)

  const types = useMemo(() => [...new Set(data.map(d => d.type))], [data])
  const typeColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    types.forEach((t, i) => { map[t] = PALETTE[i % PALETTE.length] })
    return map
  }, [types])

  const option = useMemo(() => {
    // Group by type for separate series (enables legend toggle)
    const series = types.map(type => {
      const items = data.filter(d => d.type === type)
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
        })),
        symbolSize: 7,
        itemStyle: {
          color: isDimmed ? 'rgba(200,200,200,0.3)' : color,
          borderColor: isDimmed ? 'transparent' : color,
          borderWidth: 1,
          opacity: isDimmed ? 0.2 : 0.85,
        },
        emphasis: {
          itemStyle: { borderWidth: 2, shadowBlur: 8, shadowColor: color },
        },
        large: true,
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
        axisLabel: { fontSize: 12 },
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
    }
  }, [data, types, typeColorMap, highlightType])

  return (
    <div className="fixed inset-0 top-14 flex flex-col bg-white">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">数据探索</h1>
          <span className="text-sm text-text-secondary">{data.length} 款车型</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setHighlightType(null)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
              highlightType === null ? 'bg-text text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
            }`}
          >全部</button>
          {types.map(t => (
            <button
              key={t}
              onClick={() => setHighlightType(highlightType === t ? null : t)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors ${
                highlightType === t ? 'ring-2 ring-offset-1 ring-primary' : 'bg-surface-alt hover:bg-border'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: typeColorMap[t] }} />
              {t}
            </button>
          ))}
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
