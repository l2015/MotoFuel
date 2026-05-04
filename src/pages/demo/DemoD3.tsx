import { useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import * as d3 from 'd3'
import gsap from 'gsap'
import { useData } from '../../hooks/useData'
import { avgByDisplacement, countByType, avgByBrand, calcSummary } from '../../utils/stats'

function useThreeBg(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let w = canvas.width = innerWidth
    let h = canvas.height = innerHeight
    let animId: number

    const dots: { x: number; y: number; vx: number; vy: number; r: number; hue: number }[] = []
    for (let i = 0; i < 150; i++) {
      dots.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 1, hue: 200 + Math.random() * 60
      })
    }

    function draw() {
      animId = requestAnimationFrame(draw)
      ctx.fillStyle = 'rgba(10,10,20,0.08)'
      ctx.fillRect(0, 0, w, h)
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy
        if (d.x < 0 || d.x > w) d.vx *= -1
        if (d.y < 0 || d.y > h) d.vy *= -1
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${d.hue}, 70%, 60%, 0.4)`
        ctx.fill()
      })
      // Lines between close dots
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y
          const dist = dx * dx + dy * dy
          if (dist < 8000) {
            ctx.beginPath()
            ctx.moveTo(dots[i].x, dots[i].y)
            ctx.lineTo(dots[j].x, dots[j].y)
            ctx.strokeStyle = `hsla(230, 60%, 50%, ${0.06 * (1 - dist / 8000)})`
            ctx.stroke()
          }
        }
      }
    }
    draw()

    const onResize = () => { w = canvas.width = innerWidth; h = canvas.height = innerHeight }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize) }
  }, [canvasRef])
}

function D3LineChart({ data, width, height }: { data: { x: string; y: number }[]; width: number; height: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const margin = { top: 20, right: 20, bottom: 40, left: 45 }
  const iw = width - margin.left - margin.right
  const ih = height - margin.top - margin.bottom

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scalePoint<string>().domain(data.map(d => d.x)).range([0, iw]).padding(0.5)
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.y)! * 1.1]).nice().range([ih, 0])

    // Grid
    g.selectAll('.grid')
      .data(y.ticks(5))
      .join('line')
      .attr('x1', 0).attr('x2', iw)
      .attr('y1', d => y(d)!).attr('y2', d => y(d)!)
      .attr('stroke', 'rgba(255,255,255,0.04)')

    // Axes
    g.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).tickSize(0).tickPadding(12) as any)
      .call(g => g.select('.domain').attr('stroke', 'rgba(255,255,255,0.06)'))
      .call(g => g.selectAll('text').attr('fill', '#666').attr('font-size', 11))
    g.append('g').call(d3.axisLeft(y).ticks(5).tickSize(0).tickPadding(12) as any)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').attr('fill', '#666').attr('font-size', 11))

    // Area
    const area = d3.area<{ x: string; y: number }>()
      .x(d => x(d.x)!).y0(ih).y1(d => y(d.y)!).curve(d3.curveMonotoneX)

    const gradient = svg.append('defs').append('linearGradient').attr('id', 'd3-area-grad').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1)
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#f97316').attr('stop-opacity', 0.2)
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#f97316').attr('stop-opacity', 0)

    const areaPath = g.append('path').datum(data).attr('fill', 'url(#d3-area-grad)').attr('d', area)

    // Line
    const line = d3.line<{ x: string; y: number }>().x(d => x(d.x)!).y(d => y(d.y)!).curve(d3.curveMonotoneX)
    const linePath = g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#f97316').attr('stroke-width', 3).attr('d', line)
    const lineLen = (linePath.node() as SVGPathElement).getTotalLength()

    // GSAP animate line drawing
    linePath.attr('stroke-dasharray', lineLen).attr('stroke-dashoffset', lineLen)
    gsap.to(linePath.node(), { strokeDashoffset: 0, duration: 2, ease: 'power2.out', delay: 0.5 })

    // Dots
    const dots = g.selectAll('.dot').data(data).join('circle')
      .attr('cx', d => x(d.x)!).attr('cy', d => y(d.y)!)
      .attr('r', 0).attr('fill', '#0a0a0f').attr('stroke', '#f97316').attr('stroke-width', 2.5)

    gsap.to(dots.nodes(), { r: 5, duration: 0.4, stagger: 0.08, delay: 0.8, ease: 'back.out(2)' })

    // Area fade in
    areaPath.attr('opacity', 0)
    gsap.to(areaPath.node(), { opacity: 1, duration: 1, delay: 1.5 })

  }, [data, width, height, iw, ih])

  return <svg ref={svgRef} width={width} height={height} />
}

function D3BarChart({ data, width, height }: { data: { label: string; value: number }[]; width: number; height: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const margin = { top: 10, right: 60, bottom: 10, left: 80 }
  const iw = width - margin.left - margin.right
  const ih = height - margin.top - margin.bottom

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
    const colors = ['#10b981', '#10b981', '#10b981', '#f97316', '#f97316', '#f97316', '#ef4444', '#ef4444']

    const y = d3.scaleBand<string>().domain(data.map(d => d.label)).range([0, ih]).padding(0.35)
    const x = d3.scaleLinear().domain([0, d3.max(data, d => d.value)!]).range([0, iw])

    // Labels
    g.selectAll('.label').data(data).join('text')
      .attr('x', -10).attr('y', d => y(d.label)! + y.bandwidth() / 2)
      .attr('fill', '#888').attr('font-size', 11).attr('text-anchor', 'end').attr('dominant-baseline', 'central')
      .text(d => d.label)

    // Bars
    const bars = g.selectAll('.bar').data(data).join('rect')
      .attr('x', 0).attr('y', d => y(d.label)!)
      .attr('width', 0).attr('height', y.bandwidth())
      .attr('rx', 5).attr('ry', 5)
      .attr('fill', (_, i) => colors[i]).attr('opacity', 0.8)

    // GSAP animate bars
    gsap.to(bars.nodes(), {
      width: (i: number) => x(data[i].value),
      duration: 1, stagger: 0.08, delay: 0.3, ease: 'power3.out'
    })

    // Values
    const vals = g.selectAll('.val').data(data).join('text')
      .attr('x', d => x(d.value) + 10).attr('y', d => y(d.label)! + y.bandwidth() / 2)
      .attr('fill', (_, i) => colors[i]).attr('font-size', 12).attr('font-weight', 600).attr('dominant-baseline', 'central')
      .attr('font-family', 'Space Grotesk').text(d => d.value.toFixed(2))
      .attr('opacity', 0)

    gsap.to(vals.nodes(), { opacity: 1, duration: 0.3, stagger: 0.08, delay: 1 })

  }, [data, width, height, iw, ih])

  return <svg ref={svgRef} width={width} height={height} />
}

export default function DemoD3() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useThreeBg(canvasRef)

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

  // GSAP scroll-triggered entrance for sections
  const sectionsRef = useRef<HTMLDivElement[]>([])
  useEffect(() => {
    sectionsRef.current.forEach(el => {
      if (!el) return
      gsap.fromTo(el, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      })
    })
  }, [])

  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !sectionsRef.current.includes(el)) sectionsRef.current.push(el)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e0e0f0', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* NAV */}
        <nav ref={addToRefs} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 56, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 48
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 18 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #f97316, #ef4444)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white', fontWeight: 800 }}>D</div>
            D3 Demo
            <span style={{ fontSize: 10, color: '#666', background: 'rgba(249,115,22,0.1)', padding: '2px 8px', borderRadius: 4 }}>d3 + gsap + canvas</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['/demo/nivo', '/demo/visx', '/demo/d3'].map(p => (
              <a key={p} href={p} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                color: p === '/demo/d3' ? '#e0e0f0' : '#666',
                background: p === '/demo/d3' ? 'rgba(249,115,22,0.15)' : 'transparent',
                textDecoration: 'none', transition: 'all 0.2s'
              }}>{p.split('/').pop()?.toUpperCase()}</a>
            ))}
          </div>
        </nav>

        {/* HERO */}
        <section ref={addToRefs} style={{ textAlign: 'center', paddingBottom: 48 }}>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif', fontSize: 48, fontWeight: 700,
            letterSpacing: '-0.03em', marginBottom: 12,
            background: 'linear-gradient(135deg, #fff 0%, #f97316 50%, #ef4444 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>D3.js + GSAP + Canvas</h1>
          <p style={{ color: '#666', fontSize: 15 }}>数据驱动 SVG · GSAP ScrollTrigger 动画 · Canvas 粒子连线</p>
        </section>

        {/* STATS */}
        <div ref={addToRefs} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { value: summary.lowestConsumption?.consumption.toFixed(2) ?? '-', label: '最低油耗 L/100km', color: '#22d3ee' },
            { value: summary.totalBrands.toString(), label: '品牌数量', color: '#10b981' },
            { value: summary.totalModels.toLocaleString(), label: '车型数量', color: '#f97316' },
            { value: summary.totalSamples.toLocaleString(), label: '总样本数', color: '#f59e0b' }
          ].map((s, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(249,115,22,0.1)' }}
              style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '24px 16px', textAlign: 'center', cursor: 'default'
              }}
            >
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 36, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 8, fontWeight: 500 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* TREND CHART */}
        <div ref={addToRefs} style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20, padding: 28, marginBottom: 20
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>
            排量-油耗趋势 · D3 Line + GSAP 动画绘制
          </div>
          <D3LineChart data={trendData} width={1100} height={320} />
        </div>

        {/* TWO COLUMN */}
        <div ref={addToRefs} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20, padding: 28
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>
              类型分布 · D3 ScaleBand
            </div>
            <D3BarChart data={typeData} width={500} height={280} />
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20, padding: 28
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>
              品牌排行 · D3 + GSAP stagger
            </div>
            <D3BarChart data={topBrands} width={500} height={280} />
          </div>
        </div>

        {/* FEATURES */}
        <div ref={addToRefs} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingBottom: 80 }}>
          {[
            { title: '数据驱动', desc: 'D3 直接操作 SVG DOM，bind data → enter/exit，完全控制渲染', icon: '⚡' },
            { title: 'GSAP 动画', desc: '线条绘制动画、柱状条展开、scroll-trigger 入场，物理级缓动', icon: '🎬' },
            { title: 'Canvas 粒子', desc: '轻量 Canvas 2D 粒子连线背景，无 WebGL 依赖，性能极佳', icon: '✨' }
          ].map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -3, background: 'rgba(255,255,255,0.05)' }}
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: 20, cursor: 'default' }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
