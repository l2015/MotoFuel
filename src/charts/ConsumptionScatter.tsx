import ReactECharts from 'echarts-for-react'
import type { Motorcycle } from '../types'

interface Props {
  data: Motorcycle[]
}

export default function ConsumptionScatter({ data }: Props) {
  const option = {
    tooltip: {
      trigger: 'item' as const,
      formatter: (p: { data: [number, number, string, string] }) =>
        `${p.data[2]} ${p.data[3]}<br/>油耗: ${p.data[0]} L/100km<br/>样本数: ${p.data[1]}`,
    },
    grid: { left: 60, right: 30, top: 20, bottom: 50 },
    xAxis: { type: 'value' as const, name: '油耗 (L/100km)', nameLocation: 'center' as const, nameGap: 30 },
    yAxis: { type: 'value' as const, name: '样本数' },
    series: [{
      type: 'scatter' as const,
      data: data.map(d => [d.consumption, d.samples, d.brand, d.series]),
      symbolSize: (val: number[]) => Math.max(6, Math.min(30, Math.sqrt(val[1]) * 2)),
      itemStyle: { color: 'rgba(37,99,235,0.6)' },
    }],
  }
  return <ReactECharts option={option} style={{ height: 400 }} />
}
