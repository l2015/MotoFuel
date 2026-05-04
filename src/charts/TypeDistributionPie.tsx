import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ReactECharts from 'echarts-for-react'
import { CHART_PALETTE, CHART_AXIS, CHART_TOOLTIP } from '../utils/chartTheme'

interface Props {
  data: { type: string; count: number }[]
  typeSamplesMap?: Map<string, number>
  onTypeClick?: (type: string) => void
}

export default function TypeDistributionPie({ data, typeSamplesMap, onTypeClick }: Props) {
  const { t } = useTranslation()
  const option = useMemo(() => ({
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: CHART_TOOLTIP.backgroundColor,
      borderColor: CHART_TOOLTIP.borderColor,
      textStyle: CHART_TOOLTIP.textStyle,
      formatter: (p: any) => {
        const samples = typeSamplesMap?.get(p.name) || 0
        const base = `${p.name}: ${p.value}${t('chart.tooltip.modelsPercent', { percent: p.percent })}`
        return typeSamplesMap ? `${base}<br/>${t('chart.tooltip.sampleCount', { count: samples.toLocaleString() })}` : base
      },
    },
    color: CHART_PALETTE,
    series: [{
      type: 'pie' as const,
      radius: typeSamplesMap ? ['30%', '65%'] : ['35%', '62%'],
      center: typeSamplesMap ? ['50%', '55%'] : ['50%', '52%'],
      data: data.map(d => ({ name: d.type, value: d.count })),
      label: {
        fontSize: 11,
        color: CHART_AXIS.label,
        formatter: (p: any) => p.percent >= 4 ? `${p.name}\n${p.percent}%` : '',
        lineHeight: 15,
      },
      labelLine: { lineStyle: { color: CHART_AXIS.line }, length: 10, length2: 6 },
      labelLayout: { hideOverlap: true },
      itemStyle: { borderColor: CHART_TOOLTIP.backgroundColor, borderWidth: 2 },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(255,107,53,0.15)' } },
    }],
  }), [data, t, typeSamplesMap])

  const onEvents = useMemo(() => {
    if (!onTypeClick) return undefined
    return {
      click: (params: any) => {
        if (params.name) onTypeClick(params.name)
      },
    } as Record<string, (params: any) => void>
  }, [onTypeClick])

  return <ReactECharts option={option} style={{ height: 320 }} onEvents={onEvents} />
}
