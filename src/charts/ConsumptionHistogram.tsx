import { useTranslation } from 'react-i18next'
import ReactECharts from 'echarts-for-react'
import { CHART_GRADIENTS, CHART_AXIS, CHART_TOOLTIP } from '../utils/chartTheme'

interface Props {
  data: { range: string; count: number }[]
}

export default function ConsumptionHistogram({ data }: Props) {
  const { t } = useTranslation()
  const option = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'shadow' as const },
      backgroundColor: CHART_TOOLTIP.backgroundColor,
      borderColor: CHART_TOOLTIP.borderColor,
      textStyle: CHART_TOOLTIP.textStyle,
    },
    grid: { left: 50, right: 20, top: 20, bottom: 50 },
    xAxis: {
      type: 'category' as const,
      data: data.map(d => d.range + 'L'),
      axisLabel: { rotate: 45, color: CHART_AXIS.label },
      axisLine: { lineStyle: { color: CHART_AXIS.line } },
      axisTick: { lineStyle: { color: CHART_AXIS.tick } },
    },
    yAxis: {
      type: 'value' as const,
      name: t('chart.axis.modelCount'),
      nameTextStyle: { color: CHART_AXIS.name },
      axisLabel: { color: CHART_AXIS.label },
      axisLine: { lineStyle: { color: CHART_AXIS.line } },
      splitLine: { lineStyle: { color: CHART_AXIS.splitLine } },
    },
    series: [{
      type: 'bar' as const,
      data: data.map(d => d.count),
      itemStyle: {
        color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: CHART_GRADIENTS.indigo[0] }, { offset: 1, color: CHART_GRADIENTS.indigo[1] }] },
        borderRadius: [3, 3, 0, 0],
      },
      barMaxWidth: 30,
    }],
  }
  return <ReactECharts option={option} style={{ height: 300 }} />
}
