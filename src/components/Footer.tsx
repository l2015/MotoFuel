import { useTranslation } from 'react-i18next'
import { formatScrapeTime } from '../utils/formatDate'

interface Props {
  scrapeTime?: string
}

export default function Footer({ scrapeTime }: Props) {
  const { t, i18n } = useTranslation()
  const formattedTime = scrapeTime ? formatScrapeTime(scrapeTime, i18n.language) : null

  return (
    <footer className="mt-auto">
      <hr className="double-rule" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[13px] text-text-secondary leading-relaxed">
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
          </div>
          <div className="flex items-center gap-3 text-[11px] text-text-tertiary font-medium">
            <span className="font-serif font-bold text-text text-[13px]">MotoFuel</span>
            <span>v{__APP_VERSION__}</span>
            <a href="https://github.com/l2015/MotoFuel" target="_blank" rel="noopener noreferrer"
              className="hover:text-text transition-colors no-underline text-text-tertiary">GitHub</a>
            <span>MIT</span>
          </div>
        </div>
        {formattedTime && (
          <p className="text-[11px] text-text-tertiary mt-3 italic">
            {t('footer.scrapedAt')}{formattedTime}
          </p>
        )}
      </div>
    </footer>
  )
}
