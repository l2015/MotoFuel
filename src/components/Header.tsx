import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Header() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { path: '/', label: t('nav.overview') },
    { path: '/ranking', label: t('nav.ranking') },
    { path: '/analysis', label: t('nav.analysis') },
    { path: '/explorer', label: t('nav.explorer') },
  ]

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')
  }

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
            <span className="text-[10px] font-normal text-text-secondary bg-surface-alt px-1.5 py-0.5 rounded">v0.7.0</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
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
            <button
              onClick={toggleLang}
              className="ml-2 px-2 py-1 rounded-md text-xs font-medium text-text-secondary hover:bg-surface-alt hover:text-text transition-colors"
            >
              {i18n.language === 'zh' ? 'EN' : '中'}
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-text-secondary hover:bg-surface-alt hover:text-text transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t('header.menu')}
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
            <button
              onClick={toggleLang}
              className="px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-surface-alt hover:text-text transition-colors text-left"
            >
              {i18n.language === 'zh' ? 'English' : '中文'}
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}
