import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ReactECharts from 'echarts-for-react'
import { CHART_AXIS, CHART_TOOLTIP, brandRankColor } from '../utils/chartTheme'

interface Props {
  data: { brand: string; avg: number; count: number }[]
  brandSamplesMap: Map<string, number>
  onBrandClick?: (brand: string) => void
}

export default function BrandRankBar({ data, brandSamplesMap, onBrandClick }: Props) {
  const { t } = useTranslation()
  const items = useMemo(() => data.slice(0, 30), [data])

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'shadow' as const },
      ...CHART_TOOLTIP,
      formatter: (p: any) => {
        const idx = p[0]?.dataIndex ?? 0
        const item = items[idx]
        if (!item) return ''
        return `${item.brand}<br/>${t('chart.tooltip.avgConsumption', { avg: item.avg })}<br/>${t('chart.tooltip.modelCount', { count: item.count })}<br/>${t('chart.tooltip.sampleCount', { count: (brandSamplesMap.get(item.brand) || 0).toLocaleString() })}`
      },
    },
    grid: { left: 100, right: 50, top: 10, bottom: 20 },
    xAxis: {
      type: 'value' as const,
      name: 'L/100km',
      nameTextStyle: { color: CHART_AXIS.name },
      axisLabel: { color: CHART_AXIS.label },
      axisLine: { lineStyle: { color: CHART_AXIS.line } },
      splitLine: { lineStyle: { color: CHART_AXIS.splitLine } },
    },
    yAxis: {
      type: 'category' as const,
      data: items.map(d => d.brand),
      inverse: true,
      axisLabel: { fontSize: 13, color: CHART_AXIS.label },
      axisLine: { lineStyle: { color: CHART_AXIS.line } },
    },
    series: [{
      type: 'bar' as const,
      data: items.map(d => ({
        value: d.avg,
        label: { show: true, position: 'right' as const, formatter: '{c}', fontSize: 11, color: CHART_AXIS.label },
        itemStyle: {
          color: brandRankColor(d.avg),
          borderRadius: [0, 4, 4, 0],
        },
      })),
      barMaxWidth: 16,
    }],
  }), [items, brandSamplesMap, t])

  const onEvents = useMemo(() => {
    if (!onBrandClick) return undefined
    return {
      click: (params: any) => {
        const brand = items[params.dataIndex]?.brand
        if (brand) onBrandClick(brand)
      },
    } as Record<string, (params: any) => void>
  }, [items, onBrandClick])

  return (
    <ReactECharts
      option={option}
      style={{ height: Math.max(300, Math.min(items.length, 30) * 26) }}
      onEvents={onEvents}
    />
  )
}
