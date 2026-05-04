import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Motorcycle } from '../types'
import { consumptionColor } from '../utils/chartTheme'

interface DataTableProps {
  data: Motorcycle[]
  showDisplacement?: boolean
  showBar?: boolean
}

type SortKey = 'rank' | 'brand' | 'series' | 'type' | 'displacement' | 'consumption' | 'samples'
type SortDir = 'asc' | 'desc'

export default function DataTable({ data, showDisplacement = false, showBar = false }: DataTableProps) {
  const { t } = useTranslation()
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
    () => data.length > 0 ? data.reduce((m, d) => d.consumption > m ? d.consumption : m, 0) : 1,
    [data]
  )

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
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

  if (data.length === 0) {
    return <div className="text-center py-12 text-text-secondary">{t('table.noData')}</div>
  }

  return (
    <div>
      <div className="overflow-x-auto border border-border">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b-2 border-b-text">
              <th className="px-3 py-2.5 text-left w-10 sm:w-14 cursor-pointer hover:text-primary hidden sm:table-cell text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary select-none" onClick={() => toggleSort('rank')}>
                {t('table.header.rank')}<SortIcon k="rank" />
              </th>
              <th className="px-2 sm:px-3 py-2.5 text-left w-[72px] sm:w-24 cursor-pointer hover:text-primary text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary select-none" onClick={() => toggleSort('brand')}>
                {t('table.header.brand')}<SortIcon k="brand" />
              </th>
              <th className="px-2 sm:px-3 py-2.5 text-left cursor-pointer hover:text-primary text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary select-none" onClick={() => toggleSort('series')}>
                {t('table.header.series')}<SortIcon k="series" />
              </th>
              <th className="hidden sm:table-cell px-3 py-2.5 text-left w-16 cursor-pointer hover:text-primary text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary select-none" onClick={() => toggleSort('type')}>
                {t('table.header.type')}<SortIcon k="type" />
              </th>
              {showDisplacement && (
                <th className="px-1.5 sm:px-3 py-2.5 text-left w-14 sm:w-16 cursor-pointer hover:text-primary text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary select-none" onClick={() => toggleSort('displacement')}>
                  {t('table.header.displacement')}<SortIcon k="displacement" />
                </th>
              )}
              <th className="px-2 sm:px-3 py-2.5 text-right w-20 sm:w-44 cursor-pointer hover:text-primary text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary select-none" onClick={() => toggleSort('consumption')}>
                {t('table.header.consumption')}<SortIcon k="consumption" />
              </th>
              <th className="px-2 sm:px-3 py-2.5 text-right w-14 sm:w-16 cursor-pointer hover:text-primary text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary select-none" onClick={() => toggleSort('samples')}>
                {t('table.header.samples')}<SortIcon k="samples" />
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => (
              <tr key={row.id} className="border-t border-border-subtle transition-colors hover:bg-primary/[0.02]">
                <td className="px-3 py-2 font-mono text-text-secondary hidden sm:table-cell">{row.rank}</td>
                <td className="px-2 sm:px-3 py-2 text-[13px] sm:text-sm font-medium">{row.brand}</td>
                <td className="px-2 sm:px-3 py-2 text-[13px] sm:text-sm truncate">{row.series}</td>
                <td className="hidden sm:table-cell px-3 py-2">
                  <span className="px-1.5 py-0.5 rounded text-xs bg-surface-alt">{row.type}</span>
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
          <span className="text-text-secondary">{t('table.pagination.status', { total: data.length, page: page + 1, totalPages })}</span>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage(0)} className="px-1.5 sm:px-2 py-1 rounded border border-border disabled:opacity-30 hover:bg-surface-alt">{t('table.pagination.first')}</button>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-1.5 sm:px-2 py-1 rounded border border-border disabled:opacity-30 hover:bg-surface-alt">{t('table.pagination.prev')}</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-1.5 sm:px-2 py-1 rounded border border-border disabled:opacity-30 hover:bg-surface-alt">{t('table.pagination.next')}</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)} className="px-1.5 sm:px-2 py-1 rounded border border-border disabled:opacity-30 hover:bg-surface-alt">{t('table.pagination.last')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
