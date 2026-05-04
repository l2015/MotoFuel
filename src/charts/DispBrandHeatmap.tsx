import { useMemo } from 'react'
import type { Motorcycle } from '../types'

interface Props {
  data: Motorcycle[]
}

const DISPS = [110, 125, 150, 200, 250, 300, 400, 500, 600, 800, 1000]

const BRANDS = [
  '五羊本田', '新大洲本田', '建设雅马哈', '济南铃木',
  '豪爵', '豪爵铃木', '钱江', '春风', '无极',
  '本田', '雅马哈', '铃木', '川崎',
  '贝纳利', 'QJMOTOR', '光阳', 'SYM三阳',
]

// Muted editorial color scale: teal → blue → amber → orange → red
function cellColor(val: number, min: number, max: number): string {
  const t = Math.max(0, Math.min(1, (val - min) / (max - min)))
  // 5 stops: very light warm → teal → blue → amber → warm red
  if (t < 0.25) return `hsl(165, 25%, ${94 - t * 40}%)`
  if (t < 0.5) return `hsl(${165 - (t - 0.25) * 200}, ${30 + t * 30}%, ${84 - t * 20}%)`
  if (t < 0.75) return `hsl(${220 - (t - 0.5) * 180}, ${50 + t * 20}%, ${72 - t * 10}%)`
  return `hsl(${15 + (1 - t) * 10}, ${70 + t * 15}%, ${70 - t * 15}%)`
}

function textColor(val: number, min: number, max: number): string {
  const t = (val - min) / (max - min)
  return t > 0.7 ? '#fff' : '#1a1a1a'
}

export default function DispBrandHeatmap({ data }: Props) {
  const { cells, minVal, maxVal } = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>()
    for (const m of data) {
      if (!BRANDS.includes(m.brand) || !DISPS.includes(m.displacement)) continue
      const key = m.brand + '|' + m.displacement
      const cur = map.get(key) || { sum: 0, count: 0 }
      cur.sum += m.consumption
      cur.count++
      map.set(key, cur)
    }

    const result = new Map<string, number>()
    for (const [key, { sum, count }] of map) {
      if (count >= 2) result.set(key, Math.round((sum / count) * 100) / 100)
    }
    const vals = [...result.values()]
    return { cells: result, minVal: Math.min(...vals), maxVal: Math.max(...vals) }
  }, [data])

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="heatmap-table">
        <thead>
          <tr>
            <th className="heatmap-brand-header" />
            {DISPS.map(d => (
              <th key={d} className="heatmap-disp-header">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BRANDS.map(brand => (
            <tr key={brand}>
              <td className="heatmap-brand-cell">{brand}</td>
              {DISPS.map(disp => {
                const val = cells.get(brand + '|' + disp)
                if (val == null) return <td key={disp} className="heatmap-empty" />
                return (
                  <td
                    key={disp}
                    className="heatmap-cell"
                    style={{
                      backgroundColor: cellColor(val, minVal, maxVal),
                      color: textColor(val, minVal, maxVal),
                    }}
                  >
                    {val.toFixed(1)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-4 mt-3 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cellColor(minVal, minVal, maxVal) }} />
          <span className="text-[10px] text-text-tertiary font-mono">{minVal.toFixed(1)}L</span>
        </div>
        <div className="flex-1 h-1 rounded" style={{
          background: `linear-gradient(to right, hsl(165,25%,92%), hsl(165,40%,78%), hsl(220,60%,68%), hsl(38,70%,65%), hsl(15,80%,55%))`,
        }} />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-text-tertiary font-mono">{maxVal.toFixed(1)}L</span>
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cellColor(maxVal, minVal, maxVal) }} />
        </div>
      </div>
    </div>
  )
}
