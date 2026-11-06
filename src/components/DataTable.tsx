import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTypeLabel } from '../utils/typeLabel'
import type { Motorcycle } from '../types'
import { consumptionColor } from '../utils/chartTheme'

interface DataTableProps {
  data: Motorcycle[]
  showDisplacement?: boolean
  showBar?: boolean
}

type SortKey = 'rank' | 'brand' | 'series' | 'type' | 'displacement' | 'consumption' | 'samples'
type SortDir = 'asc' | 'desc'

/** 排序图标：定义在模块作用域，避免每次渲染都重建组件类型 */
function SortIcon({ k, sortKey, sortDir }: { k: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== k) return (
    <svg className="w-3 h-3 ml-0.5 inline text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  )
  if (sortDir === 'asc') return (
    <svg className="w-3 h-3 ml-0.5 inline text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  )
  return (
    <svg className="w-3 h-3 ml-0.5 inline text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

interface SortableThProps {
  k: SortKey
  label: string
  className?: string
  sortKey: SortKey
  sortDir: SortDir
  onSort: (k: SortKey) => void
}

/**
 * 可排序表头：用真正的 <button> 承载交互，键盘可聚焦、可回车触发，
 * 并通过 aria-sort 向读屏软件暴露当前排序方向（此前是 th 上的 onClick，键盘无法操作）。
 */
function SortableTh({ k, label, className = '', sortKey, sortDir, onSort }: SortableThProps) {
  const active = sortKey === k
  return (
    <th
      scope="col"
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary select-none ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className="inline-flex items-center gap-0.5 cursor-pointer hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {label}<SortIcon k={k} sortKey={sortKey} sortDir={sortDir} />
      </button>
    </th>
  )
}

export default function DataTable({ data, showDisplacement = false, showBar = false }: DataTableProps) {
  const { t } = useTranslation()
  const typeText = useTypeLabel()
  const [sortKey, setSortKey] = useState<SortKey>('consumption')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)
  const pageSize = 50

  // 数据集或排序变化后回到第一页。用"渲染期同步 state"（React 官方推荐模式），
  // 比在 effect 里 setState 少一次提交，也避免级联渲染。
  const [pagedFor, setPagedFor] = useState({ data, sortKey, sortDir })
  if (pagedFor.data !== data || pagedFor.sortKey !== sortKey || pagedFor.sortDir !== sortDir) {
    setPagedFor({ data, sortKey, sortDir })
    setPage(0)
  }

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

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  // 兜底：即使 page 因为某些路径越界，也不会渲染出空白表格
  const safePage = Math.min(page, totalPages - 1)
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize)

  const maxConsumption = useMemo(
    () => data.length > 0 ? data.reduce((m, d) => d.consumption > m ? d.consumption : m, 0) : 1,
    [data]
  )

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  if (data.length === 0) {
    return <div className="text-center py-12 text-text-secondary">{t('table.noData')}</div>
  }

  return (
    <div>
      <div className="overflow-x-auto border border-border">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b-2 border-b-text">
              <SortableTh k="rank" label={t('table.header.rank')} className="px-3 py-2.5 text-left w-10 sm:w-14 hidden sm:table-cell" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh k="brand" label={t('table.header.brand')} className="px-2 sm:px-3 py-2.5 text-left w-[72px] sm:w-24" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh k="series" label={t('table.header.series')} className="px-2 sm:px-3 py-2.5 text-left" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh k="type" label={t('table.header.type')} className="hidden sm:table-cell px-3 py-2.5 text-left w-16" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              {showDisplacement && (
                <SortableTh k="displacement" label={t('table.header.displacement')} className="px-1.5 sm:px-3 py-2.5 text-left w-14 sm:w-16" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              )}
              <SortableTh k="consumption" label={t('table.header.consumption')} className="px-2 sm:px-3 py-2.5 text-right w-20 sm:w-44" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh k="samples" label={t('table.header.samples')} className="px-2 sm:px-3 py-2.5 text-right w-14 sm:w-16" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => (
              <tr key={row.id} className="border-t border-border-subtle transition-colors hover:bg-primary/[0.02]">
                <td className="px-3 py-2 font-mono text-text-secondary hidden sm:table-cell">{row.rank}</td>
                <td className="px-2 sm:px-3 py-2 text-[13px] sm:text-sm font-medium">{row.brand}</td>
                <td className="px-2 sm:px-3 py-2 text-[13px] sm:text-sm truncate">{row.series}</td>
                <td className="hidden sm:table-cell px-3 py-2">
                  <span className="px-1.5 py-0.5 rounded text-xs bg-surface-alt">{typeText(row.type)}</span>
                </td>
                {showDisplacement && <td className="px-1.5 sm:px-3 py-2 font-mono">{row.displacement}cc</td>}
                <td className="px-2 sm:px-3 py-2">
                  <div className="flex items-center gap-2">
                    {showBar && (
                      <div className="w-24 bg-surface-alt rounded-full h-2 overflow-hidden shrink-0 hidden sm:block">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(6, (row.consumption / maxConsumption) * 100)}%`,
                            backgroundColor: consumptionColor(row.consumption),
                          }}
                        />
                      </div>
                    )}
                    <span className="font-mono font-medium text-primary ml-auto">{row.consumption}</span>
                  </div>
                </td>
                <td className="px-2 sm:px-3 py-2 text-right font-mono text-text-secondary">{row.samples}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs sm:text-sm">
          <span className="text-text-secondary">{t('table.pagination.status', { total: data.length, page: safePage + 1, totalPages })}</span>
          <div className="flex gap-1">
            <button disabled={safePage === 0} onClick={() => setPage(0)} className="px-1.5 sm:px-2 py-1 rounded border border-border disabled:opacity-30 hover:bg-surface-alt">{t('table.pagination.first')}</button>
            <button disabled={safePage === 0} onClick={() => setPage(Math.max(0, safePage - 1))} className="px-1.5 sm:px-2 py-1 rounded border border-border disabled:opacity-30 hover:bg-surface-alt">{t('table.pagination.prev')}</button>
            <button disabled={safePage >= totalPages - 1} onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))} className="px-1.5 sm:px-2 py-1 rounded border border-border disabled:opacity-30 hover:bg-surface-alt">{t('table.pagination.next')}</button>
            <button disabled={safePage >= totalPages - 1} onClick={() => setPage(totalPages - 1)} className="px-1.5 sm:px-2 py-1 rounded border border-border disabled:opacity-30 hover:bg-surface-alt">{t('table.pagination.last')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
