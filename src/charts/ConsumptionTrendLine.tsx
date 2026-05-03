import ReactECharts from 'echarts-for-react'

interface Props {
  data: { displacement: number; avg: number }[]
}

export default function ConsumptionTrendLine({ data }: Props) {
  const option = {
    tooltip: { trigger: 'axis' as const, formatter: '{b}cc<br/>平均油耗: {c} L/100km' },
    grid: { left: 60, right: 20, top: 30, bottom: 40 },
    xAxis: { type: 'category' as const, data: data.map(d => d.displacement + 'cc'), name: '排量' },
    yAxis: { type: 'value' as const, name: 'L/100km', min: 0 },
    series: [{
      type: 'line' as const,
      data: data.map(d => d.avg),
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: '#2563eb' },
      itemStyle: { color: '#2563eb' },
      areaStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(37,99,235,0.3)' }, { offset: 1, color: 'rgba(37,99,235,0.02)' }] } },
    }],
  }
  return <ReactECharts option={option} style={{ height: 320 }} />
}
