interface DisplacementTabsProps {
  displacements: number[]
  selected: number[]
  onChange: (selected: number[]) => void
}

export default function DisplacementTabs({ displacements, selected, onChange }: DisplacementTabsProps) {
  const toggle = (disp: number) => {
    if (selected.length === 0) {
      onChange([disp])
    } else if (selected.includes(disp)) {
      const next = selected.filter(d => d !== disp)
      onChange(next)
    } else {
      onChange([...selected, disp])
    }
  }

  const selectAll = () => onChange([])

  const isActive = (disp: number) => selected.length === 0 || selected.includes(disp)

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      <button
        onClick={selectAll}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          selected.length === 0
            ? 'bg-primary text-white'
            : 'bg-surface-alt text-text-secondary hover:bg-border'
        }`}
      >
        全部
      </button>
      {displacements.map(d => (
        <button
          key={d}
          onClick={() => toggle(d)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            isActive(d)
              ? 'bg-primary text-white'
              : 'bg-surface-alt text-text-secondary hover:bg-border'
          }`}
        >
          {d}cc
        </button>
      ))}
    </div>
  )
}
