import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: '总览' },
  { path: '/ranking', label: '排行榜' },
  { path: '/analysis', label: '数据洞察' },
  { path: '/explorer', label: '数据探索' },
]

export default function Header() {
  const location = useLocation()

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <svg viewBox="0 0 32 32" className="w-7 h-7">
              <rect width="32" height="32" rx="6" fill="#2563eb" />
              <text x="16" y="23" textAnchor="middle" fontSize="20" fontWeight="bold" fill="white" fontFamily="system-ui">M</text>
            </svg>
            <span>MotoFuel</span>
            <span className="text-[10px] font-normal text-text-secondary bg-surface-alt px-1.5 py-0.5 rounded">v0.2.0</span>
          </Link>
          <nav className="flex gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-surface-alt hover:text-text'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="bg-primary/5 border-t border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-xs text-text-secondary">
          <span>
            数据来源：
            <a href="https://www.xiaoxiongyouhao.com/page_rank_chexi_moto.php" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
              小熊油耗
            </a>
            — 感谢小熊油耗公开数据
          </span>
          <span>数据抓取时间：2026-05-04</span>
        </div>
      </div>
    </header>
  )
}
