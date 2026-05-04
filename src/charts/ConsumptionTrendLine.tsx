import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactECharts from 'echarts-for-react'
import { CHART_PALETTE, CHART_AXIS, CHART_TOOLTIP } from '../utils/chartTheme'

interface DataPoint {
  displacement: number
  avg: number
  weightedAvg: number
  count: number
  filteredCount: number
}

interface Props {
  data: DataPoint[]
}

export default function ConsumptionTrendLine({ data }: Props) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'simple' | 'weighted'>('simple')

  const values = data.map(d => mode === 'simple' ? d.avg : d.weightedAvg)
  const lineColor = mode === 'weighted' ? CHART_PALETTE[5] : CHART_PALETTE[0]
  const rgba = (hex: string, a: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${a})`
  }

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: CHART_TOOLTIP.backgroundColor,
      borderColor: CHART_TOOLTIP.borderColor,
      textStyle: CHART_TOOLTIP.textStyle,
      formatter: (p: any) => {
        const idx = p[0]?.dataIndex ?? 0
        const d = data[idx]
        const val = mode === 'simple' ? d.avg : d.weightedAvg
        return [
          `${d.displacement}cc`,
          `${mode === 'simple' ? t('chart.tooltip.simpleAverage') : t('chart.tooltip.weightedAverage')}: ${val} L/100km`,
          t('chart.tooltip.modelCount', { count: d.count }),
        ].join('<br/>')
      },
    },
    grid: { left: 60, right: 20, top: 30, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: data.map(d => d.displacement + 'cc'),
      name: t('chart.axis.displacement'),
      nameTextStyle: { color: CHART_AXIS.name },
      axisLabel: { color: CHART_AXIS.label },
      axisLine: { lineStyle: { color: CHART_AXIS.line } },
      axisTick: { lineStyle: { color: CHART_AXIS.tick } },
    },
    yAxis: {
      type: 'value' as const,
      name: 'L/100km',
      min: 0,
      nameTextStyle: { color: CHART_AXIS.name },
      axisLabel: { color: CHART_AXIS.label },
      axisLine: { lineStyle: { color: CHART_AXIS.line } },
      splitLine: { lineStyle: { color: CHART_AXIS.splitLine } },
    },
    series: [{
      type: 'line' as const,
      data: values,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: lineColor },
      itemStyle: { color: lineColor },
      areaStyle: {
        color: {
          type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: rgba(lineColor, 0.25) },
            { offset: 1, color: rgba(lineColor, 0.02) },
          ],
        },
      },
    }],
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setMode('simple')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            mode === 'simple' ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
          }`}
        >
          {t('chart.mode.simpleAverage')}
        </button>
        <button
          onClick={() => setMode('weighted')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            mode === 'weighted' ? 'bg-accent-green text-white' : 'bg-surface-alt text-text-secondary hover:bg-border'
          }`}
        >
          {t('chart.mode.weightedAverage')}
        </button>
      </div>
      <ReactECharts option={option} style={{ height: 300 }} />
    </div>
  )
}
