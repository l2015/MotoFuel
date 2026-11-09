import { describe, it, expect } from 'vitest'
import { parsePage, toPlainText } from './parser.js'

describe('toPlainText', () => {
  it('剥离昵称标签，保留可见文字', () => {
    expect(
      toPlainText('Cross Cub<span class="moto-chexi-nickname">（幼兽）</span>')
    ).toBe('Cross Cub（幼兽）')
  })

  it('标签前的分隔空格不残留', () => {
    expect(
      toPlainText('C 125 Super Cub <span class="moto-chexi-nickname">（超级幼兽）</span>')
    ).toBe('C 125 Super Cub（超级幼兽）')
  })

  it('还原 HTML 实体', () => {
    expect(toPlainText('A &amp; B 125')).toBe('A & B 125')
  })

  it('纯文本原样返回并 trim', () => {
    expect(toPlainText('  豪爵 DR160  ')).toBe('豪爵 DR160')
  })

  it('空值/undefined 得到空串', () => {
    expect(toPlainText(undefined)).toBe('')
    expect(toPlainText(null)).toBe('')
  })

  it('返回值不再包含任何标签', () => {
    const out = toPlainText('X<span class="moto-chexi-nickname">（别名）</span>')
    expect(out).not.toMatch(/[<>]/)
  })
})

describe('parsePage', () => {
  /** 构造一个和源站结构一致的最小页面：script 里放 "data": [...] */
  function pageWith(rows) {
    const data = JSON.stringify(rows)
    return `<html><body><script>window.__DATA__ = {"data": ${data}};</script></body></html>`
  }

  const row = (overrides = {}) => [
    1,                                   // rank
    '<img src="logo.png">',              // imgHtml（不输出）
    '新大洲本田',                         // brand
    'Cross Cub<span class="moto-chexi-nickname">（幼兽）</span>', // series
    '其它',                              // type
    1.74,                                // consumption
    '1270',                              // samples
    ...(overrides.extra ?? []),
  ]

  it('车型名里的 HTML 标签被清理', () => {
    const { rows } = parsePage(pageWith([row()]), 3)
    expect(rows).toHaveLength(1)
    expect(rows[0].series).toBe('Cross Cub（幼兽）')
    expect(rows[0].series).not.toMatch(/[<>]/)
  })

  it('清理后其余字段不受影响', () => {
    const { rows } = parsePage(pageWith([row()]), 3)
    expect(rows[0].brand).toBe('新大洲本田')
    expect(rows[0].type).toBe('其它')
    expect(rows[0].displacement).toBe(110)
    expect(rows[0].consumption).toBe(1.74)
    expect(rows[0].samples).toBe(1270)
  })
})
