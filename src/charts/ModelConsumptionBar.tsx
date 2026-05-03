import ReactECharts from 'echarts-for-react'

interface Props {
  data: { brand: string; series: string; consumption: number }[]
  maxItems?: number
}

export default function ModelConsumptionBar({ data, maxItems = 30 }: Props) {
  const items = data.slice(0, maxItems)
  const maxVal = items.length > 0 ? items[items.length - 1].consumption : 1

  const option = {
    tooltip: { show: false },
    grid: { left: 140, right: 60, top: 10, bottom: 20 },
    xAxis: { type: 'value' as const, show: false },
    yAxis: {
      type: 'category' as const,
      data: items.map(d => `${d.brand} ${d.series}`),
      inverse: true,
      axisLabel: { fontSize: 11 },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [{
      type: 'bar' as const,
      data: items.map(d => ({
        value: d.consumption,
        label: {
          show: true,
          position: 'right' as const,
          formatter: '{c}',
          fontSize: 10,
          color: '#64748b',
        },
        itemStyle: {
          borderRadius: [0, 3, 3, 0],
          color: {
            type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#1d4ed8' },
              { offset: 1, color: `hsl(${210 + (d.consumption / maxVal) * 30}, 80%, 55%)` },
            ],
          },
        },
      })),
      barMaxWidth: 14,
    }],
  }
  return <ReactECharts option={option} style={{ height: Math.max(200, items.length * 24) }} />
}
