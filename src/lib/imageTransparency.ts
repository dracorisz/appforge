export type TransparencyRepairResult = {
  dataUrl: string
  blob: Blob
  width: number
  height: number
  transparentPercent: number
  backgroundColors: Array<[number, number, number]>
  repaired: boolean
}

const MAX_EDGE = 2048

export const readBlobAsDataUrl = (file: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = () => reject(reader.error || new Error('Could not read image.'))
  reader.readAsDataURL(file)
})

export const safeCanvasImageSource = async (source: string): Promise<string> => {
  if (/^(?:data:|blob:)/i.test(source)) return source
  const response = await fetch(source, { mode: 'cors', credentials: 'omit' })
  if (!response.ok) throw new Error(`Could not load the image for local processing (${response.status}).`)
  const blob = await response.blob()
  if (!blob.type.startsWith('image/')) throw new Error('The selected source did not return an image.')
  return readBlobAsDataUrl(blob)
}

const canvasBlob = (canvas: HTMLCanvasElement) => new Promise<Blob>((resolve, reject) => {
  canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not encode transparent PNG.')), 'image/png')
})

const distance = (r: number, g: number, b: number, color: [number, number, number]) => {
  const dr = r - color[0]
  const dg = g - color[1]
  const db = b - color[2]
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

const quantizeKey = (r: number, g: number, b: number) => `${Math.round(r / 24) * 24},${Math.round(g / 24) * 24},${Math.round(b / 24) * 24}`

const edgeColors = (pixels: Uint8ClampedArray, width: number, height: number) => {
  const counts = new Map<string, number>()
  const add = (x: number, y: number) => {
    const index = (y * width + x) * 4
    if (pixels[index + 3] < 245) return
    const key = quantizeKey(pixels[index], pixels[index + 1], pixels[index + 2])
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  const stepX = Math.max(1, Math.floor(width / 80))
  const stepY = Math.max(1, Math.floor(height / 80))
  const bandX = Math.max(2, Math.floor(width * 0.035))
  const bandY = Math.max(2, Math.floor(height * 0.035))
  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < bandX; x += Math.max(1, Math.floor(bandX / 3))) add(x, y)
    for (let x = width - 1; x >= Math.max(0, width - bandX); x -= Math.max(1, Math.floor(bandX / 3))) add(x, y)
  }
  for (let x = 0; x < width; x += stepX) {
    for (let y = 0; y < bandY; y += Math.max(1, Math.floor(bandY / 3))) add(x, y)
    for (let y = height - 1; y >= Math.max(0, height - bandY); y -= Math.max(1, Math.floor(bandY / 3))) add(x, y)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([key]) => key.split(',').map(Number) as [number, number, number])
}

const edgeTransparencyPercent = (pixels: Uint8ClampedArray, width: number, height: number) => {
  let samples = 0
  let transparent = 0
  const add = (x: number, y: number) => {
    samples += 1
    if (pixels[(y * width + x) * 4 + 3] < 245) transparent += 1
  }
  const stepX = Math.max(1, Math.floor(width / 100))
  const stepY = Math.max(1, Math.floor(height / 100))
  for (let x = 0; x < width; x += stepX) { add(x, 0); add(x, height - 1) }
  for (let y = 0; y < height; y += stepY) { add(0, y); add(width - 1, y) }
  return samples ? (transparent / samples) * 100 : 0
}

export async function repairImageTransparency(source: string, tolerance = 38, onlyWhenOpaque = false): Promise<TransparencyRepairResult> {
  const safeSource = await safeCanvasImageSource(source)
  const image = new Image()
  image.src = safeSource
  await image.decode()
  if (!image.naturalWidth || !image.naturalHeight) throw new Error('Image dimensions could not be read.')
  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas pixel processing is unavailable in this browser.')
  context.clearRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)
  const frame = context.getImageData(0, 0, width, height)
  const pixels = frame.data
  let transparent = 0
  for (let index = 3; index < pixels.length; index += 4) if (pixels[index] < 245) transparent += 1
  const initialPercent = (transparent / (width * height)) * 100
  const transparentEdges = edgeTransparencyPercent(pixels, width, height)
  if (onlyWhenOpaque && transparentEdges >= 35) {
    const blob = await canvasBlob(canvas)
    return { dataUrl: await readBlobAsDataUrl(blob), blob, width, height, transparentPercent: initialPercent, backgroundColors: [], repaired: false }
  }

  const colors = edgeColors(pixels, width, height)
  if (!colors.length) throw new Error('Could not estimate the image background from its edges.')
  const feather = Math.max(8, tolerance * 0.65)
  const visited = new Uint8Array(width * height)
  const queue = new Int32Array(width * height)
  let head = 0
  let tail = 0

  const nearestDistance = (pixel: number) => {
    const index = pixel * 4
    let nearest = Number.POSITIVE_INFINITY
    for (const color of colors) nearest = Math.min(nearest, distance(pixels[index], pixels[index + 1], pixels[index + 2], color))
    return nearest
  }
  const enqueueIfBackground = (pixel: number) => {
    if (visited[pixel]) return
    const alpha = pixels[pixel * 4 + 3]
    if (alpha < 245 || nearestDistance(pixel) <= tolerance + feather) {
      visited[pixel] = 1
      queue[tail++] = pixel
    }
  }

  for (let x = 0; x < width; x += 1) { enqueueIfBackground(x); enqueueIfBackground((height - 1) * width + x) }
  for (let y = 1; y < height - 1; y += 1) { enqueueIfBackground(y * width); enqueueIfBackground(y * width + width - 1) }

  while (head < tail) {
    const pixel = queue[head++]
    const x = pixel % width
    const y = Math.floor(pixel / width)
    if (x > 0) enqueueIfBackground(pixel - 1)
    if (x + 1 < width) enqueueIfBackground(pixel + 1)
    if (y > 0) enqueueIfBackground(pixel - width)
    if (y + 1 < height) enqueueIfBackground(pixel + width)
  }

  transparent = 0
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const index = pixel * 4
    if (visited[pixel]) {
      const nearest = nearestDistance(pixel)
      if (pixels[index + 3] < 245 || nearest <= tolerance) pixels[index + 3] = 0
      else if (nearest < tolerance + feather) pixels[index + 3] = Math.min(pixels[index + 3], Math.round(255 * ((nearest - tolerance) / feather)))
    }
    if (pixels[index + 3] < 245) transparent += 1
  }

  context.putImageData(frame, 0, 0)
  const blob = await canvasBlob(canvas)
  return { dataUrl: await readBlobAsDataUrl(blob), blob, width, height, transparentPercent: (transparent / (width * height)) * 100, backgroundColors: colors, repaired: true }
}
