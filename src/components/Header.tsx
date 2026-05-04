import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: '总览' },
  { path: '/ranking', label: '排行榜' },
  { path: '/analysis', label: '数据洞察' },
  { path: '/explorer', label: '数据探索' },
]

export default function Header() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="glass-card border-b border-border sticky top-0 z-50 rounded-none border-t-0 border-x-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <svg viewBox="0 0 32 32" className="w-7 h-7">
              <rect width="32" height="32" rx="6" fill="#6366f1" />
              <text x="16" y="23" textAnchor="middle" fontSize="20" fontWeight="bold" fill="white" fontFamily="system-ui">M</text>
            </svg>
            <span>MotoFuel</span>
            <span className="text-[10px] font-normal text-text-secondary bg-surface-alt px-1.5 py-0.5 rounded">v0.6.5</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1">
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

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-text-secondary hover:bg-surface-alt hover:text-text transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="菜单"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden pb-3 flex flex-col gap-1 border-t border-border pt-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-surface-alt hover:text-text'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
