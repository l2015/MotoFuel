import * as cheerio from 'cheerio'

const DISPLACEMENT_MAP = {
  1: 50, 2: 100, 3: 110, 4: 125, 5: 150, 6: 160,
  7: 190, 8: 200, 9: 250, 10: 300, 11: 350, 12: 400,
  13: 500, 14: 600, 15: 700, 16: 800, 17: 900, 18: 1000,
}

export function parsePage(html, levelId) {
  const $ = cheerio.load(html)
  const displacement = DISPLACEMENT_MAP[levelId]
  if (!displacement) return []

  // Strategy 1: Find script containing "data" array
  const scriptText = $('script').toArray()
    .map(el => $(el).html())
    .find(s => s && s.includes('"data":'))

  if (!scriptText) return []

  // Strategy 2: Try regex extraction
  let rows = tryExtractArray(scriptText)

  // Strategy 3: If regex fails, try extracting the full JSON object
  if (!rows) {
    rows = tryExtractFullJSON(scriptText)
  }

  if (!rows || !Array.isArray(rows)) return []

  return rows.map(row => {
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
  }).filter(row =>
    row.brand && !isNaN(row.consumption) && !isNaN(row.samples) && row.consumption > 0
  )
}

function tryExtractArray(scriptText) {
  const match = scriptText.match(/"data"\s*:\s*(\[[\s\S]*?\])\s*[,}]/)
  if (!match) return null
  try {
    return JSON.parse(match[1])
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
