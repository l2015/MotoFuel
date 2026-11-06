import fetch from 'node-fetch'
import { parsePage } from './parser.js'
import { loadPreviousDataset, validateAgainstPrevious } from './validate.js'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
// 源站已把 /page_rank_chexi_moto/... 301 迁移到 /rank_moto/...，这里直接使用新地址，
// 避免依赖 node-fetch 的自动重定向（多一跳，且站点若取消重定向会直接断掉）。
const BASE_URL = 'https://www.xiaoxiongyouhao.com/rank_moto/byDisplacementLvl'
const TOTAL_LEVELS = 18
const DELAY_MS = 1000
const MAX_RETRIES = 3

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchPage(levelId) {
  const url = `${BASE_URL}/${levelId}.html`

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`Fetching level ${levelId} (attempt ${attempt}/${MAX_RETRIES}): ${url}`)
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
          'Accept-Language': 'zh-CN,zh;q=0.9',
        },
      })

      if (!res.ok) {
        console.error(`HTTP ${res.status} for level ${levelId}`)
        if (attempt < MAX_RETRIES) { await sleep(2000 * attempt); continue }
        return { rows: [], rejected: 0 }
      }

      const html = await res.text()
      const result = parsePage(html, levelId)

      if (result.rows.length === 0 && attempt < MAX_RETRIES) {
        console.warn(`No data parsed for level ${levelId}, retrying...`)
        await sleep(2000 * attempt)
        continue
      }

      return result
    } catch (e) {
      console.error(`Error fetching level ${levelId} (attempt ${attempt}):`, e.message)
      if (attempt < MAX_RETRIES) { await sleep(2000 * attempt); continue }
      return { rows: [], rejected: 0 }
    }
  }
  return { rows: [], rejected: 0 }
}

async function main() {
  console.log('Starting MotoFuel scraper...')
  const allData = []
  const displacements = []
  const failedLevels = []
  let totalRejected = 0

  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const result = await fetchPage(i)
    if (result.rows.length > 0) {
      displacements.push(result.rows[0].displacement)
      allData.push(...result.rows)
      totalRejected += result.rejected
    } else {
      failedLevels.push(i)
      console.warn(`WARNING: No data for level ${i}`)
    }
    if (i < TOTAL_LEVELS) await sleep(DELAY_MS)
  }

  // Health check: abort if >30% levels failed (major structural change)
  const failRate = failedLevels.length / TOTAL_LEVELS
  if (failRate > 0.3) {
    console.error(`\nSCRAPER HEALTH CHECK FAILED`)
    console.error(`Failed levels: ${failedLevels.length}/${TOTAL_LEVELS} (${(failRate * 100).toFixed(0)}%)`)
    console.error(`Failed level IDs: ${failedLevels.join(', ')}`)
    console.error(`This likely means the source website has changed its structure.`)
    console.error(`Aborting to prevent writing bad data.`)
    process.exit(1)
  }

  let globalRank = 1
  for (const item of allData) {
    item.id = globalRank++
  }

  console.log(`\nScraping complete: ${allData.length} models from ${displacements.length} displacement levels`)
  console.log(`Rejected rows: ${totalRejected}`)
  if (failedLevels.length > 0) {
    console.warn(`Failed levels: ${failedLevels.join(', ')}`)
  }

  // Data validation
  if (allData.length < 500) {
    console.error(`ERROR: Only ${allData.length} models scraped (expected 500+). Aborting write.`)
    process.exit(1)
  }

  const outDir = join(__dirname, '..', 'public', 'data')
  const outPath = join(outDir, 'motorcycles.json')

  const output = {
    metadata: {
      source: 'xiaoxiongyouhao.com',
      scrapedAt: new Date().toISOString(),
      totalModels: allData.length,
    },
    displacements: displacements.sort((a, b) => a - b),
    data: allData,
  }

  // 写入前回归校验：与仓库里上一版数据对比，避免源站改版时静默写入残缺数据
  const previous = loadPreviousDataset(outPath)
  const { problems, stats, skipped } = validateAgainstPrevious(previous, output, displacements)
  if (skipped) {
    console.log('未找到上一版数据，跳过回归校验（首次运行）')
  } else {
    console.log(
      `与上一版对比: 新增 ${stats.added} | 消失 ${stats.removed} | 数值变化 ${stats.changed}`
    )
  }

  if (problems.length > 0) {
    console.error('\n数据回归校验失败，已中止写入：')
    for (const problem of problems) {
      console.error(`  - ${problem}`)
    }
    if (process.env.SKIP_REGRESSION_CHECK !== '1') {
      console.error('\n如确认源站确实下架了这些车型，可用 SKIP_REGRESSION_CHECK=1 重新运行。')
      process.exit(1)
    }
    console.warn('\nSKIP_REGRESSION_CHECK=1，忽略上述问题继续写入。')
  }

  mkdirSync(outDir, { recursive: true })
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`Done! ${allData.length} models saved to ${outPath}`)
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1) })
