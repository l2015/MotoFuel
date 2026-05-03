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

  const scriptText = $('script').toArray()
    .map(el => $(el).html())
    .find(s => s && s.includes('"data":'))

  if (!scriptText) return []

  const dataMatch = scriptText.match(/"data"\s*:\s*(\[[\s\S]*?\])\s*\}/)
  if (!dataMatch) return []

  let rows
  try {
    rows = JSON.parse(dataMatch[1])
  } catch {
    return []
  }

  return rows.map(row => {
    const [rank, imgHtml, brand, series, type, consumption, samples] = row

    let logoModelId = ''
    const imgMatch = imgHtml.match(/models\/(\d+)\//)
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
}
