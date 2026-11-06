import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useData } from './hooks/useData'
import Header from './components/Header'
import Footer from './components/Footer'
import BottomNav from './components/BottomNav'
import ErrorBoundary from './components/ErrorBoundary'
// 路由级懒加载：首屏只需要 Home，其余页面（尤其依赖 echarts 的 Analysis/Explorer）
// 按需加载，避免把全部图表代码塞进首屏 bundle。
const Home = lazy(() => import('./pages/Home'))
const Ranking = lazy(() => import('./pages/Ranking'))
const Analysis = lazy(() => import('./pages/Analysis'))
const Explorer = lazy(() => import('./pages/Explorer'))
const About = lazy(() => import('./pages/About'))

function PageFallback() {
  return (
    <div className="flex-1 flex items-center justify-center py-24">
      <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

/**
 * 数据加载骨架：数据文件 353KB，弱网下要等一会儿。
 * 先把页面框架和占位块画出来（固定高度，避免数据到达后的布局跳动），
 * 而不是整页只有一个转圈。
 */
function DataSkeleton({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg" aria-busy="true">
      <div className="sticky top-0 z-50 h-14 border-b-[3px] double-rule bg-[rgba(255,254,249,0.92)] backdrop-blur-xl" />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6">
        <div className="animate-pulse space-y-4 py-6">
          <div className="h-3 w-24 bg-surface-alt" />
          <div className="h-10 w-2/3 bg-surface-alt" />
          <div className="h-4 w-1/2 bg-surface-alt" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-20 bg-surface-alt" />)}
          </div>
          <div className="h-64 bg-surface-alt" />
          <div className="h-40 bg-surface-alt" />
        </div>
        <p className="sr-only">{label}</p>
      </main>
    </div>
  )
}

function App() {
  const { t } = useTranslation()
  const { data, loading, error } = useData()
  const location = useLocation()
  const isExplorer = location.pathname === '/explorer'

  if (loading) {
    return <DataSkeleton label={t('common.loadingData')} />
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
          <Suspense fallback={<PageFallback />}>
            <Explorer data={data.data} />
          </Suspense>
        ) : (
          <>
            <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 mobile-content-pad">
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<Home data={data.data} />} />
                  <Route path="/ranking" element={<Ranking data={data.data} scrapeTime={data.metadata.scrapedAt} />} />
                  <Route path="/analysis" element={<Analysis data={data.data} />} />
                  <Route path="/explorer" element={<></>} />
                  <Route path="/about" element={<About />} />
                </Routes>
              </Suspense>
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
