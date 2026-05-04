import fetch from 'node-fetch'
import { parsePage } from './parser.js'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE_URL = 'https://www.xiaoxiongyouhao.com/page_rank_chexi_moto/byDisplacementLvl'
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
        return []
      }

      const html = await res.text()
      const rows = parsePage(html, levelId)

      if (rows.length === 0 && attempt < MAX_RETRIES) {
        console.warn(`No data parsed for level ${levelId}, retrying...`)
        await sleep(2000 * attempt)
        continue
      }

      return rows
    } catch (e) {
      console.error(`Error fetching level ${levelId} (attempt ${attempt}):`, e.message)
      if (attempt < MAX_RETRIES) { await sleep(2000 * attempt); continue }
      return []
    }
  }
  return []
}

async function main() {
  console.log('Starting MotoFuel scraper...')
  const allData = []
  const displacements = []
  const failedLevels = []

  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const rows = await fetchPage(i)
    if (rows.length > 0) {
      displacements.push(rows[0].displacement)
      allData.push(...rows)
    } else {
      failedLevels.push(i)
      console.warn(`WARNING: No data for level ${i}`)
    }
    if (i < TOTAL_LEVELS) await sleep(DELAY_MS)
  }

  let globalRank = 1
  for (const item of allData) {
    item.id = globalRank++
  }

  console.log(`\nScraping complete: ${allData.length} models from ${displacements.length} displacement levels`)
  if (failedLevels.length > 0) {
    console.warn(`Failed levels: ${failedLevels.join(', ')}`)
  }

  // Data validation
  if (allData.length < 500) {
    console.error(`ERROR: Only ${allData.length} models scraped (expected 500+). Aborting write.`)
    process.exit(1)
  }

  const output = {
    metadata: {
      source: 'xiaoxiongyouhao.com',
      scrapedAt: new Date().toISOString(),
      totalModels: allData.length,
    },
    displacements: displacements.sort((a, b) => a - b),
    data: allData,
  }

  const outDir = join(__dirname, '..', 'public', 'data')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, 'motorcycles.json')
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`Done! ${allData.length} models saved to ${outPath}`)
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1) })
