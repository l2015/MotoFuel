import ReactECharts from 'echarts-for-react'
import { CHART_AXIS } from '../utils/chartTheme'

interface Props {
  data: { brand: string; series: string; consumption: number }[]
  maxItems?: number
}

export default function ModelConsumptionBar({ data, maxItems = 30 }: Props) {
  const items = data.slice(0, maxItems)
  const maxVal = items.length > 0 ? items[items.length - 1].consumption : 1

  const option = {
    tooltip: { show: false },
    grid: { left: 160, right: 70, top: 6, bottom: 8 },
    xAxis: { type: 'value' as const, show: false },
    yAxis: {
      type: 'category' as const,
      data: items.map(d => `${d.brand} ${d.series}`),
      inverse: true,
      axisLabel: { fontSize: 13, color: CHART_AXIS.label },
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
          fontSize: 13,
          color: CHART_AXIS.label,
          fontWeight: 500,
        },
        itemStyle: {
          borderRadius: [0, 3, 3, 0],
          color: {
            type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#6366f1' },
              { offset: 1, color: `hsl(${240 + (d.consumption / maxVal) * 30}, 80%, 65%)` },
            ],
          },
        },
      })),
      barMaxWidth: 10,
    }],
  }
  return <ReactECharts option={option} style={{ height: Math.max(200, items.length * 28) }} />
}
