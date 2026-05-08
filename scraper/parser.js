import * as cheerio from 'cheerio'

const DISPLACEMENT_MAP = {
  1: 50, 2: 100, 3: 110, 4: 125, 5: 150, 6: 160,
  7: 190, 8: 200, 9: 250, 10: 300, 11: 350, 12: 400,
  13: 500, 14: 600, 15: 700, 16: 800, 17: 900, 18: 1000,
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

    let logoModelId = ''
    const imgMatch = String(imgHtml).match(/models\/(\d+)\//)
    if (imgMatch) logoModelId = imgMatch[1]

    return {
      brand: String(brand).trim(),
      series: String(series).trim(),
      type: String(type).trim(),
      displacement,
      consumption: parseFloat(consumption),
      samples: parseInt(samples, 10),
      rank: parseInt(rank, 10),
      logoUrl: logoModelId
        ? `https://cdn.xiaoxiongyouhao.com/models/${logoModelId}/che_biao_180.jpg`
        : '',
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
