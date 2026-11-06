import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { CSSProperties } from 'react'
import echarts from '../utils/echarts'

/** 从按需入口推导实例类型，避免与整包 echarts 的类型声明冲突 */
type EChartsInstance = ReturnType<typeof echarts.init>
type SetOptionParams = Parameters<EChartsInstance['setOption']>[0]

export interface EChartHandle {
  /** 与 echarts-for-react 的同名方法保持一致，便于迁移 */
  getEchartsInstance: () => EChartsInstance | null
  resize: () => void
}

interface EChartProps {
  option: object
  style?: CSSProperties
  className?: string
  /**
   * 事件名 -> 处理函数，例如 { click: fn, dataZoom: fn }。
   * 参数类型用 never 是为了让调用方可以传入收窄过的参数类型（逆变兼容）。
   */
  onEvents?: Record<string, (params: never) => void>
}

/**
 * echarts 的极薄 React 封装（替代 echarts-for-react）。
 *
 * 之所以不用 echarts-for-react：它的 `lib/core` 是 CJS 产物，经 bundler 互操作后
 * default 导出可能变成模块对象，导致 "Element type is invalid"（React #130）；
 * 另外它的根入口会静态引入整包 echarts，无法按需裁剪。
 *
 * 行为约定：
 * - 挂载时 init，卸载时 dispose
 * - ResizeObserver 跟随容器尺寸变化自动 resize
 * - option 变化时使用默认合并语义 setOption（而非 notMerge），
 *   这样 dataZoom 等内部交互状态不会被无关的重渲染重置
 */
const EChart = forwardRef<EChartHandle, EChartProps>(({ option, style, className, onEvents }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsInstance | null>(null)

  useImperativeHandle(ref, () => ({
    getEchartsInstance: () => chartRef.current,
    resize: () => chartRef.current?.resize(),
  }), [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const chart = echarts.init(el)
    chartRef.current = chart

    const observer = new ResizeObserver(() => { chart.resize() })
    observer.observe(el)

    return () => {
      observer.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option as SetOptionParams)
  }, [option])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !onEvents) return
    const entries = Object.entries(onEvents)
    for (const [eventName, handler] of entries) chart.on(eventName, handler as (params: unknown) => void)
    return () => {
      for (const [eventName, handler] of entries) chart.off(eventName, handler as (params: unknown) => void)
    }
  }, [onEvents])

  return <div ref={containerRef} style={style} className={className} />
})

EChart.displayName = 'EChart'

export default EChart
