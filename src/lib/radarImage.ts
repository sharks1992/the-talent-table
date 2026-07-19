import { ChartJS } from '@/lib/charts'
import { CMP_PAL, FRAME, GOLD, GREY, ROLE_FAMILY } from '@/lib/constants'
import { pctRank } from '@/lib/math'
import { I18N, type PdfLang } from '@/i18n'
import type { Player } from '@/types'

/* ==================================================================
   Off-screen radar PNG for the PDF report (ported from lines 1445–1470).
   Rendered at 760×620 with devicePixelRatio 2, then converted to a
   base64 PNG. Every line is ranked within the SUBJECT's family pool at
   the chosen benchmark so axes are directly comparable.
=================================================================== */

/** Wrap a long label onto two lines for radar point labels (handles spaceless German compounds). */
function wrap(s: string): string | string[] {
  if (s.length <= 13) return s
  const parts = s.split(' ')
  if (parts.length === 2) return parts // two words → one per line
  if (parts.length === 1 && s.includes('-')) {
    const h = s.lastIndexOf('-')
    return [s.slice(0, h + 1), s.slice(h + 1)]
  }
  const sp = s.lastIndexOf(' ', Math.ceil(s.length / 2))
  if (sp > 2) return [s.slice(0, sp), s.slice(sp + 1)]
  const mid = Math.ceil(s.length / 2)
  return [s.slice(0, mid), s.slice(mid)]
}

export function renderRadarPng(
  subject: Player,
  cmpPlayers: Player[],
  bench: string,
  pool: Player[],
  lang: PdfLang,
): string {
  const fam = ROLE_FAMILY[subject.pos] || 'MID'
  const groups = FRAME[fam]
  const L = I18N[lang] || I18N.en
  const tg = (g: string) => L.groups[g] || g

  const gv = (x: Player, g: string): number | null => {
    const sc = x && x.sc && (x.sc[bench] || x.sc.all)
    return sc && sc.g ? sc.g[g] ?? null : null
  }
  const famVals: Record<string, number[]> = {}
  groups.forEach((g) => {
    famVals[g] = pool
      .filter((x) => ROLE_FAMILY[x.pos] === fam)
      .map((x) => gv(x, g))
      .filter((v): v is number => v != null)
  })
  // BUG FIX vs the original: a missing rating is a gap (null), not a 0th-percentile spoke.
  const pctFam = (x: Player, g: string): number | null => {
    const v = gv(x, g)
    return v == null ? null : pctRank(v, famVals[g])
  }

  const host = document.createElement('div')
  host.style.cssText = 'position:absolute;left:-9999px;top:0;width:760px;height:620px'
  document.body.appendChild(host)
  const cv = document.createElement('canvas')
  cv.width = 760
  cv.height = 620
  host.appendChild(cv)

  const datasets: {
    label: string
    data: (number | null)[]
    borderColor: string
    backgroundColor: string
    borderWidth: number
    pointRadius: number
    pointBackgroundColor?: string
    borderDash?: number[]
  }[] = [
    {
      label: subject.name,
      data: groups.map((g) => pctFam(subject, g)),
      borderColor: '#16A34A',
      backgroundColor: 'rgba(22,163,74,.16)',
      borderWidth: 2.5,
      pointRadius: 3,
      pointBackgroundColor: '#16A34A',
    },
  ]
  cmpPlayers.slice(0, 6).forEach((cp, i) => {
    const col = CMP_PAL[i % CMP_PAL.length]
    datasets.push({
      label: cp.name,
      data: groups.map((g) => pctFam(cp, g)),
      borderColor: col,
      backgroundColor: col + '22',
      borderWidth: 2,
      pointRadius: 2.5,
      pointBackgroundColor: col,
    })
  })
  datasets.push({
    label: L.elite,
    data: groups.map(() => 99),
    borderColor: GOLD,
    borderDash: [2, 3],
    borderWidth: 1.4,
    pointRadius: 0,
    backgroundColor: 'transparent',
  })
  if (!cmpPlayers.length) {
    datasets.push({
      label: L.average,
      data: groups.map(() => 50),
      borderColor: GREY,
      borderDash: [5, 4],
      borderWidth: 1.5,
      pointRadius: 0,
      backgroundColor: 'transparent',
    })
  }

  const ctx = cv.getContext('2d')
  if (!ctx) {
    host.remove()
    return ''
  }
  const ch = new ChartJS(ctx, {
    type: 'radar',
    data: { labels: groups.map((g) => wrap(tg(g))) as string[], datasets },
    options: {
      responsive: false,
      animation: false,
      devicePixelRatio: 2,
      layout: { padding: 8 },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false, stepSize: 25 },
          grid: { color: '#E5E5EC' },
          angleLines: { color: '#E5E5EC' },
          pointLabels: { color: '#1F1F28', font: { size: 13, weight: 600 } },
        },
      },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 9, font: { size: 13 } } },
      },
    },
  })
  const url = ch.toBase64Image('image/png', 1)
  ch.destroy()
  host.remove()
  return url
}