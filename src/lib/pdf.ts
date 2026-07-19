import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/* ==================================================================
   PDF download — replaces the original's html2pdf bundle with
   html2canvas + jsPDF (same capture semantics: scale 2, white
   background, A4 portrait, 11mm top / 12mm bottom margins, horizontal
   margins from the report's own padding).
   Page-break avoidance: the report is composed of `.pdf-unit` blocks
   (heading glued to its first content row, keep-together leaf items).
   Each unit is captured separately and flowed onto pages; only a unit
   taller than a full page is sliced.
=================================================================== */

const A4_W = 210
const A4_H = 297
const M_TOP = 11
const M_BOTTOM = 12
const REPORT_W_PX = 794
const PX_TO_MM = A4_W / REPORT_W_PX
const USABLE_H = A4_H - M_TOP - M_BOTTOM

function sliceCanvas(src: HTMLCanvasElement, yPx: number, hPx: number): string {
  const c = document.createElement('canvas')
  c.width = src.width
  c.height = Math.max(1, Math.round(hPx))
  const ctx = c.getContext('2d')
  if (!ctx) return ''
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(src, 0, yPx, src.width, hPx, 0, 0, src.width, hPx)
  return c.toDataURL('image/jpeg', 0.95)
}

/* html2canvas workaround: CSS text-transform:uppercase turns 'ß' into 'SS',
   growing the rendered text beyond the DOM node's length, which crashes
   html2canvas's Range-based text splitter (IndexSizeError: offset larger
   than the node's length). Temporarily rewrite ß→ss for the capture —
   identical once uppercased, and correct Swiss spelling in lowercase —
   then restore the original nodes. */
function withoutSharpS(root: HTMLElement): () => void {
  const touched: [Text, string][] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let n = walker.nextNode() as Text | null
  while (n) {
    if (n.nodeValue && n.nodeValue.includes('ß')) {
      touched.push([n, n.nodeValue])
      n.nodeValue = n.nodeValue.replace(/ß/g, 'ss')
    }
    n = walker.nextNode() as Text | null
  }
  return () => {
    touched.forEach(([t, v]) => {
      t.nodeValue = v
    })
  }
}

export async function downloadPdf(reportRoot: HTMLElement, filename: string): Promise<void> {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const units = Array.from(reportRoot.querySelectorAll<HTMLElement>(':scope > .pdf-unit'))
  if (!units.length) throw new Error('nothing-to-export')

  let pageY = M_TOP
  let firstOnPage = true

  const newPage = () => {
    pdf.addPage()
    pageY = M_TOP
    firstOnPage = true
  }

  const restoreSharpS = withoutSharpS(reportRoot)
  try {
    for (const u of units) {
    // Preserve the vertical rhythm the preview shows (margins live outside the border box).
    const marginTopMm = firstOnPage ? 0 : parseFloat(getComputedStyle(u).marginTop || '0') * PX_TO_MM
    const canvas = await html2canvas(u, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
      logging: false,
    })
    const wMm = (canvas.width / 2) * PX_TO_MM
    const hMm = (canvas.height / 2) * PX_TO_MM
    const x = (A4_W - wMm) / 2 // symmetric report padding → same left offset as the preview

    if (hMm + marginTopMm <= USABLE_H) {
      if (pageY + marginTopMm + hMm > A4_H - M_BOTTOM + 0.01) newPage()
      else pageY += marginTopMm
      const img = canvas.toDataURL('image/jpeg', 0.95)
      pdf.addImage(img, 'JPEG', x, pageY, wMm, hMm)
      pageY += hMm
      firstOnPage = false
    } else {
      // Oversized unit: start it on a fresh page and slice across pages.
      newPage()
      const pxPerMm = canvas.height / 2 / hMm
      let consumedMm = 0
      while (consumedMm < hMm) {
        const roomMm = A4_H - M_BOTTOM - pageY
        const takeMm = Math.min(roomMm, hMm - consumedMm)
        const img = sliceCanvas(canvas, consumedMm * 2 * pxPerMm, takeMm * 2 * pxPerMm)
        pdf.addImage(img, 'JPEG', x, pageY, wMm, takeMm)
        consumedMm += takeMm
        pageY += takeMm
        firstOnPage = false
        if (consumedMm < hMm) newPage()
      }
    }
  }
  } finally {
    restoreSharpS()
  }

  pdf.save(filename)
}