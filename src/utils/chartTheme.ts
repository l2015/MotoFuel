// Editorial chart theme — warm tones, magazine-style palette

export const CHART_PALETTE = [
  '#ff6b35', // orange (primary)
  '#2563eb', // blue
  '#0d9488', // teal
  '#fd5750', // salmon
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#a855f7', // purple
  '#ef4444', // red
] as const

export const CHART_AXIS = {
  line: '#d4d0c8',
  label: '#888888',
  name: '#555555',
  tick: '#d4d0c8',
  splitLine: '#f0ece5',
} as const

export const CHART_TOOLTIP = {
  backgroundColor: 'rgba(255,254,249,0.96)',
  borderColor: '#e8e4dd',
  textStyle: { color: '#1a1a1a', fontSize: 13 } as const,
  extraCssText: 'box-shadow:0 4px 16px rgba(0,0,0,0.06);border-radius:4px;',
} as const

export function consumptionColor(v: number): string {
  if (v < 2) return '#0d9488'
  if (v < 2.5) return '#14b8a6'
  if (v < 3) return '#2563eb'
  if (v < 3.5) return '#6366f1'
  if (v < 4) return '#8b5cf6'
  if (v < 4.5) return '#f59e0b'
  if (v < 5) return '#ff6b35'
  return '#fd5750'
}

export function brandRankColor(avg: number): string {
  if (avg < 3) return '#0d9488'
  if (avg < 5) return '#2563eb'
  if (avg < 7) return '#f59e0b'
  return '#fd5750'
}

export const CHART_GRADIENTS = {
  primary: ['#ff6b35', '#fd5750'] as const,
  blue: ['#2563eb', '#1d4ed8'] as const,
  teal: ['#0d9488', '#0f766e'] as const,
} as const
