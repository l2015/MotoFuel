// Shared chart color palette and theme constants for MotoFuel
// All chart components should import colors from this file.

// 11-color palette for categorical series (type/brand distribution)
export const CHART_PALETTE = [
  '#818cf8', // indigo
  '#c084fc', // purple
  '#f472b6', // pink
  '#fb7185', // rose
  '#fb923c', // orange
  '#34d399', // emerald
  '#2dd4bf', // teal
  '#38bdf8', // sky
  '#a78bfa', // violet
  '#fbbf24', // amber
  '#a3e635', // lime
] as const

// Axis colors (semi-transparent for dark background)
export const CHART_AXIS = {
  line: 'rgba(148,163,184,0.15)',
  label: '#94a3b8',
  name: '#cbd5e1',
  tick: 'rgba(148,163,184,0.1)',
  splitLine: 'rgba(148,163,184,0.07)',
} as const

// Dark tooltip style
export const CHART_TOOLTIP = {
  backgroundColor: 'rgba(30,41,59,0.95)',
  borderColor: 'rgba(148,163,184,0.2)',
  textStyle: { color: '#f1f5f9', fontSize: 13 } as const,
} as const

// Consumption → color mapping (green = efficient, red = wasteful)
export function consumptionColor(v: number): string {
  if (v < 2) return '#22c55e'
  if (v < 2.5) return '#34d399'
  if (v < 3) return '#38bdf8'
  if (v < 3.5) return '#818cf8'
  if (v < 4) return '#a78bfa'
  if (v < 4.5) return '#fbbf24'
  if (v < 5) return '#fb923c'
  return '#f87171'
}

// Brand rank bar threshold colors
export function brandRankColor(avg: number): string {
  if (avg < 3) return '#34d399'
  if (avg < 5) return '#818cf8'
  if (avg < 7) return '#fbbf24'
  return '#f87171'
}

// Chart gradient pairs [start, end] for bar charts
export const CHART_GRADIENTS = {
  primary: ['#818cf8', '#6366f1'] as const,
  blue: ['#38bdf8', '#2563eb'] as const,
  indigo: ['#a78bfa', '#7c3aed'] as const,
} as const
