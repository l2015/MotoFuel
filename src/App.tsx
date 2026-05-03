import { Routes, Route, useLocation } from 'react-router-dom'
import { useData } from './hooks/useData'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Ranking from './pages/Ranking'
import Analysis from './pages/Analysis'
import Explorer from './pages/Explorer'

function App() {
  const { data, loading, error } = useData()
  const location = useLocation()
  const isExplorer = location.pathname === '/explorer'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">加载数据中...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-accent-red text-lg font-semibold">数据加载失败</p>
          <p className="text-text-secondary mt-2">{error || '未知错误'}</p>
        </div>
      </div>
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
          <Footer />
        </>
      )}
    </div>
  )
}

export default App
