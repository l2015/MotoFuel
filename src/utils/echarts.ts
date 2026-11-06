/**
 * echarts 按需入口：只注册项目实际用到的图表与组件。
 *
 * 之前每个图表组件都 `import ReactECharts from 'echarts-for-react'`，会把整个
 * echarts（约 1.1MB）打进主包。这里改用 echarts/core + 显式注册，
 * 实例由 src/charts/EChart.tsx 这个极薄封装创建。
 *
 * 新增图表类型时，记得在这里补上对应的 Chart 与 Component。
 */
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, ScatterChart } from 'echarts/charts'
import {
  DataZoomComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import { LabelLayout } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  // 图表
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  // 组件
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  // 特性：散点/饼图的 labelLayout.hideOverlap 依赖它
  LabelLayout,
  // 渲染器
  CanvasRenderer,
])

export default echarts
