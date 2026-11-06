import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import zh from './locales/zh.json'
import en from './locales/en.json'

function syncHtmlLang(lng: string) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lng.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

i18n.on('languageChanged', syncHtmlLang)

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en },
    },
    fallbackLng: 'zh',
    supportedLngs: ['zh', 'en'],
    interpolation: { escapeValue: false },
  })
  .then(() => syncHtmlLang(i18n.language))

export default i18n
