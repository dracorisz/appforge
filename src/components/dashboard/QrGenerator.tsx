import React from 'react'
import { Copy, Download, ExternalLink, QrCode, RefreshCw } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'

type Mode = 'text' | 'wifi'
type Format = 'png' | 'svg'

const wifiPayload = (ssid: string, password: string, security: 'WPA' | 'WEP' | 'nopass', hidden: boolean) => {
  const esc = (value: string) => value.replace(/([\\;,:"])/g, '\\$1')
  return `WIFI:T:${security};S:${esc(ssid)};${security !== 'nopass' ? `P:${esc(password)};` : ''}${hidden ? 'H:true;' : ''};`
}

export function QrGenerator() {
  const [mode, setMode] = React.useState<Mode>('text')
  const [value, setValue] = React.useState('https://www.sstoken.space')
  const [ssid, setSsid] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [security, setSecurity] = React.useState<'WPA' | 'WEP' | 'nopass'>('WPA')
  const [hidden, setHidden] = React.useState(false)
  const [size, setSize] = React.useState(320)
  const [margin, setMargin] = React.useState(2)
  const [format, setFormat] = React.useState<Format>('png')
  const [nonce, setNonce] = React.useState(0)
  const [copied, setCopied] = React.useState(false)

  const payload = mode === 'wifi' ? wifiPayload(ssid, password, security, hidden) : value.trim()
  const url = React.useMemo(() => {
    if (!payload) return ''
    const params = new URLSearchParams({ data: payload, size: `${size}x${size}`, margin: String(margin), format })
    params.set('_', String(nonce))
    return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`
  }, [format, margin, nonce, payload, size])

  const download = async () => {
    if (!url) return
    const response = await fetch(url)
    if (!response.ok) throw new Error('QR download failed.')
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = `appforge-qr.${format}`
    anchor.click()
    URL.revokeObjectURL(objectUrl)
  }

  const copyPayload = async () => {
    if (!payload) return
    await navigator.clipboard.writeText(payload)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="w-full space-y-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><QrCode className="h-6 w-6" /> QR Generator</h1><p className="mt-1 text-sm text-muted-foreground">Create QR codes for links, text or Wi-Fi.</p></div>
        <div className="flex gap-2"><Button variant="secondary" onClick={() => setNonce((value) => value + 1)}><RefreshCw className="h-4 w-4" /> Refresh</Button><Button onClick={() => void download()} disabled={!url}><Download className="h-4 w-4" /> Download</Button></div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="p-5">
          <div className="flex gap-1 rounded-xl border border-border/70 bg-background/40 p-1"><button onClick={() => setMode('text')} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === 'text' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Text / URL</button><button onClick={() => setMode('wifi')} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === 'wifi' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Wi-Fi</button></div>

          {mode === 'text' ? <div className="mt-5"><label className="text-xs font-medium text-muted-foreground">Content<textarea value={value} onChange={(event) => setValue(event.target.value)} rows={6} className="mt-1.5 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring/25" placeholder="URL or text" /></label></div> : <div className="mt-5 grid gap-4 sm:grid-cols-2"><Input label="Network name" value={ssid} onChange={(event) => setSsid(event.target.value)} /><Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={security === 'nopass'} /><label className="text-xs font-medium text-muted-foreground">Security<select value={security} onChange={(event) => setSecurity(event.target.value as typeof security)} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"><option value="WPA">WPA / WPA2</option><option value="WEP">WEP</option><option value="nopass">Open network</option></select></label><label className="flex items-end gap-2 pb-2 text-sm text-muted-foreground"><input type="checkbox" checked={hidden} onChange={(event) => setHidden(event.target.checked)} /> Hidden network</label></div>}

          <div className="mt-5 grid gap-4 sm:grid-cols-3"><label className="text-xs font-medium text-muted-foreground">Size<select value={size} onChange={(event) => setSize(Number(event.target.value))} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground">{[192,256,320,512,768].map((value) => <option key={value} value={value}>{value}px</option>)}</select></label><label className="text-xs font-medium text-muted-foreground">Margin<select value={margin} onChange={(event) => setMargin(Number(event.target.value))} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground">{[0,1,2,4,8].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="text-xs font-medium text-muted-foreground">Format<select value={format} onChange={(event) => setFormat(event.target.value as Format)} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"><option value="png">PNG</option><option value="svg">SVG</option></select></label></div>

          <div className="mt-5 flex flex-wrap items-center gap-2"><Button variant="secondary" onClick={() => void copyPayload()} disabled={!payload}><Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy encoded value'}</Button>{url && <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium hover:bg-accent"><ExternalLink className="h-4 w-4" /> Open image</a>}</div>
        </Card>

        <Card className="flex min-h-[420px] items-center justify-center p-5">
          {url ? <div className="w-full text-center"><div className="mx-auto flex aspect-square w-full max-w-[360px] items-center justify-center rounded-2xl bg-white p-4"><img src={url} alt="Generated QR code" className="h-full w-full object-contain" /></div><p className="mt-3 text-xs text-muted-foreground">Generated by api.qrserver.com. QR content is sent to that provider.</p></div> : <div className="text-center text-sm text-muted-foreground"><QrCode className="mx-auto h-12 w-12 opacity-40" /><p className="mt-3">Add content to generate a code.</p></div>}
        </Card>
      </div>
    </div>
  )
}
