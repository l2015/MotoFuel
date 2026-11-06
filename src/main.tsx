import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import './i18n'
import App from './App'

// GA4: injected at build time via GA_MEASUREMENT_ID env var
if (__GA_MEASUREMENT_ID__) {
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${__GA_MEASUREMENT_ID__}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag(...args: unknown[]) { window.dataLayer!.push(args) }
  gtag('js', new Date())
  gtag('config', __GA_MEASUREMENT_ID__)
}

// PWA：走 virtual:pwa-register（而不是裸 register），新版本就绪后会自动接管并刷新页面，
// 避免回访用户长期停留在旧的预缓存内容上。每小时额外检查一次更新，长时间开着的标签页也能拿到新数据。
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    setInterval(() => {
      // 离线/网络异常时 update() 会 reject，这里显式吞掉，避免 unhandledrejection
      registration.update().catch(() => { /* 忽略离线或临时网络错误 */ })
    }, 60 * 60 * 1000)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/MotoFuel">
      <App />
    </BrowserRouter>
  </StrictMode>,
)
