import React from 'react'
import { Badge, Button, Card, Input } from '@/components/ui'
import { Search } from 'lucide-react'

type TxtRecord = { text: string }

const normalizeDnsName = (value: string) => {
  const input = value.trim().toLowerCase()
  if (!input) throw new Error('Enter a domain or DNS name.')
  if (/\s/.test(input)) throw new Error('DNS names cannot contain spaces.')

  let hostname = input
  if (input.includes('://') || input.includes('/') || input.includes(':')) {
    try {
      hostname = new URL(input.includes('://') ? input : `https://${input}`).hostname.toLowerCase()
    } catch {
      throw new Error('Enter a valid domain, hostname, or URL.')
    }
  }

  hostname = hostname.replace(/\.$/, '')
  if (!hostname || hostname.length > 253 || !hostname.includes('.') || !/^[a-z0-9_.-]+$/i.test(hostname)) {
    throw new Error('Enter a valid DNS name such as example.com or _dmarc.example.com.')
  }
  return hostname
}

const decodeTxtAnswer = (value: unknown) => String(value || '')
  .replace(/^"|"$/g, '')
  .replace(/"\s*"/g, '')
  .replace(/\\"/g, '"')

export function PF_DnsTxtChecker() {
  const [domain, setDomain] = React.useState('')
  const [records, setRecords] = React.useState<TxtRecord[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [resolvedName, setResolvedName] = React.useState('')

  const lookup = async () => {
    setError('')
    setRecords([])
    setResolvedName('')
    let name = ''
    try {
      name = normalizeDnsName(domain)
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : 'Enter a valid DNS name.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`, {
        headers: { Accept: 'application/dns-json' },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(`DNS lookup failed with HTTP ${response.status}.`)
      const answers = Array.isArray(data?.Answer) ? data.Answer : []
      const txts: TxtRecord[] = []
      for (const answer of answers) {
        if (Number(answer?.type) !== 16) continue
        const text = decodeTxtAnswer(answer?.data)
        if (text) txts.push({ text })
      }
      setResolvedName(name)
      setRecords(txts)
      if (!txts.length) setError(`No TXT records found for ${name}.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not check DNS.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-5 pb-10">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge color="green">Utility</Badge>
          <span className="text-xs text-muted-foreground">Cloudflare DNS-over-HTTPS</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">DNS TXT Checker</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">Inspect TXT records for a domain or DNS name. URLs are normalized automatically; DKIM and DMARC names are supported.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input value={domain} onChange={(event) => { setDomain(event.target.value); if (error) setError('') }} onKeyDown={(event) => { if (event.key === 'Enter') void lookup() }} placeholder="example.com or _dmarc.example.com" className="sm:flex-1" aria-label="Domain or DNS name" />
          <Button onClick={() => void lookup()} disabled={loading || !domain.trim()}><Search className="h-4 w-4" />{loading ? 'Checking…' : 'Check TXT'}</Button>
        </div>
        {error && <div role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}
      </Card>

      {records.length > 0 && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold text-foreground">TXT records</h2>{resolvedName && <span className="font-mono text-xs text-muted-foreground">{resolvedName}</span>}</div>
          <div className="mt-3 space-y-2">
            {records.map((record, index) => (
              <div key={`${record.text}-${index}`} className="break-all rounded-lg border border-border/70 bg-background/40 px-3 py-2 font-mono text-xs text-foreground">
                {record.text}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
