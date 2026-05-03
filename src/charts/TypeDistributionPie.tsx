import ReactECharts from 'echarts-for-react'

interface Props {
  data: { type: string; count: number }[]
}

export default function TypeDistributionPie({ data }: Props) {
  const option = {
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c} 款 ({d}%)' },
    series: [{
      type: 'pie' as const,
      radius: ['35%', '65%'],
      center: ['50%', '50%'],
      data: data.map(d => ({ name: d.type, value: d.count })),
      label: {
        fontSize: 11,
        formatter: (p: any) => {
          const pct = p.percent
          if (pct < 5) return p.name
          return `${p.name} ${pct}%`
        },
      },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' } },
    }],
  }
  return <ReactECharts option={option} style={{ height: 300 }} />
}
