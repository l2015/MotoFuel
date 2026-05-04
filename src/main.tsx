import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/MotoFuel">
      <App />
    </BrowserRouter>
  </StrictMode>,
)
