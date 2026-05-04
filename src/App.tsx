import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useData } from './hooks/useData'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Ranking from './pages/Ranking'
import Analysis from './pages/Analysis'
import Explorer from './pages/Explorer'

const DemoNivo = lazy(() => import('./pages/demo/DemoNivo'))
const DemoVisx = lazy(() => import('./pages/demo/DemoVisx'))
const DemoD3 = lazy(() => import('./pages/demo/DemoD3'))

function App() {
  const { t } = useTranslation()
  const { data, loading, error } = useData()
  const location = useLocation()
  const isExplorer = location.pathname === '/explorer'
  const isDemo = location.pathname.startsWith('/demo')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">{t('common.loadingData')}</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-accent-red text-lg font-semibold">{t('common.dataLoadFailed')}</p>
          <p className="text-text-secondary mt-2">{error || t('common.unknownError')}</p>
        </div>
      </div>
    )
  }

  if (isDemo) {
    return (
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>Loading...</div>}>
        <Routes>
          <Route path="/demo/nivo" element={<DemoNivo />} />
          <Route path="/demo/visx" element={<DemoVisx />} />
          <Route path="/demo/d3" element={<DemoD3 />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <div className={isExplorer ? 'min-h-screen flex flex-col' : 'min-h-screen flex flex-col'}>
      <Header />
      {isExplorer ? (
        <Explorer data={data.data} />
      ) : (
        <>
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              <Route path="/" element={<Home data={data.data} />} />
              <Route path="/ranking" element={<Ranking data={data.data} />} />
              <Route path="/analysis" element={<Analysis data={data.data} />} />
              <Route path="/explorer" element={<></>} />
            </Routes>
          </main>
          <Footer scrapeTime={data.metadata.scrapedAt} />
        </>
      )}
    </div>
  )
}

export default App
