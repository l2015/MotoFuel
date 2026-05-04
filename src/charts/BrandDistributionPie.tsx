import ReactECharts from 'echarts-for-react'
import { CHART_PALETTE, CHART_TOOLTIP } from '../utils/chartTheme'

interface Props {
  data: { brand: string; count: number }[]
  maxItems?: number
}

export default function BrandDistributionPie({ data, maxItems = 12 }: Props) {
  const top = data.slice(0, maxItems)
  const rest = data.slice(maxItems).reduce((s, d) => s + d.count, 0)
  const pieData = top.map(d => ({ name: d.brand, value: d.count }))
  if (rest > 0) pieData.push({ name: '其他', value: rest })

  const option = {
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: CHART_TOOLTIP.backgroundColor,
      borderColor: CHART_TOOLTIP.borderColor,
      textStyle: CHART_TOOLTIP.textStyle,
      formatter: '{b}: {c} 款 ({d}%)',
    },
    color: CHART_PALETTE,
    series: [{
      type: 'pie' as const,
      radius: ['35%', '65%'],
      center: ['50%', '50%'],
      data: pieData,
      label: { fontSize: 11, color: '#94a3b8' },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.4)' } },
    }],
  }
  return <ReactECharts option={option} style={{ height: 300 }} />
}
