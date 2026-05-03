interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  color?: string
}

export default function StatCard({ title, value, subtitle, color = 'text-primary' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 sm:p-5">
      <p className="text-sm text-text-secondary">{title}</p>
      <p className={`text-2xl sm:text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
    </div>
  )
}
