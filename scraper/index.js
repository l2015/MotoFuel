import fetch from 'node-fetch'
import { parsePage } from './parser.js'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE_URL = 'https://www.xiaoxiongyouhao.com/page_rank_chexi_moto/byDisplacementLvl'
const TOTAL_LEVELS = 18
const DELAY_MS = 1000

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchPage(levelId) {
  const url = `${BASE_URL}/${levelId}.html`
  console.log(`Fetching level ${levelId}: ${url}`)

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
  })

  if (!res.ok) {
    console.error(`Failed to fetch level ${levelId}: ${res.status}`)
    return []
  }

  const html = await res.text()
  return parsePage(html, levelId)
}

async function main() {
  console.log('Starting MotoFuel scraper...')
  const allData = []
  const displacements = []

  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const rows = await fetchPage(i)
    if (rows.length > 0) {
      displacements.push(rows[0].displacement)
      allData.push(...rows)
    }
    if (i < TOTAL_LEVELS) await sleep(DELAY_MS)
  }

  let globalRank = 1
  for (const item of allData) {
    item.id = globalRank++
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

main().catch(console.error)
