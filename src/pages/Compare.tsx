import { useState, useMemo } from 'react'
import type { Motorcycle } from '../types'
import DataTable from '../components/DataTable'
import CompareRadar from '../charts/CompareRadar'

interface Props {
  data: Motorcycle[]
}

export default function Compare({ data }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [searchText, setSearchText] = useState('')

  const searchResults = useMemo(() => {
    if (!searchText.trim()) return data.slice(0, 100)
    const q = searchText.trim().toLowerCase()
    return data.filter(d =>
      d.brand.toLowerCase().includes(q) ||
      d.series.toLowerCase().includes(q)
    ).slice(0, 100)
  }, [data, searchText])

  const selectedItems = useMemo(
    () => data.filter(d => selectedIds.has(d.id)),
    [data, selectedIds]
  )

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 6) next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">车型对比</h1>
      <p className="text-sm text-text-secondary">选择最多6款车型进行对比（勾选后下方雷达图自动更新）</p>

      {selectedItems.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-base font-semibold mb-3">对比雷达图</h2>
          <CompareRadar items={selectedItems} />
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedItems.map(item => (
              <span key={item.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs">
                {item.brand} {item.series}
                <button onClick={() => toggleSelect(item.id)} className="hover:text-accent-red">×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border p-4">
        <input
          type="text"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder="搜索品牌或车型名称..."
          className="w-full max-w-md px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary mb-4"
        />
        <DataTable
          data={searchResults}
          showDisplacement
          selectable
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      </div>
    </div>
  )
}
