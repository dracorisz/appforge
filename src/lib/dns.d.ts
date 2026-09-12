export type DnsRecord = { name: string; type: number; ttl: number; data: string }
export type DnsResult = { type: string; status: number; message: string; validated: boolean; records: DnsRecord[]; authority: DnsRecord[] }
export const DNS_TYPES: Record<string, number>
export const OVERVIEW_TYPES: string[]
export function normalizeDnsName(value: string): string
export function recordTypeCode(type: string | number): number
export function recordTypeName(code: number): string
export function queryDns(name: string, type: string | number, options?: { signal?: AbortSignal; fetchImpl?: typeof fetch }): Promise<DnsResult>
export function lookupDns(name: string, types: (string | number)[], options?: { signal?: AbortSignal; fetchImpl?: typeof fetch }): Promise<DnsResult[]>
