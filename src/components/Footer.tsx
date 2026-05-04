import { useTranslation } from 'react-i18next'

interface Props {
  scrapeTime?: string
}

export default function Footer({ scrapeTime }: Props) {
  const { t, i18n } = useTranslation()
  const formattedTime = scrapeTime
    ? new Date(scrapeTime).toLocaleString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <footer className="border-t border-border bg-surface-alt mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center space-y-2">
        <p className="text-sm">
          {t('footer.dataSource')}
          <a
            href="https://www.xiaoxiongyouhao.com/page_rank_chexi_moto.php"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            {t('footer.xiaoxiongYouhao')}
          </a>
          {t('footer.acknowledgement')}
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-text-secondary">
          <span>MotoFuel v0.7.0</span>
          <span>·</span>
          <a href="https://github.com/l2015/MotoFuel" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">GitHub</a>
          <span>·</span>
          <span>MIT License</span>
          {formattedTime && (
            <>
              <span>·</span>
              <span>{t('footer.scrapedAt')}{formattedTime}</span>
            </>
          )}
        </div>
      </div>
    </footer>
  )
}
