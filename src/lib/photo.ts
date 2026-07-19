/* Photo pipeline — ported from the original (lines 1182–1192):
   FileReader → Image → downscale so the long edge is ≤512 px → JPEG 0.85 data URL. */
export function fileToPhotoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onerror = () => reject(new Error('read-failed'))
    r.onload = () => {
      const img = new Image()
      img.onload = () => {
        const max = 512
        const s = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.round(img.width * s)
        const h = Math.round(img.height * s)
        const cv = document.createElement('canvas')
        cv.width = w
        cv.height = h
        const ctx = cv.getContext('2d')
        if (!ctx) {
          reject(new Error('canvas-failed'))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(cv.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = () => reject(new Error('image-failed'))
      img.src = r.result as string
    }
    r.readAsDataURL(file)
  })
}