import { Routes, Route, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useData } from './hooks/useData'
import Header from './components/Header'
import Footer from './components/Footer'
import BottomNav from './components/BottomNav'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import Ranking from './pages/Ranking'
import Analysis from './pages/Analysis'
import Explorer from './pages/Explorer'
import About from './pages/About'

function App() {
  const { t } = useTranslation()
  const { data, loading, error } = useData()
  const location = useLocation()
  const isExplorer = location.pathname === '/explorer'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary text-sm">{t('common.loadingData')}</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-accent-red text-lg font-serif font-bold">{t('common.dataLoadFailed')}</p>
          <p className="text-text-secondary mt-2 text-sm">{error || t('common.unknownError')}</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-bg">
        <Header />
        {isExplorer ? (
          <Explorer data={data.data} />
        ) : (
          <>
            <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 mobile-content-pad">
              <Routes>
                <Route path="/" element={<Home data={data.data} />} />
                <Route path="/ranking" element={<Ranking data={data.data} scrapeTime={data.metadata.scrapedAt} />} />
                <Route path="/analysis" element={<Analysis data={data.data} />} />
                <Route path="/explorer" element={<></>} />
                <Route path="/about" element={<About />} />
              </Routes>
            </main>
            <Footer scrapeTime={data.metadata.scrapedAt} />
          </>
        )}
        <BottomNav />
      </div>
    </ErrorBoundary>
  )
}

export default App
