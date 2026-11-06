import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * 车型类型在数据源里只有中文字段（踏板/街车/巡航太子…），共 11 个枚举值。
 * 英文界面下如果直接显示中文，会和其余英文文案混排；这里做一层标签映射，
 * 只影响展示，筛选、图表系列、深链参数仍然使用原始中文值。
 */
const TYPE_LABELS: Record<string, { zh: string; en: string }> = {
  踏板: { zh: '踏板', en: 'Scooter' },
  街车: { zh: '街车', en: 'Street' },
  巡航太子: { zh: '巡航太子', en: 'Cruiser' },
  复古: { zh: '复古', en: 'Retro' },
  拉力: { zh: '拉力', en: 'Adventure' },
  跑车: { zh: '跑车', en: 'Sport' },
  弯梁: { zh: '弯梁', en: 'Underbone' },
  MINI: { zh: 'MINI', en: 'Mini' },
  旅行: { zh: '旅行', en: 'Touring' },
  三轮: { zh: '三轮', en: 'Trike' },
  越野: { zh: '越野', en: 'Off-road' },
}

export function typeLabel(type: string, lang: string): string {
  return TYPE_LABELS[type]?.[lang.startsWith('en') ? 'en' : 'zh'] ?? type
}

/** 展示用的标签反查原始值（图表图例点击、饼图扇区点击需要还原成中文值） */
export function typeFromLabel(label: string): string {
  for (const [raw, labels] of Object.entries(TYPE_LABELS)) {
    if (labels.zh === label || labels.en === label) return raw
  }
  return label
}

/** 组件内使用：语言切换后标签自动更新 */
export function useTypeLabel() {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'zh'
  return useCallback((type: string) => typeLabel(type, lang), [lang])
}
