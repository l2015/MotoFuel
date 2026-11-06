import { describe, it, expect } from 'vitest'
import { validateAgainstPrevious } from './validate.js'

function makeRow(overrides = {}) {
  return {
    brand: '豪爵',
    series: 'DR160',
    type: '街车',
    displacement: 160,
    consumption: 2.5,
    samples: 100,
    rank: 1,
    ...overrides,
  }
}

function dataset(rows, displacements) {
  return {
    metadata: { source: 'test', scrapedAt: '2026-01-01T00:00:00.000Z', totalModels: rows.length },
    displacements: displacements ?? [...new Set(rows.map(r => r.displacement))],
    data: rows,
  }
}

/** 构造 n 条互不相同的车型 */
function many(n, displacement = 160, prefix = 'M') {
  return Array.from({ length: n }, (_, i) =>
    makeRow({ brand: '品牌A', series: `${prefix}${i}`, displacement })
  )
}

describe('validateAgainstPrevious', () => {
  it('首次运行（没有上一版）时跳过校验', () => {
    const next = dataset(many(600))
    const result = validateAgainstPrevious(null, next, next.displacements)
    expect(result.skipped).toBe(true)
    expect(result.problems).toEqual([])
  })

  it('正常小幅增长不报错，并给出变更统计', () => {
    const prev = dataset(many(600))
    const next = dataset([...many(600), ...many(3, 160, 'NEW')])
    const result = validateAgainstPrevious(prev, next, next.displacements)
    expect(result.problems).toEqual([])
    expect(result.stats.added).toBe(3)
  })

  it('整档丢失要拦截', () => {
    const prev = dataset([...many(300, 125), ...many(300, 250)])
    const next = dataset(many(300, 125), [125])
    const result = validateAgainstPrevious(prev, next, [125])
    expect(result.problems.some(p => p.includes('丢失排量档') && p.includes('250'))).toBe(true)
  })

  it('总量下降超过 10% 要拦截', () => {
    const prev = dataset(many(600, 125))
    const next = dataset(many(500, 125))
    const result = validateAgainstPrevious(prev, next, [125])
    expect(result.problems.some(p => p.includes('总量下降'))).toBe(true)
  })

  it('单个排量档车型数下降超过 30% 要拦截', () => {
    const prev = dataset([...many(100, 125), ...many(400, 250)])
    const next = dataset([...many(100, 125), ...many(200, 250)])
    const result = validateAgainstPrevious(prev, next, [125, 250])
    expect(result.problems.some(p => p.includes('250cc 车型数异常减少'))).toBe(true)
  })

  it('完全一致时没有异常且统计为 0', () => {
    const prev = dataset(many(600))
    const next = dataset(many(600))
    const result = validateAgainstPrevious(prev, next, prev.displacements)
    expect(result.problems).toEqual([])
    expect(result.stats).toEqual({ added: 0, removed: 0, changed: 0 })
  })
})
