import ReactECharts from 'echarts-for-react'
import type { Motorcycle } from '../types'
import { CHART_PALETTE, CHART_AXIS, CHART_TOOLTIP } from '../utils/chartTheme'

interface Props {
  data: Motorcycle[]
}

export default function ConsumptionScatter({ data }: Props) {
  const option = {
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: CHART_TOOLTIP.backgroundColor,
      borderColor: CHART_TOOLTIP.borderColor,
      textStyle: CHART_TOOLTIP.textStyle,
      formatter: (p: { data: [number, number, string, string] }) =>
        `${p.data[2]} ${p.data[3]}<br/>油耗: ${p.data[0]} L/100km<br/>样本数: ${p.data[1]}`,
    },
    grid: { left: 60, right: 30, top: 20, bottom: 50 },
    xAxis: {
      type: 'value' as const,
      name: '油耗 (L/100km)',
      nameLocation: 'center' as const,
      nameGap: 30,
      nameTextStyle: { color: CHART_AXIS.name },
      axisLabel: { color: CHART_AXIS.label },
      axisLine: { lineStyle: { color: CHART_AXIS.line } },
      splitLine: { lineStyle: { color: CHART_AXIS.splitLine } },
    },
    yAxis: {
      type: 'value' as const,
      name: '样本数',
      nameTextStyle: { color: CHART_AXIS.name },
      axisLabel: { color: CHART_AXIS.label },
      axisLine: { lineStyle: { color: CHART_AXIS.line } },
      splitLine: { lineStyle: { color: CHART_AXIS.splitLine } },
    },
    series: [{
      type: 'scatter' as const,
      data: data.map(d => [d.consumption, d.samples, d.brand, d.series]),
      symbolSize: (val: number[]) => Math.max(6, Math.min(30, Math.sqrt(val[1]) * 2)),
      itemStyle: { color: CHART_PALETTE[0] + '99' },
    }],
  }
  return <ReactECharts option={option} style={{ height: 400 }} />
}
