import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { Motorcycle } from '../types'

interface Props {
  data: Motorcycle[]
}

export default function Explorer({ data }: Props) {
  const scatterData = useMemo(
    () => data.map(d => ({
      value: [d.displacement, d.consumption],
      itemStyle: {
        color: getTypeColor(d.type),
        opacity: 0.7,
      },
    })),
    [data]
  )

  const typeColors: Record<string, string> = {}
  const uniqueTypes = [...new Set(data.map(d => d.type))]
  const palette = ['#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6']
  uniqueTypes.forEach((t, i) => { typeColors[t] = palette[i % palette.length] })

  function getTypeColor(type: string) {
    return typeColors[type] || '#94a3b8'
  }

  const option = {
    tooltip: {
      trigger: 'item' as const,
      formatter: (p: any) => {
        const d = data[p.dataIndex]
        return [
          `<strong>${d.brand} ${d.series}</strong>`,
          `排量: ${d.displacement}cc`,
          `油耗: ${d.consumption} L/100km`,
          `样本数: ${d.samples}`,
          `类型: ${d.type}`,
        ].join('<br/>')
      },
    },
    grid: { left: 70, right: 30, top: 40, bottom: 60 },
    xAxis: {
      type: 'value' as const,
      name: '排量 (cc)',
      nameLocation: 'center' as const,
      nameGap: 35,
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    yAxis: {
      type: 'value' as const,
      name: '油耗 (L/100km)',
      nameLocation: 'center' as const,
      nameGap: 50,
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    dataZoom: [
      { type: 'inside' as const, xAxisIndex: 0 },
      { type: 'inside' as const, yAxisIndex: 0 },
      { type: 'slider' as const, xAxisIndex: 0, bottom: 10, height: 20 },
    ],
    series: [{
      type: 'scatter' as const,
      data: scatterData,
      symbolSize: 6,
    }],
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">数据探索</h1>
        <span className="text-sm text-text-secondary">{data.length} 款车型 · 滚轮缩放 · 拖拽平移</span>
      </div>

      <div className="bg-white rounded-xl border border-border p-4">
        <div className="flex items-center gap-4 mb-3">
          <h2 className="text-base font-semibold">排量 vs 油耗散点图</h2>
          <div className="flex flex-wrap gap-2">
            {uniqueTypes.map(t => (
              <span key={t} className="flex items-center gap-1 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getTypeColor(t) }} />
                {t}
              </span>
            ))}
          </div>
        </div>
        <ReactECharts option={option} style={{ height: 520 }} />
      </div>
    </div>
  )
}
