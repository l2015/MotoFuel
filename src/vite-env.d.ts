/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string
declare const __GA_MEASUREMENT_ID__: string

interface Window {
  dataLayer?: unknown[]
}
