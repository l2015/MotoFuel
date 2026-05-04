import { useTranslation } from 'react-i18next'

export default function About() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto">
      <section className="py-12 md:py-16 animate-in">
        <div className="text-[12px] font-bold text-primary uppercase tracking-[0.12em] mb-3">
          {t('about.kicker')}
        </div>
        <h1 className="font-serif text-[40px] md:text-[56px] font-black leading-[1.05] tracking-tight mb-4 text-text">
          {t('about.title')}
        </h1>
        <p className="text-[17px] leading-relaxed text-text-secondary">
          {t('about.subtitle')}
        </p>
      </section>

      <hr className="section-rule mb-10" />

      <section className="mb-10">
        <h2 className="font-serif text-[24px] font-extrabold leading-tight mb-3 text-text">
          {t('about.whatTitle')}
        </h2>
        <p className="text-[15px] leading-[1.8] text-text-secondary">
          {t('about.whatContent')}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-[24px] font-extrabold leading-tight mb-3 text-text">
          {t('about.sourceTitle')}
        </h2>
        <p className="text-[15px] leading-[1.8] text-text-secondary">
          {t('about.sourceContent')}
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <a
            href="https://www.xiaoxiongyouhao.com/page_app.php"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity no-underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('about.downloadApp')}
          </a>
          <a
            href="https://www.xiaoxiongyouhao.com/page_rank_chexi_moto.php"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-primary text-primary text-[13px] font-semibold rounded-lg hover:bg-primary/5 transition-colors no-underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            {t('about.viewRanking')}
          </a>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-[24px] font-extrabold leading-tight mb-3 text-text">
          {t('about.techTitle')}
        </h2>
        <p className="text-[15px] leading-[1.8] text-text-secondary">
          {t('about.techContent')}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-[24px] font-extrabold leading-tight mb-3 text-text">
          {t('about.limitationTitle')}
        </h2>
        <p className="text-[15px] leading-[1.8] text-text-secondary">
          {t('about.limitationContent')}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-[20px] font-extrabold leading-tight mb-3 text-text">
          {t('about.disclaimer')}
        </h2>
        <p className="text-[14px] leading-[1.8] text-text-tertiary">
          {t('about.disclaimerContent')}
        </p>
      </section>

      <div className="pb-8" />
    </div>
  )
}
