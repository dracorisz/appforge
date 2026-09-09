import React from 'react'
import { Badge, Button, Card, Input } from '@/components/ui'
import { Search } from 'lucide-react'

type TxtRecord = { text: string }

export function PF_DnsTxtChecker() {
  const [domain, setDomain] = React.useState('')
  const [records, setRecords] = React.useState<TxtRecord[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const lookup = async () => {
    const trimmed = domain.trim().toLowerCase()
    if (!trimmed) return
    setLoading(true)
    setError('')
    setRecords([])
    try {
      const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(trimmed)}&type=TXT`, {
        headers: { Accept: 'application/dns-json' },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error('DNS lookup failed.')
      const answers = Array.isArray(data?.Answer) ? data.Answer : []
      const txts: TxtRecord[] = []
      for (const answer of answers) {
        const text = String(answer?.data || '').replace(/^"|"$/g, '')
        if (text) txts.push({ text })
      }
      setRecords(txts)
      if (!txts.length) setError('No TXT records found.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not check DNS.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-10">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge color="green">Utility</Badge>
          <span className="text-xs text-muted-foreground">Cloudflare DNS-over-HTTPS</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">DNS TXT Checker</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Inspect TXT records for any domain. Useful for verifying ownership, SPF, DKIM, DMARC, and site verification tokens.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" className="sm:flex-1" />
          <Button onClick={() => void lookup()} disabled={loading || !domain.trim()}><Search className="h-4 w-4" />{loading ? 'Checking…' : 'Check TXT'}</Button>
        </div>
        {error && <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}
      </Card>

      {records.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-foreground">TXT records</h2>
          <div className="mt-3 space-y-2">
            {records.map((record, index) => (
              <div key={index} className="rounded-lg border border-border/70 bg-background/40 px-3 py-2 font-mono text-xs text-foreground break-all">
                {record.text}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
