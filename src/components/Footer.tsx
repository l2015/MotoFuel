interface Props {
  scrapeTime?: string
}

export default function Footer({ scrapeTime }: Props) {
  const formattedTime = scrapeTime
    ? new Date(scrapeTime).toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <footer className="border-t border-border bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center space-y-2">
        <p className="text-sm">
          数据来源：
          <a
            href="https://www.xiaoxiongyouhao.com/page_rank_chexi_moto.php"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            小熊油耗
          </a>
          — 感谢小熊油耗平台公开摩托车油耗数据
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-text-secondary">
          <span>MotoFuel v0.6.2</span>
          <span>·</span>
          <a href="https://github.com/MotoFuel/MotoFuel" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">GitHub</a>
          <span>·</span>
          <span>MIT License</span>
          {formattedTime && (
            <>
              <span>·</span>
              <span>数据抓取：{formattedTime}</span>
            </>
          )}
        </div>
      </div>
    </footer>
  )
}
