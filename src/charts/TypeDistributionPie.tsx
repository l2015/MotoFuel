import { useTranslation } from 'react-i18next'
import ReactECharts from 'echarts-for-react'
import { CHART_PALETTE, CHART_TOOLTIP } from '../utils/chartTheme'

interface Props {
  data: { type: string; count: number }[]
}

export default function TypeDistributionPie({ data }: Props) {
  const { t } = useTranslation()
  const option = {
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: CHART_TOOLTIP.backgroundColor,
      borderColor: CHART_TOOLTIP.borderColor,
      textStyle: CHART_TOOLTIP.textStyle,
      formatter: (p: any) => `${p.name}: ${p.value}${t('chart.tooltip.modelsPercent', { percent: p.percent })}`,
    },
    color: CHART_PALETTE,
    series: [{
      type: 'pie' as const,
      radius: ['35%', '65%'],
      center: ['50%', '50%'],
      data: data.map(d => ({ name: d.type, value: d.count })),
      label: {
        fontSize: 11,
        color: '#64748b',
        formatter: (p: any) => {
          const pct = p.percent
          if (pct < 5) return p.name
          return `${p.name} ${pct}%`
        },
      },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.4)' } },
    }],
  }
  return <ReactECharts option={option} style={{ height: 300 }} />
}
