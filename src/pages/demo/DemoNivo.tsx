import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveLine } from '@nivo/line'
import { ResponsivePie } from '@nivo/pie'
import { useData } from '../../hooks/useData'
import { avgByDisplacement, countByType, avgByBrand, calcSummary } from '../../utils/stats'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
}
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }
}

export default function DemoNivo() {
  const { data } = useData()
  const motorcycles = data?.data ?? []

  const summary = useMemo(() => calcSummary(motorcycles), [motorcycles])
  const trendData = useMemo(() => {
    const avg = avgByDisplacement(motorcycles)
    return [{
      id: 'avg-consumption',
      data: avg.map(d => ({ x: d.displacement + 'cc', y: Math.round(d.avg * 100) / 100 }))
    }]
  }, [motorcycles])
  const pieData = useMemo(() => {
    const counts = countByType(motorcycles)
    return counts.map(d => ({ id: d.type, label: d.type, value: d.count }))
  }, [motorcycles])
  const topBrands = useMemo(() => avgByBrand(motorcycles).slice(0, 8), [motorcycles])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e0e0f0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }
      `}</style>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}
      >
        {/* NAV */}
        <motion.nav variants={item} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 56, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 48
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 18 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #6366f1, #ec4899)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white', fontWeight: 800 }}>N</div>
            Nivo Demo
            <span style={{ fontSize: 10, color: '#666', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 4 }}>@nivo + framer-motion</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['/demo/nivo', '/demo/visx', '/demo/d3'].map(p => (
              <a key={p} href={p} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                color: p === '/demo/nivo' ? '#e0e0f0' : '#666',
                background: p === '/demo/nivo' ? 'rgba(99,102,241,0.15)' : 'transparent',
                textDecoration: 'none', transition: 'all 0.2s'
              }}>{p.split('/').pop()?.toUpperCase()}</a>
            ))}
          </div>
        </motion.nav>

        {/* HERO */}
        <motion.section variants={item} style={{ textAlign: 'center', paddingBottom: 48 }}>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif', fontSize: 48, fontWeight: 700,
            letterSpacing: '-0.03em', marginBottom: 12,
            background: 'linear-gradient(135deg, #fff 0%, #6366f1 50%, #ec4899 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Nivo + Framer Motion</h1>
          <p style={{ color: '#666', fontSize: 15 }}>React 原生图表 + 声明式动效 · 内置主题 · 自动响应式</p>
        </motion.section>

        {/* STATS */}
        <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { value: summary.lowestConsumption?.consumption.toFixed(2) ?? '-', label: '最低油耗 L/100km', color: '#22d3ee' },
            { value: summary.totalBrands.toString(), label: '品牌数量', color: '#10b981' },
            { value: summary.totalModels.toLocaleString(), label: '车型数量', color: '#6366f1' },
            { value: summary.totalSamples.toLocaleString(), label: '总样本数', color: '#f59e0b' }
          ].map((s, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(99,102,241,0.1)' }}
              style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '24px 16px', textAlign: 'center', cursor: 'default'
              }}
            >
              <div style={{
                fontFamily: 'Space Grotesk, sans-serif', fontSize: 36, fontWeight: 700, color: s.color, lineHeight: 1
              }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 8, fontWeight: 500 }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* TREND CHART */}
        <motion.div variants={item} whileHover={{ borderColor: 'rgba(99,102,241,0.2)' }} style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20, padding: 28, marginBottom: 20
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>
            排量-油耗趋势 · Nivo ResponsiveLine
          </div>
          <div style={{ height: 320 }}>
            <ResponsiveLine
              data={trendData}
              margin={{ top: 20, right: 30, bottom: 50, left: 50 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 0, max: 'auto' }}
              curve="monotoneX"
              lineWidth={3}
              colors={['#6366f1']}
              pointSize={10}
              pointColor="#0a0a0f"
              pointBorderWidth={3}
              pointBorderColor="#6366f1"
              enableArea
              areaOpacity={0.15}
              areaBaselineValue={0}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 0, tickPadding: 12,
                legend: '排量', legendOffset: 40, legendPosition: 'middle'
              }}
              axisLeft={{
                tickSize: 0, tickPadding: 12,
                legend: 'L/100km', legendOffset: -40, legendPosition: 'middle'
              }}
              gridYValues={5}
              theme={{
                background: 'transparent',
                text: { fill: '#666', fontSize: 11, fontFamily: 'Inter' },
                axis: { domain: { line: { stroke: 'rgba(255,255,255,0.06)' } } },
                grid: { line: { stroke: 'rgba(255,255,255,0.04)' } },
                tooltip: {
                  container: {
                    background: 'rgba(15,15,30,0.95)', border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', fontSize: 12, color: '#e0e0f0',
                    backdropFilter: 'blur(12px)'
                  }
                }
              }}
              animate
              motionConfig="gentle"
              useMesh
            />
          </div>
        </motion.div>

        {/* TWO COLUMN */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          {/* PIE */}
          <motion.div variants={item} whileHover={{ borderColor: 'rgba(99,102,241,0.2)' }} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20, padding: 28
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              类型分布 · Nivo ResponsivePie
            </div>
            <div style={{ height: 300 }}>
              <ResponsivePie
                data={pieData}
                margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
                innerRadius={0.55}
                padAngle={2}
                cornerRadius={6}
                activeOuterRadiusOffset={8}
                colors={['#6366f1', '#22d3ee', '#ec4899', '#10b981', '#f59e0b', '#ef4444']}
                borderWidth={3}
                borderColor={{ from: 'color', modifiers: [['darker', 0.6]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#666"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
                theme={{
                  text: { fill: '#666', fontSize: 11, fontFamily: 'Inter' },
                  tooltip: {
                    container: {
                      background: 'rgba(15,15,30,0.95)', border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', fontSize: 12, color: '#e0e0f0'
                    }
                  }
                }}
                animate
                motionConfig="gentle"
              />
            </div>
          </motion.div>

          {/* TABLE */}
          <motion.div variants={item} whileHover={{ borderColor: 'rgba(99,102,241,0.2)' }} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20, padding: 28
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>
              品牌排行 · Framer Motion stagger
            </div>
            <motion.table variants={container} initial="hidden" animate="show" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['#', '品牌', '平均油耗', '车型数'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '8px 12px', fontSize: 10, fontWeight: 600,
                      color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em',
                      borderBottom: '1px solid rgba(255,255,255,0.06)'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topBrands.map((b, i) => (
                  <motion.tr
                    key={b.brand}
                    variants={item}
                    whileHover={{ background: 'rgba(99,102,241,0.04)', x: 4 }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'default' }}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.05, type: 'spring', stiffness: 300 }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 24, height: 24, borderRadius: 8, fontSize: 11, fontWeight: 700,
                          background: i < 3 ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.08)',
                          color: i < 3 ? '#f59e0b' : '#666'
                        }}
                      >{i + 1}</motion.span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{b.brand}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: b.avg < 2.5 ? 'rgba(16,185,129,0.1)' : b.avg < 3 ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)',
                        color: b.avg < 2.5 ? '#10b981' : b.avg < 3 ? '#6366f1' : '#f59e0b'
                      }}>{b.avg.toFixed(2)}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#666' }}>{b.count}</td>
                  </motion.tr>
                ))}
              </tbody>
            </motion.table>
          </motion.div>
        </div>

        {/* FEATURE HIGHLIGHTS */}
        <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingBottom: 80 }}>
          {[
            { title: '内置动画', desc: 'Nivo 图表自带平滑过渡动画，数据变化时自动 morph', icon: '✨' },
            { title: '声明式动效', desc: 'Framer Motion 用 variants 定义入场/stagger/hover，零 CSS keyframes', icon: '🎭' },
            { title: '响应式图表', desc: 'ResponsiveLine/ResponsivePie 自动适配容器尺寸，无需手动 resize', icon: '📱' }
          ].map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -3, background: 'rgba(255,255,255,0.05)' }}
              style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 14, padding: 20, cursor: 'default'
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{f.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
