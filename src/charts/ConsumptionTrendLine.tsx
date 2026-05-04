import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ReactECharts from 'echarts-for-react'
import { CHART_AXIS, CHART_TOOLTIP } from '../utils/chartTheme'

interface DataPoint {
  displacement: number
  avg: number
  weightedAvg: number
  count: number
  filteredCount: number
}

interface Props {
  data: DataPoint[]
  mode: 'simple' | 'weighted'
}

export default function ConsumptionTrendLine({ data, mode }: Props) {
  const { t } = useTranslation()

  const values = useMemo(() => data.map(d => mode === 'simple' ? d.avg : d.weightedAvg), [data, mode])
  const lineColor = mode === 'weighted' ? '#0d9488' : '#ff6b35'
  const rgba = (hex: string, a: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${a})`
  }

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: CHART_TOOLTIP.backgroundColor,
      borderColor: CHART_TOOLTIP.borderColor,
      textStyle: CHART_TOOLTIP.textStyle,
      formatter: (p: any) => {
        const idx = p[0]?.dataIndex ?? 0
        const d = data[idx]
        const val = mode === 'simple' ? d.avg : d.weightedAvg
        return [
          `${d.displacement}cc`,
          `${mode === 'simple' ? t('chart.tooltip.simpleAverage') : t('chart.tooltip.weightedAverage')}: ${val} L/100km`,
          t('chart.tooltip.modelCount', { count: d.count }),
        ].join('<br/>')
      },
    },
    grid: { left: 50, right: 16, top: 20, bottom: 36 },
    xAxis: {
      type: 'category' as const,
      data: data.map(d => d.displacement + 'cc'),
      name: t('chart.axis.displacement'),
      nameTextStyle: { color: CHART_AXIS.name },
      axisLabel: { color: CHART_AXIS.label, fontSize: 11 },
      axisLine: { lineStyle: { color: CHART_AXIS.line } },
      axisTick: { lineStyle: { color: CHART_AXIS.tick } },
    },
    yAxis: {
      type: 'value' as const,
      name: 'L/100km',
      min: 0,
      nameTextStyle: { color: CHART_AXIS.name },
      axisLabel: { color: CHART_AXIS.label, fontSize: 11 },
      axisLine: { lineStyle: { color: CHART_AXIS.line } },
      splitLine: { lineStyle: { color: CHART_AXIS.splitLine } },
    },
    series: [{
      type: 'line' as const,
      data: values,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: lineColor },
      itemStyle: { color: lineColor, borderColor: CHART_TOOLTIP.backgroundColor, borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: rgba(lineColor, 0.25) },
            { offset: 1, color: rgba(lineColor, 0.02) },
          ],
        },
      },
    }],
  }), [data, mode, t, values, lineColor, rgba])

  return <ReactECharts option={option} style={{ height: 260 }} />
}
