import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ReactECharts from 'echarts-for-react'
import { CHART_PALETTE, CHART_AXIS, CHART_TOOLTIP } from '../utils/chartTheme'

interface Props {
  data: { range: string; count: number }[]
}

export default function ConsumptionHistogram({ data }: Props) {
  const { t } = useTranslation()

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'shadow' as const },
      ...CHART_TOOLTIP,
      formatter: (p: any) => {
        const idx = p[0]?.dataIndex ?? 0
        const d = data[idx]
        if (!d) return ''
        return `${d.range}L/100km<br/>${t('chart.tooltip.modelCount', { count: d.count })}`
      },
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
      itemStyle: { color: CHART_PALETTE[0], borderRadius: [3, 3, 0, 0] },
      barMaxWidth: 30,
    }],
  }), [data, t])

  return <ReactECharts option={option} style={{ height: 320 }} />
}
