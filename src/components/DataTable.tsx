import { useState, useMemo } from 'react'
import type { Motorcycle } from '../types'

interface DataTableProps {
  data: Motorcycle[]
  showDisplacement?: boolean
  showBar?: boolean
  selectable?: boolean
  selectedIds?: Set<number>
  onToggleSelect?: (id: number) => void
}

type SortKey = 'rank' | 'brand' | 'series' | 'type' | 'displacement' | 'consumption' | 'samples'
type SortDir = 'asc' | 'desc'

function getBarColor(consumption: number): string {
  if (consumption < 2) return '#16a34a'
  if (consumption < 2.5) return '#22c55e'
  if (consumption < 3) return '#3b82f6'
  if (consumption < 3.5) return '#6366f1'
  if (consumption < 4) return '#8b5cf6'
  if (consumption < 4.5) return '#f59e0b'
  if (consumption < 5) return '#f97316'
  return '#dc2626'
}

export default function DataTable({ data, showDisplacement = false, showBar = false, selectable = false, selectedIds, onToggleSelect }: DataTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('consumption')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)
  const pageSize = 50

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv, 'zh') : bv.localeCompare(av, 'zh')
      }
      const diff = (av as number) - (bv as number)
      return sortDir === 'asc' ? diff : -diff
    })
  }, [data, sortKey, sortDir])

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(data.length / pageSize)

  const maxConsumption = useMemo(
    () => data.length > 0 ? Math.max(...data.map(d => d.consumption)) : 1,
    [data]
  )

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <span className="text-border ml-0.5">↕</span>
    return <span className="text-primary ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  if (data.length === 0) {
    return <div className="text-center py-12 text-text-secondary">暂无数据</div>
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className={`w-full text-sm ${showBar ? 'table-fixed' : ''}`}>
          <thead className="bg-surface-alt">
            <tr>
              {selectable && <th className="px-3 py-2.5 w-8" />}
              <th className="px-3 py-2.5 text-left cursor-pointer hover:text-primary" onClick={() => toggleSort('rank')}>
                排名<SortIcon k="rank" />
              </th>
              <th className="px-3 py-2.5 text-left cursor-pointer hover:text-primary" onClick={() => toggleSort('brand')}>
                品牌<SortIcon k="brand" />
              </th>
              <th className="px-3 py-2.5 text-left cursor-pointer hover:text-primary" onClick={() => toggleSort('series')}>
                车系<SortIcon k="series" />
              </th>
              <th className="px-3 py-2.5 text-left cursor-pointer hover:text-primary" onClick={() => toggleSort('type')}>
                类型<SortIcon k="type" />
              </th>
              {showDisplacement && (
                <th className="px-3 py-2.5 text-left cursor-pointer hover:text-primary" onClick={() => toggleSort('displacement')}>
                  排量<SortIcon k="displacement" />
                </th>
              )}
              <th className="px-3 py-2.5 text-right cursor-pointer hover:text-primary w-44" onClick={() => toggleSort('consumption')}>
                油耗(L/100km)<SortIcon k="consumption" />
              </th>
              <th className="px-3 py-2.5 text-right cursor-pointer hover:text-primary" onClick={() => toggleSort('samples')}>
                样本数<SortIcon k="samples" />
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={row.id} className={`border-t border-border hover:bg-blue-50/50 ${i % 2 === 0 ? 'bg-white' : 'bg-surface-alt/30'}`}>
                {selectable && (
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(row.id) || false}
                      onChange={() => onToggleSelect?.(row.id)}
                      className="rounded accent-primary"
                    />
                  </td>
                )}
                <td className="px-3 py-2 font-mono text-text-secondary">{row.rank}</td>
                <td className="px-3 py-2 font-medium">{row.brand}</td>
                <td className="px-3 py-2 truncate max-w-48">{row.series}</td>
                <td className="px-3 py-2">
                  <span className="px-1.5 py-0.5 rounded text-xs bg-surface-alt">{row.type}</span>
                </td>
                {showDisplacement && <td className="px-3 py-2 font-mono">{row.displacement}cc</td>}
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {showBar && (
                      <div className="w-24 bg-surface-alt rounded-full h-2 overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(6, (row.consumption / maxConsumption) * 100)}%`,
                            backgroundColor: getBarColor(row.consumption),
                          }}
                        />
                      </div>
                    )}
                    <span className="font-mono font-medium text-primary ml-auto">{row.consumption}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right font-mono text-text-secondary">{row.samples}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-text-secondary">共 {data.length} 条，第 {page + 1}/{totalPages} 页</span>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage(0)} className="px-2 py-1 rounded border border-border disabled:opacity-30 hover:bg-surface-alt">首页</button>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-2 py-1 rounded border border-border disabled:opacity-30 hover:bg-surface-alt">上一页</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded border border-border disabled:opacity-30 hover:bg-surface-alt">下一页</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)} className="px-2 py-1 rounded border border-border disabled:opacity-30 hover:bg-surface-alt">末页</button>
          </div>
        </div>
      )}
    </div>
  )
}
