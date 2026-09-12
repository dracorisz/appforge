import React from 'react'
import { Card, Button, Input, Textarea } from '@/components/ui'
import { Download, Eye, RefreshCw, Copy, Check, Image as ImageIcon } from 'lucide-react'

export interface HeaderConfig {
  name: string
  title: string
  experience: string
  tagline: string
  available: string
  milestone: string
  theme: 'dark' | 'light'
}

const defaultConfig: HeaderConfig = {
  name: 'YOUR NAME',
  title: 'Product Engineer & Creator',
  experience: 'Build • Ship • Iterate',
  tagline: 'WEB PRODUCTS • APIs • AUTOMATION • AI',
  available: 'Available for projects',
  milestone: 'Flexible delivery',
  theme: 'dark'
}

export function PF_CreatorSVG() {
  const [config, setConfig] = React.useState<HeaderConfig>(defaultConfig)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [svgCode, setSvgCode] = React.useState('')
  const [copied, setCopied] = React.useState(false)

  const escapeXml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')

  const generateSvg = () => {
    const bg = config.theme === 'dark' ? '#0b0f19' : '#ffffff'
    const textPrimary = config.theme === 'dark' ? '#ffffff' : '#0f172a'
    const textSecondary = config.theme === 'dark' ? '#38bdf8' : '#3178C6'
    const textMuted = config.theme === 'dark' ? '#94a3b8' : '#475569'
    const accent = config.theme === 'dark' ? '#34d399' : '#10B981'
    const pillBg = config.theme === 'dark' ? '#1e293b' : '#f1f5f9'
    const pillBorder = config.theme === 'dark' ? '#475569' : '#e2e8f0'

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 300" width="1920" height="300" style="background:${bg}; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="50%" stop-color="${config.theme === 'dark' ? '#151c2e' : '#f8fafc'}"/>
      <stop offset="100%" stop-color="${bg}"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="1920" height="300" fill="url(#bg-grad)"/>
  <path d="M0,150 H1920" stroke="${config.theme === 'dark' ? '#334155' : '#cbd5e1'}" stroke-width="1" stroke-dasharray="6,6" opacity="0.3"/>
  <circle cx="800" cy="150" r="150" fill="${accent}" opacity="0.025" filter="url(#glow)"/>
  <g transform="translate(40, 0)">
    <text x="0" y="55" fill="${textPrimary}" font-size="38" font-weight="800" letter-spacing="1">${escapeXml(config.name)}</text>
    <text x="0" y="82" fill="${textSecondary}" font-size="16" font-weight="600">${escapeXml(config.title)}</text>
    <text x="0" y="102" fill="${textMuted}" font-size="12" font-weight="500">${escapeXml(config.experience)}</text>
  </g>
  <line x1="450" y1="30" x2="450" y2="270" stroke="${config.theme === 'dark' ? '#334155' : '#cbd5e1'}" stroke-width="1"/>
  <g transform="translate(480, 0)">
    <text x="0" y="45" fill="${accent}" font-size="12" font-weight="700" letter-spacing="1">${escapeXml(config.tagline)}</text>
    <g transform="translate(0, 62)">
      <rect x="0" y="0" width="110" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="55" y="18" fill="${textPrimary}" font-size="13" text-anchor="middle">JavaScript</text>
      <rect x="120" y="0" width="82" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="160" y="18" fill="${textPrimary}" font-size="13" text-anchor="middle">TypeScript</text>
      <rect x="210" y="0" width="48" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="230" y="18" fill="${textPrimary}" font-size="13" text-anchor="middle">PHP</text>
      <rect x="266" y="0" width="65" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="299" y="18" fill="${textPrimary}" font-size="13" text-anchor="middle">Node.js</text>
      <rect x="339" y="0" width="60" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="369" y="18" fill="${textPrimary}" font-size="13" text-anchor="middle">Vue.js</text>
      <rect x="407" y="0" width="58" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="436" y="18" fill="${textPrimary}" font-size="13" text-anchor="middle">React</text>
      <rect x="473" y="0" width="60" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="503" y="18" fill="${textPrimary}" font-size="13" text-anchor="middle">Next.js</text>
      <rect x="541" y="0" width="65" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="573" y="18" fill="${textPrimary}" font-size="13" text-anchor="middle">Angular</text>
      <rect x="614" y="0" width="65" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="646" y="18" fill="${textPrimary}" font-size="13" text-anchor="middle">Laravel</text>
      <rect x="687" y="0" width="62" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="718" y="18" fill="${textPrimary}" font-size="13" text-anchor="middle">Python</text>
      <rect x="757" y="0" width="42" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="778" y="18" fill="${textPrimary}" font-size="13" text-anchor="middle">Go</text>
    </g>
    <g transform="translate(0, 100)">
      <rect x="0" y="0" width="52" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="26" y="18" fill="${textMuted}" font-size="11" text-anchor="middle">AWS</text>
      <rect x="58" y="0" width="65" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="90" y="18" fill="${textMuted}" font-size="11" text-anchor="middle">Docker</text>
      <rect x="129" y="0" width="76" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="167" y="18" fill="${textMuted}" font-size="11" text-anchor="middle">Supabase</text>
      <rect x="211" y="0" width="88" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="255" y="18" fill="${textMuted}" font-size="11" text-anchor="middle">PostgreSQL</text>
      <rect x="305" y="0" width="76" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="343" y="18" fill="${textMuted}" font-size="11" text-anchor="middle">MongoDB</text>
      <rect x="387" y="0" width="72" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="423" y="18" fill="${textMuted}" font-size="11" text-anchor="middle">GraphQL</text>
      <rect x="465" y="0" width="78" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="504" y="18" fill="${textMuted}" font-size="11" text-anchor="middle">REST APIs</text>
      <rect x="549" y="0" width="68" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="583" y="18" fill="${textMuted}" font-size="11" text-anchor="middle">Tailwind</text>
      <rect x="623" y="0" width="94" height="28" rx="6" fill="${pillBg}" stroke="${pillBorder}"/><text x="670" y="18" fill="${textMuted}" font-size="11" text-anchor="middle">React Native</text>
    </g>
    <g transform="translate(0, 138)">
      <rect x="0" y="0" width="150" height="28" rx="6" fill="${bg}" stroke="${accent}" stroke-width="1"/><text x="75" y="18" fill="${accent}" font-size="10.5" font-weight="600" text-anchor="middle">3D / WebGL (Three.js)</text>
      <rect x="156" y="0" width="135" height="28" rx="6" fill="${bg}" stroke="${accent}" stroke-width="1"/><text x="223" y="18" fill="${accent}" font-size="10.5" font-weight="600" text-anchor="middle">Web3 / Solidity</text>
      <rect x="297" y="0" width="168" height="28" rx="6" fill="${bg}" stroke="${accent}" stroke-width="1"/><text x="381" y="18" fill="${accent}" font-size="10.5" font-weight="600" text-anchor="middle">AI Integration &amp; Workflows</text>
      <rect x="471" y="0" width="120" height="28" rx="6" fill="${bg}" stroke="${accent}" stroke-width="1"/><text x="531" y="18" fill="${accent}" font-size="10.5" font-weight="600" text-anchor="middle">CI/CD &amp; DevOps</text>
      <rect x="597" y="0" width="82" height="28" rx="6" fill="${bg}" stroke="${accent}" stroke-width="1"/><text x="638" y="18" fill="${accent}" font-size="10.5" font-weight="600" text-anchor="middle">Git &amp; Jira</text>
    </g>
  </g>
  <line x1="1350" y1="30" x2="1350" y2="270" stroke="${config.theme === 'dark' ? '#334155' : '#cbd5e1'}" stroke-width="1"/>
  <g transform="translate(1380, 0)">
    <text x="0" y="45" fill="${textMuted}" font-size="11" font-weight="700" letter-spacing="1.5">WHY WORK WITH ME</text>
    <text x="0" y="70" fill="${textPrimary}" font-size="12" font-weight="500">
      <tspan fill="${accent}">✓</tspan> Clean, maintainable &amp; production-ready code
    </text>
    <text x="0" y="90" fill="${textPrimary}" font-size="12" font-weight="500">
      <tspan fill="${accent}">✓</tspan> Full ownership from architecture to cloud deployment
    </text>
    <g transform="translate(0, 110)">
      <rect x="0" y="0" width="235" height="34" rx="8" fill="${config.theme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5'}" stroke="${accent}" stroke-width="1.2"/>
      <circle cx="16" cy="17" r="4" fill="${accent}"/>
      <text x="28" y="21" fill="${accent}" font-size="11.5" font-weight="700">${escapeXml(config.available)}</text>
      <rect x="245" y="0" width="245" height="34" rx="8" fill="${config.theme === 'dark' ? 'rgba(56, 189, 248, 0.15)' : '#eff6ff'}" stroke="${config.theme === 'dark' ? '#38BDF8' : '#3b82f6'}" stroke-width="1.2"/>
      <polygon points="261,13 265,17 261,21 257,17" fill="${config.theme === 'dark' ? '#38bdf8' : '#3b82f6'}"/>
      <text x="272" y="21" fill="${config.theme === 'dark' ? '#38bdf8' : '#3b82f6'}" font-size="11.5" font-weight="700">${escapeXml(config.milestone)}</text>
    </g>
  </g>
</svg>`
  }

  const downloadSvg = () => {
    const svg = generateSvg()
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'appforge-header.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPng = async () => {
    const svgString = generateSvg()
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1920
      canvas.height = 300
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const pngUrl = canvas.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = 'appforge-header.png'
        a.click()
      }
      URL.revokeObjectURL(url)
    }
    img.onerror = () => URL.revokeObjectURL(url)
    img.src = url
  }

  const showPreview = () => {
    const svg = generateSvg()
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    setPreviewUrl(url)
    setSvgCode(svg)
  }

  const hidePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setSvgCode('')
    }
  }

  const copySvgCode = async () => {
    try {
      await navigator.clipboard.writeText(svgCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const update = (patch: Partial<HeaderConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }))
  }

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground dark:text-foreground">Creator SVG</h1>
        <p className="mt-1 text-sm text-foreground dark:text-muted-foreground">Configure and download a reusable portfolio/SVG header. Everything is generated locally in your browser.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-foreground dark:text-foreground">Configuration</h2>
          <div className="mt-4 space-y-3">
            <Input label="Name" value={config.name} onChange={(e) => update({ name: e.target.value })} />
            <Input label="Title" value={config.title} onChange={(e) => update({ title: e.target.value })} />
            <Input label="Experience" value={config.experience} onChange={(e) => update({ experience: e.target.value })} />
            <Input label="Tagline" value={config.tagline} onChange={(e) => update({ tagline: e.target.value })} />
            <Input label="Availability" value={config.available} onChange={(e) => update({ available: e.target.value })} />
            <Input label="Milestone" value={config.milestone} onChange={(e) => update({ milestone: e.target.value })} />
            <div className="flex gap-2">
              <Button variant={config.theme === 'dark' ? 'primary' : 'secondary'} onClick={() => update({ theme: 'dark' })}>Dark</Button>
              <Button variant={config.theme === 'light' ? 'primary' : 'secondary'} onClick={() => update({ theme: 'light' })}>Light</Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={downloadSvg}><Download className="h-4 w-4" /> Download SVG</Button>
              <Button variant="secondary" onClick={() => void downloadPng()}><ImageIcon className="h-4 w-4" /> Save as PNG</Button>
              <Button variant="secondary" onClick={previewUrl ? hidePreview : showPreview}><Eye className="h-4 w-4" /> {previewUrl ? 'Hide' : 'Preview'}</Button>
              <Button variant="ghost" onClick={() => setConfig(defaultConfig)}><RefreshCw className="h-4 w-4" /> Reset</Button>
            </div>
          </div>
        </Card>

        {previewUrl && (
          <Card>
            <h2 className="text-lg font-semibold text-foreground dark:text-foreground">Live Preview</h2>
            <div className="mt-4 overflow-hidden rounded-lg border border-border dark:border-border">
              <img src={previewUrl} alt="Header preview" className="h-auto w-full" />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground dark:text-foreground">SVG Code</h3>
                <Button variant="ghost" onClick={() => void copySvgCode()} className="!px-2 !py-1">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Textarea
                value={svgCode}
                readOnly
                rows={8}
                className="mt-2 font-mono text-xs"
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
