import ReactECharts from 'echarts-for-react'

interface Props {
  data: { range: string; count: number }[]
}

export default function ConsumptionHistogram({ data }: Props) {
  const option = {
    tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
    grid: { left: 50, right: 20, top: 20, bottom: 50 },
    xAxis: { type: 'category' as const, data: data.map(d => d.range + 'L'), axisLabel: { rotate: 45 } },
    yAxis: { type: 'value' as const, name: '车型数' },
    series: [{
      type: 'bar' as const,
      data: data.map(d => d.count),
      itemStyle: {
        color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#818cf8' }, { offset: 1, color: '#4f46e5' }] },
        borderRadius: [3, 3, 0, 0],
      },
      barMaxWidth: 30,
    }],
  }
  return <ReactECharts option={option} style={{ height: 300 }} />
}
