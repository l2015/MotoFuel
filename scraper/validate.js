import { readFileSync } from 'fs'

/**
 * 读取上一版数据快照（仓库里已提交的 public/data/motorcycles.json）。
 * 首次运行或文件损坏时返回 null，调用方应跳过回归校验。
 */
export function loadPreviousDataset(path) {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8'))
    if (!Array.isArray(parsed?.data) || parsed.data.length === 0) return null
    return parsed
  } catch {
    return null
  }
}

function keyOf(row) {
  return `${row.brand}|${row.series}|${row.displacement}`
}

function countByDisplacement(rows) {
  const map = new Map()
  for (const row of rows) {
    map.set(row.displacement, (map.get(row.displacement) || 0) + 1)
  }
  return map
}

/**
 * 与上一版数据对比，返回异常清单。
 *
 * 背景：爬虫在 18 个排量档里最多容忍 30% 失败，且只要总数 >500 就会写入。
 * 一旦源站改版导致某一档整体解析失败，会把"少一个排量段"的残缺数据当成正常
 * 更新提交上线，且没有任何告警。这里用"与上一版对比"替代拍脑袋的常数阈值。
 *
 * 判定为异常（任一命中即中止写入）：
 *   - 上一版存在、本版完全消失的排量档
 *   - 总量下降超过 10%
 *   - 单个排量档车型数下降超过 30%（且上一版该档 >= 10 款）
 */
export function validateAgainstPrevious(previous, next, displacements) {
  const stats = { added: 0, removed: 0, changed: 0 }

  if (!previous) {
    return { problems: [], stats, skipped: true }
  }

  const prevRows = previous.data
  const nextRows = next.data

  const prevIndex = new Map(prevRows.map(row => [keyOf(row), row]))
  const nextIndex = new Map(nextRows.map(row => [keyOf(row), row]))
  for (const [key, row] of nextIndex) {
    const prev = prevIndex.get(key)
    if (!prev) stats.added++
    else if (prev.consumption !== row.consumption || prev.samples !== row.samples) stats.changed++
  }
  for (const key of prevIndex.keys()) {
    if (!nextIndex.has(key)) stats.removed++
  }

  const problems = []

  const prevDisps = new Set(previous.displacements || prevRows.map(row => row.displacement))
  const nextDisps = new Set(displacements || nextRows.map(row => row.displacement))
  const lostDisps = [...prevDisps].filter(d => !nextDisps.has(d))
  if (lostDisps.length > 0) {
    problems.push(`丢失排量档: ${lostDisps.join(', ')}`)
  }

  const dropRate = 1 - nextRows.length / prevRows.length
  if (dropRate > 0.1) {
    problems.push(
      `总量下降 ${(dropRate * 100).toFixed(1)}%（${prevRows.length} → ${nextRows.length}）`
    )
  }

  const prevByDisp = countByDisplacement(prevRows)
  const nextByDisp = countByDisplacement(nextRows)
  for (const [displacement, prevCount] of prevByDisp) {
    const nextCount = nextByDisp.get(displacement) || 0
    if (prevCount >= 10 && nextCount < prevCount * 0.7) {
      problems.push(
        `${displacement}cc 车型数异常减少: ${prevCount} → ${nextCount}（-${Math.round((1 - nextCount / prevCount) * 100)}%）`
      )
    }
  }

  return { problems, stats, skipped: false }
}
