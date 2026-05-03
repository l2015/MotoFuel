import ReactECharts from 'echarts-for-react'

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
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c} 款 ({d}%)' },
    series: [{
      type: 'pie' as const,
      radius: ['35%', '65%'],
      center: ['50%', '50%'],
      data: pieData,
      label: { fontSize: 11 },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' } },
    }],
  }
  return <ReactECharts option={option} style={{ height: 300 }} />
}
