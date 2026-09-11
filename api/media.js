import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const MAX_BYTES = 35 * 1024 * 1024
const MAX_REDIRECTS = 3
const PROTECTED_PAGE_HOSTS = [
  'youtube.com',
  'youtu.be',
  'tiktok.com',
  'instagram.com',
  'facebook.com',
  'fb.watch',
  'x.com',
  'twitter.com',
  'vimeo.com',
  'twitch.tv',
]

const isPrivateIp = (address) => {
  if (!address) return true
  if (address === '::1' || address === '0.0.0.0') return true
  if (address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80:')) return true
  if (!address.includes('.')) return false
  const parts = address.split('.').map(Number)
  if (parts[0] === 10 || parts[0] === 127) return true
  if (parts[0] === 169 && parts[1] === 254) return true
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
  if (parts[0] === 192 && parts[1] === 168) return true
  return false
}

const isProtectedSourcePage = (value) => {
  try {
    const host = new URL(String(value || '')).hostname.toLowerCase().replace(/^www\./, '')
    return PROTECTED_PAGE_HOSTS.some((entry) => host === entry || host.endsWith(`.${entry}`))
  } catch {
    return false
  }
}

const assertSafeUrl = async (value) => {
  const url = new URL(String(value || ''))
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported URL protocol')
  if (url.username || url.password) throw new Error('Credentialed URLs are not allowed')
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost')) throw new Error('Local URLs are not allowed')

  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error('Private network URLs are not allowed')
  } else {
    const addresses = await lookup(host, { all: true, verbatim: true })
    if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
      throw new Error('Private network destination is not allowed')
    }
  }
  return url
}

const fetchMedia = async (initialUrl) => {
  let current = await assertSafeUrl(initialUrl)

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    try {
      const response = await fetch(current, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'image/*,video/*,application/octet-stream;q=0.8,*/*;q=0.2',
          'User-Agent': 'AppForge-ScrapperPro/2.1 (+https://www.sstoken.space)',
        },
      })

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (!location) throw new Error('Redirect has no destination')
        if (redirect === MAX_REDIRECTS) throw new Error('Too many redirects')
        const next = new URL(location, current).toString()
        if (isProtectedSourcePage(next)) throw new Error('Protected source pages are reference-only in Getter Pro')
        current = await assertSafeUrl(next)
        continue
      }

      if (!response.ok) throw new Error(`Remote server returned HTTP ${response.status}`)
      return response
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new Error('Unable to fetch media')
}

const readLimited = async (response) => {
  const declared = Number(response.headers.get('content-length') || 0)
  if (declared > MAX_BYTES) throw new Error('Media file is larger than 35 MB')
  if (!response.body) return Buffer.from(await response.arrayBuffer())

  const reader = response.body.getReader()
  const chunks = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BYTES) {
      await reader.cancel()
      throw new Error('Media file is larger than 35 MB')
    }
    chunks.push(Buffer.from(value))
  }
  return Buffer.concat(chunks)
}

const extensionFor = (contentType) => {
  const type = String(contentType || '').split(';')[0].toLowerCase()
  const map = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
    'image/svg+xml': 'svg', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
  }
  return map[type] || 'bin'
}

const safeFilename = (value, fallback) => String(value || fallback)
  .replace(/[^a-zA-Z0-9._-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 100) || fallback

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const target = String(req.query?.url || '')
    if (!target) return res.status(400).json({ error: 'url is required' })
    if (isProtectedSourcePage(target)) {
      return res.status(409).json({
        error: 'This provider page is reference-only. Save its URL to Media Vault instead of downloading protected media.',
        code: 'protected_source_reference_only',
        action: 'save_reference',
      })
    }

    const response = await fetchMedia(target)
    const contentType = String(response.headers.get('content-type') || '').split(';')[0].toLowerCase()
    if (!contentType.startsWith('image/') && !contentType.startsWith('video/')) {
      return res.status(415).json({ error: 'Only image and video media can be downloaded through this endpoint' })
    }

    const data = await readLimited(response)
    const extension = extensionFor(contentType)
    const requestedName = safeFilename(req.query?.name, `getter-pro.${extension}`)
    const filename = requestedName.includes('.') ? requestedName : `${requestedName}.${extension}`

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', String(data.length))
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    return res.status(200).send(data)
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Media download failed' })
  }
}
