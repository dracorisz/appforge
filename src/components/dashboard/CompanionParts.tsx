import React from 'react'
import {
  Check,
  ChevronDown,
  Download,
  FileCode,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Play,
  RefreshCw,
  Star,
  Trash2,
} from 'lucide-react'
import { Badge, Button, FileButton, Input, Modal, Select, Surface, Textarea } from '@/components/ui'

export type LamatTask = {
  id: string
  goal_id?: string | null
  title: string
  description?: string | null
  rationale?: string | null
  kind: string
  status: string
  priority: number
  priority_score: number
  expected_outcome?: string | null
  verification_method?: string | null
  plan_steps?: Array<{ index: number; title: string; tool?: string; status?: string; output_summary?: string }>
  current_step_index: number
  checkpoint_state?: Record<string, unknown>
  attempt_count: number
  max_attempts: number
  estimated_cost_usd?: number
  actual_cost_usd?: number
  deliverable?: string | null
  user_rating?: number | null
  user_feedback?: string | null
  rated_at?: string | null
  result?: { summary?: string } | null
  verification_evidence?: { verified?: boolean; confidence?: number; evidence_summary?: string } | null
  last_error?: string | null
  blocker_reason?: string | null
}

export type LamatLibraryItem = {
  id: string
  title: string
  file_name: string
  mime_type: string
  kind: 'image' | 'document' | 'spreadsheet'
  size_bytes: number
  thumbnail_data?: string | null
  parsed_text?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
}

export type LamatMemoryItem = {
  id: string
  kind: string
  content: string
  provenance: string
  confidence: number
  tags?: string[]
  updated_at?: string
}

export type IntegrationStatusItem = {
  status: string
  authSource?: string
  detail?: string
  connectedEmail?: string | null
  serviceAccountEmail?: string | null
  repository?: string
  capabilities?: string[]
}

export type ModelOptionItem = {
  id: string
  label: string
  group: string
  badge: string
}

export const MODEL_CATALOG: ModelOptionItem[] = [
  { id: 'auto', label: 'Auto Orchestrator', group: 'Smart Orchestrator', badge: 'Multi-Model' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', group: 'Google Cloud Vertex AI', badge: 'Fast' },
  { id: 'gemini-4-argon', label: 'Gemini 4 Argon', group: 'Google Cloud Vertex AI', badge: 'Reasoning & Code' },
  { id: 'openrouter:minimax/minimax-m3.1-flash:free', label: 'MiniMax M3.1 Flash (1M)', group: 'Free Tier Models (Quota-Limited)', badge: 'Free' },
  { id: 'openrouter:nvidia/nemotron-3-ultra-550b-a55b:free', label: 'Nemotron 3 Ultra 550B (1M)', group: 'Free Tier Models (Quota-Limited)', badge: 'Free' },
  { id: 'openrouter:poolside/laguna-s-2.1:free', label: 'Poolside Laguna S 2.1 (Code)', group: 'Free Tier Models (Quota-Limited)', badge: 'Free' },
  { id: 'openrouter:cohere/north-mini-code:free', label: 'Cohere North Mini Code', group: 'Free Tier Models (Quota-Limited)', badge: 'Free' },
  { id: 'openrouter:nvidia/nemotron-3.5-super-vl:free', label: 'Nemotron 3.5 Super VL (Vision)', group: 'Free Tier Models (Quota-Limited)', badge: 'Free' },
  { id: 'openrouter:nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', label: 'Nemotron 3 Nano Reasoning', group: 'Free Tier Models (Quota-Limited)', badge: 'Free' },
  { id: 'openrouter:dots-studio/dots-3-note-preview:free', label: 'Dots 3 Note (512k)', group: 'Free Tier Models (Quota-Limited)', badge: 'Free' },
  { id: 'openrouter:google/gemma-4-31b-it:free', label: 'Google Gemma 4 31B', group: 'Free Tier Models (Quota-Limited)', badge: 'Free' },
  { id: 'hf:Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B Instruct', group: 'Free Tier Models (Quota-Limited)', badge: 'Free' },
  { id: 'hf:meta-llama/Llama-3.3-70B-Instruct', label: 'Llama 3.3 70B Instruct', group: 'Free Tier Models (Quota-Limited)', badge: 'Free' },
]

export function ModelSelectorDropdown({
  value,
  onChange,
  disabled = false,
}: {
  value: string
  onChange: (nextModel: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const activeItem = MODEL_CATALOG.find((m) => m.id === value) || MODEL_CATALOG[0]

  React.useEffect(() => {
    if (!open) return
    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', handleOutside)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('mousedown', handleOutside)
      window.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const groups = Array.from(new Set(MODEL_CATALOG.map((m) => m.group)))

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="justify-between gap-2 text-left"
        aria-label="Select AI model"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate text-left font-medium">{activeItem.label}</span>
        <Badge color={activeItem.badge === 'Free' ? 'green' : 'blue'}>{activeItem.badge}</Badge>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </Button>

      {open && (
        <Surface
          variant="popover"
          padding={2}
          className="absolute left-0 top-full z-50 mt-1 max-h-96 w-80 overflow-y-auto border border-border text-left shadow-xl"
        >
          {groups.map((grp) => (
            <div key={grp} className="mb-2">
              <div className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground /* design-xs-ok */">
                {grp}
              </div>
              <div className="space-y-2">
                {MODEL_CATALOG.filter((m) => m.group === grp).map((item) => {
                  const selected = item.id === value
                  return (
                    <Button
                      key={item.id}
                      type="button"
                      variant={selected ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        onChange(item.id)
                        setOpen(false)
                      }}
                      className="w-full justify-between gap-2 px-2 text-left"
                    >
                      <span className="min-w-0 flex-1 truncate text-left font-normal">{item.label}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge color={item.badge === 'Free' ? 'green' : 'slate'}>{item.badge}</Badge>
                        {selected && <Check className="h-4 w-4 shrink-0" />}
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </Surface>
      )}
    </div>
  )
}

export type ParsedListItem = {
  text: string
  subItems: Array<{ ordered: boolean; text: string }>
  details: string[]
}

export type ParsedMarkdownBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'blockquote'; lines: string[] }
  | { type: 'hr' }
  | { type: 'image'; alt: string; src: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; ordered: boolean; items: ParsedListItem[] }

export function parseMarkdownBlocks(rawContent: string): ParsedMarkdownBlock[] {
  const cleanedContent = String(rawContent || '')
    .replace(/\r\n/g, '\n')
    .replace(/!\[([^\]]*)\]\((?:\[INLINE_IMAGE_ATTACHED_TO_RESPONSE\]|GENERATED_AND_ATTACHED_AUTOMATICALLY)\)/g, '')

  const lines = cleanedContent.split('\n')
  const blocks: ParsedMarkdownBlock[] = []
  let paragraph: string[] = []
  let list: { ordered: boolean; items: ParsedListItem[] } | null = null
  let codeLines: string[] | null = null
  let codeLang = ''
  let quoteLines: string[] = []
  let tableLines: string[] = []

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
      paragraph = []
    }
  }

  const flushQuote = () => {
    if (quoteLines.length > 0) {
      blocks.push({ type: 'blockquote', lines: [...quoteLines] })
      quoteLines = []
    }
  }

  const flushTable = () => {
    if (tableLines.length >= 2) {
      const parseRow = (rowLine: string) =>
        rowLine
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((cell) => cell.trim())
      const headers = parseRow(tableLines[0])
      const isSeparator = /^[\s|:-]+$/.test(tableLines[1])
      const dataLines = isSeparator ? tableLines.slice(2) : tableLines.slice(1)
      const rows = dataLines.map(parseRow)
      blocks.push({ type: 'table', headers, rows })
    } else if (tableLines.length === 1) {
      paragraph.push(tableLines[0].trim())
    }
    tableLines = []
  }

  const flushList = () => {
    if (list && list.items.length > 0) {
      blocks.push({ type: 'list', ordered: list.ordered, items: [...list.items] })
    }
    list = null
  }

  const findNextNonEmptyLine = (fromIndex: number): string => {
    for (let j = fromIndex; j < lines.length; j += 1) {
      if (lines[j].trim().length > 0) return lines[j]
    }
    return ''
  }

  const hasSubsequentNumberedItem = (fromIndex: number): boolean => {
    for (let j = fromIndex; j < lines.length; j += 1) {
      const candidate = lines[j]
      if (!candidate.trim()) continue
      if (/^\s*\d+[.)]\s+/.test(candidate)) return true
      if (/^\s*[-*+]\s+/.test(candidate) || /^\s{2,}\S/.test(candidate)) continue
      return false
    }
    return false
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const fenceMatch = line.match(/^\s*```([^\s`]*)\s*$/)
    if (fenceMatch) {
      flushParagraph()
      flushQuote()
      flushTable()
      flushList()
      if (codeLines !== null) {
        blocks.push({ type: 'code', language: codeLang, code: codeLines.join('\n') })
        codeLines = null
        codeLang = ''
      } else {
        codeLines = []
        codeLang = fenceMatch[1] || ''
      }
      continue
    }

    if (codeLines !== null) {
      codeLines.push(line)
      continue
    }

    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      flushQuote()
      flushTable()
      if (list) {
        const nextLine = findNextNonEmptyLine(i + 1)
        const continuesList =
          /^\s*\d+[.)]\s+/.test(nextLine) ||
          /^\s*[-*+]\s+/.test(nextLine) ||
          /^\s{2,}\S/.test(nextLine)
        if (!continuesList) {
          flushList()
        }
      }
      continue
    }

    // Table row detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
      flushParagraph()
      flushQuote()
      flushList()
      tableLines.push(trimmed)
      continue
    } else if (tableLines.length > 0) {
      flushTable()
    }

    // Blockquote detection
    const quoteMatch = line.match(/^\s*>\s?(.*)$/)
    if (quoteMatch) {
      flushParagraph()
      flushList()
      quoteLines.push(quoteMatch[1])
      continue
    } else if (quoteLines.length > 0) {
      flushQuote()
    }

    // Horizontal rule
    if (/^(?:---|\*\*\*|___)\s*$/.test(trimmed)) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'hr' })
      continue
    }

    // Standalone image line
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)$/)
    if (imgMatch) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'image', alt: imgMatch[1] || 'Generated image', src: imgMatch[2] })
      continue
    }

    // Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      })
      continue
    }

    // List item detection (ordered & unordered, top-level & nested)
    const indentLen = (line.match(/^(\s*)/)?.[1] || '').length
    const bulletMatch = line.match(/^\s*[-*+]\s+(.+)$/)
    const numberedMatch = line.match(/^\s*\d+[.)]\s+(.+)$/)

    if (bulletMatch || numberedMatch) {
      flushParagraph()
      const isOrderedLine = Boolean(numberedMatch)
      const itemText = (bulletMatch ? bulletMatch[1] : numberedMatch![1]).trim()

      if (list && list.items.length > 0) {
        const lastItem = list.items[list.items.length - 1]
        // Case 1: Active ordered list, and we encounter a sub-bullet (either indented OR followed by another numbered item)
        if (list.ordered && !isOrderedLine && (indentLen >= 2 || hasSubsequentNumberedItem(i + 1))) {
          lastItem.subItems.push({ ordered: false, text: itemText })
          continue
        }
        // Case 2: Indented nested ordered or unordered item inside any active list
        if (indentLen >= 2 && list.ordered !== isOrderedLine) {
          lastItem.subItems.push({ ordered: isOrderedLine, text: itemText })
          continue
        }
        if (indentLen >= 3 && list.ordered === isOrderedLine) {
          lastItem.subItems.push({ ordered: isOrderedLine, text: itemText })
          continue
        }
        // Case 3: Top-level switch between list types when no further parent items exist
        if (list.ordered !== isOrderedLine) {
          flushList()
        }
      }

      if (!list) {
        list = { ordered: isOrderedLine, items: [] }
      }
      list.items.push({ text: itemText, subItems: [], details: [] })
      continue
    }

    // Indented continuation paragraph inside an active list item
    if (list && list.items.length > 0 && indentLen >= 2) {
      list.items[list.items.length - 1].details.push(trimmed)
      continue
    }

    flushList()
    paragraph.push(trimmed)
  }

  flushParagraph()
  flushQuote()
  flushTable()
  flushList()
  if (codeLines !== null) {
    blocks.push({ type: 'code', language: codeLang, code: codeLines.join('\n') })
  }

  return blocks
}

export function FormattedMessage({ content }: { content: string }) {
  const blocks = React.useMemo(() => parseMarkdownBlocks(content), [content])

  const renderInline = (value: string): React.ReactNode[] => {
    const tokenRegex = /(\*\*[^*]+\*\*|\*[^*\n]+\*|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g
    return value.split(tokenRegex).map((part, index) => {
      if (!part) return null
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={index}>{part.slice(1, -1)}</em>
      }
      if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
        return <del key={index}>{part.slice(2, -2)}</del>
      }
      if (part.charCodeAt(0) === 96 && part.charCodeAt(part.length - 1) === 96 && part.length > 2) {
        return (
          <code key={index} className="rounded-xl bg-muted px-2 font-mono text-sm">
            {part.slice(1, -1)}
          </code>
        )
      }
      const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/)
      if (linkMatch) {
        return (
          <a
            key={index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline hover:text-foreground"
          >
            {linkMatch[1]}
          </a>
        )
      }
      return part
    })
  }

  return (
    <div className="break-words [&_a]:break-all">
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') {
          return (
            <p key={index} className="my-2">
              {renderInline(block.text)}
            </p>
          )
        }
        if (block.type === 'heading') {
          return (
            <div
              key={index}
              className={block.level <= 2 ? 'mt-4 text-sm font-semibold' : 'mt-2 text-sm font-medium'}
            >
              {renderInline(block.text)}
            </div>
          )
        }
        if (block.type === 'hr') {
          return <hr key={index} className="my-4 border-border/70" />
        }
        if (block.type === 'blockquote') {
          return (
            <blockquote
              key={index}
              className="my-2 border-l border-border pl-4 text-sm text-muted-foreground"
            >
              {block.lines.map((qLine, qIdx) => (
                <p key={qIdx} className="my-2">
                  {renderInline(qLine)}
                </p>
              ))}
            </blockquote>
          )
        }
        if (block.type === 'code') {
          return (
            <pre
              key={index}
              className="my-4 max-w-full overflow-x-auto rounded-xl border border-border/70 bg-muted/60 p-4 font-mono text-sm"
            >
              <code>{block.code}</code>
            </pre>
          )
        }
        if (block.type === 'image') {
          return (
            <div key={index} className="my-4 overflow-hidden rounded-xl border border-border/70">
              <img
                src={block.src}
                alt={block.alt}
                className="max-h-96 w-auto rounded-xl object-contain"
              />
            </div>
          )
        }
        if (block.type === 'table') {
          return (
            <div key={index} className="my-4 overflow-x-auto rounded-xl border border-border/70">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {block.headers.map((header, hIdx) => (
                      <th key={hIdx} className="px-4 py-2 font-semibold">
                        {renderInline(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-border/50 last:border-b-0">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-4 py-2">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul'
          return (
            <ListTag
              key={index}
              className={(block.ordered ? 'list-decimal' : 'list-disc') + ' my-2 space-y-2 pl-8'}
            >
              {block.items.map((item, itemIdx) => {
                const subOrdered = item.subItems.length > 0 && item.subItems.every((s) => s.ordered)
                const SubTag = subOrdered ? 'ol' : 'ul'
                return (
                  <li key={itemIdx} className="space-y-2">
                    <div>{renderInline(item.text)}</div>
                    {item.details.map((detailLine, dIdx) => (
                      <div key={dIdx} className="text-sm text-muted-foreground">
                        {renderInline(detailLine)}
                      </div>
                    ))}
                    {item.subItems.length > 0 && (
                      <SubTag
                        className={(subOrdered ? 'list-decimal' : 'list-disc') + ' mt-1 space-y-2 pl-4'}
                      >
                        {item.subItems.map((sub, sIdx) => (
                          <li key={sIdx}>{renderInline(sub.text)}</li>
                        ))}
                      </SubTag>
                    )}
                  </li>
                )
              })}
            </ListTag>
          )
        }
        return null
      })}
    </div>
  )
}

export function AnimatedAssistantMessage({
  content,
  animate,
}: {
  content: string
  animate: boolean
}) {
  const [displayed, setDisplayed] = React.useState(() => (animate ? '' : content))

  React.useEffect(() => {
    if (!animate) {
      setDisplayed(content)
      return
    }
    let cursor = 0
    const step = Math.max(12, Math.ceil(content.length / 45))
    const timer = window.setInterval(() => {
      cursor += step
      if (cursor >= content.length) {
        setDisplayed(content)
        window.clearInterval(timer)
      } else {
        setDisplayed(content.slice(0, cursor))
      }
    }, 24)
    return () => window.clearInterval(timer)
  }, [animate, content])

  return <FormattedMessage content={displayed} />
}

export function PersonaConfigModal({
  open,
  onClose,
  personaNameInput,
  setPersonaNameInput,
  personaGenderInput,
  setPersonaGenderInput,
  userCallsignInput,
  setUserCallsignInput,
  savingPersona,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  personaNameInput: string
  setPersonaNameInput: (v: string) => void
  personaGenderInput: string
  setPersonaGenderInput: (v: string) => void
  userCallsignInput: string
  setUserCallsignInput: (v: string) => void
  savingPersona: boolean
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="Persona & Identity Configuration">
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          The underlying autonomous engine is <strong>Lamat</strong>. Customize how your personal operator introduces itself, its presentation, and what it should call you.
        </div>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">Operator Name</label>
            <Input
              value={personaNameInput}
              onChange={(e) => setPersonaNameInput(e.target.value)}
              placeholder="e.g. Lamat, Maya, Aria"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Gender Presentation</label>
            <Select
              value={personaGenderInput}
              onChange={(e) => setPersonaGenderInput(e.target.value)}
              aria-label="Gender presentation"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="adaptive">Adaptive / Neutral</option>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Your Name / Callsign</label>
            <Input
              value={userCallsignInput}
              onChange={(e) => setUserCallsignInput(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={savingPersona}>
              {savingPersona ? 'Saving…' : 'Save Persona Preferences'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export function IntegrationsModal({
  open,
  onClose,
  integrations,
  verifying,
  onVerify,
  onConnectGoogleWorkspace,
}: {
  open: boolean
  onClose: () => void
  integrations: Record<string, IntegrationStatusItem>
  verifying: boolean
  onVerify: () => void
  onConnectGoogleWorkspace: () => void
}) {
  const entries: Array<{ key: string; title: string; subtitle: string }> = [
    {
      key: 'github',
      title: 'GitHub',
      subtitle: 'Repository inspection, code search, workflow dispatch, and approval-gated file changes.',
    },
    {
      key: 'vercel',
      title: 'Vercel',
      subtitle: 'Production and preview deployment status and runtime diagnostics.',
    },
    {
      key: 'supabase',
      title: 'Supabase',
      subtitle: 'RLS-protected operational tables, financial ledger, memories, and document library.',
    },
    {
      key: 'google_workspace',
      title: 'Google Workspace (Drive, Docs & Sheets)',
      subtitle: 'Discover, search, read, create, and edit Google Drive files, Docs, and Spreadsheets.',
    },
  ]

  const mapBadge = (status?: string): { label: string; color: 'green' | 'amber' | 'red' | 'slate' } => {
    if (status === 'verified') return { label: 'Connected', color: 'green' }
    if (status === 'partial') return { label: 'Shared / Partial', color: 'amber' }
    if (status === 'expired') return { label: 'Session Expired', color: 'amber' }
    if (status === 'insufficient_permissions') return { label: 'Permissions Needed', color: 'amber' }
    if (status === 'invalid_credentials') return { label: 'Invalid Credentials', color: 'red' }
    if (status === 'needs_setup') return { label: 'Needs Setup', color: 'slate' }
    return { label: status || 'Checking…', color: 'slate' }
  }

  return (
    <Modal open={open} onClose={onClose} title="External Integrations & Connections">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Connection states reflect live capability verification against each external service.
          </p>
          <Button type="button" size="sm" variant="secondary" onClick={onVerify} disabled={verifying}>
            <RefreshCw className={`h-4 w-4 ${verifying ? 'animate-spin' : ''}`} />
            {verifying ? 'Verifying…' : 'Verify Connections'}
          </Button>
        </div>

        <div className="space-y-2">
          {entries.map(({ key, title, subtitle }) => {
            const info = integrations[key]
            const badge = mapBadge(info?.status)
            const isGoogle = key === 'google_workspace'
            return (
              <Surface key={key} variant="muted" padding={4} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{title}</div>
                    <div className="text-xs text-muted-foreground /* design-xs-ok */">{subtitle}</div>
                  </div>
                  <Badge color={badge.color}>{badge.label}</Badge>
                </div>

                {info?.detail && (
                  <div className="text-xs text-muted-foreground /* design-xs-ok */">{info.detail}</div>
                )}

                {Array.isArray(info?.capabilities) && info.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {info.capabilities.map((cap) => (
                      <Badge key={cap} color="slate">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                )}

                {isGoogle && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <span className="text-xs text-muted-foreground /* design-xs-ok */">
                      {info?.authSource === 'user_oauth'
                        ? `Authorized via Google OAuth${info.connectedEmail ? ` (${info.connectedEmail})` : ''}.`
                        : 'Authorize Google OAuth to search personal Drive files and create/edit Docs & Sheets.'}
                    </span>
                    <Button type="button" size="sm" variant="primary" onClick={onConnectGoogleWorkspace}>
                      {info?.authSource === 'user_oauth' ? 'Reconnect Google Workspace' : 'Connect Google Workspace'}
                    </Button>
                  </div>
                )}
              </Surface>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

export function MemoryPersonalizationModal({
  open,
  onClose,
  memories,
  personaNameInput,
  setPersonaNameInput,
  personaGenderInput,
  setPersonaGenderInput,
  userCallsignInput,
  setUserCallsignInput,
  savingPersona,
  onSubmitPersona,
  newMemoryKind,
  setNewMemoryKind,
  newMemoryContent,
  setNewMemoryContent,
  onCreateMemory,
  onArchiveMemory,
}: {
  open: boolean
  onClose: () => void
  memories: LamatMemoryItem[]
  personaNameInput: string
  setPersonaNameInput: (v: string) => void
  personaGenderInput: string
  setPersonaGenderInput: (v: string) => void
  userCallsignInput: string
  setUserCallsignInput: (v: string) => void
  savingPersona: boolean
  onSubmitPersona: (e: React.FormEvent) => void
  newMemoryKind: string
  setNewMemoryKind: (v: string) => void
  newMemoryContent: string
  setNewMemoryContent: (v: string) => void
  onCreateMemory: (e: React.FormEvent) => void
  onArchiveMemory: (memoryId: string) => void
}) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const filteredMemories = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return memories
    return memories.filter((m) => `${m.kind} ${m.content} ${m.provenance}`.toLowerCase().includes(q))
  }, [memories, searchQuery])

  return (
    <Modal open={open} onClose={onClose} title="Memory & Personalization">
      <div className="space-y-4">
        <Surface variant="muted" padding={4} className="space-y-4">
          <div>
            <div className="text-sm font-semibold">Persona & Identity Preferences</div>
            <p className="text-xs text-muted-foreground /* design-xs-ok */">
              Customize how your personal operator introduces itself and addresses you. The platform engine remains Lamat.
            </p>
          </div>
          <form onSubmit={onSubmitPersona} className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-medium /* design-xs-ok */">Operator Name</label>
              <Input
                value={personaNameInput}
                onChange={(e) => setPersonaNameInput(e.target.value)}
                placeholder="e.g. Lamat, Maya"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium /* design-xs-ok */">Presentation</label>
              <Select
                value={personaGenderInput}
                onChange={(e) => setPersonaGenderInput(e.target.value)}
                aria-label="Gender presentation"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-binary</option>
                <option value="adaptive">Adaptive / Neutral</option>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium /* design-xs-ok */">Your Callsign</label>
              <Input
                value={userCallsignInput}
                onChange={(e) => setUserCallsignInput(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="flex justify-end sm:col-span-3">
              <Button type="submit" size="sm" variant="primary" disabled={savingPersona}>
                {savingPersona ? 'Saving…' : 'Save Persona'}
              </Button>
            </div>
          </form>
        </Surface>

        <Surface variant="muted" padding={4} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">Durable Memories ({memories.length})</div>
              <p className="text-xs text-muted-foreground /* design-xs-ok */">
                Facts, preferences, constraints, and lessons retained across sessions.
              </p>
            </div>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter memories…"
              aria-label="Filter memories"
              className="w-48"
            />
          </div>

          <form onSubmit={onCreateMemory} className="grid gap-2 sm:grid-cols-4">
            <Select
              value={newMemoryKind}
              onChange={(e) => setNewMemoryKind(e.target.value)}
              aria-label="Memory kind"
            >
              <option value="fact">Fact</option>
              <option value="preference">Preference</option>
              <option value="constraint">Constraint</option>
              <option value="lesson">Lesson</option>
              <option value="decision">Decision</option>
            </Select>
            <div className="sm:col-span-2">
              <Input
                value={newMemoryContent}
                onChange={(e) => setNewMemoryContent(e.target.value)}
                placeholder="Record a durable fact, preference, or constraint…"
                required
              />
            </div>
            <Button type="submit" variant="secondary">
              Save Memory
            </Button>
          </form>

          <div className="max-h-72 space-y-2 overflow-y-auto">
            {filteredMemories.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No matching memories recorded.</p>
            ) : (
              filteredMemories.map((m) => (
                <Surface key={m.id} variant="card" padding={2} className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge color="blue">{m.kind}</Badge>
                      <span className="text-xs text-muted-foreground /* design-xs-ok */">{m.provenance}</span>
                    </div>
                    <p className="text-sm">{m.content}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label="Delete memory"
                    onClick={() => onArchiveMemory(m.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </Surface>
              ))
            )}
          </div>
        </Surface>
      </div>
    </Modal>
  )
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function parseTabularPreview(text: string, maxRows: number): { headers: string[]; rows: string[][]; totalRows: number } {
  const rawLines = String(text || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0 && !l.startsWith('[Uploaded Spreadsheet:'))
  if (rawLines.length === 0) return { headers: [], rows: [], totalRows: 0 }
  const delimiter = rawLines[0].includes('\t') ? '\t' : ','
  const splitLine = (line: string) =>
    line.split(delimiter).map((cell) => cell.replace(/^"|"$/g, '').trim())
  const headers = splitLine(rawLines[0])
  const allDataLines = rawLines.slice(1)
  const rows = allDataLines.slice(0, maxRows).map(splitLine)
  return { headers, rows, totalRows: allDataLines.length }
}

export function LibraryModal({
  open,
  onClose,
  items,
  uploading,
  onUploadFiles,
  onDeleteItem,
}: {
  open: boolean
  onClose: () => void
  items: LamatLibraryItem[]
  uploading: boolean
  onUploadFiles: (files: FileList | null) => void
  onDeleteItem: (id: string) => void
}) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [filterKind, setFilterKind] = React.useState<'all' | 'image' | 'document' | 'spreadsheet'>('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [docCharLimit, setDocCharLimit] = React.useState(6000)
  const [sheetRowLimit, setSheetRowLimit] = React.useState(40)
  const [showRawText, setShowRawText] = React.useState(false)

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      if (filterKind !== 'all' && item.kind !== filterKind) return false
      const q = searchQuery.trim().toLowerCase()
      if (!q) return true
      return `${item.title} ${item.file_name} ${item.mime_type} ${item.parsed_text || ''}`
        .toLowerCase()
        .includes(q)
    })
  }, [items, filterKind, searchQuery])

  React.useEffect(() => {
    if (!open) return
    if (filteredItems.length > 0 && (!selectedId || !filteredItems.some((i) => i.id === selectedId))) {
      setSelectedId(filteredItems[0].id)
    } else if (filteredItems.length === 0) {
      setSelectedId(null)
    }
  }, [open, filteredItems, selectedId])

  const selectedItem = filteredItems.find((i) => i.id === selectedId) || null

  const handleDownload = (item: LamatLibraryItem) => {
    const a = document.createElement('a')
    if (item.kind === 'image' && item.thumbnail_data) {
      a.href = item.thumbnail_data
      a.download = item.file_name || `${item.title || 'image'}.png`
      a.click()
      return
    }
    const blob = new Blob([item.parsed_text || ''], { type: item.mime_type || 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    a.href = url
    a.download = item.file_name || `${item.title || 'document'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isCodeFile = (item: LamatLibraryItem) =>
    /\.(json|js|jsx|ts|tsx|py|sql|sh|yaml|yml|toml|html|css|xml)$/i.test(item.file_name || '') ||
    /json|javascript|typescript|python|sql|xml/i.test(item.mime_type || '')

  return (
    <Modal open={open} onClose={onClose} title={`Document & Media Library (${items.length})`}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'image', 'document', 'spreadsheet'] as const).map((k) => (
              <Button
                key={k}
                type="button"
                size="sm"
                variant={filterKind === k ? 'secondary' : 'ghost'}
                onClick={() => setFilterKind(k)}
              >
                {k === 'all' ? 'All' : k === 'image' ? 'Images' : k === 'document' ? 'Documents' : 'Spreadsheets'}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library…"
              aria-label="Search library"
              className="w-44"
            />
            <FileButton
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,.csv,.tsv,.txt,.md,.json,.js,.ts,.tsx,.py,.sql,.html,.css"
              multiple
              disabled={uploading}
              variant="primary"
              size="sm"
              onChange={(e) => {
                onUploadFiles(e.target.files)
                e.target.value = ''
              }}
            >
              {uploading ? 'Uploading…' : '+ Upload File'}
            </FileButton>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <Surface variant="muted" padding={8} className="text-center">
            <FolderOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <div className="text-sm font-medium">No Library resources found</div>
            <p className="mt-1 text-xs text-muted-foreground /* design-xs-ok */">
              Upload images, PDFs, Markdown/text documents, code files, or CSV/TSV spreadsheets to preview and reference them in chat.
            </p>
          </Surface>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {/* Left item list */}
            <div className="max-h-96 space-y-2 overflow-y-auto md:col-span-1">
              {filteredItems.map((item) => {
                const active = item.id === selectedItem?.id
                return (
                  <Surface
                    key={item.id}
                    variant={active ? 'card' : 'muted'}
                    padding={2}
                    className={`cursor-pointer border ${active ? 'border-foreground/40' : 'border-transparent'}`}
                    onClick={() => {
                      setSelectedId(item.id)
                      setDocCharLimit(6000)
                      setSheetRowLimit(40)
                      setShowRawText(false)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {item.kind === 'image' && item.thumbnail_data ? (
                        <img
                          src={item.thumbnail_data}
                          alt={item.title}
                          className="h-10 w-10 shrink-0 rounded-xl border border-border object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary">
                          {item.kind === 'spreadsheet' ? (
                            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                          ) : isCodeFile(item) ? (
                            <FileCode className="h-4 w-4 text-muted-foreground" />
                          ) : item.kind === 'image' ? (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{item.title}</div>
                        <div className="truncate text-xs text-muted-foreground /* design-xs-ok */">
                          {item.kind} · {formatBytes(item.size_bytes)}
                        </div>
                      </div>
                    </div>
                  </Surface>
                )
              })}
            </div>

            {/* Right rich preview pane */}
            <div className="md:col-span-2">
              {selectedItem && (
                <Surface variant="muted" padding={4} className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/70 pb-4">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{selectedItem.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground /* design-xs-ok */">
                        <Badge color="blue">{selectedItem.kind}</Badge>
                        <span>{selectedItem.file_name}</span>
                        <span>·</span>
                        <span>{selectedItem.mime_type}</span>
                        <span>·</span>
                        <span>{formatBytes(selectedItem.size_bytes)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedItem.kind !== 'image' && selectedItem.parsed_text && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setShowRawText((v) => !v)}
                        >
                          {showRawText ? 'Formatted View' : 'Raw Text'}
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(selectedItem)}
                      >
                        <Download className="h-4 w-4" /> Download
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`Delete ${selectedItem.title}`}
                        onClick={() => onDeleteItem(selectedItem.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Preview Body by Kind */}
                  {selectedItem.kind === 'image' ? (
                    <div className="space-y-2">
                      {selectedItem.thumbnail_data ? (
                        <div className="flex justify-center overflow-hidden rounded-xl border border-border bg-background p-2">
                          <img
                            src={selectedItem.thumbnail_data}
                            alt={selectedItem.title}
                            className="max-h-96 w-auto rounded-xl object-contain"
                          />
                        </div>
                      ) : (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          Image preview data is not available for this item.
                        </div>
                      )}
                      {selectedItem.parsed_text && (
                        <div className="text-xs text-muted-foreground /* design-xs-ok */">
                          {selectedItem.parsed_text}
                        </div>
                      )}
                    </div>
                  ) : selectedItem.kind === 'spreadsheet' && !showRawText ? (
                    (() => {
                      const tableData = parseTabularPreview(selectedItem.parsed_text || '', sheetRowLimit)
                      if (tableData.headers.length === 0) {
                        return (
                          <div className="py-8 text-center text-sm text-muted-foreground">
                            Spreadsheet is empty or could not be parsed into rows.
                          </div>
                        )
                      }
                      return (
                        <div className="space-y-2">
                          <div className="max-h-80 overflow-auto rounded-xl border border-border bg-background">
                            <table className="w-full border-collapse text-left text-xs /* design-xs-ok */">
                              <thead>
                                <tr className="border-b border-border bg-muted/60">
                                  {tableData.headers.map((h, hIdx) => (
                                    <th key={hIdx} className="px-2 py-2 font-semibold">
                                      {h || `Col ${hIdx + 1}`}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {tableData.rows.map((row, rIdx) => (
                                  <tr key={rIdx} className="border-b border-border/50 last:border-b-0">
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className="px-2 py-2">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {tableData.totalRows > sheetRowLimit && (
                            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground /* design-xs-ok */">
                              <span>
                                Showing {tableData.rows.length} of {tableData.totalRows} rows
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => setSheetRowLimit((prev) => prev + 60)}
                              >
                                Load More Rows
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })()
                  ) : (
                    (() => {
                      const fullText = String(selectedItem.parsed_text || '')
                      if (!fullText.trim()) {
                        return (
                          <div className="py-8 text-center text-sm text-muted-foreground">
                            No readable text content extracted for this file.
                          </div>
                        )
                      }
                      const boundedText = fullText.slice(0, docCharLimit)
                      const isTruncated = fullText.length > docCharLimit
                      return (
                        <div className="space-y-2">
                          <div className="max-h-80 overflow-y-auto rounded-xl border border-border bg-background p-4 text-sm">
                            {showRawText || isCodeFile(selectedItem) ? (
                              <pre className="whitespace-pre-wrap break-words font-mono text-xs /* design-xs-ok */">
                                <code>{boundedText}</code>
                              </pre>
                            ) : (
                              <FormattedMessage content={boundedText} />
                            )}
                          </div>
                          {isTruncated && (
                            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground /* design-xs-ok */">
                              <span>
                                Showing {boundedText.length.toLocaleString()} of {fullText.length.toLocaleString()} characters
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => setDocCharLimit((prev) => prev + 12000)}
                              >
                                Show More Content
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })()
                  )}
                </Surface>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export function TaskInspectModal({
  task,
  onClose,
  personaName,
  taskRatingInput,
  setTaskRatingInput,
  taskFeedbackInput,
  setTaskFeedbackInput,
  savingRating,
  cycling,
  onRunTask,
  onRateTask,
}: {
  task: LamatTask | null
  onClose: () => void
  personaName: string
  taskRatingInput: number
  setTaskRatingInput: (v: number) => void
  taskFeedbackInput: string
  setTaskFeedbackInput: (v: string) => void
  savingRating: boolean
  cycling: boolean
  onRunTask: (taskId: string) => void
  onRateTask: (requestRevision: boolean) => void
}) {
  const steps = Array.isArray(task?.plan_steps) ? task.plan_steps : []

  return (
    <Modal open={Boolean(task)} onClose={onClose} title={task?.title || 'Task Deliverable & Steps'}>
      {task && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge color={task.status === 'completed' ? 'green' : 'blue'}>{task.status}</Badge>
            <span className="text-sm text-muted-foreground">
              Priority P{task.priority} · Score {task.priority_score}
            </span>
          </div>

          {task.rationale && (
            <div className="text-sm text-muted-foreground">
              <strong>Why this task matters:</strong> {task.rationale}
            </div>
          )}

          {/* Visible Execution Steps Section */}
          <div className="space-y-2">
            <div className="text-sm font-semibold">
              Execution Steps ({Math.min(task.current_step_index, steps.length)}/{steps.length} completed)
            </div>
            {steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Single-pass execution task.</p>
            ) : (
              steps.map((step, idx) => {
                const isDone = step.status === 'completed' || idx < task.current_step_index
                return (
                  <Surface key={idx} variant="muted" padding={2} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        Step {idx + 1}: {step.title}
                      </span>
                      <Badge color={isDone ? 'green' : 'slate'}>{isDone ? 'completed' : 'pending'}</Badge>
                    </div>
                    {step.tool && step.tool !== 'none' && (
                      <div className="text-sm text-muted-foreground">Tool: {step.tool}</div>
                    )}
                    {step.output_summary && (
                      <div className="text-sm text-muted-foreground">{step.output_summary}</div>
                    )}
                  </Surface>
                )
              })
            )}
          </div>

          {/* Deliverable Section */}
          <Surface variant="muted" padding={4} className="space-y-2 text-sm">
            <div className="font-semibold">Deliverable & Execution Output</div>
            <FormattedMessage
              content={
                task.deliverable ||
                task.result?.summary ||
                'Task is queued for execution. Click "Run Task Now" below to generate the deliverable.'
              }
            />
          </Surface>

          {task.status !== 'completed' && (
            <Button
              type="button"
              variant="primary"
              onClick={() => onRunTask(task.id)}
              disabled={cycling}
            >
              <Play className="h-4 w-4" /> Run Task Now
            </Button>
          )}

          {/* Yellow/Gold Star-Only Rating & Feedback */}
          <div className="space-y-4 border-t border-border/70 pt-4">
            <div className="text-sm font-semibold">
              Rate & Guide {personaName}’s Self-Improvement
            </div>
            <div className="flex items-center gap-2" role="radiogroup" aria-label="Task rating">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = taskRatingInput >= star
                return (
                  <Button
                    key={star}
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setTaskRatingInput(star)}
                    aria-label={`Rate ${star} out of 5 stars`}
                    title={`${star} / 5 stars`}
                  >
                    <Star className={`h-4 w-4 ${active ? 'fill-current text-warning' : 'text-muted-foreground'}`} />
                  </Button>
                )
              })}
            </div>
            <Textarea
              value={taskFeedbackInput}
              onChange={(e) => setTaskFeedbackInput(e.target.value)}
              placeholder="Add comments, corrections, or specific instructions for how Lamat should improve this output…"
              rows={3}
              className="!h-auto !min-h-[4.5rem] w-full"
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onRateTask(true)}
                disabled={savingRating}
              >
                Save & Queue Revision Task
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => onRateTask(false)}
                disabled={savingRating}
              >
                {savingRating ? 'Saving…' : 'Save Rating & Feedback'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
