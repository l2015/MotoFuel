import { useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { Group } from '@visx/group'
import { LinePath, BarRounded } from '@visx/shape'
import { scalePoint, scaleLinear } from '@visx/scale'
import { AxisLeft, AxisBottom } from '@visx/axis'
import { curveMonotoneX } from '@visx/curve'
import { useData } from '../../hooks/useData'
import { avgByDisplacement, countByType, avgByBrand, calcSummary } from '../../utils/stats'
import * as THREE from 'three'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
}
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }
}

function Particles() {
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const count = 300
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const positions = useMemo(() => {
    const p: { pos: [number, number, number]; speed: number; offset: number }[] = []
    for (let i = 0; i < count; i++) {
      p.push({
        pos: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20],
        speed: Math.random() * 0.5 + 0.2,
        offset: Math.random() * Math.PI * 2
      })
    }
    return p
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    positions.forEach((p, i) => {
      dummy.position.set(
        p.pos[0] + Math.sin(t * p.speed + p.offset) * 2,
        p.pos[1] + Math.cos(t * p.speed * 0.7 + p.offset) * 1.5,
        p.pos[2] + Math.sin(t * p.speed * 0.5) * 1
      )
      const s = 0.04 + Math.sin(t * 2 + p.offset) * 0.02
      dummy.scale.set(s, s, s)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#7c3aed" transparent opacity={0.6} />
    </instancedMesh>
  )
}

function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 15], fov: 60 }} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <ambientLight intensity={0.5} />
      <Particles />
    </Canvas>
  )
}

function VisxLineChart({ data, width, height }: { data: { x: string; y: number }[]; width: number; height: number }) {
  const margin = { top: 20, right: 20, bottom: 40, left: 45 }
  const xMax = width - margin.left - margin.right
  const yMax = height - margin.top - margin.bottom

  const xScale = scalePoint<string>({ domain: data.map(d => d.x), range: [0, xMax], padding: 0.5 })
  const yScale = scaleLinear<number>({ domain: [0, Math.max(...data.map(d => d.y)) * 1.1], range: [yMax, 0], nice: true })

  return (
    <svg width={width} height={height}>
      <Group left={margin.left} top={margin.top}>
        {/* Grid lines */}
        {yScale.ticks(5).map(tick => (
          <line key={tick} x1={0} x2={xMax} y1={yScale(tick)!} y2={yScale(tick)!} stroke="rgba(255,255,255,0.04)" />
        ))}
        <AxisLeft
          scale={yScale}
          tickStroke="transparent"
          tickLabelProps={{ fill: '#666', fontSize: 11, fontFamily: 'Inter' }}
          numTicks={5}
        />
        <AxisBottom
          scale={xScale}
          top={yMax}
          tickStroke="transparent"
          tickLabelProps={{ fill: '#666', fontSize: 11, fontFamily: 'Inter', textAnchor: 'middle' }}
        />
        <LinePath
          data={data}
          x={d => xScale(d.x)!}
          y={d => yScale(d.y)!}
          curve={curveMonotoneX}
          stroke="#7c3aed"
          strokeWidth={3}
        >
          {({ path }) => {
            const d = path(data) ?? ''
            return (
              <>
                <defs>
                  <linearGradient id="visx-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <path d={d.replace(/L/g, 'L').replace(/M(.*?)L/, `M$1L`) + `L${xMax},${yMax}L0,${yMax}Z`} fill="url(#visx-grad)" />
                <path d={d} fill="none" stroke="#7c3aed" strokeWidth={3} />
              </>
            )
          }}
        </LinePath>
        {/* Dots */}
        {data.map((d, i) => (
          <circle key={i} cx={xScale(d.x)!} cy={yScale(d.y)!} r={5} fill="#0a0a0f" stroke="#7c3aed" strokeWidth={2.5} />
        ))}
      </Group>
    </svg>
  )
}

function VisxBarChart({ data, width, height }: { data: { label: string; value: number }[]; width: number; height: number }) {
  const margin = { top: 10, right: 10, bottom: 10, left: 70 }
  const xMax = width - margin.left - margin.right
  const yMax = height - margin.top - margin.bottom
  const maxVal = Math.max(...data.map(d => d.value))

  const yScale = scalePoint<string>({ domain: data.map(d => d.label), range: [0, yMax], padding: 0.4 })
  const xScale = scaleLinear<number>({ domain: [0, maxVal], range: [0, xMax] })
  const colors = ['#10b981', '#10b981', '#10b981', '#6366f1', '#6366f1', '#6366f1', '#f59e0b', '#f59e0b']

  return (
    <svg width={width} height={height}>
      <Group left={margin.left} top={margin.top}>
        {data.map((d, i) => {
          const barWidth = xScale(d.value)!
          const y = yScale(d.label)!
          const barHeight = yMax / data.length * 0.6
          return (
            <Group key={i}>
              <text x={-8} y={y + barHeight / 2} fill="#888" fontSize={11} textAnchor="end" dominantBaseline="central" fontFamily="Inter">{d.label}</text>
              <BarRounded
                x={0} y={y}
                width={barWidth} height={barHeight}
                radius={6}
                fill={colors[i]}
                fillOpacity={0.2}
              />
              <BarRounded
                x={0} y={y}
                width={barWidth * (d.value / maxVal)} height={barHeight}
                radius={6}
                fill={colors[i]}
                fillOpacity={0.8}
              />
              <text x={barWidth + 8} y={y + barHeight / 2} fill={colors[i]} fontSize={12} fontWeight={600} dominantBaseline="central" fontFamily="Space Grotesk">{d.value.toFixed(2)}</text>
            </Group>
          )
        })}
      </Group>
    </svg>
  )
}

export default function DemoVisx() {
  const { data } = useData()
  const motorcycles = data?.data ?? []

  const summary = useMemo(() => calcSummary(motorcycles), [motorcycles])
  const trendData = useMemo(() => {
    const avg = avgByDisplacement(motorcycles)
    return avg.map(d => ({ x: d.displacement + 'cc', y: Math.round(d.avg * 100) / 100 }))
  }, [motorcycles])
  const typeData = useMemo(() => {
    const counts = countByType(motorcycles)
    return counts.map(d => ({ label: d.type, value: d.count }))
  }, [motorcycles])
  const topBrands = useMemo(() => avgByBrand(motorcycles).slice(0, 8).map(b => ({ label: b.brand, value: b.avg })), [motorcycles])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e0e0f0', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }
      `}</style>

      <Scene />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}
      >
        {/* NAV */}
        <motion.nav variants={item} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 56, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 48
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 18 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white', fontWeight: 800 }}>V</div>
            Visx Demo
            <span style={{ fontSize: 10, color: '#666', background: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: 4 }}>@visx + r3f + framer-motion</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['/demo/nivo', '/demo/visx', '/demo/d3'].map(p => (
              <a key={p} href={p} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                color: p === '/demo/visx' ? '#e0e0f0' : '#666',
                background: p === '/demo/visx' ? 'rgba(124,58,237,0.15)' : 'transparent',
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
            background: 'linear-gradient(135deg, #fff 0%, #7c3aed 50%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Visx + R3F + Framer Motion</h1>
          <p style={{ color: '#666', fontSize: 15 }}>手绘 SVG 图表 · React Three Fiber 粒子场 · 声明式动效</p>
        </motion.section>

        {/* STATS */}
        <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { value: summary.lowestConsumption?.consumption.toFixed(2) ?? '-', label: '最低油耗 L/100km', color: '#06b6d4' },
            { value: summary.totalBrands.toString(), label: '品牌数量', color: '#10b981' },
            { value: summary.totalModels.toLocaleString(), label: '车型数量', color: '#7c3aed' },
            { value: summary.totalSamples.toLocaleString(), label: '总样本数', color: '#f59e0b' }
          ].map((s, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(124,58,237,0.1)' }}
              style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '24px 16px', textAlign: 'center', cursor: 'default',
                backdropFilter: 'blur(8px)'
              }}
            >
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 36, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 8, fontWeight: 500 }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* TREND CHART */}
        <motion.div variants={item} whileHover={{ borderColor: 'rgba(124,58,237,0.2)' }} style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20, padding: 28, marginBottom: 20, backdropFilter: 'blur(8px)'
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>
            排量-油耗趋势 · Visx LinePath (手绘 SVG)
          </div>
          <VisxLineChart data={trendData} width={1100} height={320} />
        </motion.div>

        {/* TWO COLUMN */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          <motion.div variants={item} whileHover={{ borderColor: 'rgba(124,58,237,0.2)' }} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20, padding: 28, backdropFilter: 'blur(8px)'
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>
              类型分布 · Visx BarHorizontal
            </div>
            <VisxBarChart data={typeData} width={500} height={280} />
          </motion.div>

          <motion.div variants={item} whileHover={{ borderColor: 'rgba(124,58,237,0.2)' }} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20, padding: 28, backdropFilter: 'blur(8px)'
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>
              品牌排行 · Visx BarRounded
            </div>
            <VisxBarChart data={topBrands} width={500} height={280} />
          </motion.div>
        </div>

        {/* FEATURES */}
        <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingBottom: 80 }}>
          {[
            { title: '像素级控制', desc: 'Visx 是 SVG 原子组件，每一个元素都可以精确控制样式和动画', icon: '🎯' },
            { title: '3D 粒子场', desc: 'R3F 声明式 Three.js，背景 300 个浮动粒子随鼠标视差', icon: '🌌' },
            { title: '组合式图表', desc: 'Axis + LinePath + BarRounded 自由组合，不受框架限制', icon: '🧩' }
          ].map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -3, background: 'rgba(255,255,255,0.05)' }}
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: 20, cursor: 'default', backdropFilter: 'blur(8px)' }}
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
