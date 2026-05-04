import ReactECharts from 'echarts-for-react'
import { CHART_GRADIENTS, CHART_AXIS, CHART_TOOLTIP } from '../utils/chartTheme'

interface Props {
  data: { displacement: number; avg: number; count: number }[]
}

export default function ConsumptionByDispBar({ data }: Props) {
  const option = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'shadow' as const },
      backgroundColor: CHART_TOOLTIP.backgroundColor,
      borderColor: CHART_TOOLTIP.borderColor,
      textStyle: CHART_TOOLTIP.textStyle,
      formatter: (p: any) => {
        const idx = p[0]?.dataIndex ?? 0
        const item = data[idx]
        return `${item.displacement}cc<br/>平均油耗: ${item.avg} L/100km<br/>车型数: ${item.count}`
      },
    },
    grid: { left: 60, right: 20, top: 30, bottom: 50 },
    xAxis: {
      type: 'category' as const,
      data: data.map(d => d.displacement + 'cc'),
      axisLabel: { rotate: 45, color: CHART_AXIS.label },
      nameTextStyle: { color: CHART_AXIS.name },
      axisLine: { lineStyle: { color: CHART_AXIS.line } },
      axisTick: { lineStyle: { color: CHART_AXIS.tick } },
    },
    yAxis: {
      type: 'value' as const,
      name: 'L/100km',
      min: 0,
      nameTextStyle: { color: CHART_AXIS.name },
      axisLabel: { color: CHART_AXIS.label },
      axisLine: { lineStyle: { color: CHART_AXIS.line } },
      splitLine: { lineStyle: { color: CHART_AXIS.splitLine } },
    },
    series: [{
      type: 'bar' as const,
      data: data.map(d => ({
        value: d.avg,
        itemStyle: {
          color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: CHART_GRADIENTS.blue[0] }, { offset: 1, color: CHART_GRADIENTS.blue[1] }] },
          borderRadius: [4, 4, 0, 0],
        },
      })),
      barMaxWidth: 40,
    }],
  }
  return <ReactECharts option={option} style={{ height: 320 }} />
}
