import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Header() {
  const { t, i18n } = useTranslation()
  const location = useLocation()

  const navItems = [
    { path: '/', label: t('nav.overview') },
    { path: '/ranking', label: t('nav.ranking') },
    { path: '/analysis', label: t('nav.analysis') },
    { path: '/explorer', label: t('nav.explorer') },
    { path: '/about', label: t('nav.about') },
  ]

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')
  }

  return (
    <header className="sticky top-0 z-50 bg-[rgba(255,254,249,0.92)] backdrop-blur-xl border-b-[3px] double-rule">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left: logo */}
          <Link to="/" className="flex items-baseline no-underline">
            <span className="font-serif text-[24px] font-black text-text tracking-tight">Moto</span>
            <span className="font-serif text-[24px] font-black text-primary tracking-tight">Fuel</span>
            <span className="ml-1.5 text-[10px] font-mono font-medium text-text-tertiary align-top mt-1">{__APP_VERSION__}</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center">
            <nav className="flex">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.1em] no-underline transition-colors border-l border-border-subtle last:border-r last:border-r-border-subtle ${
                    location.pathname === item.path
                      ? 'text-primary bg-primary-light'
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <button
              onClick={toggleLang}
              className="ml-3 px-2 py-1 text-[11px] font-medium text-text-tertiary hover:text-text transition-colors"
            >
              {i18n.language === 'zh' ? 'EN' : '中'}
            </button>
          </div>

          {/* Mobile lang toggle */}
          <button
            onClick={toggleLang}
            className="md:hidden px-2 py-1 text-[11px] font-medium text-text-tertiary hover:text-text transition-colors"
          >
            {i18n.language === 'zh' ? 'EN' : '中'}
          </button>
        </div>
      </div>
    </header>
  )
}
