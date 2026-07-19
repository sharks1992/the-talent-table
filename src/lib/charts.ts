import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  type Plugin,
} from 'chart.js'
import { GREY, CLOUD } from '@/lib/constants'

/* Register only the chart types/elements this app uses (radar, scatter, bar). */
ChartJS.register(RadialLinearScale, LinearScale, CategoryScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend)

export { ChartJS }

/* ------------------------------------------------------------------
   Custom plugins ported from the original (lines 858–863):
   avg-line for the bar chart, crosshairs for the scatter cloud.
------------------------------------------------------------------- */

export function avgLinePlugin(avg: number): Plugin<'bar'> {
  return {
    id: 'avg',
    afterDraw(c) {
      const { ctx, chartArea: a, scales } = c
      if (!a) return
      const y = scales.y.getPixelForValue(avg)
      ctx.save()
      ctx.strokeStyle = GREY
      ctx.setLineDash([5, 4])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(a.left, y)
      ctx.lineTo(a.right, y)
      ctx.stroke()
      ctx.restore()
    },
  }
}

export function crosshairPlugin(mx: number, my: number): Plugin<'scatter'> {
  return {
    id: 'cross',
    afterDraw(c) {
      const { ctx, chartArea: a, scales } = c
      if (!a) return
      const x = scales.x.getPixelForValue(mx)
      const y = scales.y.getPixelForValue(my)
      ctx.save()
      ctx.strokeStyle = CLOUD
      ctx.setLineDash([5, 4])
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(x, a.top)
      ctx.lineTo(x, a.bottom)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(a.left, y)
      ctx.lineTo(a.right, y)
      ctx.stroke()
      ctx.restore()
    },
  }
}

/** Shared radial-scale styling so every radar in the app looks identical. */
export function radarScaleOpts() {
  return {
    min: 0,
    max: 100,
    ticks: {
      stepSize: 25,
      backdropColor: 'transparent',
      color: '#9A9AA8',
      font: { size: 10 },
    },
    grid: { color: '#E5E5EC' },
    angleLines: { color: '#E5E5EC' },
    pointLabels: { color: '#1F1F28', font: { size: 12, weight: 600 as const } },
  }
}