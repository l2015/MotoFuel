// Shared chart color palette and theme constants for MotoFuel
// All chart components should import colors from this file.

// 11-color palette for categorical series (type/brand distribution)
export const CHART_PALETTE = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#a855f7', // purple
  '#eab308', // yellow
  '#84cc16', // lime
] as const

// Axis colors (for light background)
export const CHART_AXIS = {
  line: '#e2e8f0',
  label: '#64748b',
  name: '#475569',
  tick: '#e2e8f0',
  splitLine: '#f1f5f9',
} as const

// Light tooltip style
export const CHART_TOOLTIP = {
  backgroundColor: '#ffffff',
  borderColor: '#e2e8f0',
  textStyle: { color: '#1e293b', fontSize: 13 } as const,
} as const

// Consumption → color mapping (green = efficient, red = wasteful)
export function consumptionColor(v: number): string {
  if (v < 2) return '#22c55e'
  if (v < 2.5) return '#34d399'
  if (v < 3) return '#3b82f6'
  if (v < 3.5) return '#6366f1'
  if (v < 4) return '#8b5cf6'
  if (v < 4.5) return '#eab308'
  if (v < 5) return '#f97316'
  return '#ef4444'
}

// Brand rank bar threshold colors
export function brandRankColor(avg: number): string {
  if (avg < 3) return '#22c55e'
  if (avg < 5) return '#3b82f6'
  if (avg < 7) return '#eab308'
  return '#ef4444'
}

// Chart gradient pairs [start, end] for bar charts
export const CHART_GRADIENTS = {
  primary: ['#3b82f6', '#2563eb'] as const,
  blue: ['#06b6d4', '#0284c7'] as const,
  indigo: ['#8b5cf6', '#6d28d9'] as const,
} as const
