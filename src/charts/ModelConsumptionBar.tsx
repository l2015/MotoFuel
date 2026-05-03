import ReactECharts from 'echarts-for-react'

interface Props {
  data: { brand: string; series: string; consumption: number }[]
  maxItems?: number
}

export default function ModelConsumptionBar({ data, maxItems = 30 }: Props) {
  const items = data.slice(0, maxItems)
  const option = {
    tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
    grid: { left: 140, right: 40, top: 10, bottom: 20 },
    xAxis: { type: 'value' as const, name: 'L/100km' },
    yAxis: {
      type: 'category' as const,
      data: items.map(d => `${d.brand} ${d.series}`),
      inverse: true,
      axisLabel: { fontSize: 11 },
    },
    series: [{
      type: 'bar' as const,
      data: items.map(d => d.consumption),
      itemStyle: {
        color: { type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#1d4ed8' }, { offset: 1, color: '#3b82f6' }] },
        borderRadius: [0, 4, 4, 0],
      },
      barMaxWidth: 16,
    }],
  }
  return <ReactECharts option={option} style={{ height: Math.max(200, items.length * 24) }} />
}
