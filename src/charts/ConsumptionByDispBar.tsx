import ReactECharts from 'echarts-for-react'

interface Props {
  data: { displacement: number; avg: number; count: number }[]
}

export default function ConsumptionByDispBar({ data }: Props) {
  const option = {
    tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const }, formatter: (p: any) => {
      const idx = p[0]?.dataIndex ?? 0
      const item = data[idx]
      return `${item.displacement}cc<br/>平均油耗: ${item.avg} L/100km<br/>车型数: ${item.count}`
    }},
    grid: { left: 60, right: 20, top: 30, bottom: 50 },
    xAxis: { type: 'category' as const, data: data.map(d => d.displacement + 'cc'), axisLabel: { rotate: 45 } },
    yAxis: { type: 'value' as const, name: 'L/100km', min: 0 },
    series: [{
      type: 'bar' as const,
      data: data.map(d => ({
        value: d.avg,
        itemStyle: {
          color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#1d4ed8' }] },
          borderRadius: [4, 4, 0, 0],
        },
      })),
      barMaxWidth: 40,
    }],
  }
  return <ReactECharts option={option} style={{ height: 320 }} />
}
