import { useState } from 'react'
import ReactECharts from 'echarts-for-react'

interface DataPoint {
  displacement: number
  avg: number
  weightedAvg: number
  count: number
  filteredCount: number
}

interface Props {
  data: DataPoint[]
}

export default function ConsumptionTrendLine({ data }: Props) {
  const [mode, setMode] = useState<'simple' | 'weighted'>('simple')

  const values = data.map(d => mode === 'simple' ? d.avg : d.weightedAvg)

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      formatter: (p: any) => {
        const idx = p[0]?.dataIndex ?? 0
        const d = data[idx]
        const val = mode === 'simple' ? d.avg : d.weightedAvg
        return [
          `${d.displacement}cc`,
          `${mode === 'simple' ? '简单平均' : '加权平均'}: ${val} L/100km`,
          `车型数: ${d.count}`,
        ].join('<br/>')
      },
    },
    grid: { left: 60, right: 20, top: 30, bottom: 40 },
    xAxis: { type: 'category' as const, data: data.map(d => d.displacement + 'cc'), name: '排量' },
    yAxis: { type: 'value' as const, name: 'L/100km', min: 0 },
    series: [{
      type: 'line' as const,
      data: values,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: mode === 'weighted' ? '#16a34a' : '#2563eb' },
      itemStyle: { color: mode === 'weighted' ? '#16a34a' : '#2563eb' },
      areaStyle: {
        color: {
          type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: mode === 'weighted'
            ? [{ offset: 0, color: 'rgba(22,163,74,0.25)' }, { offset: 1, color: 'rgba(22,163,74,0.02)' }]
            : [{ offset: 0, color: 'rgba(37,99,235,0.25)' }, { offset: 1, color: 'rgba(37,99,235,0.02)' }],
        },
      },
    }],
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setMode('simple')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            mode === 'simple' ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
          }`}
        >
          简单平均
        </button>
        <button
          onClick={() => setMode('weighted')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            mode === 'weighted' ? 'bg-accent-green text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
          }`}
        >
          加权平均
        </button>
      </div>
      <ReactECharts option={option} style={{ height: 300 }} />
    </div>
  )
}
