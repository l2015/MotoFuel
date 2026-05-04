export function formatScrapeTime(scrapeTime: string, language: string): string {
  return new Date(scrapeTime).toLocaleString(
    language === 'zh' ? 'zh-CN' : 'en-US',
    { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
  )
}
