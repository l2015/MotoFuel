import ReactECharts from 'echarts-for-react'

interface Props {
  data: { brand: string; avg: number; count: number }[]
  maxItems?: number
}

export default function BrandRankBar({ data, maxItems = 25 }: Props) {
  const items = data.slice(0, maxItems)
  const option = {
    tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const }, formatter: (p: any) => {
      const idx = p[0]?.dataIndex ?? 0
      const item = items[idx]
      return `${item.brand}<br/>平均油耗: ${item.avg} L/100km<br/>车型数: ${item.count}`
    }},
    grid: { left: 100, right: 40, top: 10, bottom: 20 },
    xAxis: { type: 'value' as const, name: 'L/100km' },
    yAxis: {
      type: 'category' as const,
      data: items.map(d => d.brand),
      inverse: true,
    },
    series: [{
      type: 'bar' as const,
      data: items.map(d => ({
        value: d.avg,
        itemStyle: {
          color: d.avg < 3 ? '#16a34a' : d.avg < 5 ? '#2563eb' : d.avg < 7 ? '#f59e0b' : '#dc2626',
          borderRadius: [0, 4, 4, 0],
        },
      })),
      barMaxWidth: 14,
    }],
  }
  return <ReactECharts option={option} style={{ height: Math.max(200, items.length * 22) }} />
}
