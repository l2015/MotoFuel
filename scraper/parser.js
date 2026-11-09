import * as cheerio from 'cheerio'

const DISPLACEMENT_MAP = {
  1: 50, 2: 100, 3: 110, 4: 125, 5: 150, 6: 160,
  7: 190, 8: 200, 9: 250, 10: 300, 11: 350, 12: 400,
  13: 500, 14: 600, 15: 700, 16: 800, 17: 900, 18: 1000,
}

/**
 * 把源站字段转成纯文本。
 *
 * 源站的车型名里带昵称标记，例如
 *   `Cross Cub<span class="moto-chexi-nickname">（幼兽）</span>`
 * 直接 trim 会把整段标签存进数据，前端按纯文本渲染就会显示成字面量
 * `<span class="moto-chexi-nickname">（幼兽）</span>`。
 * 这里用 cheerio 去掉标签、还原 `&amp;` 之类的实体，只保留可见文字。
 */
export function toPlainText(value) {
  const raw = String(value ?? '')
  if (!/[<&]/.test(raw)) return raw.trim()
  return cheerio.load(raw, undefined, false)
    .root()
    .text()
    .replace(/\s+/g, ' ')
    // 标签被移除后会在「」（昵称）前留下一个分隔空格，属于剥离副产物，一并去掉
    .replace(/\s+（/g, '（')
    .trim()
}

export function parsePage(html, levelId) {
  const $ = cheerio.load(html)
  const displacement = DISPLACEMENT_MAP[levelId]
  if (!displacement) return { rows: [], rejected: 0 }

  // Strategy 1: Find script containing "data" array
  const scriptText = $('script').toArray()
    .map(el => $(el).html())
    .find(s => s && s.includes('"data":'))

  if (!scriptText) return { rows: [], rejected: 0 }

  // Strategy 2: Try regex extraction
  let rawRows = tryExtractArray(scriptText)

  // Strategy 3: If regex fails, try extracting the full JSON object
  if (!rawRows) {
    rawRows = tryExtractFullJSON(scriptText)
  }

  if (!rawRows || !Array.isArray(rawRows)) return { rows: [], rejected: 0 }

  const mapped = rawRows.map(row => {
    const [rank, imgHtml, brand, series, type, consumption, samples] = row

    // 图片列只用于取 logo，前端从未渲染，已不再输出
    void imgHtml

    return {
      brand: toPlainText(brand),
      series: toPlainText(series),
      type: toPlainText(type),
      displacement,
      consumption: parseFloat(consumption),
      samples: parseInt(samples, 10),
      rank: parseInt(rank, 10),
    }
  })

  const rows = mapped.filter(row => {
    if (!row.brand || !row.series || !row.type) return false
    if (isNaN(row.consumption) || row.consumption < 1 || row.consumption > 20) return false
    if (isNaN(row.samples) || row.samples <= 0) return false
    return true
  })

  return { rows, rejected: mapped.length - rows.length }
}

function tryExtractArray(scriptText) {
  const marker = '"data":'
  const idx = scriptText.indexOf(marker)
  if (idx === -1) return null

  const afterData = scriptText.substring(idx + marker.length).trim()
  if (!afterData.startsWith('[')) return null

  // Bracket-matching to find the full array (handles nested arrays)
  let depth = 0
  let inStr = false
  let esc = false
  let endPos = -1

  for (let i = 0; i < afterData.length; i++) {
    const c = afterData[i]
    if (esc) { esc = false; continue }
    if (c === String.fromCharCode(92)) { esc = true; continue }
    if (c === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (c === '[') { depth++; continue }
    if (c === ']') {
      depth--
      if (depth === 0) { endPos = i; break }
    }
  }

  if (endPos <= 0) return null

  try {
    return JSON.parse(afterData.substring(0, endPos + 1))
  } catch {
    return null
  }
}

function tryExtractFullJSON(scriptText) {
  // Try to find a complete JSON object containing "data"
  const match = scriptText.match(/\{[^{}]*"data"\s*:\s*(\[[\s\S]*?\])[^{}]*\}/)
  if (!match) return null
  try {
    // Try to parse just the array part
    return JSON.parse(match[1])
  } catch {
    return null
  }
}
