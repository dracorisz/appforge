import React from 'react'
import { Button, Card, Input } from '@/components/ui'
import { Search, Download } from 'lucide-react'
import { AppHeading } from '@/components/layout/AppHeading'
import { DNS_TYPES, OVERVIEW_TYPES, lookupDns, normalizeDnsName, recordTypeCode, recordTypeName, type DnsResult } from '@/lib/dns'

export function DNSChecker() {
  const [domain, setDomain] = React.useState('')
  const [type, setType] = React.useState('overview')
  const [customType, setCustomType] = React.useState('')
  const [results, setResults] = React.useState<DnsResult[]>([])
  const [resolvedName, setResolvedName] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [selected, setSelected] = React.useState('')
  const controller = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => controller.current?.abort(), [])

  const lookup = async () => {
    controller.current?.abort()
    let name: string; let types: string[]
    try {
      name = normalizeDnsName(domain)
      types = type === 'overview' ? OVERVIEW_TYPES : [type === 'custom' ? String(recordTypeCode(customType)) : type]
    } catch (validationError) { setError(validationError instanceof Error ? validationError.message : 'Invalid query.'); return }
    const request = new AbortController(); controller.current = request
    const timeout = window.setTimeout(() => request.abort(), 20000)
    setLoading(true); setError(''); setResults([]); setSelected(''); setResolvedName('')
    try {
      const records = await lookupDns(name, types, { signal: request.signal })
      if (controller.current !== request) return
      setResults(records); setResolvedName(name)
    } catch (requestError) { if (controller.current === request) setError(request.signal.aborted ? 'Lookup timed out. Please retry.' : requestError instanceof Error ? requestError.message : 'Lookup failed.') }
    finally { window.clearTimeout(timeout); if (controller.current === request) setLoading(false) }
  }
  const exportResults = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ name: resolvedName, resolver: 'Google Public DNS', results }, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = `${resolvedName}-dns.json`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const visible = selected ? results.filter((result) => result.type === selected) : results
  return <div className="w-full space-y-5 pb-8">
    <AppHeading />
    <Card>
      <form onSubmit={(event) => { event.preventDefault(); void lookup() }} className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
        <Input label="Domain or DNS name" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com or _dmarc.example.com" />
        <label className="grid gap-1.5 text-sm">Record type<select value={type} onChange={(event) => setType(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3"><option value="overview">Common records</option>{Object.keys(DNS_TYPES).map((name) => <option key={name}>{name}</option>)}<option value="custom">Custom type number</option></select></label>
        <Button type="submit" disabled={loading || !domain.trim()}><Search className="h-4 w-4" />{loading ? 'Checking…' : 'Check DNS'}</Button>
        {type === 'custom' && <Input label="Type number (1–65535)" inputMode="numeric" value={customType} onChange={(event) => setCustomType(event.target.value)} placeholder="257" />}
      </form>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">Google Public DNS · no API key. Query any record type by number; common records checks 12 types. SRV, DKIM and DMARC need their full owner name. PTR uses a reverse name such as 8.8.8.8.in-addr.arpa.</p>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </Card>
    {results.length > 0 && <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold">DNS record map</h2><Button variant="secondary" size="sm" onClick={exportResults}><Download className="h-4 w-4" />Export JSON</Button></div>
        <p className="mt-2 break-all font-mono text-sm">{resolvedName}</p>
        <p className="mt-1 text-xs text-muted-foreground">Select a branch to inspect its answers. This maps one resolver’s records, not global propagation.</p>
        <div className="mt-4 grid gap-2 border-l-2 border-border pl-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="DNS map branches">{results.map((result) => <button key={result.type} type="button" aria-pressed={selected === result.type} onClick={() => setSelected(selected === result.type ? '' : result.type)} className={`rounded-lg border p-3 text-left text-sm ${selected === result.type ? 'border-primary bg-accent' : 'border-border hover:bg-accent'}`}><span className="font-semibold">{result.type}</span><span className="ml-2 text-xs text-muted-foreground">{result.status ? result.message : `${result.records.length} answers`}</span>{result.records.slice(0, 3).map((record, index) => <span key={index} className="mt-2 block break-all border-l border-border pl-3 font-mono text-xs text-muted-foreground">{record.data}</span>)}{result.records.length > 3 && <span className="mt-2 block text-xs text-muted-foreground">{result.records.length - 3} more answers</span>}</button>)}</div>
      </Card>
      <div aria-live="polite" className="space-y-3">{visible.map((result) => <Card key={result.type}>
        <h2 className="text-sm font-semibold">{result.type}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{result.message || (result.records.length ? `${result.records.length} answers · ${result.validated ? 'DNSSEC validated' : 'DNSSEC not validated'}` : 'No records at this DNS name.')}</p>
        {[['Answers', result.records], ['Authority', result.authority]].map(([label, records]) => typeof records !== 'string' && records.length > 0 && <div key={String(label)} className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><caption className="mb-2 text-left font-medium">{String(label)}</caption><thead><tr className="border-b border-border"><th className="p-2">Name</th><th className="p-2">Type</th><th className="p-2">TTL (s)</th><th className="p-2">Value</th></tr></thead><tbody>{records.map((record, index) => <tr key={index} className="border-b border-border/50"><td className="p-2 font-mono">{record.name}</td><td className="p-2">{recordTypeName(record.type)}</td><td className="p-2">{record.ttl}</td><td className="min-w-48 break-all p-2 font-mono">{record.data}</td></tr>)}</tbody></table></div>)}
      </Card>)}</div>
    </>}
  </div>
}
