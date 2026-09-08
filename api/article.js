const safeUrl = (value) => {
  try {
    const url = new URL(String(value || ''))
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

const stripControl = (value) => String(value || '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  .trim()

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const target = safeUrl(req.query?.url)
  if (!target) return res.status(400).json({ error: 'A valid article URL is required' })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch(`https://r.jina.ai/${target}`, {
      signal: controller.signal,
      headers: {
        Accept: 'text/plain,text/markdown;q=0.9,*/*;q=0.5',
        'User-Agent': 'AppForge-ScrapperPro/2.1 (+https://www.sstoken.space)',
      },
    })
    if (!response.ok) throw new Error(`Reader returned HTTP ${response.status}`)
    const raw = stripControl(await response.text())
    const text = raw.slice(0, 120000)
    return res.status(200).json({ ok: true, url: target, text })
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Article fetch failed' })
  } finally {
    clearTimeout(timeout)
  }
}
