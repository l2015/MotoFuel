import ReactECharts from 'echarts-for-react'
import type { Motorcycle } from '../types'

interface Props {
  items: Motorcycle[]
}

export default function CompareRadar({ items }: Props) {
  if (items.length === 0) return <div className="text-center py-8 text-text-secondary">请选择要对比的车型</div>

  const maxConsumption = Math.max(...items.map(d => d.consumption)) * 1.2
  const maxSamples = Math.max(...items.map(d => d.samples)) * 1.2
  const maxDisp = Math.max(...items.map(d => d.displacement)) * 1.2

  const indicator = [
    { name: '油耗', max: maxConsumption },
    { name: '样本数', max: maxSamples },
    { name: '排量', max: maxDisp },
  ]

  const colors = ['#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899']

  const option = {
    tooltip: {},
    legend: {
      data: items.map(d => `${d.brand} ${d.series}`),
      bottom: 0,
      textStyle: { fontSize: 11 },
    },
    radar: { indicator, radius: '60%' },
    series: [{
      type: 'radar' as const,
      data: items.map((d, i) => ({
        name: `${d.brand} ${d.series}`,
        value: [d.consumption, d.samples, d.displacement],
        lineStyle: { color: colors[i % colors.length] },
        itemStyle: { color: colors[i % colors.length] },
        areaStyle: { color: colors[i % colors.length], opacity: 0.15 },
      })),
    }],
  }
  return <ReactECharts option={option} style={{ height: 400 }} />
}
