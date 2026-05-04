import { useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const tabs = [
  {
    path: '/',
    labelKey: 'nav.overview',
    // grid/dashboard icon
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    path: '/ranking',
    labelKey: 'nav.ranking',
    // list/table icon
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    path: '/analysis',
    labelKey: 'nav.analysis',
    // chart/pie icon
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12A9 9 0 1 1 12 3v9z" />
        <path d="M21 3v9h-9" />
      </svg>
    ),
  },
  {
    path: '/explorer',
    labelKey: 'nav.explorer',
    // scatter/bubble icon
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="7" r="2" />
        <circle cx="17" cy="9" r="3" />
        <circle cx="10" cy="16" r="2.5" />
        <circle cx="18" cy="18" r="1.5" />
        <circle cx="5" cy="14" r="1" />
      </svg>
    ),
  },
  {
    path: '/about',
    labelKey: 'nav.about',
    // info icon
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <nav className="bottom-nav md:hidden">
      {tabs.map(tab => (
        <Link
          key={tab.path}
          to={tab.path}
          className={location.pathname === tab.path ? 'active' : ''}
        >
          {tab.icon}
          <span>{t(tab.labelKey)}</span>
        </Link>
      ))}
    </nav>
  )
}
