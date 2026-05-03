export default function Footer() {
  return (
    <footer className="border-t border-border bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
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
          — 感谢小熊油耗平台公开摩托车油耗数据，为车友提供宝贵的参考
        </p>
        <p className="text-xs text-text-secondary mt-2">
          MotoFuel v0.2.0 · 基于车友真实加油记录的油耗分析 · 仅供学习参考
        </p>
      </div>
    </footer>
  )
}
